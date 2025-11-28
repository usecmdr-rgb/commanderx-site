/**
 * Aloha Voice Pack Generation
 * 
 * Handles generating and regenerating voice pack audio (MP3) using OpenAI TTS
 * when the agent's self-name changes.
 */

import { openai } from "@/lib/openai";
import { getAlohaSelfName } from "./profile";
import { getAlohaVoiceProfile } from "./profile";

/**
 * Base script template for voice pack
 * This is the script that will be used to generate the voice pack audio.
 * The {{assistant_name}} placeholder will be replaced with the effective self-name.
 * This script should represent how the agent introduces itself in calls.
 */
const VOICE_PACK_SCRIPT_TEMPLATE = `Hi, I'm {{assistant_name}}. I'm here to help you with any questions or requests you might have. How can I assist you today?`;

/**
 * Generate voice pack script with self-name
 * This creates a longer script that includes multiple self-references for a more comprehensive voice pack.
 */
function generateVoicePackScript(selfName: string): string {
  return `Hi, I'm ${selfName}. I'm here to help you with any questions or requests you might have. How can I assist you today?`;
}

/**
 * Regenerate voice pack audio for a user's Aloha agent
 * 
 * @param userId - User ID
 * @param effectiveSelfName - The effective self-name to use (defaults to "Aloha" if not provided)
 * @returns Base64-encoded MP3 audio buffer, or null if generation fails
 */
export async function regenerateAlohaVoicePack(
  userId: string,
  effectiveSelfName?: string
): Promise<{ audioBase64: string; contentType: string } | null> {
  try {
    // Get effective self-name if not provided
    const selfName = effectiveSelfName || (await getAlohaSelfName(userId));
    
    // Get voice profile
    const voiceProfile = await getAlohaVoiceProfile(userId);
    
    // Generate script with self-name
    const scriptText = generateVoicePackScript(selfName);
    
    // Generate TTS audio using OpenAI
    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: voiceProfile.openaiVoiceId as
        | "alloy"
        | "echo"
        | "fable"
        | "onyx"
        | "nova"
        | "shimmer",
      response_format: "mp3",
      input: scriptText,
    });
    
    // Convert to buffer and then to base64
    const buffer = Buffer.from(await ttsResponse.arrayBuffer());
    const audioBase64 = buffer.toString("base64");
    
    return {
      audioBase64,
      contentType: "audio/mpeg",
    };
  } catch (error) {
    console.error("Error regenerating Aloha voice pack:", error);
    return null;
  }
}

/**
 * Get the voice pack script with the effective self-name
 */
export async function getVoicePackScript(userId: string): Promise<string> {
  const selfName = await getAlohaSelfName(userId);
  return generateVoicePackScript(selfName);
}

