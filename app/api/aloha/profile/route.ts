import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import {
  isValidVoiceKey,
  DEFAULT_VOICE_KEY,
  type AlohaVoiceKey,
} from "@/lib/aloha/voice-profiles";
import { getAlohaProfile, updateAlohaProfile, getAlohaSelfName } from "@/lib/aloha/profile";
import { regenerateAlohaVoicePack } from "@/lib/aloha/voice-pack";

/**
 * GET /api/aloha/profile
 * Get the current user's Aloha profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const profile = await getAlohaProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Failed to load Aloha profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error: any) {
    console.error("Error in GET /api/aloha/profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/aloha/profile
 * Update the current user's Aloha profile
 * 
 * Body:
 * - display_name?: string
 * - aloha_self_name?: string | null (custom name the agent calls itself, empty string = use default "Aloha")
 * - voice_key?: AlohaVoiceKey (one of the 4 voice profiles)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const body = await request.json();
    const { display_name, aloha_self_name, voice_key } = body;

    // Validate inputs
    const updates: {
      display_name?: string;
      aloha_self_name?: string | null;
      voice_key?: AlohaVoiceKey;
      voice_pack_url?: string | null;
    } = {};

    if (display_name !== undefined) {
      if (typeof display_name !== "string" || display_name.trim().length === 0) {
        return NextResponse.json(
          { error: "display_name must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.display_name = display_name.trim();
    }

    if (aloha_self_name !== undefined) {
      // Normalize: empty string or whitespace-only = null (use default "Aloha")
      const normalizedSelfName = typeof aloha_self_name === "string" 
        ? (aloha_self_name.trim() || null)
        : null;
      updates.aloha_self_name = normalizedSelfName;
    }

    if (voice_key !== undefined) {
      if (typeof voice_key !== "string") {
        return NextResponse.json(
          { error: "voice_key must be a string" },
          { status: 400 }
        );
      }
      if (!isValidVoiceKey(voice_key)) {
        return NextResponse.json(
          { error: `Invalid voice_key: ${voice_key}. Must be one of the 4 predefined voice profiles.` },
          { status: 400 }
        );
      }
      updates.voice_key = voice_key as AlohaVoiceKey;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    // Update profile first
    const updatedProfile = await updateAlohaProfile(userId, updates);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Failed to update Aloha profile" },
        { status: 500 }
      );
    }

    // If aloha_self_name was updated, regenerate voice pack
    let voicePackData: { audioBase64: string; contentType: string } | null = null;
    if (aloha_self_name !== undefined) {
      try {
        // Get effective self-name (normalized)
        const effectiveSelfName = updatedProfile.aloha_self_name?.trim() || "Aloha";
        
        // Regenerate voice pack
        voicePackData = await regenerateAlohaVoicePack(userId, effectiveSelfName);
        
        if (voicePackData) {
          // Create data URL for the voice pack
          const dataUrl = `data:${voicePackData.contentType};base64,${voicePackData.audioBase64}`;
          
          // Update profile with voice pack URL (storing as data URL for now)
          // In production, you might want to upload to cloud storage and store the URL
          await updateAlohaProfile(userId, {
            voice_pack_url: dataUrl,
          });
        } else {
          console.warn("Voice pack regeneration failed, but profile was updated");
        }
      } catch (voicePackError: any) {
        // Log error but don't fail the request - profile was already updated
        console.error("Error regenerating voice pack:", voicePackError);
        // Continue without failing - the previous voice pack will still work
      }
    }

    // Fetch updated profile (in case voice_pack_url was updated)
    const finalProfile = await getAlohaProfile(userId);

    return NextResponse.json({
      ok: true,
      profile: finalProfile,
      voicePack: voicePackData ? {
        audioBase64: voicePackData.audioBase64,
        contentType: voicePackData.contentType,
      } : undefined,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/aloha/profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

