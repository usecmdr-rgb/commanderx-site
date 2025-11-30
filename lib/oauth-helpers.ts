/**
 * Helper functions for OAuth redirect URI construction
 * Ensures consistency between auth request and callback
 */

/**
 * Gets the redirect URI for OAuth callbacks
 * This function ensures the redirect URI is constructed consistently
 * across auth requests and callbacks
 */
export function getOAuthRedirectUri(
  request: { url: string; headers: Headers },
  callbackPath: string,
  envVarName?: string
): string {
  // First, check if explicit redirect URI is set in environment
  if (envVarName && process.env[envVarName]) {
    const envUri = process.env[envVarName]?.trim();
    if (envUri) {
      return envUri.replace(/\/$/, ""); // Remove trailing slash
    }
  }

  // Try to get origin from request URL (most reliable)
  let origin: string | null = null;
  
  try {
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin;
  } catch {
    // If that fails, try headers
  }

  // Fallback to origin header
  if (!origin) {
    origin = request.headers.get("origin");
  }

  // Fallback to referer header
  if (!origin) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        origin = refererUrl.origin;
      } catch {
        const match = referer.match(/^(https?:\/\/[^\/]+)/);
        if (match) origin = match[1];
      }
    }
  }

  // Final fallback to environment variable or default
  if (!origin) {
    origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  // Construct redirect URI
  const redirectUri = `${origin}${callbackPath}`;
  
  // Remove trailing slash and trim (Google is strict about this)
  return redirectUri.replace(/\/$/, "").trim();
}

