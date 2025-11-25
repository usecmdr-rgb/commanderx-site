/**
 * Aloha Scenario Handler
 * 
 * Integrates scenario detection with call handling, providing
 * scenario-aware responses and behavior adjustments.
 */

import {
  detectScenario,
  requiresGracefulExit,
  getRetryCount,
  type ScenarioContext,
  type DetectedScenario,
} from "./scenario-detection";
import {
  getFallbackResponse,
  getRandomFallbackResponse,
  type FallbackResponse,
} from "./fallback-responses";
import { getBusinessContext } from "@/lib/business-context";
import { getAlohaDisplayName } from "./profile";

export interface ScenarioHandlerContext {
  userId: string;
  transcript: string;
  audioMetrics?: {
    sttConfidence?: number;
    audioQuality?: number;
    hasBackgroundNoise?: boolean;
    hasEcho?: boolean;
    callLatency?: number;
    isVoicemail?: boolean;
    multipleSpeakers?: boolean;
  };
  behaviorMetrics?: {
    interruptionCount?: number;
    silenceDuration?: number;
    speechRate?: number;
    topicSwitches?: number;
    unrelatedQuestions?: number;
  };
  callContext?: {
    businessHours?: boolean;
    requestedService?: string;
    requestedInfo?: string;
  };
}

export interface ScenarioHandlingResult {
  scenario: DetectedScenario;
  shouldUseFallback: boolean;
  fallbackResponse?: string;
  shouldExit: boolean;
  retryCount: number;
  shouldLogKnowledgeGap: boolean;
  shouldOfferCallback: boolean;
  outcomeOverride?: string;
}

/**
 * Handle scenario detection and provide appropriate response guidance
 */
export async function handleScenario(
  context: ScenarioHandlerContext
): Promise<ScenarioHandlingResult> {
  // Build scenario context
  const scenarioContext: ScenarioContext = {
    sttConfidence: context.audioMetrics?.sttConfidence,
    audioQuality: context.audioMetrics?.audioQuality,
    hasBackgroundNoise: context.audioMetrics?.hasBackgroundNoise,
    hasEcho: context.audioMetrics?.hasEcho,
    callLatency: context.audioMetrics?.callLatency,
    isVoicemail: context.audioMetrics?.isVoicemail,
    multipleSpeakers: context.audioMetrics?.multipleSpeakers,
    interruptionCount: context.behaviorMetrics?.interruptionCount,
    silenceDuration: context.behaviorMetrics?.silenceDuration,
    speechRate: context.behaviorMetrics?.speechRate,
    topicSwitches: context.behaviorMetrics?.topicSwitches,
    unrelatedQuestions: context.behaviorMetrics?.unrelatedQuestions,
    businessHours: context.callContext?.businessHours,
    requestedService: context.callContext?.requestedService,
    requestedInfo: context.callContext?.requestedInfo,
  };

  // Detect scenario
  const scenario = detectScenario(scenarioContext, context.transcript);

  // Check if graceful exit is required
  const shouldExit = requiresGracefulExit(scenario);

  // Get retry count
  const retryCount = getRetryCount(scenario);

  // Get fallback response if needed
  let fallbackResponse: string | undefined;
  let shouldUseFallback = false;
  let shouldLogKnowledgeGap = false;
  let shouldOfferCallback = false;
  let outcomeOverride: string | undefined;

  // Determine if we should use fallback response
  // Use fallback for high-severity scenarios or when immediate action is required
  if (
    scenario.severity === "high" ||
    scenario.requiresImmediateAction ||
    scenario.category !== "normal"
  ) {
    shouldUseFallback = true;

    // Get business context for fallback response placeholders
    let businessContext;
    try {
      businessContext = await getBusinessContext(context.userId);
    } catch (error) {
      console.error("Error fetching business context for scenario handler:", error);
    }

    const displayName = await getAlohaDisplayName(context.userId);
    const businessName = businessContext?.profile.businessName || "our business";
    const phone = businessContext?.profile.contactPhone || "our main number";
    const hours = businessContext?.profile.hours || "our regular business hours";

    const fallback = getFallbackResponse(scenario, {
      displayName,
      businessName,
      phone,
      hours,
    });

    fallbackResponse = getRandomFallbackResponse(scenario, {
      displayName,
      businessName,
      phone,
      hours,
    });

    shouldLogKnowledgeGap = fallback.shouldLogKnowledgeGap || false;
    shouldOfferCallback = fallback.shouldOfferCallback || false;

    // Set outcome override for specific scenarios
    if (scenario.category === "audio_technical") {
      outcomeOverride = "audio_issue";
    } else if (scenario.category === "emotional_social" && scenario.type === "emergency") {
      outcomeOverride = "emergency_redirect";
    } else if (
      scenario.category === "business_logic" &&
      scenario.type === "unsubscribe_dnc"
    ) {
      outcomeOverride = "opt_out";
    }
  }

  return {
    scenario,
    shouldUseFallback,
    fallbackResponse,
    shouldExit,
    retryCount,
    shouldLogKnowledgeGap,
    shouldOfferCallback,
    outcomeOverride,
  };
}

/**
 * Check if scenario should trigger immediate TTS stop (for barge-in)
 */
export function shouldStopTTS(scenario: DetectedScenario): boolean {
  if (scenario.category === "caller_behavior") {
    if (scenario.type === "interruption" || scenario.type === "talking_over") {
      return true;
    }
  }
  return false;
}

/**
 * Enhance LLM prompt with scenario context
 */
export function enhancePromptWithScenario(
  basePrompt: string,
  scenario: DetectedScenario
): string {
  if (scenario.category === "normal") {
    return basePrompt; // No enhancement needed for normal scenarios
  }

  let scenarioContext = "\n\nCURRENT CALL SCENARIO DETECTED:\n";
  scenarioContext += `- Category: ${scenario.category}\n`;
  if (scenario.type) {
    scenarioContext += `- Type: ${scenario.type}\n`;
  }
  scenarioContext += `- Severity: ${scenario.severity}\n`;
  scenarioContext += `- Requires immediate action: ${scenario.requiresImmediateAction}\n\n`;

  scenarioContext += "IMPORTANT: Adjust your response based on this scenario:\n";

  switch (scenario.category) {
    case "audio_technical":
      scenarioContext +=
        "- Use shorter, clearer responses\n- Offer callback if audio quality is poor\n- Be patient with repetition requests\n";
      break;
    case "caller_behavior":
      scenarioContext +=
        "- If interruption detected, stop immediately and listen\n- Be patient with pauses\n- Adjust speech rate requests appropriately\n";
      break;
    case "emotional_social":
      scenarioContext +=
        "- Use empathetic, calm tone\n- Never escalate\n- For emergencies, redirect immediately to 911\n";
      break;
    case "identity_issues":
      scenarioContext +=
        "- Keep responses general\n- Don't reveal sensitive information\n- For children, request parent/guardian\n";
      break;
    case "business_logic":
      scenarioContext +=
        "- For opt-outs, comply immediately\n- For legal concerns, redirect to professionals\n- Log knowledge gaps when information is missing\n";
      break;
  }

  return basePrompt + scenarioContext;
}
