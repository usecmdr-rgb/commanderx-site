import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { Workflow } from "@/types";

// GET: List all workflows for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get current user for auth
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

    // Fetch workflows from database
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workflows:", error);
      throw error;
    }

    // Transform to Workflow type
    const workflows: Workflow[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      trigger: row.trigger,
      condition: row.condition,
      actions: row.actions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ ok: true, data: workflows });
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
    const { name, description, trigger, condition, actions, enabled = true } = body;

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: "Missing required fields: name, trigger, actions" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    
    // Get current user for auth
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

    // Insert workflow
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        name,
        description,
        enabled,
        trigger,
        condition: condition || null,
        actions,
        trigger_config: {},
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workflow:", error);
      throw error;
    }

    // Transform to Workflow type
    const workflow: Workflow = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      trigger: data.trigger,
      condition: data.condition,
      actions: data.actions,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ ok: true, data: workflow });
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}





