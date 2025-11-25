import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { generateCampaignSystemPrompt, type CampaignScriptContext } from "@/lib/aloha/campaign-scripts";
import { isValidPurpose, type CampaignPurpose } from "@/lib/aloha/campaign-purposes";
import { createAlohaCallHandler } from "@/lib/aloha/call-handler";

/**
 * POST /api/campaigns/[id]/test-call
 * 
 * Initiate a test call for a campaign so the user can hear how Aloha behaves
 * 
 * Body:
 * - phoneNumber: string (required) - Phone number to call (usually user's own)
 * 
 * Rate Limiting:
 * - Max 5 test calls per hour per user (enforced in application)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();
    const campaignId = params.id;

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber || typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return createErrorResponse("phoneNumber is required", 400);
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("call_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return createErrorResponse("Campaign not found", 404);
    }

    // Rate limiting: Check test calls in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentTestCalls, error: rateLimitError } = await supabase
      .from("calls")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_test_call", true)
      .gte("created_at", oneHourAgo);

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError);
    } else {
      const testCallCount = recentTestCalls?.length || 0;
      const MAX_TEST_CALLS_PER_HOUR = 5;
      if (testCallCount >= MAX_TEST_CALLS_PER_HOUR) {
        return createErrorResponse(
          `Rate limit exceeded: Maximum ${MAX_TEST_CALLS_PER_HOUR} test calls per hour. Please try again later.`,
          429
        );
      }
    }

    // Generate system prompt for test call (same as real campaign call)
    let systemPrompt: string | null = null;
    if (campaign.purpose && isValidPurpose(campaign.purpose)) {
      try {
        const scriptContext: CampaignScriptContext = {
          userId: user.id,
          campaignId,
          purpose: campaign.purpose as CampaignPurpose,
          purposeDetails: campaign.purpose_details || undefined,
          extraInstructions: campaign.extra_instructions || undefined,
          scriptStyle: campaign.script_style || undefined,
        };
        systemPrompt = await generateCampaignSystemPrompt(scriptContext);
      } catch (error) {
        console.error("Error generating test call system prompt:", error);
        return createErrorResponse("Failed to generate call script", 500);
      }
    }

    // Create test call handler
    const callHandler = await createAlohaCallHandler(
      user.id,
      undefined, // No callId yet - will be created when call is initiated
      "outbound",
      {
        enableFillerSpeech: true,
        enableConversationEnhancement: true,
        streaming: true,
      }
    );

    // TODO: Integrate with actual telephony provider to place the call
    // For now, return metadata about what would happen
    
    // In production, this would:
    // 1. Create a call log entry with is_test_call = true
    // 2. Initiate call via telephony API
    // 3. Use systemPrompt to configure Aloha
    // 4. Return call status

    // Create test call log entry
    const { data: callLog, error: callLogError } = await supabase
      .from("calls")
      .insert({
        user_id: user.id,
        agent_id: null, // Will be set when agent is determined
        summary: `Test call for campaign: ${campaign.name}`,
        outcome: "test_initiated",
        is_test_call: true,
        test_campaign_id: campaignId, // Link to campaign being tested
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (callLogError) {
      console.error("Error creating test call log:", callLogError);
      // Continue anyway - call log is for tracking, not blocking
    }

    // Cleanup handler
    callHandler.cleanup();

    return NextResponse.json({
      ok: true,
      message: "Test call initiated",
      callLogId: callLog?.id,
      phoneNumber,
      systemPrompt: systemPrompt ? "Generated successfully" : null,
      note: "In production, this would place an actual call via your telephony provider. The call would use the generated system prompt to configure Aloha's behavior.",
    });
  } catch (error: any) {
    console.error("Error initiating test call:", error);
    return createErrorResponse("Failed to initiate test call", 500, error);
  }
}

