/**
 * Aloha Response Generation Layer
 * 
 * Integrates intent analysis, fallback phrases, and voice shaping
 * to generate natural, contextually appropriate responses.
 * 
 * Flow:
 * 1. Evaluate conversation intent
 * 2. Pull fallback phrases when needed
 * 3. Apply Human Voice Rules
 * 4. Return final shaped response for TTS
 */

import { getFallbackPhrase, type FallbackScenario } from "./fallback-phrases";
import { shapeVoice, detectCallerTone, detectContentComplexity, type VoiceShapingOptions } from "./voice-shaping";

export interface ConversationContext {
  // STT/Intent detection
  sttConfidence?: number;
  callerEmotion?: string;
  intent?: string;
  responseTime?: number;
  
  // Conversation state
  conversationLength?: number;
  conversationState?: "opening" | "middle" | "closing" | "handling_issue";
  previousTurns?: number;
  
  // Campaign context
  agentName?: string;
  businessName?: string;
  campaignReason?: string;
  phone?: string;
  
  // Call metadata
  isRepetitiveQuestion?: boolean;
  isOffTopic?: boolean;
  requiresHuman?: boolean;
  hasKnowledgeGap?: boolean;
}

export interface ResponseGenerationOptions {
  useFallback?: boolean; // Whether to use fallback phrases
  applyVoiceShaping?: boolean; // Whether to apply voice shaping (default: true)
  fallbackScenario?: FallbackScenario; // Explicit scenario override
}

/**
 * Detect which fallback scenario applies based on conversation context
 */
export function detectFallbackScenario(context: ConversationContext): FallbackScenario | null {
  // Emergency - highest priority
  if (context.intent === "emergency" || context.callerEmotion === "emergency") {
    return "emergency";
  }

  // Personal loss
  if (context.callerEmotion === "grief" || context.intent === "personal_loss") {
    return "personal_loss";
  }

  // Low STT confidence scenarios
  if (context.sttConfidence !== undefined && context.sttConfidence < 0.6) {
    if (context.sttConfidence < 0.4) {
      return "bad_connection";
    }
    return "aloha_cant_hear";
  }

  // Emotional states
  if (context.callerEmotion === "angry" || context.intent === "angry") {
    return "angry";
  }
  if (context.callerEmotion === "upset" || context.callerEmotion === "frustrated") {
    return "upset";
  }
  if (context.callerEmotion === "confused" || context.intent === "confused") {
    return "confused";
  }
  if (context.callerEmotion === "emotional") {
    return "emotional";
  }

  // Knowledge gaps
  if (context.hasKnowledgeGap || context.intent === "unknown_info") {
    return "unknown_info";
  }

  // Human request
  if (context.requiresHuman || context.intent === "human_request") {
    return "human_request";
  }

  // Repetitive questions
  if (context.isRepetitiveQuestion) {
    return "repetitive_question";
  }

  // Off-topic
  if (context.isOffTopic || context.intent === "off_topic") {
    return "off_topic";
  }

  // Exit intent
  if (context.intent === "exit" || context.intent === "goodbye") {
    return "exit_intent";
  }

  // Busy caller
  if (context.intent === "busy" || context.responseTime && context.responseTime < 300) {
    return "busy";
  }

  // Silence detection (would come from telephony system)
  if (context.intent === "silence") {
    return "silence";
  }

  // Voicemail (would come from telephony system)
  if (context.intent === "voicemail") {
    return "voicemail";
  }

  // Unsubscribe
  if (context.intent === "unsubscribe" || context.intent === "opt_out") {
    return "unsubscribe";
  }

  // Callback request
  if (context.intent === "callback" || context.intent === "call_back") {
    return "callback";
  }

  // Wrong person
  if (context.intent === "wrong_person") {
    return "wrong_person";
  }

  // Graceful closing (conversation ending naturally)
  if (context.conversationState === "closing") {
    return "graceful_closing";
  }

  // No fallback needed
  return null;
}

/**
 * Generate response with fallback phrases and voice shaping
 */
export function generateResponse(
  baseResponse: string,
  context: ConversationContext,
  options: ResponseGenerationOptions = {}
): string {
  const {
    useFallback = true,
    applyVoiceShaping = true,
    fallbackScenario: explicitScenario,
  } = options;

  let response = baseResponse;

  // Step 1: Determine if we need a fallback phrase
  const scenario = explicitScenario || (useFallback ? detectFallbackScenario(context) : null);

  // Step 2: Apply fallback phrase if needed
  if (scenario) {
    const fallbackPhrase = getFallbackPhrase(scenario, {
      agentName: context.agentName,
      businessName: context.businessName,
      campaignReason: context.campaignReason,
      phone: context.phone,
    });

    // Combine fallback with base response
    // For some scenarios, fallback replaces the response
    const replaceScenarios: FallbackScenario[] = [
      "emergency",
      "exit_intent",
      "unsubscribe",
      "voicemail",
    ];

    if (replaceScenarios.includes(scenario)) {
      response = fallbackPhrase;
    } else {
      // For most scenarios, prepend or append fallback
      const prependScenarios: FallbackScenario[] = [
        "angry",
        "upset",
        "confused",
        "emotional",
        "personal_loss",
        "unknown_info",
        "human_request",
      ];

      if (prependScenarios.includes(scenario)) {
        response = `${fallbackPhrase} ${response}`;
      } else {
        // Append for others
        response = `${response} ${fallbackPhrase}`;
      }
    }
  }

  // Step 3: Apply voice shaping
  if (applyVoiceShaping) {
    const callerTone = detectCallerTone({
      sttConfidence: context.sttConfidence,
      callerEmotion: context.callerEmotion,
      responseTime: context.responseTime,
      conversationLength: context.conversationLength,
    });

    const contentComplexity = detectContentComplexity(response);

    const voiceOptions: VoiceShapingOptions = {
      callerTone,
      contentComplexity,
      conversationState: context.conversationState || "middle",
      enableDisfluencies: true,
      enableSoftening: true,
      enableGrounding: true,
    };

    response = shapeVoice(response, voiceOptions);
  }

  return response;
}

/**
 * Generate response for a specific scenario (for testing)
 */
export function generateScenarioResponse(
  scenario: FallbackScenario,
  context: ConversationContext,
  applyShaping: boolean = true
): string {
  const fallbackPhrase = getFallbackPhrase(scenario, {
    agentName: context.agentName,
    businessName: context.businessName,
    campaignReason: context.campaignReason,
    phone: context.phone,
  });

  if (applyShaping) {
    const callerTone = detectCallerTone({
      callerEmotion: context.callerEmotion,
    });

    return shapeVoice(fallbackPhrase, {
      callerTone,
      conversationState: context.conversationState || "middle",
    });
  }

  return fallbackPhrase;
}

