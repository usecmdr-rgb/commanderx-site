import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * POST /api/telephony/twilio/release-number
 * 
 * Release (deactivate) the user's active Twilio phone number
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    // Find active number
    const { data: activeNumber, error: fetchError } = await supabase
      .from("user_phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (fetchError || !activeNumber) {
      return NextResponse.json(
        { error: "No active number found" },
        { status: 404 }
      );
    }

    // TODO: Integrate with actual Twilio API
    // In production, you would:
    // 1. Call Twilio's IncomingPhoneNumber.delete() API
    // 2. Release the number from Twilio

    // Deactivate the number (trigger will disable voicemail automatically)
    const { error: updateError } = await supabase
      .from("user_phone_numbers")
      .update({ is_active: false })
      .eq("id", activeNumber.id);

    if (updateError) {
      console.error("Error releasing number:", updateError);
      return NextResponse.json(
        { error: "Failed to release number" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Number released successfully",
    });
  } catch (error: any) {
    console.error("Error releasing number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
