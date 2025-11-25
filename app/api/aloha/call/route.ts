/**
 * Aloha Call Handler API
 * 
 * This endpoint handles Aloha voice calls (inbound and outbound).
 * It processes STT → LLM → TTS with filler speech support.
 * 
 * This is a middleware layer that can be integrated with your telephony provider.
 * 
 * POST /api/aloha/call
 * 
 * Body:
 * - callId: string (optional)
 * - callType: "inbound" | "outbound"
 * - sttText: string (transcribed caller speech)
 * - enableFiller: boolean (default: true)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { createAlohaCallHandler } from "@/lib/aloha/call-handler";
import { openai } from "@/lib/openai";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getBusinessContext } from "@/lib/business-context";
import { getAlohaDisplayName } from "@/lib/aloha/profile";
import type { AgentKey } from "@/lib/agents/config";

/**
 * Generate LLM response for Aloha call
 * This is a simplified version - in production, you'd use the full /api/brain logic
 */
async function generateAlohaResponse(
  userId: string,
  sttText: string,
  callContext?: { callId?: string; callType?: "inbound" | "outbound" }
): Promise<string> {
  // In production, this would call /api/brain or use the same logic
  // For now, this is a placeholder that shows the integration point

  // You would:
  // 1. Load conversation history
  // 2. Build system prompt with business context and display name
  // 3. Call OpenAI API
  // 4. Return response text

  // Placeholder response
  return `I understand you said: "${sttText}". Let me help you with that.`;
}

/**
 * POST /api/aloha/call
 * Process a call turn with filler speech support
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const body = await request.json();
    const {
      callId,
      callType,
      sttText,
      enableFiller = true,
    } = body;

    // Validate inputs
    if (!sttText || typeof sttText !== "string") {
      return NextResponse.json(
        { error: "sttText is required and must be a string" },
        { status: 400 }
      );
    }

    if (callType && !["inbound", "outbound"].includes(callType)) {
      return NextResponse.json(
        { error: 'callType must be "inbound" or "outbound"' },
        { status: 400 }
      );
    }

    const effectiveCallType = callType || "inbound";

    // Create call handler
    const handler = await createAlohaCallHandler(
      userId,
      callId,
      effectiveCallType,
      {
        enableFillerSpeech: enableFiller,
        enableConversationEnhancement: true,
        streaming: true,
      }
    );

    try {
      // Process call turn
      // In production, llmGenerator would call your actual LLM API
      const result = await handler.processCallTurn(sttText, async (text) => {
        // This is where you'd call /api/brain or your LLM service
        // For now, using placeholder
        return generateAlohaResponse(userId, text, { callId, callType: effectiveCallType });
      });

      // Return result
      // Note: In production, you'd stream the audio directly to the telephony provider
      // This endpoint returns metadata about the call turn
      return NextResponse.json({
        ok: true,
        response: result.enhancedResponse,
        usedFiller: result.usedFiller,
        fillerText: result.fillerText,
        responseTime: result.responseTime,
        // In production, audioStream would be sent directly to telephony provider
        // We can't return a stream in JSON, so this is metadata only
        audioGenerated: !!result.audioStream,
      });
    } finally {
      handler.cleanup();
    }
  } catch (error: any) {
    console.error("Error in POST /api/aloha/call:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle caller interruption
 * 
 * NOTE: This should be moved to a separate route file:
 * POST /api/aloha/call/interrupt
 * 
 * Body:
 * - callId: string
 */
async function handleInterruption(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const body = await request.json();
    const { callId } = body;

    // In production, you'd look up the active call handler for this callId
    // and call handleInterruption() on it
    // For now, this is a placeholder

    return NextResponse.json({
      ok: true,
      message: "Interruption handled",
    });
  } catch (error: any) {
    console.error("Error handling interruption:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

