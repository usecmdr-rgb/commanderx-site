import { NextRequest, NextResponse } from "next/server";
import { getOAuthRedirectUri } from "@/lib/oauth-helpers";

/**
 * Diagnostic endpoint to check Gmail OAuth configuration
 * This helps identify what's missing or misconfigured
 */
export async function GET(request: NextRequest) {
  // Get redirect URI using the same helper as auth/callback routes
  const cleanRedirectUri = getOAuthRedirectUri(
    { url: request.url, headers: request.headers },
    "/api/gmail/callback",
    "GMAIL_REDIRECT_URI"
  );
  
  // Get origin for display
  let origin: string | null = null;
  try {
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin;
  } catch {
    origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  const config = {
    hasClientId: !!process.env.GMAIL_CLIENT_ID,
    hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
    hasRedirectUri: !!process.env.GMAIL_REDIRECT_URI,
    clientIdLength: process.env.GMAIL_CLIENT_ID?.length || 0,
    clientSecretLength: process.env.GMAIL_CLIENT_SECRET?.length || 0,
    redirectUri: cleanRedirectUri,
    origin,
    nodeEnv: process.env.NODE_ENV,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    issues: [] as string[],
  };

  // Check for issues
  const clientIdValue = process.env.GMAIL_CLIENT_ID || "";
  const clientSecretValue = process.env.GMAIL_CLIENT_SECRET || "";
  const isPlaceholderId = clientIdValue.includes("your_") || clientIdValue === "your_gmail_client_id_here";
  const isPlaceholderSecret = clientSecretValue.includes("your_") || clientSecretValue === "your_gmail_client_secret_here";
  
  if (!config.hasClientId) {
    config.issues.push("GMAIL_CLIENT_ID is not set in environment variables");
  } else if (isPlaceholderId) {
    config.issues.push("GMAIL_CLIENT_ID contains placeholder value - you need to replace 'your_gmail_client_id_here' with your actual Client ID from Google Cloud Console");
  } else if (config.clientIdLength < 20) {
    config.issues.push("GMAIL_CLIENT_ID appears to be invalid (too short - should be 50+ characters)");
  }
  
  if (!config.hasClientSecret) {
    config.issues.push("GMAIL_CLIENT_SECRET is not set in environment variables");
  } else if (isPlaceholderSecret) {
    config.issues.push("GMAIL_CLIENT_SECRET contains placeholder value - you need to replace 'your_gmail_client_secret_here' with your actual Client Secret from Google Cloud Console");
  } else if (config.clientSecretLength < 20) {
    config.issues.push("GMAIL_CLIENT_SECRET appears to be invalid (too short - should be 20+ characters)");
  }

  // Validate redirect URI
  try {
    new URL(cleanRedirectUri);
  } catch {
    config.issues.push(`Redirect URI "${cleanRedirectUri}" is not a valid URL`);
  }

  return NextResponse.json({
    ok: config.issues.length === 0,
    config: {
      ...config,
      clientId: config.hasClientId ? `${process.env.GMAIL_CLIENT_ID?.substring(0, 10)}...` : "NOT SET",
      clientSecret: config.hasClientSecret ? "***SET***" : "NOT SET",
    },
    issues: config.issues,
    redirectUri: cleanRedirectUri,
    setupInstructions: config.issues.length > 0 ? {
      step1: "Go to https://console.cloud.google.com/apis/credentials",
      step2: "Create or select a project (if needed)",
      step3: "Enable Gmail API (APIs & Services → Library → search 'Gmail API' → Enable)",
      step4: "Go to APIs & Services → Credentials",
      step5: "Click + CREATE CREDENTIALS → OAuth client ID",
      step6: "If prompted, configure OAuth consent screen first (External, add your email as test user)",
      step7: "Application type: Web application",
      step8: `Add authorized redirect URI: ${cleanRedirectUri}`,
      step9: "Click Create - you'll see a popup with Client ID and Client Secret",
      step10: "Copy the Client ID (long string, ~50+ characters)",
      step11: "Copy the Client Secret (also a long string)",
      step12: "Open .env.local in your project root",
      step13: "Replace the placeholder values with your actual credentials:",
      step14: "   GMAIL_CLIENT_ID=your_actual_client_id_from_google",
      step15: "   GMAIL_CLIENT_SECRET=your_actual_client_secret_from_google",
      step16: "Save .env.local and restart your dev server (Ctrl+C then npm run dev)",
      step17: "See GMAIL_SETUP.md for detailed instructions",
    } : null,
    isPlaceholder: isPlaceholderId || isPlaceholderSecret,
  });
}

