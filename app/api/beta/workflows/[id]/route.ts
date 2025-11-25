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
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
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
      .select()
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (error && error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Workflows table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data });
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
    
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id);

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (error && error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Workflows table not found" },
        { status: 404 }
      );
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





