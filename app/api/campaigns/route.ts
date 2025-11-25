import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { isWithinCallWindow } from "@/lib/campaign-time-window";

/**
 * GET /api/campaigns
 * 
 * Get all campaigns for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    // Get all campaigns for the user
    const { data: campaigns, error: campaignsError } = await supabase
      .from("call_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      throw campaignsError;
    }

    // For each campaign, get progress stats and time window status
    const campaignsWithStats = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        // Get targets for progress calculation
        const { data: targets } = await supabase
          .from("call_campaign_targets")
          .select("status")
          .eq("campaign_id", campaign.id);

        const total = targets?.length || 0;
        const completed = targets?.filter((t) => t.status === "completed").length || 0;
        const pending = targets?.filter((t) => t.status === "pending").length || 0;
        const failed = targets?.filter((t) => t.status === "failed").length || 0;

        // Check time window status
        const timeWindowCheck = isWithinCallWindow({
          timezone: campaign.timezone,
          allowedCallStartTime: campaign.allowed_call_start_time,
          allowedCallEndTime: campaign.allowed_call_end_time,
          allowedDaysOfWeek: campaign.allowed_days_of_week || [],
        });

        // Generate time window summary
        let timeWindowSummary = `${campaign.allowed_call_start_time} - ${campaign.allowed_call_end_time}`;
        if (campaign.allowed_days_of_week && campaign.allowed_days_of_week.length > 0) {
          const days = campaign.allowed_days_of_week.join(", ");
          timeWindowSummary += ` on ${days}`;
        }

        return {
          ...campaign,
          progress: {
            total,
            completed,
            pending,
            failed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
          timeWindowSummary,
          timeWindowStatus: timeWindowCheck,
        };
      })
    );

    return NextResponse.json({ campaigns: campaignsWithStats });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to fetch campaigns", 500, error);
  }
}

/**
 * POST /api/campaigns
 * 
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // Validate required fields
    if (!body.name || !body.type) {
      return createErrorResponse("Campaign name and type are required", 400);
    }

    // Create campaign
    const { data: campaign, error: createError } = await supabase
      .from("call_campaigns")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        type: body.type,
        purpose: body.purpose || null,
        purpose_details: body.purpose_details || null,
        script_style: body.script_style || null,
        status: "draft",
        timezone: body.timezone || "America/New_York",
        allowed_call_start_time: body.allowed_call_start_time || "09:00",
        allowed_call_end_time: body.allowed_call_end_time || "17:00",
        allowed_days_of_week: body.allowed_days_of_week || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        extra_instructions: body.extra_instructions || null,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to create campaign", 500, error);
  }
}
