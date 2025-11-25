import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { isWithinCallWindow, getTimeWindowSummary } from "@/lib/campaign-time-window";

/**
 * GET /api/campaigns
 * 
 * Get all call campaigns for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    // Get campaigns with target counts
    const { data: campaigns, error } = await supabase
      .from("call_campaigns")
      .select(`
        *,
        call_campaign_targets(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate progress for each campaign
    const campaignsWithProgress = await Promise.all(
      (campaigns || []).map(async (campaign: any) => {
        // Get target status counts
        const { data: targets } = await supabase
          .from("call_campaign_targets")
          .select("status")
          .eq("campaign_id", campaign.id);

        const total = targets?.length || 0;
        const completed =
          targets?.filter((t) => t.status === "completed").length || 0;
        const pending =
          targets?.filter((t) => t.status === "pending").length || 0;
        const failed =
          targets?.filter((t) => t.status === "failed").length || 0;

        // Check time window status
        const timeWindowCheck = isWithinCallWindow({
          timezone: campaign.timezone,
          allowedCallStartTime: campaign.allowed_call_start_time,
          allowedCallEndTime: campaign.allowed_call_end_time,
          allowedDaysOfWeek: campaign.allowed_days_of_week || [],
        });

        return {
          ...campaign,
          progress: {
            total,
            completed,
            pending,
            failed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
          timeWindowSummary: getTimeWindowSummary({
            timezone: campaign.timezone,
            allowedCallStartTime: campaign.allowed_call_start_time,
            allowedCallEndTime: campaign.allowed_call_end_time,
            allowedDaysOfWeek: campaign.allowed_days_of_week || [],
          }),
          timeWindowStatus: timeWindowCheck,
        };
      })
    );

    return NextResponse.json({ campaigns: campaignsWithProgress });
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
 * Create a new call campaign
 * 
 * Body:
 * - name, description, type
 * - timezone, allowedCallStartTime, allowedCallEndTime, allowedDaysOfWeek
 * - scriptTemplate (optional)
 * - phoneNumbers (array of phone numbers or newline-separated string)
 * - contactNames (optional array, parallel to phoneNumbers)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // Validate required fields
    if (!body.name || !body.type) {
      return createErrorResponse("Name and type are required", 400);
    }

    // Validate purpose if provided
    if (body.purpose) {
      const validPurposes = [
        "lead_generation_sales",
        "feedback_satisfaction",
        "appointment_management",
        "order_project_updates",
        "administrative_operations",
        "loyalty_relationship",
        "urgent_notifications",
        "custom",
      ];
      if (!validPurposes.includes(body.purpose)) {
        return createErrorResponse(`Invalid purpose. Must be one of: ${validPurposes.join(", ")}`, 400);
      }

      // Validate purpose_details for required purposes
      const { getPurposeDefinition } = await import("@/lib/aloha/campaign-purposes");
      const purposeDef = getPurposeDefinition(body.purpose);
      if (purposeDef.requiresPurposeDetails && (!body.purposeDetails || !body.purposeDetails.trim())) {
        return createErrorResponse(
          `Campaign message is required for ${purposeDef.label} campaigns. Please provide what Aloha should tell these contacts.`,
          400
        );
      }
    }

    // Validate script_style if provided
    if (body.scriptStyle) {
      const validStyles = ["friendly", "professional", "energetic", "calm", "casual"];
      if (!validStyles.includes(body.scriptStyle)) {
        return createErrorResponse(`Invalid script_style. Must be one of: ${validStyles.join(", ")}`, 400);
      }
    }

    if (!body.phoneNumbers || (Array.isArray(body.phoneNumbers) && body.phoneNumbers.length === 0)) {
      return createErrorResponse("At least one phone number is required", 400);
    }

    // Parse phone numbers (can be array or newline-separated string)
    let phoneNumbers: string[] = [];
    if (Array.isArray(body.phoneNumbers)) {
      phoneNumbers = body.phoneNumbers;
    } else if (typeof body.phoneNumbers === "string") {
      // Split by newlines or commas
      phoneNumbers = body.phoneNumbers
        .split(/[\n,]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }

    if (phoneNumbers.length === 0) {
      return createErrorResponse("At least one valid phone number is required", 400);
    }

    // Parse contact names if provided
    let contactNames: (string | null)[] = [];
    if (body.contactNames && Array.isArray(body.contactNames)) {
      contactNames = body.contactNames;
    } else if (body.contactNames && typeof body.contactNames === "string") {
      contactNames = body.contactNames
        .split(/[\n,]/)
        .map((n) => n.trim() || null);
    } else {
      contactNames = new Array(phoneNumbers.length).fill(null);
    }

    // Ensure contactNames array matches phoneNumbers length
    while (contactNames.length < phoneNumbers.length) {
      contactNames.push(null);
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("call_campaigns")
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        type: body.type,
        status: "draft", // Always start as draft
        purpose: body.purpose || null,
        purpose_details: body.purposeDetails || null,
        script_style: body.scriptStyle || null,
        business_context_required: body.businessContextRequired !== false, // Default true
        timezone: body.timezone || "America/New_York",
        allowed_call_start_time: body.allowedCallStartTime || "09:00:00",
        allowed_call_end_time: body.allowedCallEndTime || "18:00:00",
        allowed_days_of_week: body.allowedDaysOfWeek || [
          "mon",
          "tue",
          "wed",
          "thu",
          "fri",
        ],
        script_template: null, // Internal-only, generated from purpose + purpose_details
        extra_instructions: body.extraInstructions || null,
        rate_limit_per_minute: body.rateLimitPerMinute || 5,
        rate_limit_per_hour: body.rateLimitPerHour || 30,
      })
      .select("id")
      .single();

    if (campaignError) {
      throw campaignError;
    }

    // Create campaign targets
    const targets = phoneNumbers.map((phone, idx) => ({
      campaign_id: campaign.id,
      phone_number: phone,
      contact_name: contactNames[idx] || null,
      status: "pending",
    }));

    const { error: targetsError } = await supabase
      .from("call_campaign_targets")
      .insert(targets);

    if (targetsError) {
      // Rollback: delete campaign if targets fail
      await supabase.from("call_campaigns").delete().eq("id", campaign.id);
      throw targetsError;
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: "Campaign created successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to create campaign", 500, error);
  }
}

