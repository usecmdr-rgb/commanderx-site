/**
 * Aloha Voice Profiles System
 * 
 * Defines 4 distinct voice profiles for Aloha. Each profile represents:
 * - A unique OpenAI voice name/model
 * - A tone preset key (friendly/professional/empathetic/energetic)
 * - A label & description for the UI
 * 
 * Aloha's personality and behavior stay the same; only the voice changes.
 */

import type { TonePresetKey } from "./tone-presets";

export type AlohaVoiceKey =
  | "aloha_voice_friendly_female_us"
  | "aloha_voice_professional_male_us"
  | "aloha_voice_energetic_female_uk"
  | "aloha_voice_empathetic_male_neutral";

export interface AlohaVoiceProfile {
  key: AlohaVoiceKey;
  label: string; // What the user sees on the button
  description: string; // Short description
  openaiVoiceId: string; // Which OpenAI voice we use in TTS/Realtime
  tonePreset: TonePresetKey;
  gender: "female" | "male";
  accent: string; // e.g., "US", "UK", "Neutral"
}

/**
 * Aloha Voice Profiles
 * 
 * These are the 4 voice options users can choose from.
 * Each maps to an OpenAI TTS voice and a tone preset.
 */
export const ALOHA_VOICE_PROFILES: AlohaVoiceProfile[] = [
  {
    key: "aloha_voice_friendly_female_us",
    label: "Friendly (Female, US)",
    description: "Warm and approachable, ideal for feedback and general calls.",
    openaiVoiceId: "nova", // OpenAI TTS voice: nova (female, warm, US accent)
    tonePreset: "friendly",
    gender: "female",
    accent: "US",
  },
  {
    key: "aloha_voice_professional_male_us",
    label: "Professional (Male, US)",
    description: "Clear and confident, great for confirmations and updates.",
    openaiVoiceId: "onyx", // OpenAI TTS voice: onyx (male, professional, US accent)
    tonePreset: "professional",
    gender: "male",
    accent: "US",
  },
  {
    key: "aloha_voice_energetic_female_uk",
    label: "Energetic (Female, UK)",
    description: "Lively and upbeat, perfect for sales or promotions.",
    openaiVoiceId: "shimmer", // OpenAI TTS voice: shimmer (female, energetic, UK accent)
    tonePreset: "energetic",
    gender: "female",
    accent: "UK",
  },
  {
    key: "aloha_voice_empathetic_male_neutral",
    label: "Empathetic (Male, Neutral)",
    description: "Calm and reassuring, ideal for sensitive or support calls.",
    openaiVoiceId: "echo", // OpenAI TTS voice: echo (male, calm, neutral accent)
    tonePreset: "empathetic",
    gender: "male",
    accent: "Neutral",
  },
];

/**
 * Default voice profile (used when user hasn't selected one)
 */
export const DEFAULT_VOICE_KEY: AlohaVoiceKey = "aloha_voice_friendly_female_us";

/**
 * Get voice profile by key
 */
export function getVoiceProfileByKey(
  key: AlohaVoiceKey | string | null | undefined
): AlohaVoiceProfile {
  if (!key) {
    return getVoiceProfileByKey(DEFAULT_VOICE_KEY);
  }

  const profile = ALOHA_VOICE_PROFILES.find((p) => p.key === key);
  if (!profile) {
    console.warn(`Invalid voice key: ${key}, using default`);
    return getVoiceProfileByKey(DEFAULT_VOICE_KEY);
  }

  return profile;
}

/**
 * Get all voice profiles
 */
export function getAllVoiceProfiles(): AlohaVoiceProfile[] {
  return ALOHA_VOICE_PROFILES;
}

/**
 * Validate voice key
 */
export function isValidVoiceKey(key: string): key is AlohaVoiceKey {
  return ALOHA_VOICE_PROFILES.some((p) => p.key === key);
}

