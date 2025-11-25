import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createErrorResponse } from "@/lib/validation";
import { resolveKnowledgeGap } from "@/lib/knowledge-gap-logger";

/**
 * POST /api/knowledge-gaps/[id]/resolve
 * 
 * Resolve a knowledge gap by providing the missing information
 * 
 * Body:
 * - resolutionNotes: How the gap was resolved
 * - resolutionAction: 'updated_business_info' | 'added_knowledge_chunk' | 'other'
 * - addToKnowledgeBase: If true, create a knowledge chunk from the resolution
 * - knowledgeChunkContent: Content to add to knowledge base (if addToKnowledgeBase is true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gapId } = await params;
    const user = await requireAuthFromRequest(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    if (!body.resolutionNotes) {
      return createErrorResponse("Resolution notes are required", 400);
    }

    // Get the knowledge gap
    const { data: gap, error: gapError } = await supabase
      .from("agent_knowledge_gaps")
      .select("*")
      .eq("id", gapId)
      .eq("user_id", user.id)
      .single();

    if (gapError || !gap) {
      return createErrorResponse("Knowledge gap not found", 404);
    }

    if (gap.status === "resolved") {
      return createErrorResponse("Knowledge gap is already resolved", 400);
    }

    // Resolve the gap
    await resolveKnowledgeGap(
      gapId,
      user.id,
      body.resolutionNotes,
      body.resolutionAction
    );

    // Optionally add to knowledge base
    if (body.addToKnowledgeBase && body.knowledgeChunkContent) {
      // Get user's business profile
      const { data: profile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        // Create knowledge chunk
        await supabase.from("business_knowledge_chunks").insert({
          business_profile_id: profile.id,
          source: "manual",
          title: `Resolved: ${gap.requested_info}`,
          content: body.knowledgeChunkContent,
          metadata: {
            resolved_from_gap_id: gapId,
            resolved_at: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge gap resolved successfully",
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }
    return createErrorResponse("Failed to resolve knowledge gap", 500, error);
  }
}

