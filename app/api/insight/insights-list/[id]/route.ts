import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * PATCH /api/insight/insights-list/[id]
 * 
 * Update an insight (e.g., mark as read, dismiss)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isRead, dismissedAt } = body;

    // Build update object
    const updates: any = {};
    if (typeof isRead === "boolean") {
      updates.is_read = isRead;
    }
    if (dismissedAt) {
      updates.dismissed_at = dismissedAt;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("insights")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating insight:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("Error in insights-list PATCH endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

