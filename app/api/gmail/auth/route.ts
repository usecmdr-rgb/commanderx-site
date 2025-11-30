import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

// Gmail OAuth configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    // Validate client ID is configured
    if (!GMAIL_CLIENT_ID || GMAIL_CLIENT_ID === "your_gmail_client_id_here" || GMAIL_CLIENT_ID.includes("your_")) {
      return NextResponse.json(
        { 
          error: "Gmail OAuth is not configured",
          details: "GMAIL_CLIENT_ID is not set or contains placeholder value. Please set a valid Client ID from Google Cloud Console.",
          setupRequired: true
        },
        { status: 500 }
      );
    }
    
    // Validate client ID format (should be a long string, not a placeholder)
    if (GMAIL_CLIENT_ID.length < 20) {
      return NextResponse.json(
        { 
          error: "Invalid Gmail Client ID",
          details: "GMAIL_CLIENT_ID appears to be invalid (too short). Please check your .env.local file.",
          setupRequired: true
        },
        { status: 500 }
      );
    }
    
    // Log the exact Client ID being used for debugging
    console.log("[Gmail OAuth] Using Client ID:", GMAIL_CLIENT_ID.substring(0, 30) + "...");
    console.log("[Gmail OAuth] Client ID length:", GMAIL_CLIENT_ID.length);

    const supabase = getSupabaseServerClient();
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.match(/^Bearer\s+(.*)$/i)?.[1]?.trim();
    const userIdHeader = request.headers.get("x-user-id");

    // Get userId - require authentication
    let userId: string;
    
    if (!accessToken || accessToken === "dev-token") {
      return NextResponse.json(
        { error: "Unauthorized", details: "Please log in to connect Gmail." },
        { status: 401 }
      );
    }

    if (userIdHeader) {
      // Verify the user ID matches the authenticated user
      const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !userResult?.user) {
        return NextResponse.json(
          { error: "Unauthorized", details: "Invalid authentication token." },
          { status: 401 }
        );
      }
      // Use userId from header if it matches authenticated user
      if (userIdHeader === userResult.user.id) {
        userId = userIdHeader;
      } else {
        userId = userResult.user.id;
      }
    } else {
      // Get userId from auth token
      const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !userResult?.user) {
        return NextResponse.json(
          { error: "Unauthorized", details: "Invalid authentication token." },
          { status: 401 }
        );
      }
      userId = userResult.user.id;
    }

    // Construct redirect URI from the request origin to ensure it matches exactly
    // Try multiple methods to get the origin, prioritizing the actual request origin
    let origin = request.headers.get("origin");
    
    if (!origin) {
      // Try to get from referer header
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          origin = refererUrl.origin;
        } catch {
          // Fallback to extracting from referer string
          const match = referer.match(/^(https?:\/\/[^\/]+)/);
          if (match) origin = match[1];
        }
      }
    }
    
    // Try to get from the request URL itself
    if (!origin) {
      try {
        const requestUrl = new URL(request.url);
        origin = requestUrl.origin;
      } catch {
        // Ignore
      }
    }
    
    // Final fallback to environment variable or default (use 3000 as default for Next.js)
    if (!origin) {
      origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    }
    
    // Use explicit redirect URI from env if set, otherwise construct from origin
    const redirectUri = process.env.GMAIL_REDIRECT_URI || `${origin}/api/gmail/callback`;
    
    // Ensure redirect URI doesn't have trailing slash (Google is strict about this)
    const cleanRedirectUri = redirectUri.replace(/\/$/, "").trim();
    
    // Validate redirect URI format
    try {
      new URL(cleanRedirectUri);
    } catch {
      return NextResponse.json(
        { 
          error: "Invalid redirect URI configuration",
          details: `Redirect URI "${cleanRedirectUri}" is not a valid URL. Please set GMAIL_REDIRECT_URI in environment variables.`
        },
        { status: 500 }
      );
    }

    // Generate OAuth URL
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GMAIL_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", cleanRedirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", userId); // Pass user ID in state for callback
    
    // Log the exact redirect URI being used for debugging
    console.log("[Gmail OAuth] Redirect URI being used:", cleanRedirectUri);
    console.log("[Gmail OAuth] Client ID:", GMAIL_CLIENT_ID.substring(0, 20) + "...");

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("Gmail OAuth URL generated:", {
        clientId: GMAIL_CLIENT_ID ? "***configured***" : "MISSING",
        redirectUri: cleanRedirectUri,
        userId,
      });
    }

    return NextResponse.json({
      ok: true,
      authUrl: authUrl.toString(),
      redirectUri: cleanRedirectUri, // Return for debugging
    });
  } catch (error: any) {
    console.error("Error generating Gmail auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL", details: error.message },
      { status: 500 }
    );
  }
}

