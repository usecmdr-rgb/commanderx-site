/**
 * Aloha Filler Speech System
 * 
 * Provides natural "thinking" or "processing" filler speech when the LLM
 * needs extra time to generate a response. Prevents awkward silence during
 * STT → LLM → TTS pipeline delays.
 * 
 * Behavior:
 * - Detects delays (300-700ms threshold)
 * - Immediately speaks short, natural phrases
 * - Cuts off filler when real response is ready
 * - Non-blocking, streaming
 * - Respects voice and display name settings
 */

import {
  getAlohaVoice,
  getAlohaDisplayName,
  getAlohaVoiceProfile,
} from "./profile";
import { generateSpeech, streamSpeech, type TTSOptions } from "./tts";
import type { AlohaVoice } from "./voices";
import type { AlohaVoiceProfile } from "./voice-profiles";

/**
 * Filler phrases - natural, unscripted, context-appropriate
 * Rotated randomly to avoid repetition
 */
const FILLER_PHRASES = [
  "Let me check that for you…",
  "Just a moment…",
  "Got it, give me one second…",
  "Okay, let me see…",
  "One sec…",
  "Alright, hold on…",
  "Hmm, checking…",
  "Let me look that up…",
  "Give me just a moment…",
  "Okay, one second…",
  "Right, let me find that…",
  "Sure, checking on that…",
];

/**
 * Delay thresholds (in milliseconds)
 */
export const DELAY_THRESHOLDS = {
  MIN_DELAY: 300, // Start filler if delay exceeds 300ms
  MAX_DELAY: 700, // Filler should definitely be playing by 700ms
  FILLER_START_TARGET: 250, // Target time to start filler TTS (250-400ms)
  FILLER_START_MAX: 400,
} as const;

/**
 * Filler speech state
 */
export interface FillerSpeechState {
  isActive: boolean;
  fillerText: string | null;
  fillerAudioStream: ReadableStream | null;
  startTime: number | null;
  stopRequested: boolean;
}

/**
 * Call context for filler speech
 */
export interface CallContext {
  userId: string;
  callId?: string;
  callType: "inbound" | "outbound";
  displayName?: string; // Optional override
  voice?: AlohaVoice; // Optional override
}

/**
 * Get a random filler phrase
 */
export function getRandomFillerPhrase(): string {
  return FILLER_PHRASES[Math.floor(Math.random() * FILLER_PHRASES.length)];
}

/**
 * Get a context-appropriate filler phrase
 * Can be customized based on call context if needed
 */
export function getContextualFillerPhrase(context?: CallContext): string {
  // For now, just return random phrase
  // In the future, could customize based on:
  // - Call type (inbound vs outbound)
  // - Previous conversation context
  // - Display name personalization
  return getRandomFillerPhrase();
}

/**
 * Detect if delay threshold has been exceeded
 */
export function shouldStartFiller(elapsedMs: number): boolean {
  return elapsedMs >= DELAY_THRESHOLDS.MIN_DELAY;
}

/**
 * Check if filler should definitely be playing
 */
export function mustHaveFiller(elapsedMs: number): boolean {
  return elapsedMs >= DELAY_THRESHOLDS.MAX_DELAY;
}

/**
 * Generate filler speech audio
 * 
 * This generates TTS for a filler phrase using the user's selected voice.
 * The audio should be streamed immediately and can be cut off when the
 * real response is ready.
 */
export async function generateFillerSpeech(
  context: CallContext,
  fillerText?: string
): Promise<{
  audioStream: ReadableStream;
  fillerText: string;
  duration: number; // Estimated duration in ms
}> {
  // Get voice profile and display name
  const voiceProfile = await getAlohaVoiceProfile(context.userId);
  const displayName = context.displayName || (await getAlohaDisplayName(context.userId));

  // Get filler phrase
  const phrase = fillerText || getContextualFillerPhrase(context);

  // Generate TTS for filler phrase using voice profile
  // Note: This uses streaming TTS for immediate playback
  const audioStream = await streamSpeech(phrase, voiceProfile);

  // Estimate duration (filler phrases are typically 0.5-1.5 seconds)
  // Rough estimate: ~150 words per minute, ~5 characters per word
  const estimatedWords = phrase.split(/\s+/).length;
  const estimatedDuration = (estimatedWords / 150) * 60 * 1000; // Convert to ms
  const clampedDuration = Math.max(500, Math.min(1500, estimatedDuration));

  return {
    audioStream,
    fillerText: phrase,
    duration: clampedDuration,
  };
}

/**
 * Filler Speech Manager
 * 
 * Manages the lifecycle of filler speech during a call:
 * - Detects delays
 * - Starts filler speech
 * - Stops filler when real response is ready
 * - Handles interruptions
 */
export class FillerSpeechManager {
  private state: FillerSpeechState = {
    isActive: false,
    fillerText: null,
    fillerAudioStream: null,
    startTime: null,
    stopRequested: false,
  };

  private context: CallContext;
  private onFillerStart?: (fillerText: string) => void;
  private onFillerStop?: () => void;

  constructor(
    context: CallContext,
    callbacks?: {
      onFillerStart?: (fillerText: string) => void;
      onFillerStop?: () => void;
    }
  ) {
    this.context = context;
    this.onFillerStart = callbacks?.onFillerStart;
    this.onFillerStop = callbacks?.onFillerStop;
  }

  /**
   * Check if we should start filler speech based on elapsed time
   * Returns true if filler should be started
   */
  async checkAndStartFiller(elapsedMs: number): Promise<boolean> {
    // Already active or stop requested
    if (this.state.isActive || this.state.stopRequested) {
      return false;
    }

    // Check if delay threshold exceeded
    if (!shouldStartFiller(elapsedMs)) {
      return false;
    }

    // Start filler speech
    try {
      const { audioStream, fillerText } = await generateFillerSpeech(this.context);

      this.state = {
        isActive: true,
        fillerText,
        fillerAudioStream: audioStream,
        startTime: Date.now(),
        stopRequested: false,
      };

      // Notify callback
      if (this.onFillerStart) {
        this.onFillerStart(fillerText);
      }

      return true;
    } catch (error) {
      console.error("Error generating filler speech:", error);
      return false;
    }
  }

  /**
   * Stop filler speech immediately (when real response is ready or caller interrupts)
   */
  stopFiller(): void {
    if (!this.state.isActive) {
      return;
    }

    this.state.stopRequested = true;
    this.state.isActive = false;

    // Close audio stream if it exists
    if (this.state.fillerAudioStream) {
      // In production, this would stop the actual audio playback
      // The telephony system should handle stopping the stream
      try {
        // If the stream has a cancel method, call it
        if (typeof (this.state.fillerAudioStream as any).cancel === "function") {
          (this.state.fillerAudioStream as any).cancel();
        }
      } catch (error) {
        // Ignore errors when stopping
      }
    }

    this.state.fillerAudioStream = null;
    this.state.fillerText = null;
    this.state.startTime = null;

    // Notify callback
    if (this.onFillerStop) {
      this.onFillerStop();
    }
  }

  /**
   * Check if filler is currently active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get current filler text (for logging/debugging)
   */
  getCurrentFiller(): string | null {
    return this.state.fillerText;
  }

  /**
   * Reset manager state (for new call turn)
   */
  reset(): void {
    this.stopFiller();
    this.state.stopRequested = false;
  }
}

/**
 * Call Response Handler with Filler Speech
 * 
 * This middleware handles the STT → LLM → TTS pipeline with filler speech support.
 * 
 * Flow:
 * 1. Caller finishes speaking (STT complete)
 * 2. Start LLM generation (async)
 * 3. Start delay timer
 * 4. If delay > threshold, start filler speech
 * 5. When LLM response ready, stop filler and start real response TTS
 * 6. Handle interruptions (stop filler, restart)
 */
export class CallResponseHandler {
  private fillerManager: FillerSpeechManager;
  private llmResponsePromise: Promise<string> | null = null;
  private delayTimer: NodeJS.Timeout | null = null;
  private responseStartTime: number | null = null;

  constructor(context: CallContext) {
    this.fillerManager = new FillerSpeechManager(context, {
      onFillerStart: (fillerText) => {
        console.log(`[Aloha Filler] Started: "${fillerText}"`);
      },
      onFillerStop: () => {
        console.log(`[Aloha Filler] Stopped`);
      },
    });
  }

  /**
   * Handle a call turn: process STT → LLM → TTS with filler speech
   * 
   * @param sttText - Transcribed caller speech
   * @param llmGenerator - Async function that generates LLM response
   * @returns Promise that resolves when response is ready
   */
  async handleCallTurn(
    sttText: string,
    llmGenerator: (text: string) => Promise<string>
  ): Promise<{
    response: string;
    usedFiller: boolean;
    fillerText?: string;
  }> {
    // Reset state
    this.fillerManager.reset();
    this.responseStartTime = Date.now();

    // Start LLM generation (non-blocking)
    this.llmResponsePromise = llmGenerator(sttText);

    // Start delay monitoring
    const delayCheckInterval = 50; // Check every 50ms
    let lastCheckTime = Date.now();

    const checkDelay = async () => {
      if (!this.responseStartTime) return;

      const elapsed = Date.now() - this.responseStartTime;

      // Check if we should start filler
      if (!this.fillerManager.isActive()) {
        await this.fillerManager.checkAndStartFiller(elapsed);
      }

      // If LLM response is ready, stop checking
      try {
        await Promise.race([
          this.llmResponsePromise,
          new Promise((resolve) => setTimeout(resolve, delayCheckInterval)),
        ]);
      } catch (error) {
        // Ignore errors in delay check
      }
    };

    // Monitor delay until response is ready
    const delayMonitor = setInterval(checkDelay, delayCheckInterval);

    try {
      // Wait for LLM response
      const response = await this.llmResponsePromise;

      // Stop delay monitoring
      clearInterval(delayMonitor);

      // Stop filler if active
      const usedFiller = this.fillerManager.isActive();
      const fillerText = this.fillerManager.getCurrentFiller();
      this.fillerManager.stopFiller();

      return {
        response,
        usedFiller,
        fillerText: fillerText || undefined,
      };
    } catch (error) {
      // Stop delay monitoring on error
      clearInterval(delayMonitor);
      this.fillerManager.stopFiller();
      throw error;
    }
  }

  /**
   * Handle caller interruption (stop filler, prepare for new input)
   */
  handleInterruption(): void {
    this.fillerManager.stopFiller();
    // In production, would also stop any ongoing TTS
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.delayTimer) {
      clearInterval(this.delayTimer);
      this.delayTimer = null;
    }
    this.fillerManager.reset();
  }
}

