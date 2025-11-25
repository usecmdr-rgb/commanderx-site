import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

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
    const { eventId, notes, memo, reminder } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Upsert notes for the event
    const { error: upsertError } = await supabase
      .from("calendar_event_notes")
      .upsert(
        {
          user_id: userId,
          event_id: eventId,
          notes: notes || null,
          memo: memo || null,
          reminder: reminder || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,event_id",
        }
      );

    if (upsertError) {
      console.error("Error saving event notes:", upsertError);
      return NextResponse.json(
        { error: "Failed to save notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error: any) {
    console.error("Error in notes endpoint:", error);
    return NextResponse.json(
      { error: "Failed to save notes" },
      { status: 500 }
    );
  }
}

