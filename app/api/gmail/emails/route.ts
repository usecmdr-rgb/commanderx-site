import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{ body: { data?: string } }>;
    body?: { data?: string };
  };
  internalDate: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.match(/^Bearer\s+(.*)$/i)?.[1]?.trim();
    const isDevUser = request.headers.get("x-dev-user") === "true";

    // In development, allow proceeding without auth token
    let userId: string;
    if ((!accessToken || accessToken === "dev-token" || isDevUser) && process.env.NODE_ENV !== "production") {
      console.warn("[/api/gmail/emails] No access token found, using dev fallback user in development.");
      userId = "dev-user";
    } else if (accessToken && accessToken !== "dev-token") {
      const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !userResult?.user) {
        // In production, return Unauthorized. In dev, use fallback.
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        } else {
          console.warn("[/api/gmail/emails] User auth failed, using dev fallback user in development.");
          userId = "dev-user";
        }
      } else {
        userId = userResult.user.id;
      }
    } else {
      // No access token and in production - return Unauthorized
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const checkOnly = request.nextUrl.searchParams.get("check") === "true";

    // Get Gmail access token from database
    // In dev mode with dev-user, skip database check
    let gmailConnection: { access_token: string; refresh_token?: string; expires_at?: string } | null = null;
    
    if (userId !== "dev-user") {
      const { data, error: gmailError } = await supabase
        .from("gmail_connections")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        .single();

      if (gmailError || !data?.access_token) {
        return NextResponse.json(
          { error: "Gmail not connected. Please connect your Gmail account." },
          { status: 401 }
        );
      }
      gmailConnection = data;
    } else {
      // Dev mode: return early for check, but allow OAuth flow
      if (checkOnly) {
        return NextResponse.json({ ok: true, connected: false, devMode: true });
      }
      return NextResponse.json(
        { error: "Gmail not connected. Please connect your Gmail account." },
        { status: 401 }
      );
    }

    // If just checking connection, return success
    if (checkOnly) {
      return NextResponse.json({ ok: true, connected: true });
    }

    // Check if token is expired and refresh if needed
    let gmailAccessToken = gmailConnection!.access_token;
    if (gmailConnection!.expires_at && new Date(gmailConnection!.expires_at) < new Date()) {
      // Refresh token
      if (gmailConnection!.refresh_token) {
        const refreshResponse = await refreshGmailToken(gmailConnection!.refresh_token);
        if (refreshResponse.access_token) {
          gmailAccessToken = refreshResponse.access_token;
          // Update in database
          await supabase
            .from("gmail_connections")
            .update({
              access_token: refreshResponse.access_token,
              expires_at: new Date(Date.now() + (refreshResponse.expires_in * 1000)).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
      }
    }

    // Fetch emails from Gmail API
    const maxResults = 50; // Limit to 50 emails
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
      {
        headers: {
          Authorization: `Bearer ${gmailAccessToken}`,
        },
      }
    );

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error("Gmail API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch emails from Gmail" },
        { status: 500 }
      );
    }

    const { messages } = await gmailResponse.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        ok: true,
        emails: [],
      });
    }

    // Fetch full message details
    const emailPromises = messages.slice(0, maxResults).map(async (msg: { id: string }) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: {
            Authorization: `Bearer ${gmailAccessToken}`,
          },
        }
      );

      if (!msgResponse.ok) return null;

      const message: GmailMessage = await msgResponse.json();
      const headers = message.payload.headers;
      const from = headers.find((h) => h.name === "From")?.value || "";
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      // Extract email body
      let bodyText = message.snippet;
      if (message.payload.body?.data) {
        bodyText = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find(
          (part: any) => part.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          bodyText = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      }

      return {
        id: message.id,
        threadId: message.threadId,
        sender: from.replace(/<.*>/, "").trim() || from,
        fromAddress: from.match(/<(.+)>/)?.[1] || from,
        subject: subject || "(No subject)",
        snippet: message.snippet || bodyText.substring(0, 200),
        body: bodyText,
        timestamp: date || new Date(parseInt(message.internalDate)).toISOString(),
        internalDate: message.internalDate,
      };
    });

    const emails = (await Promise.all(emailPromises)).filter(Boolean);

    return NextResponse.json({
      ok: true,
      emails,
    });
  } catch (error: any) {
    console.error("Error fetching Gmail emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

async function refreshGmailToken(refreshToken: string) {
  const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
  const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

