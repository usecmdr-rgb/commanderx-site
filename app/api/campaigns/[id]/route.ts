import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { isWithinCallWindow } from "@/lib/campaign-time-window";

/**
 * GET /api/campaigns/[id]
 * 
 * Get a specific campaign with all targets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    const { data: campaign, error: campaignError } = await supabase
      .from("call_campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return createErrorResponse("Campaign not found", 404);
    }

    // Get targets
    const { data: targets, error: targetsError } = await supabase
      .from("call_campaign_targets")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });

    if (targetsError) {
      throw targetsError;
    }

    // Check time window status
    const timeWindowCheck = isWithinCallWindow({
      timezone: campaign.timezone,
      allowedCallStartTime: campaign.allowed_call_start_time,
      allowedCallEndTime: campaign.allowed_call_end_time,
      allowedDaysOfWeek: campaign.allowed_days_of_week || [],
    });

    // Calculate stats
    const total = targets?.length || 0;
    const completed =
      targets?.filter((t) => t.status === "completed").length || 0;
    const pending =
      targets?.filter((t) => t.status === "pending").length || 0;
    const failed =
      targets?.filter((t) => t.status === "failed").length || 0;
    const calling =
      targets?.filter((t) => t.status === "calling").length || 0;

    return NextResponse.json({
      campaign: {
        ...campaign,
        targets: targets || [],
        stats: {
          total,
          completed,
          pending,
          failed,
          calling,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
        timeWindowStatus: timeWindowCheck,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to fetch campaign", 500, error);
  }
}

/**
 * PATCH /api/campaigns/[id]
 * 
 * Update campaign (status changes: start, pause, resume, cancel)
 * 
 * Body:
 * - action: 'start' | 'pause' | 'resume' | 'cancel' | 'update'
 * - For 'update': can include name, description, time settings, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthFromRequest(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // Get existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from("call_campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingCampaign) {
      return createErrorResponse("Campaign not found", 404);
    }

    const action = body.action;

    // Handle status changes
    if (action === "start") {
      // CRITICAL: Only allow starting if campaign is in draft or paused state
      if (existingCampaign.status !== "draft" && existingCampaign.status !== "paused") {
        return createErrorResponse(
          `Cannot start campaign. Current status: ${existingCampaign.status}`,
          400
        );
      }

      // CRITICAL: Validate purpose_details for required purposes before starting
      if (existingCampaign.purpose) {
        const { getPurposeDefinition, isValidPurpose } = await import("@/lib/aloha/campaign-purposes");
        if (isValidPurpose(existingCampaign.purpose)) {
          const purposeDef = getPurposeDefinition(existingCampaign.purpose);
          if (purposeDef.requiresPurposeDetails && (!existingCampaign.purpose_details || !existingCampaign.purpose_details.trim())) {
            return createErrorResponse(
              `Cannot start campaign: Campaign message is required for ${purposeDef.label} campaigns. Please add what Aloha should tell these contacts before starting.`,
              400
            );
          }
        }
      }

      // Check time window before starting
      const timeWindowCheck = isWithinCallWindow({
        timezone: existingCampaign.timezone,
        allowedCallStartTime: existingCampaign.allowed_call_start_time,
        allowedCallEndTime: existingCampaign.allowed_call_end_time,
        allowedDaysOfWeek: existingCampaign.allowed_days_of_week || [],
      });

      if (!timeWindowCheck.isWithinWindow) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot start campaign outside allowed call window",
            timeWindowStatus: timeWindowCheck,
            message: `Campaign will start automatically when the call window opens. ${timeWindowCheck.nextWindowOpens || ""}`,
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("call_campaigns")
        .update({
          status: "running",
          started_at: new Date().toISOString(),
          paused_at: null,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign started successfully",
      });
    } else if (action === "pause") {
      if (existingCampaign.status !== "running") {
        return createErrorResponse(
          `Cannot pause campaign. Current status: ${existingCampaign.status}`,
          400
        );
      }

      const { error: updateError } = await supabase
        .from("call_campaigns")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign paused successfully",
      });
    } else if (action === "resume") {
      if (existingCampaign.status !== "paused") {
        return createErrorResponse(
          `Cannot resume campaign. Current status: ${existingCampaign.status}`,
          400
        );
      }

      // Check time window before resuming
      const timeWindowCheck = isWithinCallWindow({
        timezone: existingCampaign.timezone,
        allowedCallStartTime: existingCampaign.allowed_call_start_time,
        allowedCallEndTime: existingCampaign.allowed_call_end_time,
        allowedDaysOfWeek: existingCampaign.allowed_days_of_week || [],
      });

      if (!timeWindowCheck.isWithinWindow) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot resume campaign outside allowed call window",
            timeWindowStatus: timeWindowCheck,
            message: `Campaign will resume automatically when the call window opens. ${timeWindowCheck.nextWindowOpens || ""}`,
          },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("call_campaigns")
        .update({
          status: "running",
          paused_at: null,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign resumed successfully",
      });
    } else if (action === "cancel") {
      // Can cancel from any state except completed
      if (existingCampaign.status === "completed") {
        return createErrorResponse("Cannot cancel a completed campaign", 400);
      }

      const { error: updateError } = await supabase
        .from("call_campaigns")
        .update({
          status: "canceled",
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign canceled successfully",
      });
    } else if (action === "update") {
      // Update campaign settings (only if in draft or paused state)
      if (existingCampaign.status !== "draft" && existingCampaign.status !== "paused") {
        return createErrorResponse(
          "Can only update campaign when it's in draft or paused state",
          400
        );
      }

      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.purpose) updateData.purpose = body.purpose;
      if (body.purposeDetails !== undefined) updateData.purpose_details = body.purposeDetails;
      if (body.extraInstructions !== undefined) updateData.extra_instructions = body.extraInstructions;
      if (body.scriptStyle) updateData.script_style = body.scriptStyle;
      if (body.timezone) updateData.timezone = body.timezone;
      if (body.allowedCallStartTime) updateData.allowed_call_start_time = body.allowedCallStartTime;
      if (body.allowedCallEndTime) updateData.allowed_call_end_time = body.allowedCallEndTime;
      if (body.allowedDaysOfWeek) updateData.allowed_days_of_week = body.allowedDaysOfWeek;
      // Note: script_template is internal-only and not user-editable

      const { error: updateError } = await supabase
        .from("call_campaigns")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Campaign updated successfully",
      });
    } else {
      return createErrorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to update campaign", 500, error);
  }
}

/**
 * DELETE /api/campaigns/[id]
 * 
 * Delete a campaign (only if in draft or canceled state)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    // Get existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from("call_campaigns")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingCampaign) {
      return createErrorResponse("Campaign not found", 404);
    }

    // Only allow deletion of draft or canceled campaigns
    if (existingCampaign.status !== "draft" && existingCampaign.status !== "canceled") {
      return createErrorResponse(
        "Can only delete campaigns in draft or canceled state",
        400
      );
    }

    // Delete campaign (targets will be cascade deleted)
    const { error: deleteError } = await supabase
      .from("call_campaigns")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to delete campaign", 500, error);
  }
}

