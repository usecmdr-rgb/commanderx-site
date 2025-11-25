/**
 * Aloha Profile Management
 * 
 * Handles loading and managing Aloha agent profiles (display name, voice settings)
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getDefaultVoice, isValidVoiceId, type AlohaVoice } from "./voices";
import {
  DEFAULT_VOICE_KEY,
  getVoiceProfileByKey,
  isValidVoiceKey,
  type AlohaVoiceKey,
} from "./voice-profiles";

export interface AlohaProfile {
  id: string;
  user_id: string;
  display_name: string;
  voice_id: string; // Legacy field, kept for backward compatibility
  voice_key?: AlohaVoiceKey | null; // New field for voice profile selection
  voice_options?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get Aloha profile for a user
 * Creates a default profile if one doesn't exist
 */
export async function getAlohaProfile(userId: string): Promise<AlohaProfile | null> {
  const supabase = getSupabaseServerClient();

  // Try to fetch existing profile
  const { data, error } = await supabase
    .from("aloha_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, which is okay
    console.error("Error fetching Aloha profile:", error);
    return null;
  }

  if (data) {
    // Validate voice_id, fallback to default if invalid
    if (!isValidVoiceId(data.voice_id)) {
      console.warn(`Invalid voice_id ${data.voice_id} for user ${userId}, using default`);
      const defaultVoice = getDefaultVoice();
      // Auto-fix invalid voice_id
      await updateAlohaProfile(userId, { voice_id: defaultVoice.id });
      return { ...data, voice_id: defaultVoice.id };
    }
    return data;
  }

  // No profile exists, create default one
  const defaultVoice = getDefaultVoice();
  const { data: newProfile, error: createError } = await supabase
    .from("aloha_profiles")
    .insert({
      user_id: userId,
      display_name: "Aloha",
      voice_id: defaultVoice.id, // Legacy field
      voice_key: DEFAULT_VOICE_KEY, // New voice profile system
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating default Aloha profile:", createError);
    return null;
  }

  return newProfile;
}

/**
 * Update Aloha profile
 */
export async function updateAlohaProfile(
  userId: string,
  updates: {
    display_name?: string;
    voice_id?: string; // Legacy field
    voice_key?: AlohaVoiceKey; // New voice profile system
    voice_options?: Record<string, any> | null;
  }
): Promise<AlohaProfile | null> {
  const supabase = getSupabaseServerClient();

  // Validate voice_id if provided (legacy)
  if (updates.voice_id && !isValidVoiceId(updates.voice_id)) {
    console.warn(`Invalid voice_id ${updates.voice_id}, using default`);
    updates.voice_id = getDefaultVoice().id;
  }

  // Validate voice_key if provided
  if (updates.voice_key) {
    if (!isValidVoiceKey(updates.voice_key)) {
      console.warn(`Invalid voice_key ${updates.voice_key}, using default`);
      updates.voice_key = DEFAULT_VOICE_KEY;
    }
  }

  // Ensure profile exists first
  const existingProfile = await getAlohaProfile(userId);
  if (!existingProfile) {
    // Create profile if it doesn't exist
    const defaultVoice = getDefaultVoice();
    const { data: newProfile, error: createError } = await supabase
      .from("aloha_profiles")
      .insert({
        user_id: userId,
        display_name: updates.display_name || "Aloha",
        voice_id: updates.voice_id || defaultVoice.id, // Legacy
        voice_key: updates.voice_key || DEFAULT_VOICE_KEY, // New system
        voice_options: updates.voice_options || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating Aloha profile:", createError);
      return null;
    }

    return newProfile;
  }

  // Update existing profile
  const { data, error } = await supabase
    .from("aloha_profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating Aloha profile:", error);
    return null;
  }

  return data;
}

/**
 * Get display name for Aloha (with fallback)
 */
export async function getAlohaDisplayName(userId: string): Promise<string> {
  const profile = await getAlohaProfile(userId);
  return profile?.display_name || "Aloha";
}

/**
 * Get voice settings for Aloha (with fallback)
 * 
 * NOTE: This function is kept for backward compatibility.
 * New code should use getAlohaVoiceProfile() instead.
 */
export async function getAlohaVoice(userId: string): Promise<AlohaVoice> {
  const profile = await getAlohaProfile(userId);
  if (profile?.voice_id) {
    const { getVoiceById } = await import("./voices");
    const voice = getVoiceById(profile.voice_id);
    if (voice) return voice;
  }
  return getDefaultVoice();
}

/**
 * Get voice profile for Aloha (new voice profile system)
 */
export async function getAlohaVoiceProfile(
  userId: string
): Promise<ReturnType<typeof getVoiceProfileByKey>> {
  const profile = await getAlohaProfile(userId);
  const voiceKey = profile?.voice_key || DEFAULT_VOICE_KEY;
  return getVoiceProfileByKey(voiceKey);
}

