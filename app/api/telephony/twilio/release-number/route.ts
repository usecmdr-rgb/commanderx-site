import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { releasePhoneNumber, isTwilioConfigured } from "@/lib/twilioClient";

/**
 * POST /api/telephony/twilio/release-number
 * 
 * Release the user's active Twilio phone number
 * 
 * Behavior:
 * - Finds active number for user
 * - Releases it from Twilio (or simulates in mock mode)
 * - Deactivates it in the database
 * - Resets voicemail and forwarding flags
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const supabase = getSupabaseServerClient();

    // Find active number for user
    const { data: activeNumber, error: fetchError } = await supabase
      .from("user_phone_numbers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (fetchError || !activeNumber) {
      return NextResponse.json(
        { error: "no_active_number", message: "You don't have an active Aloha number." },
        { status: 404 }
      );
    }

    // Release from Twilio (or simulate in mock mode)
    if (isTwilioConfigured) {
      try {
        await releasePhoneNumber(activeNumber.twilio_phone_sid);
      } catch (error: any) {
        // If it's a simulated SID, that's okay in mock mode
        if (!activeNumber.twilio_phone_sid.startsWith("SIMULATED_SID_")) {
          console.error("Error releasing Twilio number:", error);
          throw error;
        }
      }
    }

    // Update database: deactivate and reset flags
    const { error: updateError } = await supabase
      .from("user_phone_numbers")
      .update({
        is_active: false,
        voicemail_enabled: false,
        forwarding_enabled: false,
        forwarding_confirmed: false,
      })
      .eq("id", activeNumber.id);

    if (updateError) {
      console.error("Error updating phone number:", updateError);
      return NextResponse.json(
        { error: "Failed to update phone number", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: isTwilioConfigured ? "released" : "released_mock",
    });
  } catch (error: any) {
    console.error("Error in /api/telephony/twilio/release-number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

