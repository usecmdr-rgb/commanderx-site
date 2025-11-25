import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * POST /api/telephony/twilio/purchase-number
 * 
 * Purchase a Twilio phone number for the user
 * 
 * Body:
 * - phoneNumber: string (E.164 format)
 * - country: string
 * - areaCode: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { phoneNumber, country, areaCode } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual Twilio API
    // For now, create a mock record
    // In production, you would:
    // 1. Call Twilio's IncomingPhoneNumber.create() API
    // 2. Get the Phone Number SID
    // 3. Configure webhook URL
    // 4. Store in database

    // Deactivate any existing active numbers
    await supabase
      .from("user_phone_numbers")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Create new phone number record
    const { data: newNumber, error: insertError } = await supabase
      .from("user_phone_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        country: country || "US",
        area_code: areaCode || null,
        twilio_phone_sid: `SIMULATED_SID_${Date.now()}`, // Mock SID
        is_active: true,
        voicemail_enabled: false,
        voicemail_mode: "none",
        forwarding_enabled: false,
        forwarding_confirmed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating phone number:", insertError);
      return NextResponse.json(
        { error: "Failed to purchase number" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      phoneNumber: newNumber,
    });
  } catch (error: any) {
    console.error("Error purchasing number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
