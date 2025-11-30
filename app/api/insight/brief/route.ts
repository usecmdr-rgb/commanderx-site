import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { openai } from "@/lib/openai";
import { getTimeRangeBounds } from "@/lib/insight/utils";
import { generateInsightsForRange } from "@/lib/insight/generator";
import { predictValue, generateForecastMessage } from "@/lib/insight/forecast";
import { getMemoryFacts, getUserGoals, getImportantRelationships } from "@/lib/insight/memory";
import { buildBriefSystemPrompt, buildBriefUserPrompt } from "@/lib/insight/prompts";
import { getWorkspaceIdFromAuth } from "@/lib/workspace-helpers";
import { AGENT_CONFIG } from "@/lib/agents/config";
import type { InsightBrief, TimeRange } from "@/types";
import { mockCalls, mockEmails, mockMediaItems } from "@/lib/data";

// Helper function to fetch Aloha data (calls, appointments, deadlines)
async function fetchAlohaData() {
  // In production, this would query the actual Aloha agent data
  // For now, we'll use mock data and stats
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    alpha_calls_total: 0,
    alpha_calls_missed: 0,
    alpha_appointments: 0,
  };

  // Get recent calls and appointments
  const recentCalls = mockCalls.slice(0, 5);
  const importantCalls = recentCalls.filter((c) => c.outcome === "missed" || c.followUp);
  
  return {
    calls: {
      total: latestStats.alpha_calls_total,
      missed: latestStats.alpha_calls_missed,
      recent: recentCalls,
    },
    appointments: latestStats.alpha_appointments,
    deadlines: importantCalls.map((c) => ({
      id: c.id,
      description: c.followUp,
      dueDate: new Date().toISOString(),
    })),
    conflicts: [], // Would check calendar for conflicts
  };
}

// Helper function to fetch Sync data (emails, tasks, reminders)
async function fetchSyncData() {
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    xi_important_emails: 0,
    xi_missed_emails: 0,
    xi_payments_bills: 0,
    xi_invoices: 0,
  };

  // Get important emails
  const importantEmails = mockEmails.filter((e) => e.categoryId === "important" || e.status === "needs_reply");
  const paymentEmails = mockEmails.filter((e) => e.categoryId === "payments" || e.categoryId === "invoices");

  return {
    importantEmails: latestStats.xi_important_emails,
    unreadEmails: latestStats.xi_missed_emails,
    payments: latestStats.xi_payments_bills,
    invoices: latestStats.xi_invoices,
    tasks: importantEmails.map((e) => ({
      id: e.id,
      description: `Reply to: ${e.subject}`,
      priority: e.status === "needs_reply" ? "high" as const : "medium" as const,
    })),
    reminders: paymentEmails.map((e) => ({
      id: e.id,
      message: `${e.subject} - ${e.sender}`,
      type: e.categoryId === "payments" ? "payment" as const : "deadline" as const,
    })),
  };
}

// Helper function to fetch Studio data (metrics, anomalies, performance)
async function fetchStudioData() {
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    mu_media_edits: 0,
  };

  // Calculate metrics from media items
  const totalImpressions = mockMediaItems.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalLikes = mockMediaItems.reduce((sum, item) => sum + (item.likes || 0), 0);
  const avgEngagement = mockMediaItems.length > 0 
    ? (totalLikes / totalImpressions) * 100 
    : 0;

  return {
    mediaEdits: latestStats.mu_media_edits,
    metrics: {
      impressions: totalImpressions,
      likes: totalLikes,
      engagement: avgEngagement,
    },
    anomalies: avgEngagement < 2 ? ["Low engagement rate detected"] : [],
    performance: {
      trend: avgEngagement > 3 ? "up" as const : avgEngagement < 1.5 ? "down" as const : "stable" as const,
      insight: avgEngagement > 3 
        ? "Strong engagement on recent posts"
        : avgEngagement < 1.5
        ? "Engagement below average - consider content refresh"
        : "Engagement stable",
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: { language?: string; range?: TimeRange } = await request.json().catch(() => ({}));
    const { language, range = 'daily' } = body;
    
    // Get workspace ID
    const workspaceId = await getWorkspaceIdFromAuth();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }
    
    // Fetch insights for the period
    const insights = await generateInsightsForRange(user.id, range);
    
    // Fetch memory facts, goals, and relationships for personalization (workspace-based)
    const [memoryFacts, goals, relationships] = await Promise.all([
      getMemoryFacts(workspaceId, 0.5), // Get facts with at least 50% confidence
      getUserGoals(workspaceId, 'active'),
      getImportantRelationships(workspaceId, 60), // Get relationships with 60+ importance
    ]);
    
    // Fetch data from all agents
    const [alohaData, syncData, studioData] = await Promise.all([
      fetchAlohaData(),
      fetchSyncData(),
      fetchStudioData(),
    ]);

    // Fetch historical stats for forecasting
    const { start, end } = getTimeRangeBounds(range);
    const thirtyDaysAgo = new Date(start);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: historicalStats } = await supabase
      .from('agent_stats_daily')
      .select('alpha_calls_missed, xi_important_emails, xi_missed_emails')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    // Generate forecasts
    const missedCallsHistory = historicalStats?.map(s => s.alpha_calls_missed || 0) || [];
    const importantEmailsHistory = historicalStats?.map(s => s.xi_important_emails || 0) || [];
    
    const forecasts = [
      missedCallsHistory.length >= 3 ? generateForecastMessage('missed calls', missedCallsHistory, 'calls') : null,
      importantEmailsHistory.length >= 3 ? generateForecastMessage('important emails', importantEmailsHistory, 'emails') : null,
    ].filter(Boolean) as string[];

    // Prepare stats for LLM
    const stats = {
      calls: {
        total: alohaData.calls.total,
        missed: alohaData.calls.missed,
        answered: alohaData.calls.total - alohaData.calls.missed,
      },
      emails: {
        important: syncData.importantEmails,
        unread: syncData.unreadEmails,
        invoices: syncData.invoices,
        payments: syncData.payments,
      },
      media: {
        edits: studioData.mediaEdits,
        engagement: studioData.metrics.engagement,
      },
    };

    // Generate brief using LLM with new prompt builders
    const systemPrompt = buildBriefSystemPrompt();
    const userPrompt = buildBriefUserPrompt({
      range,
      insights: insights.slice(0, 20),
      forecasts,
      stats,
      memoryFacts,
      goals,
      relationships,
    });

    let briefData: InsightBrief;
    
    try {
      const completion = await openai.chat.completions.create({
        model: AGENT_CONFIG.insight.primaryModel, // Use gpt-4o for business intelligence
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content from LLM");
      }

      const parsed = JSON.parse(content);
      briefData = {
        range,
        generatedAt: new Date().toISOString(),
        sections: parsed.sections || [],
        keyRisks: parsed.keyRisks || [],
        priorities: parsed.priorities || [],
      };
    } catch (llmError: any) {
      console.error("LLM error, falling back to template:", llmError);
      // Fallback to template-based brief
      briefData = {
        range,
        generatedAt: new Date().toISOString(),
        sections: [
          {
            title: "Summary",
            bulletPoints: [
              `${alohaData.calls.total} calls (${alohaData.calls.missed} missed)`,
              `${syncData.importantEmails} important emails`,
              `${syncData.unreadEmails} unread emails`,
            ],
          },
          {
            title: "Insights",
            bulletPoints: insights.slice(0, 5).map(i => i.title),
          },
        ],
        keyRisks: insights.filter(i => i.severity === 'critical' || i.severity === 'warning').map(i => i.title),
        priorities: [
          ...(alohaData.calls.missed > 0 ? [`Follow up on ${alohaData.calls.missed} missed calls`] : []),
          ...(syncData.importantEmails > 0 ? [`Review ${syncData.importantEmails} important emails`] : []),
        ],
      };
    }

    // Store brief in database
    await supabase
      .from('insight_briefs')
      .insert({
        user_id: user.id,
        range,
        brief_data: briefData,
      });

    return NextResponse.json({ ok: true, data: briefData });
  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate brief" },
      { status: 500 }
    );
  }
}

