import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

const CALENDAR_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "";
const CALENDAR_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "";
const CALENDAR_REDIRECT_URI = process.env.CALENDAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/calendar/callback`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/sync/calendar?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/sync/calendar?error=missing_code", request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: CALENDAR_CLIENT_ID,
        client_secret: CALENDAR_CLIENT_SECRET,
        redirect_uri: CALENDAR_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/sync/calendar?error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Store tokens in Supabase
    const supabase = getSupabaseServerClient();
    const { error: dbError } = await supabase
      .from("calendar_connections")
      .upsert({
        user_id: state,
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + (expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      console.error("Error storing Calendar tokens:", dbError);
    }

    return NextResponse.redirect(
      new URL("/sync/calendar?calendar_connected=true", request.url)
    );
  } catch (error: any) {
    console.error("Error in Calendar callback:", error);
    return NextResponse.redirect(
      new URL("/sync/calendar?error=callback_error", request.url)
    );
  }
}

