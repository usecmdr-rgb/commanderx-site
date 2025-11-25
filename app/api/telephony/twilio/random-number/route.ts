import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { searchAvailableNumbers, isTwilioConfigured } from "@/lib/twilioClient";

/**
 * GET /api/telephony/twilio/random-number
 * 
 * Get a random available phone number
 * 
 * Query params:
 * - country (string, default "US")
 * - areaCode (string, optional)
 * 
 * Returns:
 * - Single random phone number
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    // Check if user already has an active number
    const supabase = getSupabaseServerClient();
    const { data: existingNumber } = await supabase
      .from("user_phone_numbers")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (existingNumber) {
      return NextResponse.json(
        {
          error: "already_has_number",
          message: "You already have an active Aloha number. Release it to choose a new one.",
        },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "US";
    const areaCode = searchParams.get("areaCode") || undefined;

    // Search for available numbers
    const numbers = await searchAvailableNumbers(country, areaCode);

    if (numbers.length === 0) {
      return NextResponse.json(
        { error: "no_numbers_available", message: "No phone numbers available for the selected criteria." },
        { status: 404 }
      );
    }

    // Pick a random number
    const randomIndex = Math.floor(Math.random() * numbers.length);
    const selectedNumber = numbers[randomIndex];

    return NextResponse.json({
      phoneNumber: selectedNumber.phoneNumber,
      friendlyName: selectedNumber.friendlyName,
      isMock: !isTwilioConfigured,
    });
  } catch (error: any) {
    console.error("Error in /api/telephony/twilio/random-number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

