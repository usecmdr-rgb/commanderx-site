import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getOAuthRedirectUri } from "@/lib/oauth-helpers";

const CALENDAR_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "";
const CALENDAR_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/sync?error=${encodeURIComponent(error)}&tab=calendar`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/sync?error=missing_code&tab=calendar", request.url)
      );
    }

    // Get redirect URI using shared helper to ensure it matches the auth request exactly
    const cleanRedirectUri = getOAuthRedirectUri(
      { url: request.url, headers: request.headers },
      "/api/calendar/callback",
      "CALENDAR_REDIRECT_URI"
    );

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
        redirect_uri: cleanRedirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/sync?error=token_exchange_failed&tab=calendar", request.url)
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
      new URL("/sync?calendar_connected=true&tab=calendar", request.url)
    );
  } catch (error: any) {
    console.error("Error in Calendar callback:", error);
    return NextResponse.redirect(
      new URL("/sync?error=callback_error&tab=calendar", request.url)
    );
  }
}

