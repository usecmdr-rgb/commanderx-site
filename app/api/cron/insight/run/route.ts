/**
 * Cron endpoint for automatic insight generation
 * 
 * This endpoint runs generateInsightsForRange for every active user.
 * Should be triggered by:
 * - Vercel Cron
 * - Supabase cron
 * - External scheduler
 * 
 * GET /api/cron/insight/run
 * 
 * Query params:
 * - range: 'daily' | 'weekly' | 'monthly' (default: 'daily')
 * - secret: Secret key to prevent unauthorized access
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { generateInsightsForRange } from "@/lib/insight/generator";
import { updateInsightMemory, type BehaviorSignals, type ContactMetrics } from "@/lib/insight/memory";
import { getWorkspaceIdForUser } from "@/lib/workspace-helpers";
import type { TimeRange } from "@/types";

const CRON_SECRET = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const searchParams = request.nextUrl.searchParams;
    const providedSecret = searchParams.get("secret");
    const range = (searchParams.get("range") || "daily") as TimeRange;
    
    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = getSupabaseServerClient();
    
    // Get all active users
    // For now, we'll get users with recent activity (have stats in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentStats, error: statsError } = await supabase
      .from("agent_stats_daily")
      .select("user_id")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });
    
    if (statsError) {
      console.error("Error fetching user stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }
    
    // Get unique user IDs
    const userIds = [...new Set((recentStats || []).map(s => s.user_id))];
    
    if (userIds.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No active users found",
        processed: 0,
      });
    }
    
    // Generate insights and update memory for each user (by workspace)
    const results = await Promise.allSettled(
      userIds.map(async userId => {
        // Generate insights
        await generateInsightsForRange(userId, range);
        
        // Get workspace ID
        const workspaceId = await getWorkspaceIdForUser(userId);
        if (!workspaceId) {
          console.warn(`No workspace found for user ${userId}`);
          return;
        }
        
        // Collect behavior signals for memory update
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        // Get stats for last 7 days and previous 7 days
        const { data: statsLast7 } = await supabase
          .from("agent_stats_daily")
          .select("alpha_calls_missed, alpha_calls_total")
          .eq("user_id", userId)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: false });
        
        const { data: statsPrev7 } = await supabase
          .from("agent_stats_daily")
          .select("alpha_calls_missed, alpha_calls_total")
          .eq("user_id", userId)
          .gte("date", fourteenDaysAgo.toISOString().split("T")[0])
          .lt("date", sevenDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: false });
        
        const missedCallsLast7Days = statsLast7?.reduce((sum, s) => sum + (s.alpha_calls_missed || 0), 0) || 0;
        const missedCallsPrev7Days = statsPrev7?.reduce((sum, s) => sum + (s.alpha_calls_missed || 0), 0) || 0;
        
        // Get email response times (simplified - would need actual response timestamps)
        const { data: emails } = await supabase
          .from("email_summaries")
          .select("is_important, is_read, created_at, updated_at")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString());
        
        const readEmails = emails?.filter(e => e.is_read && e.updated_at) || [];
        let avgResponseTimeHours = 0;
        if (readEmails.length > 0) {
          const totalResponseTime = readEmails.reduce((sum, e) => {
            const responseTime = (new Date(e.updated_at!).getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60);
            return sum + responseTime;
          }, 0);
          avgResponseTimeHours = totalResponseTime / readEmails.length;
        }
        
        // Get activity histogram (simplified - count calls/emails by hour)
        const activeHoursHistogram = new Array(24).fill(0);
        const { data: calls } = await supabase
          .from("calls")
          .select("created_at")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString());
        
        calls?.forEach(call => {
          const hour = new Date(call.created_at).getHours();
          activeHoursHistogram[hour]++;
        });
        
        emails?.forEach(email => {
          const hour = new Date(email.created_at).getHours();
          activeHoursHistogram[hour]++;
        });
        
        // Build behavior signals
        const signals: BehaviorSignals = {
          workspaceId,
          missedCallsLast7Days,
          missedCallsPrev7Days,
          avgResponseTimeHours,
          avgResponseTimePrevHours: avgResponseTimeHours * 0.9, // Simplified
          unreadImportantEmails: emails?.filter(e => e.is_important && !e.is_read).length || 0,
          overdueTasks: 0, // Would need task data
          negativeSentimentRatio: 0, // Would need sentiment analysis
          activeHoursHistogram,
        };
        
        // Get top contacts
        const { data: topCalls } = await supabase
          .from("calls")
          .select("caller_name, caller_number, created_at")
          .eq("user_id", userId)
          .gte("created_at", sevenDaysAgo.toISOString())
          .limit(100);
        
        const contactMap = new Map<string, ContactMetrics>();
        topCalls?.forEach(call => {
          const identifier = call.caller_name || call.caller_number || "unknown";
          const existing = contactMap.get(identifier);
          if (existing) {
            existing.interactionCount++;
            const callDate = new Date(call.created_at);
            if (!existing.lastContactAt || callDate > existing.lastContactAt) {
              existing.lastContactAt = callDate;
            }
          } else {
            contactMap.set(identifier, {
              entityIdentifier: identifier,
              displayName: call.caller_name || undefined,
              interactionCount: 1,
              lastContactAt: new Date(call.created_at),
            });
          }
        });
        
        const topContacts = Array.from(contactMap.values())
          .filter(c => c.interactionCount >= 2)
          .slice(0, 20);
        
        // Update memory
        await updateInsightMemory(workspaceId, signals, topContacts);
      })
    );
    
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    
    // Log failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed to process user ${userIds[index]}:`, result.reason);
      }
    });
    
    return NextResponse.json({
      ok: true,
      message: `Processed ${successful} users (insights + memory), ${failed} failed`,
      processed: successful,
      failed,
      total: userIds.length,
    });
  } catch (error: any) {
    console.error("Error in insight cron job:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for webhook-style triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

