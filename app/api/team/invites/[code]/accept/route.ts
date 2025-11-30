import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { syncWorkspaceSubscriptionFromSeats } from "@/lib/stripeWorkspace";

/**
 * POST /api/team/invites/[code]/accept
 * 
 * Accept an invite and activate the seat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = getSupabaseServerClient();
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to accept the invite." },
        { status: 401 }
      );
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("invite_code", code)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: "This invite has already been accepted" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // Check if email matches (if invite has email)
    if (invite.email && user.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite is for a different email address" },
        { status: 403 }
      );
    }

    // Get seat to find workspace_id
    const { data: seat, error: seatFetchError } = await supabase
      .from("workspace_seats")
      .select("workspace_id")
      .eq("id", invite.seat_id)
      .single();

    if (seatFetchError || !seat) {
      throw new Error("Seat not found");
    }

    // Update seat to link to user and mark as active
    const { error: seatUpdateError } = await supabase
      .from("workspace_seats")
      .update({
        user_id: user.id,
        email: user.email || null, // Update email from user
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite.seat_id);

    if (seatUpdateError) {
      throw seatUpdateError;
    }

    // Mark invite as accepted
    const { error: inviteUpdateError } = await supabase
      .from("workspace_invites")
      .update({
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (inviteUpdateError) {
      throw inviteUpdateError;
    }

    // Sync Stripe subscription (async, don't block response)
    syncWorkspaceSubscriptionFromSeats(seat.workspace_id).catch((error) => {
      console.error("Failed to sync Stripe subscription after invite acceptance:", error);
    });

    return NextResponse.json({
      ok: true,
      message: "Invite accepted successfully",
    });
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

