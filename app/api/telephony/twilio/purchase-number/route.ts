import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { purchasePhoneNumber, isTwilioConfigured } from "@/lib/twilioClient";

/**
 * POST /api/telephony/twilio/purchase-number
 * 
 * Purchase and assign a Twilio phone number to the user
 * 
 * Body:
 * - phoneNumber (string, required)
 * - country (string, default "US")
 * - areaCode (string, optional)
 * 
 * Behavior:
 * - Deactivates any existing active number for the user
 * - Purchases the number (or simulates in mock mode)
 * - Creates a new user_phone_numbers record
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const body = await request.json();
    const { phoneNumber, country = "US", areaCode } = body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Deactivate any existing active number for this user
    await supabase
      .from("user_phone_numbers")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    // TODO: When Twilio is fully configured, optionally release old number via Twilio API

    // Determine voice URL for Twilio webhook
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";
    const voiceUrl = `${baseUrl}/api/twilio/voice/incoming`;

    // Purchase the number (or simulate in mock mode)
    const purchased = await purchasePhoneNumber(phoneNumber, voiceUrl);

    // Extract area code from phone number if not provided
    let extractedAreaCode = areaCode;
    if (!extractedAreaCode && phoneNumber.startsWith("+1") && phoneNumber.length === 12) {
      extractedAreaCode = phoneNumber.substring(2, 5);
    }

    // Create new user_phone_numbers record
    const { data: newNumber, error: insertError } = await supabase
      .from("user_phone_numbers")
      .insert({
        user_id: userId,
        twilio_phone_sid: purchased.sid,
        phone_number: purchased.phoneNumber,
        country,
        area_code: extractedAreaCode,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting phone number:", insertError);
      return NextResponse.json(
        { error: "Failed to save phone number", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: isTwilioConfigured ? "purchased" : "mock_purchased",
      phoneNumber: purchased.phoneNumber,
      id: newNumber.id,
    });
  } catch (error: any) {
    console.error("Error in /api/telephony/twilio/purchase-number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

