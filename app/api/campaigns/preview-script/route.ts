import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { generateCampaignScript, type CampaignScriptContext } from "@/lib/aloha/campaign-scripts";
import { isValidPurpose, type CampaignPurpose } from "@/lib/aloha/campaign-purposes";
import { createErrorResponse } from "@/lib/validation";

/**
 * POST /api/campaigns/preview-script
 * 
 * Generate a script preview without creating a campaign
 * Used by the campaign creation UI
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const body = await request.json();

    const { purpose, purposeDetails, extraInstructions, scriptStyle } = body;

    if (!purpose || !isValidPurpose(purpose)) {
      return createErrorResponse(
        "Valid purpose is required",
        400
      );
    }

    // Generate script preview
    const scriptContext: CampaignScriptContext = {
      userId: user.id,
      campaignId: "preview", // Temporary ID for preview
      purpose: purpose as CampaignPurpose,
      purposeDetails: purposeDetails || undefined,
      extraInstructions: extraInstructions || undefined,
      scriptStyle: scriptStyle || undefined,
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

