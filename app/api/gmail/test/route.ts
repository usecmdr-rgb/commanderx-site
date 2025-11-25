import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to verify Gmail OAuth configuration
 * Visit /api/gmail/test in your browser to see the current configuration
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") || 
                 request.headers.get("referer")?.split("/").slice(0, 3).join("/") || 
                 process.env.NEXT_PUBLIC_APP_URL || 
                 "http://localhost:3001";
  
  const redirectUri = process.env.GMAIL_REDIRECT_URI || `${origin}/api/gmail/callback`;
  const cleanRedirectUri = redirectUri.replace(/\/$/, "").trim();

  const hasClientId = !!process.env.GMAIL_CLIENT_ID;
  const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
  const clientIdValue = process.env.GMAIL_CLIENT_ID || "NOT SET";
  const isPlaceholder = clientIdValue.includes("your_") || clientIdValue.includes("placeholder");

  // Generate OAuth URL for display (if client ID is configured)
  let authUrlString = "Not available (Client ID not configured)";
  if (hasClientId && !isPlaceholder) {
    try {
      const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
      ].join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientIdValue);
      authUrl.searchParams.set("redirect_uri", cleanRedirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrlString = authUrl.toString();
    } catch (error) {
      authUrlString = "Error generating OAuth URL";
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gmail OAuth Configuration Test</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        h1 { color: #333; margin-top: 0; }
        h2 { color: #666; font-size: 18px; margin-top: 0; }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
        }
        .status.ok { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.warning { background: #fff3cd; color: #856404; }
        .config-item {
          margin: 12px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .config-item strong { display: block; margin-bottom: 4px; color: #333; }
        .config-item code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        }
        .instructions {
          background: #e7f3ff;
          border-left: 4px solid #2196F3;
          padding: 16px;
          margin: 16px 0;
        }
        .instructions ol { margin: 8px 0; padding-left: 24px; }
        .instructions li { margin: 4px 0; }
        a { color: #2196F3; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Gmail OAuth Configuration Test</h1>
        <p>This page shows your current Gmail OAuth configuration status.</p>
      </div>

      <div class="card">
        <h2>Configuration Status</h2>
        <div class="config-item">
          <strong>Client ID:</strong>
          <span class="status ${hasClientId && !isPlaceholder ? 'ok' : 'error'}">
            ${hasClientId && !isPlaceholder ? '✓ Configured' : '✗ Not Configured'}
          </span>
          ${hasClientId ? `<br><code>${clientIdValue.substring(0, 20)}...</code>` : ''}
          ${isPlaceholder ? '<br><span style="color: #856404;">⚠ Placeholder value detected</span>' : ''}
        </div>
        
        <div class="config-item">
          <strong>Client Secret:</strong>
          <span class="status ${hasClientSecret ? 'ok' : 'error'}">
            ${hasClientSecret ? '✓ Configured' : '✗ Not Configured'}
          </span>
        </div>

        <div class="config-item">
          <strong>Redirect URI:</strong>
          <code>${cleanRedirectUri}</code>
          <br><small style="color: #666;">This must match exactly in Google Cloud Console</small>
        </div>

        <div class="config-item">
          <strong>Current Origin:</strong>
          <code>${origin}</code>
        </div>
      </div>

      ${!hasClientId || !hasClientSecret || isPlaceholder ? `
      <div class="card">
        <h2>Setup Required</h2>
        <div class="instructions">
          <p><strong>To complete Gmail OAuth setup:</strong></p>
          <ol>
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
            <li>Create or select a project</li>
            <li>Enable <strong>Gmail API</strong> (APIs & Services → Library)</li>
            <li>Go to <strong>APIs & Services → Credentials</strong></li>
            <li>Click <strong>+ CREATE CREDENTIALS → OAuth client ID</strong></li>
            <li>Application type: <strong>Web application</strong></li>
            <li>Add authorized redirect URI: <code>${cleanRedirectUri}</code></li>
            <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            <li>Add them to your <code>.env.local</code> file:
              <pre style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-top: 8px;">
GMAIL_CLIENT_ID=your_actual_client_id_here
GMAIL_CLIENT_SECRET=your_actual_client_secret_here</pre>
            </li>
            <li>Restart your development server</li>
          </ol>
          <p><strong>Note:</strong> See <code>GMAIL_SETUP.md</code> for detailed instructions.</p>
        </div>
      </div>
      ` : `
      <div class="card">
        <h2>✓ Configuration Complete</h2>
        <p>Your Gmail OAuth appears to be configured correctly!</p>
        <p>Try connecting Gmail from the Sync agent page.</p>
        <p><strong>Important:</strong> Make sure the redirect URI above is added to your OAuth 2.0 Client ID in Google Cloud Console.</p>
      </div>
      `}

      <div class="card">
        <h2>🔍 Debug Information</h2>
        <div class="config-item">
          <strong>OAuth URL being generated:</strong>
          <code style="word-break: break-all; display: block; margin-top: 8px; font-size: 11px;">${authUrlString.length > 200 ? authUrlString.substring(0, 200) + '...' : authUrlString}</code>
        </div>
        <div class="config-item">
          <strong>Redirect URI in OAuth request:</strong>
          <code>${cleanRedirectUri}</code>
          <br><small style="color: #856404; margin-top: 4px; display: block;">
            ⚠️ This EXACT value must be in Google Cloud Console under "Authorized redirect URIs"
          </small>
        </div>
        <div class="config-item" style="background: #fff3cd; border-left: 4px solid #ffc107;">
          <strong>⚠️ Critical Fix Required:</strong>
          <p style="margin: 8px 0 0 0;">If you're getting "invalid_client" error, make sure this redirect URI is added in Google Cloud Console:</p>
          <code style="display: block; margin-top: 8px; background: white; padding: 8px; border: 1px solid #ddd;">${cleanRedirectUri}</code>
          <p style="margin: 8px 0 0 0; font-size: 13px;">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank">→ Go to Google Cloud Console Credentials</a>
          </p>
        </div>
      </div>

      <div class="card">
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/sync">Go to Sync Agent</a></li>
          <li><a href="/api/gmail/debug" target="_blank">Debug Endpoint (JSON)</a></li>
          <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console - Credentials</a></li>
          <li><a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank">Enable Gmail API</a></li>
        </ul>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

