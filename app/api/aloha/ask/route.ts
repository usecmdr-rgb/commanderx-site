/**
 * Aloha Ask API
 * 
 * POST /api/aloha/ask
 * 
 * LLM-powered Aloha agent for call intelligence questions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getWorkspaceIdFromAuth } from "@/lib/workspace-helpers";
import { getMemoryFacts, getImportantRelationships } from "@/lib/insight/memory";
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

    // Fetch recent calls
    const { data: calls } = await supabase
      .from("calls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Get memory facts and relationships
    const [memoryFacts, relationships] = await Promise.all([
      getMemoryFacts(workspaceId, 0.5),
      getImportantRelationships(workspaceId, 60),
    ]);

    // Build context
    const context = {
      calls: (calls || []).slice(0, 10).map((c) => ({
        caller: c.caller_name,
        outcome: c.outcome,
        sentiment: c.sentiment_score,
        summary: c.summary,
        time: c.created_at,
      })),
      memory: {
        callPatterns: memoryFacts
          .filter((f) => f.key.includes("call") || f.key.includes("missed"))
          .slice(0, 5),
        importantContacts: relationships.slice(0, 10),
      },
    };

    // Generate answer using LLM
    const systemPrompt = `You are Aloha, the voice intelligence agent. You help users understand their call patterns, analyze call sentiment, identify important contacts, and provide insights about communication effectiveness.

You have access to:
- Recent call history (outcomes, sentiment, summaries)
- Memory facts about call patterns and missed calls
- Important contact relationships

Be friendly, insightful, and actionable. When suggesting actions, format them as JSON with type and label.`;

    const userPrompt = `User question: ${question}

Context:
${JSON.stringify(context, null, 2)}

Provide a helpful answer and suggest 2-3 actionable next steps. Return JSON with:
- answer: string
- suggestedActions: array of {type: string, label: string, description?: string}`;

    const completion = await openai.chat.completions.create({
      model: AGENT_CONFIG.aloha.primaryModel, // Use gpt-4o for voice intelligence
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
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
        suggestedActions: parsed.suggestedActions || [],
      },
    });
  } catch (error: any) {
    console.error("Error in aloha ask endpoint:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

