import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getUserAccessibleAgents, isAdmin, getUserEmail } from "@/lib/auth";

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

    const { data: userResult, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userResult?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = userResult.user.id;
    const userEmail = userResult.user.email || null;

    // Get accessible agents
    const accessibleAgents = await getUserAccessibleAgents(userId, userEmail);
    const isUserAdmin = userEmail ? await isAdmin(userEmail) : false;

    return NextResponse.json({
      ok: true,
      agents: accessibleAgents,
      isAdmin: isUserAdmin,
    });
  } catch (error: any) {
    console.error("Error getting user agents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get accessible agents" },
      { status: 500 }
    );
  }
}

