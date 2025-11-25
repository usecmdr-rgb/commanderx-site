import { NextRequest, NextResponse } from "next/server";

/**
 * Validate Gmail OAuth configuration
 * This endpoint checks if the credentials are properly set up
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
  
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check if Client ID is set
  if (!clientId) {
    issues.push("GMAIL_CLIENT_ID is not set in .env.local");
  } else if (clientId === "your_gmail_client_id_here" || clientId.includes("your_")) {
    issues.push("GMAIL_CLIENT_ID contains placeholder value - replace with actual Client ID from Google Cloud Console");
  } else if (clientId.length < 20) {
    issues.push("GMAIL_CLIENT_ID appears to be invalid (too short - should be ~50+ characters)");
  } else if (!clientId.includes(".") && !clientId.includes("-")) {
    warnings.push("GMAIL_CLIENT_ID format looks unusual - verify it's correct");
  }
  
  // Check if Client Secret is set
  if (!clientSecret) {
    issues.push("GMAIL_CLIENT_SECRET is not set in .env.local");
  } else if (clientSecret === "your_gmail_client_secret_here" || clientSecret.includes("your_")) {
    issues.push("GMAIL_CLIENT_SECRET contains placeholder value - replace with actual Client Secret from Google Cloud Console");
  } else if (clientSecret.length < 20) {
    issues.push("GMAIL_CLIENT_SECRET appears to be invalid (too short - should be ~20+ characters)");
  }
  
  // Get redirect URI
  const origin = request.headers.get("origin") || 
                 request.headers.get("referer")?.split("/").slice(0, 3).join("/") || 
                 process.env.NEXT_PUBLIC_APP_URL || 
                 "http://localhost:3001";
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${origin}/api/gmail/callback`;
  const cleanRedirectUri = redirectUri.replace(/\/$/, "").trim();
  
  return NextResponse.json({
    ok: issues.length === 0,
    hasClientId: !!clientId && !clientId.includes("your_"),
    hasClientSecret: !!clientSecret && !clientSecret.includes("your_"),
    clientIdLength: clientId.length,
    clientSecretLength: clientSecret.length,
    redirectUri: cleanRedirectUri,
    issues,
    warnings,
    recommendations: issues.length > 0 ? [
      "1. Go to https://console.cloud.google.com/apis/credentials",
      "2. Create OAuth 2.0 Client ID if you haven't already",
      "3. Copy the actual Client ID (starts with a long string)",
      "4. Copy the Client Secret",
      `5. Add to .env.local: GMAIL_CLIENT_ID=<your_actual_id>`,
      `6. Add to .env.local: GMAIL_CLIENT_SECRET=<your_actual_secret>`,
      `7. Make sure redirect URI in Google Cloud Console is: ${cleanRedirectUri}`,
      "8. Restart your dev server"
    ] : [],
  });
}

