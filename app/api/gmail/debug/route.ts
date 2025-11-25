import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check OAuth configuration and generate test URL
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
  
  const origin = request.headers.get("origin") || 
                 request.headers.get("referer")?.split("/").slice(0, 3).join("/") || 
                 process.env.NEXT_PUBLIC_APP_URL || 
                 "http://localhost:3001";
  
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${origin}/api/gmail/callback`;
  const cleanRedirectUri = redirectUri.replace(/\/$/, "").trim();

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", cleanRedirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", "debug-test");

  return NextResponse.json({
    configuration: {
      hasClientId: !!clientId && !clientId.includes("your_"),
      hasClientSecret: !!clientSecret && !clientSecret.includes("your_"),
      clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : "NOT SET",
      redirectUri: cleanRedirectUri,
      origin,
    },
    oauthUrl: authUrl.toString(),
    instructions: {
      step1: "Copy the redirect URI above",
      step2: "Go to https://console.cloud.google.com/apis/credentials",
      step3: "Click on your OAuth 2.0 Client ID",
      step4: "Add the redirect URI to 'Authorized redirect URIs'",
      step5: "Click SAVE",
      step6: "Try connecting Gmail again",
    },
    testUrl: authUrl.toString(),
  });
}

