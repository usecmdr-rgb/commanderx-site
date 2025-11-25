import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { Workflow } from "@/types";

// GET: List all workflows for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    
    // Try to fetch from database, fallback to empty array if table doesn't exist
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error && error.code !== "PGRST116") {
      // PGRST116 = table doesn't exist, which is fine for now
      throw error;
    }

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error: any) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST: Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, trigger, condition, actions, enabled = true } = body;

    if (!userId || !name || !trigger || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: "Missing required fields: userId, name, trigger, actions" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    
    const workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt"> = {
      userId,
      name,
      description,
      enabled,
      trigger,
      condition,
      actions,
    };

    // Try to insert, but handle case where table doesn't exist
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        ...workflow,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // If table doesn't exist, return the workflow object (in-memory for now)
    if (error && error.code === "PGRST116") {
      const newWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        ...workflow,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ ok: true, data: newWorkflow });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}





