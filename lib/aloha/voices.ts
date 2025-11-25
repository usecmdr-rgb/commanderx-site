/**
 * Aloha Voice Registry
 * 
 * Defines available voices for the Aloha voice agent.
 * Each voice maps to TTS provider settings (voice model, pitch, speaking rate, etc.)
 * 
 * When integrating with a TTS provider (e.g., OpenAI TTS, ElevenLabs, Google Cloud TTS),
 * map each voice_id to the provider's specific voice name/ID and parameters.
 */

export interface AlohaVoice {
  id: string;
  label: string;
  description: string;
  gender: "female" | "male";
  style: string;
  // TTS provider-specific settings (will be mapped to actual provider voice)
  ttsSettings: {
    provider?: string; // e.g., "openai", "elevenlabs", "google"
    voiceName?: string; // Provider-specific voice name/ID
    pitch?: number; // -20 to +20 (semitone adjustment)
    speakingRate?: number; // 0.25 to 4.0 (speed multiplier)
    stability?: number; // 0.0 to 1.0 (for ElevenLabs-style providers)
    similarityBoost?: number; // 0.0 to 1.0 (for ElevenLabs-style providers)
  };
}

export const ALOHA_VOICES: AlohaVoice[] = [
  {
    id: "aloha_voice_1",
    label: "Warm & Friendly (F)",
    description: "A warm, approachable female voice perfect for customer service",
    gender: "female",
    style: "warm_friendly",
    ttsSettings: {
      provider: "openai", // Default to OpenAI TTS for now
      voiceName: "nova", // OpenAI TTS voice: nova (female, warm)
      pitch: 0,
      speakingRate: 1.0,
    },
  },
  {
    id: "aloha_voice_2",
    label: "Calm & Professional (M)",
    description: "A calm, professional male voice ideal for business communications",
    gender: "male",
    style: "calm_professional",
    ttsSettings: {
      provider: "openai",
      voiceName: "onyx", // OpenAI TTS voice: onyx (male, professional)
      pitch: 0,
      speakingRate: 0.95, // Slightly slower for professional tone
    },
  },
  {
    id: "aloha_voice_3",
    label: "Energetic (F)",
    description: "An energetic, upbeat female voice great for sales and marketing",
    gender: "female",
    style: "energetic",
    ttsSettings: {
      provider: "openai",
      voiceName: "shimmer", // OpenAI TTS voice: shimmer (female, energetic)
      pitch: 2, // Slightly higher pitch for energy
      speakingRate: 1.1, // Slightly faster
    },
  },
  {
    id: "aloha_voice_4",
    label: "Relaxed & Casual (M)",
    description: "A relaxed, casual male voice perfect for friendly conversations",
    gender: "male",
    style: "relaxed",
    ttsSettings: {
      provider: "openai",
      voiceName: "echo", // OpenAI TTS voice: echo (male, casual)
      pitch: -1, // Slightly lower pitch for relaxed tone
      speakingRate: 0.9, // Slightly slower for casual feel
    },
  },
];

/**
 * Get voice by ID
 */
export function getVoiceById(voiceId: string): AlohaVoice | undefined {
  return ALOHA_VOICES.find((v) => v.id === voiceId);
}

/**
 * Get default voice (first voice in registry)
 */
export function getDefaultVoice(): AlohaVoice {
  return ALOHA_VOICES[0];
}

/**
 * Validate voice ID
 */
export function isValidVoiceId(voiceId: string): boolean {
  return ALOHA_VOICES.some((v) => v.id === voiceId);
}

/**
 * Get all available voices
 */
export function getAllVoices(): AlohaVoice[] {
  return ALOHA_VOICES;
}

