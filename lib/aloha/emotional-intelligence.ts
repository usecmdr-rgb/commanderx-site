/**
 * Aloha Emotional Intelligence Layer
 * 
 * Provides empathetic response shaping based on detected emotional state.
 * This is a soft layer that modifies phrasing and tone, not content.
 * 
 * Emotional states handled:
 * - Upset → gentle tone + acknowledgement
 * - Angry → de-escalation + neutral clarity
 * - Stressed → slow pace + reassurance
 * - Confused → more explicit guidance
 * - Rushed → short, efficient responses
 * - Happy → warm and upbeat
 */

import type { EmotionalState } from "./intent-classification";
import { getResponseSnippet, type ResponseSnippetId } from "./response-snippets";

export interface EmotionalIntelligenceOptions {
  emotionalState: EmotionalState;
  callerRushed?: boolean;
  callerConfused?: boolean;
  currentResponse?: string;
  needsEmpathy?: boolean;
}

/**
 * Get empathy snippet for emotional state
 */
function getEmpathySnippet(emotionalState: EmotionalState): ResponseSnippetId | null {
  switch (emotionalState) {
    case "angry":
      return "angry_caller_deescalate";
    case "upset":
      return "upset_caller_acknowledge";
    case "frustrated":
      return "frustrated_caller_help";
    case "confused":
      return "confused_caller_repair";
    case "stressed":
      return "empathy_general";
    default:
      return null;
  }
}

/**
 * Apply emotional tone adjustments to response
 */
function applyEmotionalTone(
  response: string,
  emotionalState: EmotionalState
): string {
  let adjusted = response;

  switch (emotionalState) {
    case "upset":
      // Gentle tone + acknowledgement
      if (!adjusted.toLowerCase().includes("understand") && !adjusted.toLowerCase().includes("sorry")) {
        adjusted = `I understand this is difficult. ${adjusted}`;
      }
      // Use softer language
      adjusted = adjusted.replace(/\bcan't\b/gi, "won't be able to");
      adjusted = adjusted.replace(/\bI can't\b/gi, "I'm not able to");
      break;

    case "angry":
      // De-escalation + neutral clarity
      if (!adjusted.toLowerCase().includes("hear") && !adjusted.toLowerCase().includes("understand")) {
        adjusted = `I hear you. ${adjusted}`;
      }
      // Avoid confrontational language
      adjusted = adjusted.replace(/\bNo\b(?!,)/g, "I understand, but no");
      adjusted = adjusted.replace(/\bYou're wrong\b/gi, "I see it differently");
      adjusted = adjusted.replace(/\bYou need to\b/gi, "It would help if you");
      break;

    case "stressed":
      // Slow pace + reassurance
      if (!adjusted.toLowerCase().includes("no worries") && !adjusted.toLowerCase().includes("don't worry")) {
        if (Math.random() < 0.4) {
          adjusted = `No worries. ${adjusted}`;
        }
      }
      // Reassuring phrases
      adjusted = adjusted.replace(/\bI'll help\b/gi, "I'll make sure to help");
      adjusted = adjusted.replace(/\bLet me\b/gi, "I'll take care of this");
      break;

    case "confused":
      // More explicit guidance
      if (!adjusted.toLowerCase().includes("let me explain") && !adjusted.toLowerCase().includes("to clarify")) {
        if (Math.random() < 0.3) {
          adjusted = `Let me explain that clearly. ${adjusted}`;
        }
      }
      // Break down complex instructions
      adjusted = adjusted.replace(/(\w+), (\w+), and (\w+)/g, "$1, $2, and $3");
      // Add clarifying phrases
      adjusted = adjusted.replace(/\bIt\b(?!\s+(?:is|was|will|can|should))/, "This");
      break;

    case "frustrated":
      // Acknowledge frustration + offer solution
      if (!adjusted.toLowerCase().includes("frustrating") && !adjusted.toLowerCase().includes("understand")) {
        adjusted = `I understand this is frustrating. ${adjusted}`;
      }
      break;

    case "happy":
      // Warm and upbeat
      if (!adjusted.toLowerCase().includes("great") && !adjusted.toLowerCase().includes("wonderful")) {
        if (Math.random() < 0.3) {
          adjusted = `That's great! ${adjusted}`;
        }
      }
      // Match positive energy
      adjusted = adjusted.replace(/\bgood\b/gi, (match, offset) => {
        if (offset < 50) return "excellent";
        return match;
      });
      break;
  }

  return adjusted;
}

/**
 * Apply pacing adjustments based on emotional state
 */
function applyPacingAdjustments(
  response: string,
  emotionalState: EmotionalState,
  callerRushed?: boolean,
  callerConfused?: boolean
): string {
  let adjusted = response;

  // If caller is rushed, make response more concise
  if (callerRushed || emotionalState === "stressed") {
    // Remove filler words
    adjusted = adjusted.replace(/\b(I|We) (think|believe) that\b/gi, "$1");
    adjusted = adjusted.replace(/\bfor your information\b/gi, "");
    adjusted = adjusted.replace(/\bas I mentioned\b/gi, "");
    // Shorten phrases
    adjusted = adjusted.replace(/\bI can definitely help\b/gi, "I can help");
    adjusted = adjusted.replace(/\bI will certainly\b/gi, "I'll");
  }

  // If caller is confused, add more breaks
  if (callerConfused || emotionalState === "confused") {
    // Add pauses between concepts
    adjusted = adjusted.replace(/(\w+)(\s+)(first|second|third|next|then|finally)/gi, "$1…$2$3");
    // Add numbering if listing things
    if (adjusted.includes(",") && adjusted.split(",").length > 2) {
      adjusted = adjusted.replace(/([^,]+),([^,]+),/g, "$1, $2, and");
    }
  }

  // If caller is stressed, slow down with pauses
  if (emotionalState === "stressed") {
    adjusted = adjusted.replace(/\.(\s+)/g, "…$1");
  }

  return adjusted;
}

/**
 * Prepend empathy statement if needed
 */
function prependEmpathyStatement(
  response: string,
  emotionalState: EmotionalState,
  needsEmpathy?: boolean
): string {
  if (!needsEmpathy && emotionalState === "neutral") {
    return response;
  }

  const empathySnippet = getEmpathySnippet(emotionalState);
  if (!empathySnippet) {
    return response;
  }

  // Check if response already contains empathy
  const responseLower = response.toLowerCase();
  if (
    responseLower.includes("understand") ||
    responseLower.includes("sorry") ||
    responseLower.includes("hear") ||
    responseLower.includes("appreciate")
  ) {
    return response; // Already has empathy
  }

  // Get empathy snippet
  const snippet = getResponseSnippet(empathySnippet);
  return `${snippet.text}. ${response}`;
}

/**
 * Main function: Apply emotional intelligence to response
 */
export function applyEmotionalIntelligence(
  response: string,
  options: EmotionalIntelligenceOptions
): string {
  if (!response || response.trim().length === 0) {
    return response;
  }

  const {
    emotionalState,
    callerRushed = false,
    callerConfused = false,
    needsEmpathy = false,
  } = options;

  let enhanced = response;

  // 1. Apply emotional tone adjustments
  enhanced = applyEmotionalTone(enhanced, emotionalState);

  // 2. Apply pacing adjustments
  enhanced = applyPacingAdjustments(enhanced, emotionalState, callerRushed, callerConfused);

  // 3. Prepend empathy statement if needed
  if (needsEmpathy || (emotionalState !== "neutral" && emotionalState !== "happy")) {
    enhanced = prependEmpathyStatement(enhanced, emotionalState, needsEmpathy);
  }

  // Clean up any double spaces or punctuation
  enhanced = enhanced.replace(/\s+/g, " ").trim();
  enhanced = enhanced.replace(/\.\.+/g, ".");

  return enhanced;
}

/**
 * Determine if empathy is needed based on emotional state and response content
 */
export function needsEmpathyStatement(
  emotionalState: EmotionalState,
  responseContent: string
): boolean {
  // Always need empathy for negative emotional states
  if (
    emotionalState === "angry" ||
    emotionalState === "upset" ||
    emotionalState === "frustrated"
  ) {
    return true;
  }

  // Check if response already contains empathy
  const lower = responseContent.toLowerCase();
  if (
    lower.includes("understand") ||
    lower.includes("sorry") ||
    lower.includes("hear") ||
    lower.includes("appreciate")
  ) {
    return false; // Already has empathy
  }

  return false; // Default: no empathy needed
}

