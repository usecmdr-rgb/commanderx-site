/**
 * Aloha End-of-Call Intelligence
 * 
 * Handles graceful call endings so calls don't end abruptly.
 * Features:
 * - Detects exit intent (explicit or implied)
 * - Checks if caller needs anything else before closing
 * - Provides context-aware closing messages
 * - Respects caller's emotional state in closing
 */

import { getResponseSnippet, type ResponseSnippetId } from "./response-snippets";
import type { EmotionalState } from "./intent-classification";
import type { ConversationState } from "./conversation-state";

export interface EndOfCallOptions {
  callerWasUpset?: boolean;
  connectionWasBad?: boolean;
  callerSatisfied?: boolean;
  emotionalState?: EmotionalState;
  conversationState?: ConversationState;
}

/**
 * Detect exit intent from caller response
 */
export function detectExitIntent(
  callerResponse: string,
  conversationState?: ConversationState
): {
  hasExitIntent: boolean;
  confidence: "low" | "medium" | "high";
  isExplicit: boolean;
} {
  const lower = callerResponse.toLowerCase().trim();
  
  // Explicit exit signals
  const explicitSignals = [
    /^(?:bye|goodbye|see you|talk to you later|gotta go|have to go|that's all|nothing else|that's it|all set|done|finished)\b/i,
    /\b(?:that's all|nothing else|that's it|all set|we're done|we're finished|everything is good|sounds good|perfect|great|thanks)\b/i,
  ];
  
  const hasExplicit = explicitSignals.some(pattern => pattern.test(lower));
  
  // Implicit exit signals (short, affirmative responses)
  const implicitSignals = [
    /^(?:okay|ok|yep|yeah|sure|fine|alright|sounds good|great|perfect|thanks|thank you)(?:[,.!]|\s*$)/i,
  ];
  
  const hasImplicit = implicitSignals.some(pattern => pattern.test(lower)) && lower.length < 30;
  
  // Check conversation state
  let stateBasedExit = false;
  if (conversationState) {
    stateBasedExit = conversationState.exitIntentDetected || conversationState.readyToClose;
  }
  
  // Determine exit intent
  if (hasExplicit || stateBasedExit) {
    return {
      hasExitIntent: true,
      confidence: "high",
      isExplicit: hasExplicit,
    };
  }
  
  if (hasImplicit) {
    return {
      hasExitIntent: true,
      confidence: "medium",
      isExplicit: false,
    };
  }
  
  return {
    hasExitIntent: false,
    confidence: "low",
    isExplicit: false,
  };
}

/**
 * Check if should ask if caller needs anything else
 */
export function shouldCheckForAdditionalNeeds(
  conversationState?: ConversationState,
  options: EndOfCallOptions = {}
): boolean {
  // Don't check if already closing
  if (conversationState?.closingAttempted) {
    return false;
  }
  
  // Don't check if exit intent is explicit and strong
  if (conversationState?.exitIntentDetected && conversationState.exitIntentTimestamp) {
    const timeSinceExitIntent = Date.now() - conversationState.exitIntentTimestamp;
    if (timeSinceExitIntent < 3000) {
      // Just detected exit intent, skip check
      return false;
    }
  }
  
  // Check if all questions answered or conversation seems complete
  if (conversationState) {
    const allQuestionsAnswered =
      conversationState.questionsAsked.length > 0 &&
      conversationState.questionsAsked.length === conversationState.questionsAnswered.length;
    
    if (allQuestionsAnswered) {
      return true;
    }
  }
  
  // Check if caller seems satisfied
  if (options.callerSatisfied) {
    return true;
  }
  
  return false;
}

/**
 * Get check-in message before closing
 */
export function getAdditionalNeedsCheckIn(
  options: EndOfCallOptions = {}
): string {
  if (options.callerWasUpset || options.emotionalState === "upset" || options.emotionalState === "angry") {
    return getResponseSnippet("exit_check_needs_anything_upset").text;
  } else {
    return getResponseSnippet("exit_check_needs_anything").text;
  }
}

/**
 * Get appropriate closing message
 */
export function getClosingMessage(options: EndOfCallOptions = {}): string {
  // If caller was upset, use empathetic closing
  if (
    options.callerWasUpset ||
    options.emotionalState === "upset" ||
    options.emotionalState === "angry" ||
    options.emotionalState === "frustrated"
  ) {
    return getResponseSnippet("exit_if_upset").text;
  }
  
  // If connection was bad, mention it
  if (options.connectionWasBad) {
    return getResponseSnippet("exit_if_connection_bad").text;
  }
  
  // Standard graceful closing
  if (options.callerSatisfied !== false) {
    return getResponseSnippet("exit_graceful").text;
  }
  
  // Default standard closing
  return getResponseSnippet("exit_natural_standard").text;
}

/**
 * Determine if call should end now
 */
export function shouldEndCallNow(
  callerResponse: string,
  conversationState?: ConversationState,
  options: EndOfCallOptions = {}
): {
  shouldEnd: boolean;
  reason: string | null;
} {
  // Check for explicit exit intent
  const exitIntent = detectExitIntent(callerResponse, conversationState);
  
  if (exitIntent.hasExitIntent && exitIntent.confidence === "high") {
    return {
      shouldEnd: true,
      reason: exitIntent.isExplicit ? "explicit_exit_intent" : "strong_exit_intent",
    };
  }
  
  // Check conversation state
  if (conversationState) {
    // Already marked ready to close
    if (conversationState.readyToClose && conversationState.closingAttempted) {
      return {
        shouldEnd: true,
        reason: "already_closing",
      };
    }
    
    // Exit intent detected in conversation state
    if (conversationState.exitIntentDetected) {
      const timeSinceExitIntent =
        Date.now() - (conversationState.exitIntentTimestamp || Date.now());
      
      // If exit intent detected and we've given a chance for final response
      if (timeSinceExitIntent > 5000 && conversationState.closingAttempted) {
        return {
          shouldEnd: true,
          reason: "exit_intent_after_closing_attempt",
        };
      }
    }
    
    // All questions answered and conversation complete
    const readyToClose = checkReadyToClose(conversationState);
    if (readyToClose.ready) {
      return {
        shouldEnd: true,
        reason: readyToClose.reason || "conversation_complete",
      };
    }
  }
  
  // If caller explicitly says goodbye after we've attempted closing
  if (
    callerResponse.toLowerCase().match(/^(?:bye|goodbye)/i) &&
    conversationState?.closingAttempted
  ) {
    return {
      shouldEnd: true,
      reason: "explicit_goodbye_after_closing",
    };
  }
  
  return {
    shouldEnd: false,
    reason: null,
  };
}

/**
 * Check if ready to close based on conversation state
 */
function checkReadyToClose(conversationState: ConversationState): {
  ready: boolean;
  reason: string | null;
} {
  // Exit intent already detected
  if (conversationState.exitIntentDetected) {
    return { ready: true, reason: "exit_intent_detected" };
  }
  
  // All questions answered
  if (
    conversationState.questionsAsked.length > 0 &&
    conversationState.questionsAsked.length === conversationState.questionsAnswered.length
  ) {
    const timeSinceLastAnswer =
      Date.now() - (conversationState.lastQuestionTimestamp || conversationState.startTime);
    if (timeSinceLastAnswer > 5000) {
      return { ready: true, reason: "all_questions_answered" };
    }
  }
  
  // Conversation idle
  const idleTime = Date.now() - conversationState.lastActivityTime;
  if (idleTime > 30000) {
    return { ready: true, reason: "idle_timeout" };
  }
  
  return { ready: false, reason: null };
}

/**
 * Process end-of-call logic
 * Returns the next message to send (check-in or closing) or null if should end
 */
export function processEndOfCall(
  callerResponse: string,
  conversationState?: ConversationState,
  options: EndOfCallOptions = {}
): {
  action: "check_in" | "close" | "continue" | "end";
  message: string | null;
  shouldEndCall: boolean;
} {
  // First, check if we should end immediately
  const endCheck = shouldEndCallNow(callerResponse, conversationState, options);
  
  if (endCheck.shouldEnd && conversationState?.closingAttempted) {
    // Already attempted closing and got confirmation - end call
    return {
      action: "end",
      message: null,
      shouldEndCall: true,
    };
  }
  
  // Check if we should ask if caller needs anything else
  if (
    !conversationState?.closingAttempted &&
    shouldCheckForAdditionalNeeds(conversationState, options)
  ) {
    return {
      action: "check_in",
      message: getAdditionalNeedsCheckIn(options),
      shouldEndCall: false,
    };
  }
  
  // Check for exit intent
  const exitIntent = detectExitIntent(callerResponse, conversationState);
  
  if (exitIntent.hasExitIntent) {
    // Get closing message
    const closingMessage = getClosingMessage(options);
    
    return {
      action: "close",
      message: closingMessage,
      shouldEndCall: false, // Don't end immediately, wait for final acknowledgment
    };
  }
  
  // Continue conversation
  return {
    action: "continue",
    message: null,
    shouldEndCall: false,
  };
}

