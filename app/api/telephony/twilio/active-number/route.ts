import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * GET /api/telephony/twilio/active-number
 * 
 * Get the user's active Twilio phone number
 * 
 * Returns:
 * - ok: boolean
 * - phoneNumber: UserPhoneNumber | null
 */
export async function GET(request: NextRequest) {
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

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = not found, which is okay
      console.error("Error fetching active number:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch phone number", details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      phoneNumber: activeNumber || null,
    });
  } catch (error: any) {
    console.error("Error in /api/telephony/twilio/active-number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

