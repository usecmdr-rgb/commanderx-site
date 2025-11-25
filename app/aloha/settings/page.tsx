"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAllVoiceProfiles,
  getVoiceProfileByKey,
  DEFAULT_VOICE_KEY,
  type AlohaVoiceKey,
  type AlohaVoiceProfile,
} from "@/lib/aloha/voice-profiles";
import type { AlohaProfile } from "@/types/database";

export default function AlohaSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AlohaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<AlohaVoiceKey>(DEFAULT_VOICE_KEY);
  const [previewingVoiceKey, setPreviewingVoiceKey] = useState<AlohaVoiceKey | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  const voiceProfiles = getAllVoiceProfiles();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/aloha/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch Aloha profile");
      }
      const data = await response.json();
      if (data.ok && data.profile) {
        setProfile(data.profile);
        setDisplayName(data.profile.display_name || "Aloha");
        // Use voice_key if available, otherwise fall back to default
        setSelectedVoiceKey(
          (data.profile.voice_key as AlohaVoiceKey) || DEFAULT_VOICE_KEY
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    if (!selectedVoiceKey) {
      setError("Please select a voice");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/aloha/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          voice_key: selectedVoiceKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      if (data.ok && data.profile) {
        setProfile(data.profile);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewVoice = async (voiceKey: AlohaVoiceKey) => {
    setPreviewingVoiceKey(voiceKey);
    setPreviewAudioUrl(null);

    try {
      const response = await fetch("/api/aloha/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_key: voiceKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice preview");
      }

      const data = await response.json();
      if (data.ok && data.audioUrl) {
        // Play the audio preview
        const audio = new Audio(data.audioUrl);
        audio.play();

        audio.onended = () => {
          setPreviewingVoiceKey(null);
          setPreviewAudioUrl(null);
        };

        audio.onerror = () => {
          setPreviewingVoiceKey(null);
          setPreviewAudioUrl(null);
          setError("Failed to play voice preview");
        };
      }
    } catch (err: any) {
      console.error("Error previewing voice:", err);
      setPreviewingVoiceKey(null);
      setError(err.message || "Failed to preview voice");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Loading Aloha settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4"
        >
          ← Back
        </button>
        <p className="text-sm uppercase tracking-widest text-slate-500">Aloha Agent</p>
        <h1 className="text-3xl font-semibold">Personalization Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Customize how Aloha introduces itself and sounds during calls
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Agent Name Section */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-4">Agent Name</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            How should Aloha introduce itself during calls?
          </p>
          <div className="space-y-2">
            <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Aloha"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            />
            <p className="text-xs text-slate-500">
              Example: &quot;Sarah&quot;, &quot;Alex&quot;, &quot;Reception&quot;, or &quot;Sarah from [Your Business Name]&quot;
            </p>
            <p className="text-xs text-slate-500 mt-2">
              This name will be used in call introductions, e.g., &quot;Hi, this is {displayName || "Aloha"} from [BusinessName]. How can I help you today?&quot;
            </p>
          </div>
        </section>

        {/* Voice Selection Section */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-4">Voice Selection</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Choose how Aloha sounds during calls. Each voice has a distinct style and personality.
            Aloha's behavior and personality stay the same; only the voice changes.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {voiceProfiles.map((voiceProfile) => (
              <VoiceProfileCard
                key={voiceProfile.key}
                voiceProfile={voiceProfile}
                isSelected={selectedVoiceKey === voiceProfile.key}
                isPreviewing={previewingVoiceKey === voiceProfile.key}
                onSelect={() => setSelectedVoiceKey(voiceProfile.key)}
                onPreview={() => handlePreviewVoice(voiceProfile.key)}
              />
            ))}
          </div>
        </section>

        {/* Conversation Intelligence Section */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold mb-4">Conversation Intelligence</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Advanced conversation capabilities for more natural, context-aware interactions.
          </p>
          
          <div className="space-y-6">
            {/* Intent Classification */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">Intent Classification</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically classify caller utterances (questions, statements, emotions, call flow intent)
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Question types: pricing, availability, services, appointments</li>
                <li>• Statement types: complaint, praise, confusion</li>
                <li>• Emotional states: angry, upset, stressed, neutral, happy</li>
                <li>• Call flow: wants callback, wants email, wants unsubscribe</li>
              </ul>
            </div>

            {/* Voice Dynamics */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">Natural Voice Dynamics</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Human-like voice shaping with micro pauses, disfluencies, and emotion-aware adjustments
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Micro pauses between clauses</li>
                <li>• Natural disfluencies (sparingly): "okay," "so," "let me see"</li>
                <li>• Softening phrases: "I can help with that," "no worries"</li>
                <li>• Emotion-aware adjustments based on caller state</li>
              </ul>
            </div>

            {/* Emotional Intelligence */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">Emotional Intelligence</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Empathetic response shaping based on detected emotional state
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Upset callers → gentle tone + acknowledgement</li>
                <li>• Angry callers → de-escalation + neutral clarity</li>
                <li>• Stressed callers → slow pace + reassurance</li>
                <li>• Confused callers → more explicit guidance</li>
              </ul>
            </div>

            {/* Communication Resilience */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">Communication Resilience</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Handle connection issues, silence, and talkative callers gracefully
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Bad connection detection and fallback</li>
                <li>• Silence handling (2s, 6s, 10s check-ins)</li>
                <li>• Talkative caller management</li>
                <li>• Automatic graceful recovery</li>
              </ul>
            </div>

            {/* Contact Memory */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">Contact Memory</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Remember basic info about callers for personalized conversations
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Per-phone-number memory (name, notes, outcomes)</li>
                <li>• Do-not-call flag enforcement</li>
                <li>• Natural greeting adjustments</li>
                <li>• Privacy-conscious storage</li>
              </ul>
              <Link
                href="/aloha/contacts"
                className="mt-3 inline-block text-sm text-brand-accent hover:underline"
              >
                Manage contacts →
              </Link>
            </div>

            {/* End-of-Call Intelligence */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold mb-1">End-of-Call Intelligence</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Graceful call endings with exit intent detection
                  </p>
                </div>
                <div className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 mt-2">
                <li>• Detect exit intent (explicit or implied)</li>
                <li>• Check for additional needs before closing</li>
                <li>• Context-aware closing messages</li>
                <li>• Respectful ending for all scenarios</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !selectedVoiceKey}
            className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface VoiceProfileCardProps {
  voiceProfile: AlohaVoiceProfile;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function VoiceProfileCard({
  voiceProfile,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
}: VoiceProfileCardProps) {
  return (
    <div
      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-brand-accent bg-brand-accent/5 dark:bg-brand-accent/10"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{voiceProfile.label}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {voiceProfile.description}
          </p>
        </div>
        {isSelected && (
          <div className="ml-2 w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {voiceProfile.gender === "female" ? "♀" : "♂"} {voiceProfile.accent} • {voiceProfile.tonePreset}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          disabled={isPreviewing}
          className="text-xs px-3 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {isPreviewing ? "Playing..." : "Preview"}
        </button>
      </div>
    </div>
  );
}

