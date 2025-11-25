import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * This endpoint syncs appointments and cancellations from Aloha agent to Google Calendar
 * Called when Aloha creates or cancels an appointment
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
    const { action, callId, appointmentData } = body;

    // action can be: "create", "cancel", "update"
    if (!action || !callId) {
      return NextResponse.json(
        { error: "Action and callId are required" },
        { status: 400 }
      );
    }

    // Check if calendar is connected
    const { data: calendarConnection } = await supabase
      .from("calendar_connections")
      .select("access_token")
      .eq("user_id", userId)
      .single();

    if (!calendarConnection?.access_token) {
      return NextResponse.json(
        { error: "Calendar not connected" },
        { status: 401 }
      );
    }

    if (action === "create" || action === "update") {
      if (!appointmentData) {
        return NextResponse.json(
          { error: "Appointment data is required for create/update" },
          { status: 400 }
        );
      }

      // Create or update event via the create endpoint
      const createRes = await fetch(
        new URL("/api/calendar/events/create", request.url),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            summary: appointmentData.summary || "Appointment from Aloha",
            description: appointmentData.description || `Created by Aloha from call ${callId}`,
            start: appointmentData.start,
            end: appointmentData.end,
            location: appointmentData.location,
            attendees: appointmentData.attendees,
            notes: appointmentData.notes,
            memo: appointmentData.memo,
            reminder: appointmentData.reminder,
            createdByAloha: true,
            alohaCallId: callId,
          }),
        }
      );

      if (!createRes.ok) {
        const errorData = await createRes.json();
        return NextResponse.json(
          { error: errorData.error || "Failed to create/update appointment" },
          { status: 500 }
        );
      }

      const result = await createRes.json();
      return NextResponse.json({
        ok: true,
        event: result.event,
      });
    } else if (action === "cancel") {
      // Find the event created by this call
      const { data: eventNote } = await supabase
        .from("calendar_event_notes")
        .select("event_id")
        .eq("user_id", userId)
        .eq("aloha_call_id", callId)
        .eq("created_by_aloha", true)
        .single();

      if (!eventNote?.event_id) {
        return NextResponse.json(
          { error: "Event not found for this call" },
          { status: 404 }
        );
      }

      // Delete event from Google Calendar
      const deleteRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventNote.event_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${calendarConnection.access_token}`,
          },
        }
      );

      if (!deleteRes.ok && deleteRes.status !== 404) {
        return NextResponse.json(
          { error: "Failed to cancel appointment" },
          { status: 500 }
        );
      }

      // Remove from database
      await supabase
        .from("calendar_event_notes")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventNote.event_id);

      return NextResponse.json({
        ok: true,
        message: "Appointment cancelled",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error syncing Aloha appointment:", error);
    return NextResponse.json(
      { error: "Failed to sync appointment" },
      { status: 500 }
    );
  }
}

