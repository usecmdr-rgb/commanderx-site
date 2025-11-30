import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * GET /api/team/invites
 * 
 * Get pending invites for the current user's workspace
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get user's workspace (create if doesn't exist)
    let { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      // Create workspace if it doesn't exist
      const { data: newWorkspace, error: createError } = await supabase
        .from("workspaces")
        .insert({
          owner_user_id: user.id,
          name: "My Workspace",
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create workspace" },
          { status: 500 }
        );
      }

      workspace = newWorkspace;
    }

    // Get pending invites
    const { data: invites, error: invitesError } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("workspace_id", workspace.id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (invitesError) {
      throw invitesError;
    }

    // Generate invite URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitesWithUrls = (invites || []).map((invite) => ({
      ...invite,
      inviteUrl: `${baseUrl}/invite/${invite.invite_code}`,
      expiresIn: Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({
      ok: true,
      data: invitesWithUrls,
    });
  } catch (error: any) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

