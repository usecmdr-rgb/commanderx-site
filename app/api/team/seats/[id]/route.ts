import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { syncWorkspaceSubscriptionFromSeats } from "@/lib/stripeWorkspace";

/**
 * PATCH /api/team/seats/[id]
 * 
 * Update a seat (tier or status)
 * 
 * Request body: { tier?: TierId; status?: 'active' | 'removed' }
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
    const { tier, status } = body;

    // Get the seat
    const { data: seat, error: seatError } = await supabase
      .from("workspace_seats")
      .select("*")
      .eq("id", id)
      .single();

    if (seatError || !seat) {
      return NextResponse.json(
        { error: "Seat not found" },
        { status: 404 }
      );
    }

    // Get workspace to verify ownership
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("owner_user_id")
      .eq("id", seat.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify user owns the workspace
    if (workspace.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Prevent removing owner seat
    if (seat.is_owner && status === "removed") {
      return NextResponse.json(
        { error: "Cannot remove workspace owner seat" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (tier) {
      updates.tier = tier;
    }
    if (status) {
      updates.status = status;
    }

    const { data: updatedSeat, error: updateError } = await supabase
      .from("workspace_seats")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Sync Stripe subscription (async, don't block response)
    syncWorkspaceSubscriptionFromSeats(seat.workspace_id).catch((error) => {
      console.error("Failed to sync Stripe subscription after seat update:", error);
    });

    return NextResponse.json({ ok: true, data: updatedSeat });
  } catch (error: any) {
    console.error("Error updating seat:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/seats/[id]
 * 
 * Delete a seat (mark as removed)
 */
export async function DELETE(
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

    // Get the seat
    const { data: seat, error: seatError } = await supabase
      .from("workspace_seats")
      .select("*")
      .eq("id", id)
      .single();

    if (seatError || !seat) {
      return NextResponse.json(
        { error: "Seat not found" },
        { status: 404 }
      );
    }

    // Get workspace to verify ownership
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("owner_user_id")
      .eq("id", seat.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify user owns the workspace
    if (workspace.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Prevent removing owner seat
    if (seat.is_owner) {
      return NextResponse.json(
        { error: "Cannot remove workspace owner seat" },
        { status: 400 }
      );
    }

    // Mark as removed instead of hard delete
    const { error: updateError } = await supabase
      .from("workspace_seats")
      .update({
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Sync Stripe subscription (async, don't block response)
    syncWorkspaceSubscriptionFromSeats(seat.workspace_id).catch((error) => {
      console.error("Failed to sync Stripe subscription after seat deletion:", error);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting seat:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
