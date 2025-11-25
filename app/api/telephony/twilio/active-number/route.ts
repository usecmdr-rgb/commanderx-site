import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * GET /api/telephony/twilio/active-number
 * 
 * Get the user's active Twilio phone number
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const supabase = getSupabaseServerClient();

    const { data: phoneNumber, error } = await supabase
      .from("user_phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error || !phoneNumber) {
      return NextResponse.json({
        ok: true,
        phoneNumber: null,
      });
    }

    return NextResponse.json({
      ok: true,
      phoneNumber,
    });
  } catch (error: any) {
    console.error("Error fetching active number:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
