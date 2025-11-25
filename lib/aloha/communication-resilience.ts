/**
 * Aloha Real-Time Communication Resilience
 * 
 * Handles real-time communication issues:
 * - Bad connection detection
 * - Caller silence handling
 * - Overly talkative caller management
 */

import { getResponseSnippet } from "./response-snippets";

export interface STTMetadata {
  confidence?: number; // 0-1
  hasInaudible?: boolean;
  isEmpty?: boolean;
  hasNoiseMarkers?: boolean;
  transcript?: string;
}

export interface SilenceState {
  lastSpeechTime: number; // timestamp
  currentSilenceDuration: number; // seconds
  checkInsUsed: number; // count of silence check-ins
}

export interface CommunicationState {
  badConnectionDetected: boolean;
  badConnectionAttempts: number;
  silenceState: SilenceState;
  consecutiveLowConfidence: number;
  talkativeIndicators: {
    longResponses: number;
    interruptions: number;
    topicSwitches: number;
  };
}

/**
 * Default communication state
 */
export function createCommunicationState(): CommunicationState {
  return {
    badConnectionDetected: false,
    badConnectionAttempts: 0,
    silenceState: {
      lastSpeechTime: Date.now(),
      currentSilenceDuration: 0,
      checkInsUsed: 0,
    },
    consecutiveLowConfidence: 0,
    talkativeIndicators: {
      longResponses: 0,
      interruptions: 0,
      topicSwitches: 0,
    },
  };
}

/**
 * Detect bad connection from STT metadata
 */
export function detectBadConnection(
  sttMetadata: STTMetadata,
  state: CommunicationState
): {
  isBadConnection: boolean;
  severity: "low" | "medium" | "high";
  shouldUseFallback: boolean;
} {
  let badConnectionScore = 0;
  let severity: "low" | "medium" | "high" = "low";

  // Low confidence indicator
  if (sttMetadata.confidence !== undefined && sttMetadata.confidence < 0.5) {
    badConnectionScore += sttMetadata.confidence < 0.3 ? 3 : 1;
    state.consecutiveLowConfidence++;
  } else {
    state.consecutiveLowConfidence = 0;
  }

  // [inaudible] markers
  if (sttMetadata.hasInaudible || sttMetadata.transcript?.includes("[inaudible]")) {
    badConnectionScore += 2;
  }

  // Empty transcript
  if (sttMetadata.isEmpty || !sttMetadata.transcript || sttMetadata.transcript.trim().length === 0) {
    badConnectionScore += 2;
  }

  // Noise markers
  if (sttMetadata.hasNoiseMarkers || sttMetadata.transcript?.match(/\[noise\]|\[static\]/i)) {
    badConnectionScore += 1;
  }

  // Multiple consecutive low confidence
  if (state.consecutiveLowConfidence >= 3) {
    badConnectionScore += 2;
  }

  // Determine severity
  if (badConnectionScore >= 5) {
    severity = "high";
  } else if (badConnectionScore >= 3) {
    severity = "medium";
  } else {
    severity = "low";
  }

  const isBadConnection = badConnectionScore >= 2;
  const shouldUseFallback = badConnectionScore >= 3 || state.consecutiveLowConfidence >= 2;

  if (isBadConnection) {
    state.badConnectionDetected = true;
    state.badConnectionAttempts++;
  }

  return {
    isBadConnection,
    severity,
    shouldUseFallback,
  };
}

/**
 * Get bad connection fallback snippet
 */
export function getBadConnectionFallback(severity: "low" | "medium" | "high"): string {
  if (severity === "high") {
    return getResponseSnippet("bad_connection_detected").text;
  } else {
    return getResponseSnippet("connection_rough").text;
  }
}

/**
 * Update silence state
 */
export function updateSilenceState(
  state: CommunicationState,
  hasSpeech: boolean
): void {
  const now = Date.now();

  if (hasSpeech) {
    state.silenceState.lastSpeechTime = now;
    state.silenceState.currentSilenceDuration = 0;
  } else {
    const elapsed = (now - state.silenceState.lastSpeechTime) / 1000; // Convert to seconds
    state.silenceState.currentSilenceDuration = elapsed;
  }
}

/**
 * Check if silence check-in is needed
 */
export function shouldCheckInForSilence(
  state: CommunicationState
): {
  shouldCheckIn: boolean;
  checkInType: "short" | "medium" | "long" | null;
  message: string | null;
} {
  const silenceDuration = state.silenceState.currentSilenceDuration;

  // At 2-3 seconds: short check-in
  if (silenceDuration >= 2 && silenceDuration < 5 && state.silenceState.checkInsUsed === 0) {
    state.silenceState.checkInsUsed = 1;
    return {
      shouldCheckIn: true,
      checkInType: "short",
      message: getResponseSnippet("caller_silent_short").text,
    };
  }

  // At 6-7 seconds: medium check-in
  if (silenceDuration >= 6 && silenceDuration < 9 && state.silenceState.checkInsUsed === 1) {
    state.silenceState.checkInsUsed = 2;
    return {
      shouldCheckIn: true,
      checkInType: "medium",
      message: getResponseSnippet("caller_silent_medium").text,
    };
  }

  // At 10+ seconds: long check-in / end call
  if (silenceDuration >= 10 && state.silenceState.checkInsUsed === 2) {
    state.silenceState.checkInsUsed = 3;
    return {
      shouldCheckIn: true,
      checkInType: "long",
      message: getResponseSnippet("caller_silent_long").text,
    };
  }

  return {
    shouldCheckIn: false,
    checkInType: null,
    message: null,
  };
}

/**
 * Detect if caller is overly talkative
 */
export function detectTalkativeCaller(
  transcript: string,
  state: CommunicationState
): {
  isTalkative: boolean;
  shouldRedirect: boolean;
  redirectMessage: string | null;
} {
  const transcriptLength = transcript.length;
  const wordCount = transcript.split(/\s+/).length;

  // Long responses (more than 100 words)
  if (wordCount > 100) {
    state.talkativeIndicators.longResponses++;
  }

  // Multiple topic switches (indicated by various sentence starters)
  const topicIndicators = transcript.match(/\b(?:also|and another|speaking of|by the way|oh|and|but)\b/gi);
  if (topicIndicators && topicIndicators.length > 3) {
    state.talkativeIndicators.topicSwitches++;
  }

  // Determine if talkative
  const isTalkative =
    state.talkativeIndicators.longResponses >= 2 ||
    state.talkativeIndicators.topicSwitches >= 2 ||
    wordCount > 150;

  // Should redirect if very talkative or multiple long responses
  const shouldRedirect =
    isTalkative &&
    (state.talkativeIndicators.longResponses >= 2 ||
      state.talkativeIndicators.topicSwitches >= 2);

  return {
    isTalkative,
    shouldRedirect,
    redirectMessage: shouldRedirect ? getResponseSnippet("caller_talkative_redirect").text : null,
  };
}

/**
 * Handle interruption tracking
 */
export function handleInterruption(state: CommunicationState): void {
  state.talkativeIndicators.interruptions++;
  // Reset silence state on interruption
  state.silenceState.lastSpeechTime = Date.now();
  state.silenceState.currentSilenceDuration = 0;
}

/**
 * Get shortened response for rushed/talkative caller
 */
export function shortenResponseForRushedCaller(response: string): string {
  let shortened = response;

  // Remove redundant phrases
  shortened = shortened.replace(/\b(I|We) (think|believe) that\b/gi, "$1");
  shortened = shortened.replace(/\bfor your information\b/gi, "");
  shortened = shortened.replace(/\bas I mentioned\b/gi, "");
  shortened = shortened.replace(/\bdefinitely|certainly|absolutely\b/gi, "");

  // Shorten common phrases
  shortened = shortened.replace(/\bI can definitely help\b/gi, "I can help");
  shortened = shortened.replace(/\bI will certainly\b/gi, "I'll");
  shortened = shortened.replace(/\bI am able to\b/gi, "I can");

  // Remove unnecessary words
  shortened = shortened.replace(/\bvery\b/gi, "");
  shortened = shortened.replace(/\breally\b/gi, "");
  shortened = shortened.replace(/\bquite\b/gi, "");

  // Limit length (if still too long, truncate at sentence boundary)
  const maxLength = 200;
  if (shortened.length > maxLength) {
    const sentences = shortened.split(/(?<=[.!?])\s+/);
    let truncated = "";
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxLength) {
        break;
      }
      truncated += (truncated ? " " : "") + sentence;
    }
    if (truncated) {
      shortened = truncated;
    }
  }

  return shortened.trim();
}

/**
 * Check if should end call due to bad connection
 */
export function shouldEndCallDueToBadConnection(
  state: CommunicationState
): boolean {
  // End call if bad connection detected multiple times
  return state.badConnectionAttempts >= 3 || state.consecutiveLowConfidence >= 5;
}

/**
 * Reset communication state (for new call or after recovery)
 */
export function resetCommunicationState(
  state: CommunicationState,
  resetBadConnection: boolean = false
): void {
  if (resetBadConnection) {
    state.badConnectionDetected = false;
    state.badConnectionAttempts = 0;
    state.consecutiveLowConfidence = 0;
  }
  state.silenceState.lastSpeechTime = Date.now();
  state.silenceState.currentSilenceDuration = 0;
  // Don't reset checkInsUsed - track across conversation
  // state.silenceState.checkInsUsed = 0;
}

