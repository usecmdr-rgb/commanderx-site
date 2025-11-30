/**
 * Studio Ask API
 * 
 * POST /api/studio/ask
 * 
 * LLM-powered Studio agent for branding and content questions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getWorkspaceIdFromAuth } from "@/lib/workspace-helpers";
import { getMemoryFacts } from "@/lib/insight/memory";
import { openai } from "@/lib/openai";
import { AGENT_CONFIG } from "@/lib/agents/config";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Get authenticated user
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

    const workspaceId = await getWorkspaceIdFromAuth();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get memory facts for brand information
    const memoryFacts = await getMemoryFacts(workspaceId, 0.5);

    // Extract brand context from memory
    const brandContext: any = {};
    memoryFacts.forEach((fact) => {
      if (fact.key.includes("brand") || fact.key.includes("tone") || fact.key.includes("style")) {
        brandContext[fact.key] = fact.value;
      }
    });

    // Fetch recent studio assets
    let recentAssets: any[] = [];
    try {
      const { data: assets } = await supabase
        .from("studio_assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (assets) {
        recentAssets = assets;
      }
    } catch (e) {
      // Table might not exist
    }

    // Build context
    const context = {
      brandFacts: brandContext,
      recentAssets: recentAssets.slice(0, 5).map((a) => ({
        name: a.name || a.filename,
        type: a.type,
        createdAt: a.created_at,
      })),
    };

    // Generate answer using LLM
    const systemPrompt = `You are the Studio Agent, a branding and content intelligence coach. You help users understand their brand identity, maintain consistent tone and style, create effective content, and optimize their visual assets.

You have access to:
- Brand facts (tone, keywords, colors, audience)
- Recent content assets
- Memory about brand preferences and style

Be creative, insightful, and brand-focused. When suggesting actions, format them as JSON with type and label. When suggesting assets, include relevant details.`;

    const userPrompt = `User question: ${question}

Context:
${JSON.stringify(context, null, 2)}

Provide a helpful answer and suggest 2-3 actionable next steps or content ideas. Return JSON with:
- answer: string
- suggestedAssets: array of {type: string, label: string, description?: string, tone?: string}`;

    const completion = await openai.chat.completions.create({
      model: AGENT_CONFIG.studio.primaryModel, // Use gpt-4o for vision-capable branding/content tasks
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // Higher temperature for creative content
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from LLM");
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      ok: true,
      data: {
        answer: parsed.answer || "I couldn't generate an answer.",
        suggestedAssets: parsed.suggestedAssets || [],
      },
    });
  } catch (error: any) {
    console.error("Error in studio ask endpoint:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

