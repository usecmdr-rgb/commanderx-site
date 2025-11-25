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
    const {
      summary,
      description,
      start,
      end,
      location,
      attendees,
      notes,
      memo,
      reminder,
      createdByAloha,
      alohaCallId,
    } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: "Summary, start, and end are required" },
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
        { error: "Calendar not connected" },
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

    // Create event in Google Calendar
    const eventData: any = {
      summary,
      description: description || "",
      start: {
        dateTime: start,
        timeZone: "UTC",
      },
      end: {
        dateTime: end,
        timeZone: "UTC",
      },
    };

    if (location) {
      eventData.location = location;
    }

    if (attendees && attendees.length > 0) {
      eventData.attendees = attendees.map((email: string) => ({ email }));
    }

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

    // Store notes if provided
    if (notes || memo || reminder || createdByAloha) {
      await supabase.from("calendar_event_notes").upsert(
        {
          user_id: userId,
          event_id: createdEvent.id,
          notes: notes || null,
          memo: memo || null,
          reminder: reminder || null,
          created_by_aloha: createdByAloha || false,
          aloha_call_id: alohaCallId || null,
        },
        {
          onConflict: "user_id,event_id",
        }
      );
    }

    return NextResponse.json({
      ok: true,
      event: {
        ...createdEvent,
        notes: notes || null,
        memo: memo || null,
        reminder: reminder || null,
        createdByAloha: createdByAloha || false,
        alohaCallId: alohaCallId || null,
      },
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

