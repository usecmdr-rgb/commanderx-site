import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

// PUT: Update a workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, trigger, condition, actions, enabled } = body;

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
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (condition !== undefined) updateData.condition = condition;
    if (actions !== undefined) updateData.actions = actions;
    if (enabled !== undefined) updateData.enabled = enabled;

    const { data, error } = await supabase
      .from("workflows")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workflow:", error);
      throw error;
    }

    // Transform to Workflow type
    const workflow = {
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
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update workflow" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting workflow:", error);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to delete workflow" },
      { status: 500 }
    );
  }
}





