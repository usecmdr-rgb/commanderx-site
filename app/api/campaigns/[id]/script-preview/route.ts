import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { generateCampaignScript, type CampaignScriptContext } from "@/lib/aloha/campaign-scripts";
import { isValidPurpose, type CampaignPurpose } from "@/lib/aloha/campaign-purposes";
import { createErrorResponse } from "@/lib/validation";

/**
 * POST /api/campaigns/[id]/script-preview
 * 
 * Generate a script preview for a campaign based on its purpose
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

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

    // Validate purpose
    if (!campaign.purpose || !isValidPurpose(campaign.purpose)) {
      return createErrorResponse(
        "Campaign must have a valid purpose to generate script preview",
        400
      );
    }

    // Generate script
    const scriptContext: CampaignScriptContext = {
      userId: user.id,
      campaignId,
      purpose: campaign.purpose as CampaignPurpose,
      purposeDetails: campaign.purpose_details || undefined,
      extraInstructions: campaign.extra_instructions || undefined,
      scriptStyle: campaign.script_style || undefined,
    };

    const script = await generateCampaignScript(scriptContext);

    return NextResponse.json({
      ok: true,
      script,
    });
  } catch (error: any) {
    console.error("Error generating script preview:", error);
    return createErrorResponse("Failed to generate script preview", 500, error);
  }
}

