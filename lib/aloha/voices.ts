/**
 * Aloha Voice Registry (Legacy)
 * 
 * NOTE: This is a legacy module. New code should use voice-profiles.ts instead.
 * This file is kept for backward compatibility.
 */

export interface AlohaVoice {
  id: string;
  label: string;
  description: string;
  gender: "female" | "male";
  style: string;
  ttsSettings: {
    provider?: string;
    voiceName?: string;
    pitch?: number;
    speakingRate?: number;
    stability?: number;
    similarityBoost?: number;
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
      provider: "openai",
      voiceName: "nova",
      pitch: 0,
      speakingRate: 1.0,
    },
  },
];

export function getVoiceById(voiceId: string): AlohaVoice | undefined {
  return ALOHA_VOICES.find((v) => v.id === voiceId);
}

export function getDefaultVoice(): AlohaVoice {
  return ALOHA_VOICES[0];
}

export function isValidVoiceId(voiceId: string): boolean {
  return ALOHA_VOICES.some((v) => v.id === voiceId);
}

export function getAllVoices(): AlohaVoice[] {
  return ALOHA_VOICES;
}

