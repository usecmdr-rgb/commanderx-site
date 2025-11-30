import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

async function refreshCalendarToken(refreshToken: string) {
  const CALENDAR_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "";
  const CALENDAR_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "";

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CALENDAR_CLIENT_ID,
      client_secret: CALENDAR_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

/**
 * POST /api/calendar/followup-to-event
 * 
 * Converts a Sync follow-up into a real calendar event.
 * 
 * Request body:
 * - followupId: string (required)
 * 
 * Returns:
 * - ok: boolean
 * - event: CalendarEvent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.match(/^Bearer\s+(.*)$/i)?.[1]?.trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = userResult.user.id;
    const body = await request.json();
    const { followupId } = body;

    if (!followupId) {
      return NextResponse.json(
        { error: "followupId is required" },
        { status: 400 }
      );
    }

    // Get the follow-up
    const { data: followup, error: followupError } = await supabase
      .from("followups")
      .select("id, title, description, due_at, source_agent, related_email_id")
      .eq("id", followupId)
      .eq("user_id", userId)
      .eq("status", "open")
      .single();

    if (followupError || !followup) {
      return NextResponse.json(
        { error: "Follow-up not found" },
        { status: 404 }
      );
    }

    if (followup.source_agent !== "sync") {
      return NextResponse.json(
        { error: "Only Sync follow-ups can be converted to calendar events" },
        { status: 400 }
      );
    }

    if (!followup.due_at) {
      return NextResponse.json(
        { error: "Follow-up must have a due_at date" },
        { status: 400 }
      );
    }

    // Get Calendar access token
    const { data: calendarConnection, error: calendarError } = await supabase
      .from("calendar_connections")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .single();

    if (calendarError || !calendarConnection?.access_token) {
      return NextResponse.json(
        { error: "Calendar not connected. Please connect your Google Calendar." },
        { status: 401 }
      );
    }

    // Check if token is expired and refresh if needed
    let calendarAccessToken = calendarConnection.access_token;
    if (calendarConnection.expires_at && new Date(calendarConnection.expires_at) < new Date()) {
      const refreshResponse = await refreshCalendarToken(calendarConnection.refresh_token);
      if (refreshResponse.access_token) {
        calendarAccessToken = refreshResponse.access_token;
        await supabase
          .from("calendar_connections")
          .update({
            access_token: refreshResponse.access_token,
            expires_at: new Date(Date.now() + (refreshResponse.expires_in * 1000)).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    // Calculate start and end times
    const startTime = new Date(followup.due_at);
    // Default to 1 hour duration for meetings, 30 min for other events
    const isMeeting = followup.title?.toLowerCase().includes("meeting") || 
                     followup.title?.toLowerCase().includes("call");
    const endTime = new Date(startTime.getTime() + (isMeeting ? 60 : 30) * 60 * 1000);

    // Create event in Google Calendar
    const eventData: any = {
      summary: followup.title,
      description: followup.description || followup.title,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "UTC",
      },
    };

    const createResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${calendarAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Calendar API error:", errorText);
      return NextResponse.json(
        { error: "Failed to create calendar event" },
        { status: 500 }
      );
    }

    const createdEvent = await createResponse.json();

    // Mark follow-up as completed and link to event
    await supabase
      .from("followups")
      .update({
        status: "completed",
        linked_to_event_id: createdEvent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", followupId)
      .eq("user_id", userId);

    // Store event metadata
    await supabase.from("calendar_event_notes").upsert(
      {
        user_id: userId,
        event_id: createdEvent.id,
        notes: null,
        memo: null,
        reminder: null,
        created_by_aloha: false,
        aloha_call_id: null,
        sync_followup_id: followupId,
        sync_email_id: followup.related_email_id,
      },
      {
        onConflict: "user_id,event_id",
      }
    );

    return NextResponse.json({
      ok: true,
      event: createdEvent,
    });
  } catch (error: any) {
    console.error("Error converting follow-up to event:", error);
    return NextResponse.json(
      { error: "Failed to convert follow-up to event" },
      { status: 500 }
    );
  }
}

