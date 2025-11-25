/**
 * Aloha Conversation State Engine
 * 
 * Tracks conversation state per call to manage flow and avoid repetition.
 * State tracked:
 * - greeting done?
 * - purpose delivered?
 * - user question answered?
 * - empathy needed?
 * - caller intent (current and previous)
 * - fallback attempts used
 * - ready to close?
 * - need a human callback?
 */

import type { IntentClassification } from "./intent-classification";

export type ConversationPhase =
  | "greeting"
  | "purpose_delivery"
  | "active_conversation"
  | "clarification"
  | "closing"
  | "ended";

export interface ConversationState {
  phase: ConversationPhase;
  
  // Greeting
  greetingDone: boolean;
  greetingTimestamp?: number;
  
  // Purpose delivery (for outbound calls)
  purposeDelivered: boolean;
  purposeDeliveryTimestamp?: number;
  
  // Question handling
  questionsAsked: string[];
  questionsAnswered: string[];
  lastQuestionTimestamp?: number;
  
  // Empathy
  empathyNeeded: boolean;
  empathyProvided: boolean;
  empathyTimestamp?: number;
  
  // Intent tracking
  currentIntent: IntentClassification | null;
  previousIntents: IntentClassification[];
  intentHistory: IntentClassification[];
  
  // Fallback management
  fallbackAttempts: {
    clarification: number;
    knowledgeGap: number;
    badConnection: number;
    silence: number;
  };
  maxFallbackAttempts: {
    clarification: number;
    knowledgeGap: number;
    badConnection: number;
    silence: number;
  };
  
  // Closing
  readyToClose: boolean;
  closingAttempted: boolean;
  exitIntentDetected: boolean;
  exitIntentTimestamp?: number;
  
  // Human callback
  needsHumanCallback: boolean;
  humanCallbackRequested: boolean;
  
  // Conversation metadata
  startTime: number;
  lastActivityTime: number;
  turnCount: number;
}

/**
 * Default conversation state
 */
export function createConversationState(
  callType: "inbound" | "outbound" = "inbound"
): ConversationState {
  return {
    phase: callType === "outbound" ? "greeting" : "active_conversation",
    greetingDone: false,
    purposeDelivered: false,
    questionsAsked: [],
    questionsAnswered: [],
    empathyNeeded: false,
    empathyProvided: false,
    currentIntent: null,
    previousIntents: [],
    intentHistory: [],
    fallbackAttempts: {
      clarification: 0,
      knowledgeGap: 0,
      badConnection: 0,
      silence: 0,
    },
    maxFallbackAttempts: {
      clarification: 3,
      knowledgeGap: 1,
      badConnection: 3,
      silence: 3,
    },
    readyToClose: false,
    closingAttempted: false,
    exitIntentDetected: false,
    needsHumanCallback: false,
    humanCallbackRequested: false,
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    turnCount: 0,
  };
}

/**
 * Mark greeting as done
 */
export function markGreetingDone(state: ConversationState): void {
  state.greetingDone = true;
  state.greetingTimestamp = Date.now();
  if (state.phase === "greeting") {
    state.phase = "purpose_delivery";
  }
  state.lastActivityTime = Date.now();
}

/**
 * Mark purpose as delivered
 */
export function markPurposeDelivered(state: ConversationState): void {
  state.purposeDelivered = true;
  state.purposeDeliveryTimestamp = Date.now();
  if (state.phase === "purpose_delivery") {
    state.phase = "active_conversation";
  }
  state.lastActivityTime = Date.now();
}

/**
 * Track question asked
 */
export function trackQuestionAsked(state: ConversationState, question: string): void {
  if (!state.questionsAsked.includes(question)) {
    state.questionsAsked.push(question);
  }
  state.lastQuestionTimestamp = Date.now();
  state.lastActivityTime = Date.now();
}

/**
 * Track question answered
 */
export function trackQuestionAnswered(state: ConversationState, question: string): void {
  if (!state.questionsAnswered.includes(question)) {
    state.questionsAnswered.push(question);
  }
  state.lastActivityTime = Date.now();
}

/**
 * Update intent tracking
 */
export function updateIntent(
  state: ConversationState,
  intent: IntentClassification
): void {
  // Move current to previous
  if (state.currentIntent) {
    state.previousIntents.push(state.currentIntent);
    // Keep only last 5 previous intents
    if (state.previousIntents.length > 5) {
      state.previousIntents.shift();
    }
  }

  // Update current
  state.currentIntent = intent;
  
  // Add to history (keep last 10)
  state.intentHistory.push(intent);
  if (state.intentHistory.length > 10) {
    state.intentHistory.shift();
  }

  // Update phase based on intent
  if (intent.requiresClarification && state.phase === "active_conversation") {
    state.phase = "clarification";
  } else if (state.phase === "clarification" && !intent.requiresClarification) {
    state.phase = "active_conversation";
  }

  // Check for exit intent
  if (
    intent.primaryIntent === "exit_intent" ||
    intent.callFlowIntent === "wants_unsubscribe"
  ) {
    state.exitIntentDetected = true;
    state.exitIntentTimestamp = Date.now();
    state.readyToClose = true;
    state.phase = "closing";
  }

  // Check for human callback request
  if (intent.callFlowIntent === "wants_callback") {
    state.needsHumanCallback = true;
    state.humanCallbackRequested = true;
  }

  state.lastActivityTime = Date.now();
}

/**
 * Check if empathy is needed
 */
export function checkEmpathyNeeded(
  state: ConversationState,
  intent: IntentClassification
): boolean {
  const needsEmpathy =
    intent.emotionalState === "angry" ||
    intent.emotionalState === "upset" ||
    intent.emotionalState === "frustrated" ||
    intent.emotionalState === "stressed";

  if (needsEmpathy && !state.empathyProvided) {
    state.empathyNeeded = true;
    return true;
  }

  return false;
}

/**
 * Mark empathy as provided
 */
export function markEmpathyProvided(state: ConversationState): void {
  state.empathyProvided = true;
  state.empathyNeeded = false;
  state.empathyTimestamp = Date.now();
  state.lastActivityTime = Date.now();
}

/**
 * Track fallback attempt
 */
export function trackFallbackAttempt(
  state: ConversationState,
  fallbackType: "clarification" | "knowledgeGap" | "badConnection" | "silence"
): {
  canUseFallback: boolean;
  attemptsRemaining: number;
} {
  state.fallbackAttempts[fallbackType]++;
  const attemptsRemaining =
    state.maxFallbackAttempts[fallbackType] - state.fallbackAttempts[fallbackType];
  const canUseFallback = attemptsRemaining >= 0;

  state.lastActivityTime = Date.now();

  return {
    canUseFallback,
    attemptsRemaining,
  };
}

/**
 * Check if ready to close
 */
export function checkReadyToClose(
  state: ConversationState
): {
  ready: boolean;
  reason: string | null;
} {
  // Already detected exit intent
  if (state.exitIntentDetected) {
    return { ready: true, reason: "exit_intent_detected" };
  }

  // Check if all questions answered
  if (
    state.questionsAsked.length > 0 &&
    state.questionsAsked.length === state.questionsAnswered.length
  ) {
    // Wait a bit after last question answered before closing
    const timeSinceLastAnswer =
      Date.now() - (state.lastQuestionTimestamp || state.startTime);
    if (timeSinceLastAnswer > 5000) {
      // 5 seconds
      return { ready: true, reason: "all_questions_answered" };
    }
  }

  // Check if conversation has been idle
  const idleTime = Date.now() - state.lastActivityTime;
  if (idleTime > 30000) {
    // 30 seconds
    return { ready: true, reason: "idle_timeout" };
  }

  // Check if too many fallback attempts (might indicate communication issues)
  const totalFallbacks =
    state.fallbackAttempts.clarification +
    state.fallbackAttempts.badConnection +
    state.fallbackAttempts.silence;
  if (totalFallbacks >= 5) {
    return { ready: true, reason: "too_many_fallbacks" };
  }

  return { ready: false, reason: null };
}

/**
 * Mark ready to close
 */
export function markReadyToClose(state: ConversationState): void {
  state.readyToClose = true;
  state.phase = "closing";
  state.lastActivityTime = Date.now();
}

/**
 * Mark closing attempted
 */
export function markClosingAttempted(state: ConversationState): void {
  state.closingAttempted = true;
  state.lastActivityTime = Date.now();
}

/**
 * Mark conversation as ended
 */
export function markConversationEnded(state: ConversationState): void {
  state.phase = "ended";
  state.lastActivityTime = Date.now();
}

/**
 * Increment turn count
 */
export function incrementTurnCount(state: ConversationState): void {
  state.turnCount++;
  state.lastActivityTime = Date.now();
}

/**
 * Get conversation summary for debugging/analytics
 */
export function getConversationSummary(state: ConversationState): {
  duration: number; // milliseconds
  turnCount: number;
  phase: ConversationPhase;
  questionsAsked: number;
  questionsAnswered: number;
  empathyProvided: boolean;
  exitIntentDetected: boolean;
  needsHumanCallback: boolean;
  fallbackAttempts: ConversationState["fallbackAttempts"];
} {
  return {
    duration: Date.now() - state.startTime,
    turnCount: state.turnCount,
    phase: state.phase,
    questionsAsked: state.questionsAsked.length,
    questionsAnswered: state.questionsAnswered.length,
    empathyProvided: state.empathyProvided,
    exitIntentDetected: state.exitIntentDetected,
    needsHumanCallback: state.needsHumanCallback,
    fallbackAttempts: { ...state.fallbackAttempts },
  };
}

