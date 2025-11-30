import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
}

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

export async function GET(request: NextRequest) {
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
    const checkOnly = request.nextUrl.searchParams.get("check") === "true";

    // Get Calendar access token from database
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

    // If just checking connection, return success
    if (checkOnly) {
      return NextResponse.json({ ok: true, connected: true });
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

    // Get date range from query params
    const startDate = request.nextUrl.searchParams.get("start") || new Date().toISOString();
    const endDate = request.nextUrl.searchParams.get("end") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from Google Calendar API with all necessary fields
    // Using fields parameter to ensure we get all event details including attendees, location, description, etc.
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true&orderBy=startTime&fields=items(id,summary,description,start,end,location,attendees,created,updated,htmlLink,status,recurrence,recurringEventId)`,
      {
        headers: {
          Authorization: `Bearer ${calendarAccessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error("Calendar API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: 500 }
      );
    }

    const { items } = await calendarResponse.json();
    const events: CalendarEvent[] = items || [];

    // Get custom notes/memos from database
    const { data: eventNotes } = await supabase
      .from("calendar_event_notes")
      .select("event_id, notes, memo, reminder, created_by_aloha, aloha_call_id")
      .eq("user_id", userId)
      .in("event_id", events.map((e) => e.id));

    const notesMap = new Map(
      eventNotes?.map((note) => [note.event_id, note]) || []
    );

    // Merge events with notes and Aloha info
    const enrichedEvents = events.map((event) => {
      const notes = notesMap.get(event.id);
      return {
        ...event,
        notes: notes?.notes || null,
        memo: notes?.memo || null,
        reminder: notes?.reminder || null,
        createdByAloha: notes?.created_by_aloha || false,
        alohaCallId: notes?.aloha_call_id || null,
      };
    });

    // Get open follow-ups from Sync with due_at (suggested calendar events)
    const { data: syncFollowups } = await supabase
      .from("followups")
      .select("id, title, description, due_at, related_email_id")
      .eq("user_id", userId)
      .eq("source_agent", "sync")
      .eq("status", "open")
      .not("due_at", "is", null)
      .gte("due_at", startDate)
      .lte("due_at", endDate);

    // Convert follow-ups to suggested event format
    const suggestedEvents = (syncFollowups || []).map((followup) => {
      const dueDate = new Date(followup.due_at);
      // Default to 1 hour duration for meetings, or end of day for deadlines
      const isMeeting = followup.title?.toLowerCase().includes("meeting") || 
                       followup.title?.toLowerCase().includes("call");
      const endDate = isMeeting 
        ? new Date(dueDate.getTime() + 60 * 60 * 1000) // 1 hour
        : new Date(dueDate.getTime() + 30 * 60 * 1000); // 30 min default

      return {
        id: `followup-${followup.id}`, // Prefix to distinguish from real events
        summary: followup.title,
        description: followup.description || followup.title,
        start: {
          dateTime: dueDate.toISOString(),
        },
        end: {
          dateTime: endDate.toISOString(),
        },
        isSuggested: true, // Flag to indicate this is a suggested event
        suggestedBy: "sync",
        followupId: followup.id,
        relatedEmailId: followup.related_email_id,
      };
    });

    return NextResponse.json({
      ok: true,
      events: enrichedEvents,
      suggestedEvents: suggestedEvents || [],
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

