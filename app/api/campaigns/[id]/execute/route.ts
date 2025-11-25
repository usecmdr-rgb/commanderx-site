import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { isWithinCallWindow } from "@/lib/campaign-time-window";
import { generateCampaignSystemPrompt, type CampaignScriptContext } from "@/lib/aloha/campaign-scripts";
import { isValidPurpose, type CampaignPurpose } from "@/lib/aloha/campaign-purposes";

/**
 * POST /api/campaigns/[id]/execute
 * 
 * Execute campaign calls (called by campaign runner/job)
 * This endpoint enforces time windows and rate limiting.
 * 
 * SECURITY: This should only be called by internal services/jobs, not directly by users.
 * Users start campaigns via PATCH /api/campaigns/[id] with action='start'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // For now, allow authenticated users to trigger execution
    // In production, this might be called by a scheduled job
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    // Await params (Next.js 15)
    const { id } = await params;

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("call_campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return createErrorResponse("Campaign not found", 404);
    }

    // CRITICAL: Check if campaign is running
    if (campaign.status !== "running") {
      return NextResponse.json({
        success: false,
        message: `Campaign is not running. Current status: ${campaign.status}`,
        shouldContinue: false,
      });
    }

    // CRITICAL: Enforce time window
    const timeWindowCheck = isWithinCallWindow({
      timezone: campaign.timezone,
      allowedCallStartTime: campaign.allowed_call_start_time,
      allowedCallEndTime: campaign.allowed_call_end_time,
      allowedDaysOfWeek: campaign.allowed_days_of_week || [],
    });

    if (!timeWindowCheck.isWithinWindow) {
      return NextResponse.json({
        success: false,
        message: "Outside allowed call window",
        timeWindowStatus: timeWindowCheck,
        shouldContinue: false,
        // Campaign stays in 'running' state but won't make calls
      });
    }

    // Get pending targets
    const { data: pendingTargets, error: targetsError } = await supabase
      .from("call_campaign_targets")
      .select("*")
      .eq("campaign_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(campaign.rate_limit_per_minute || 5); // Respect rate limit

    if (targetsError) {
      throw targetsError;
    }

    if (!pendingTargets || pendingTargets.length === 0) {
      // No more pending targets - mark campaign as completed
      await supabase
        .from("call_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        message: "Campaign completed - no more pending targets",
        callsMade: 0,
        shouldContinue: false,
      });
    }

    // TODO: Integrate with actual telephony system to make calls
    // For now, we'll simulate the call execution logic
    // In production, this would:
    // 1. Mark target as 'calling'
    // 2. Initiate call via telephony API
    // 3. Handle call outcome
    // 4. Update target status and create call log

    // Simulate call execution (replace with actual telephony integration)
    const callsToMake = pendingTargets.slice(0, campaign.rate_limit_per_minute || 5);
    
    // Mark targets as calling
    for (const target of callsToMake) {
      await supabase
        .from("call_campaign_targets")
        .update({
          status: "calling",
          last_attempt_at: new Date().toISOString(),
          attempt_count: (target.attempt_count || 0) + 1,
        })
        .eq("id", target.id);
    }

    // Generate purpose-aware system prompt for Aloha if campaign has a purpose
    let systemPrompt: string | null = null;
    if (campaign.purpose && isValidPurpose(campaign.purpose)) {
      try {
        const scriptContext: CampaignScriptContext = {
          userId: user.id,
          campaignId: id,
          purpose: campaign.purpose as CampaignPurpose,
          purposeDetails: campaign.purpose_details || undefined,
          extraInstructions: campaign.extra_instructions || undefined,
          scriptStyle: campaign.script_style || undefined,
        };
        systemPrompt = await generateCampaignSystemPrompt(scriptContext);
      } catch (error) {
        console.error("Error generating campaign system prompt:", error);
        // Continue without custom prompt - will use default Aloha behavior
      }
    }

    // In production, this would trigger actual calls via telephony API
    // The systemPrompt would be used to configure Aloha's behavior for each call
    return NextResponse.json({
      success: true,
      message: "Calls queued for execution",
      targetsToCall: callsToMake.map((t) => ({
        id: t.id,
        phoneNumber: t.phone_number,
        contactName: t.contact_name,
      })),
      systemPrompt, // Include generated system prompt for telephony integration
      shouldContinue: true,
      note: "Integrate with telephony system to make actual calls. Use systemPrompt to configure Aloha's behavior. Update target status based on call outcome.",
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to execute campaign", 500, error);
  }
}

