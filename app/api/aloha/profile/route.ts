import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import {
  isValidVoiceKey,
  DEFAULT_VOICE_KEY,
  type AlohaVoiceKey,
} from "@/lib/aloha/voice-profiles";
import { getAlohaProfile, updateAlohaProfile } from "@/lib/aloha/profile";

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
 * - voice_key?: AlohaVoiceKey (one of the 4 voice profiles)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const body = await request.json();
    const { display_name, voice_key } = body;

    // Validate inputs
    const updates: {
      display_name?: string;
      voice_key?: AlohaVoiceKey;
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

    const updatedProfile = await updateAlohaProfile(userId, updates);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Failed to update Aloha profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Error in PATCH /api/aloha/profile:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

