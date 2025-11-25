import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import {
  getVoiceProfileByKey,
  isValidVoiceKey,
  DEFAULT_VOICE_KEY,
  type AlohaVoiceKey,
} from "@/lib/aloha/voice-profiles";
import { openai } from "@/lib/openai";

/**
 * POST /api/aloha/voice-preview
 * 
 * Generates a voice preview using OpenAI TTS with the selected voice profile.
 * 
 * Body:
 * - voice_key: AlohaVoiceKey
 * 
 * Returns:
 * - ok: boolean
 * - audioUrl: string (data URL or blob URL)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuthFromRequest(request);

    const body = await request.json();
    const { voice_key } = body;

    // Validate voice_key
    if (!voice_key || typeof voice_key !== "string") {
      return NextResponse.json(
        { error: "voice_key is required" },
        { status: 400 }
      );
    }

    if (!isValidVoiceKey(voice_key)) {
      return NextResponse.json(
        { error: `Invalid voice_key: ${voice_key}` },
        { status: 400 }
      );
    }

    // Get voice profile
    const voiceProfile = getVoiceProfileByKey(voice_key as AlohaVoiceKey);

    // Preview text
    const previewText =
      "Hi, I'm Aloha. This is how I'll sound when I speak with your customers.";

    // Generate speech using OpenAI TTS
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1", // or "tts-1-hd" for higher quality
        voice: voiceProfile.openaiVoiceId as
          | "alloy"
          | "echo"
          | "fable"
          | "onyx"
          | "nova"
          | "shimmer",
        input: previewText,
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());

      // Convert to base64 data URL
      const base64 = buffer.toString("base64");
      const audioUrl = `data:audio/mp3;base64,${base64}`;

      return NextResponse.json({
        ok: true,
        audioUrl,
      });
    } catch (ttsError: any) {
      console.error("Error generating TTS preview:", ttsError);
      return NextResponse.json(
        {
          error: "Failed to generate voice preview",
          details: ttsError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in POST /api/aloha/voice-preview:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
