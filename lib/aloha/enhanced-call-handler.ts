/**
 * Enhanced Aloha Call Handler
 * 
 * Integrates state machine, tone presets, and personality rules
 * into the existing Aloha call handling flow.
 */

import {
  AlohaStateMachine,
  detectIntent,
  type AlohaCallContext,
  type CallState,
  type CallIntent,
} from "./state-machine";
import {
  getTonePreset,
  getDefaultTonePreset,
  applyTonePreset,
  getTTSSettingsFromPreset,
  type TonePresetKey,
  type TonePreset,
} from "./tone-presets";
import {
  applyPersonalityRules,
  type PersonalityRuleContext,
} from "./personality-rules";
import {
  getAlohaDisplayName,
  getAlohaProfile,
  getAlohaVoiceProfile,
} from "./profile";
import { getBusinessContext } from "@/lib/business-context";
import { detectScenario, type ScenarioContext } from "./scenario-detection";
import { enhancePromptWithScenario } from "./scenario-handler";

export interface EnhancedCallHandlerOptions {
  userId: string;
  callId?: string;
  callType: "inbound" | "outbound";
  campaignId?: string;
  campaignPurpose?: string;
  tonePreset?: TonePresetKey;
}

export interface EnhancedCallTurnInput {
  sttText: string;
  sttConfidence?: number;
  audioQuality?: number;
  hasBackgroundNoise?: boolean;
  hasEcho?: boolean;
  callLatency?: number;
  isVoicemail?: boolean;
  multipleSpeakers?: boolean;
}

export interface EnhancedCallTurnResult {
  response: string;
  state: CallState;
  shouldExit: boolean;
  shouldStopTTS: boolean;
  ttsSettings?: {
    rate?: number;
    pitch?: number;
  };
  context: AlohaCallContext;
}

/**
 * Enhanced Call Handler with State Machine, Tone, and Personality
 */
export class EnhancedAlohaCallHandler {
  private stateMachine: AlohaStateMachine;
  private tonePreset: TonePreset;
  private options: EnhancedCallHandlerOptions;
  private businessName?: string;

  constructor(options: EnhancedCallHandlerOptions) {
    this.options = options;

    // Initialize state machine
    const initialState: Partial<AlohaCallContext> = {
      userId: options.userId,
      callId: options.callId,
      callType: options.callType,
      campaignId: options.campaignId,
      campaignPurpose: options.campaignPurpose,
    };
    this.stateMachine = new AlohaStateMachine(initialState);

    // Initialize tone preset (will be loaded from profile or use default)
    this.tonePreset = getDefaultTonePreset();
  }

  /**
   * Initialize handler (loads tone preset from voice profile)
   */
  async initialize(): Promise<void> {
    // Load tone preset from voice profile
    // If tonePreset is explicitly provided in options, use it (for testing/override)
    if (this.options.tonePreset) {
      this.tonePreset = getTonePreset(this.options.tonePreset);
    } else {
      // Load voice profile and use its tone preset
      const voiceProfile = await getAlohaVoiceProfile(this.options.userId);
      this.tonePreset = getTonePreset(voiceProfile.tonePreset);
    }

    // Load business name for context
    try {
      const businessContext = await getBusinessContext(this.options.userId);
      this.businessName = businessContext?.profile.businessName || undefined;
    } catch (error) {
      console.error("Error loading business context:", error);
    }

    // Initial state transition: INIT → GREETING
    this.stateMachine.transitionTo("GREETING", "Call connected");
  }

  /**
   * Process a call turn with all layers applied
   */
  async processCallTurn(
    input: EnhancedCallTurnInput,
    llmGenerator: (prompt: string, context?: any) => Promise<string>
  ): Promise<EnhancedCallTurnResult> {
    const context = this.stateMachine.getContext();
    const currentState = context.state;

    // Detect intent from user utterance
    const intent = detectIntent(input.sttText);

    // Detect scenario (audio issues, emotional state, etc.)
    const scenarioContext: ScenarioContext = {
      sttConfidence: input.sttConfidence,
      audioQuality: input.audioQuality,
      hasBackgroundNoise: input.hasBackgroundNoise,
      hasEcho: input.hasEcho,
      callLatency: input.callLatency,
      isVoicemail: input.isVoicemail,
      multipleSpeakers: input.multipleSpeakers,
    };

    const scenario = detectScenario(scenarioContext, input.sttText);

    // Update state machine with interaction
    this.stateMachine.updateFromInteraction(input.sttText, intent, {
      isAngry: scenario.category === "emotional_social" && scenario.type === "angry",
      isConfused: context.isCallerConfused || scenario.category === "caller_behavior" && scenario.type === "silence_pause",
      isBusy: context.isCallerBusy,
      isUpset: scenario.category === "emotional_social" && (scenario.type === "upset_frustrated" || scenario.type === "crying"),
      hasConnectionIssue: scenario.category === "audio_technical",
      sttConfidence: input.sttConfidence,
    });

    // Build enhanced prompt with state guidance and scenario context
    const stateGuidance = this.stateMachine.getStateGuidance();
    let basePrompt = `Current call state: ${currentState}\n${stateGuidance}\n\n`;

    // Add scenario context if needed
    if (scenario.category !== "normal") {
      basePrompt = enhancePromptWithScenario(basePrompt, scenario);
    }

    // Add state-specific instructions
    if (currentState === "GREETING") {
      basePrompt += "\nDeliver a warm greeting. Introduce yourself.";
    } else if (currentState === "PURPOSE_DELIVERY" && !context.hasDeliveredPurpose) {
      basePrompt += "\nExplain why you're calling. Be clear about the purpose.";
    } else if (currentState === "CLARIFICATION") {
      basePrompt += "\nAsk for clarification. Be patient and use simple language.";
    } else if (currentState === "EMOTIONAL_SUPPORT") {
      basePrompt += "\nProvide empathetic support. Acknowledge emotions and remain calm.";
    } else if (currentState === "CLOSING") {
      basePrompt += "\nClose the call politely. Thank the caller and provide a warm sign-off.";
    }

    // Generate base response from LLM
    const baseResponse = await llmGenerator(input.sttText, {
      state: currentState,
      intent,
      scenario: scenario.category,
      promptEnhancement: basePrompt,
    });

    // Apply tone preset
    const toneEnhanced = applyTonePreset(baseResponse, this.tonePreset, {
      isFirstResponse: currentState === "GREETING",
      isClarification: currentState === "CLARIFICATION",
      isClosing: currentState === "CLOSING",
    });

    // Apply personality rules
    const displayName = await getAlohaDisplayName(this.options.userId);
    const personalityContext: PersonalityRuleContext = {
      state: currentState,
      tonePreset: this.tonePreset,
      callContext: this.stateMachine.getContext(),
      isFirstResponse: currentState === "GREETING",
      isClosing: currentState === "CLOSING",
      isClarification: currentState === "CLARIFICATION",
      callerName: context.callerName,
      businessName: this.businessName,
    };

    const finalResponse = applyPersonalityRules(toneEnhanced, personalityContext);

    // Check if we should exit
    const shouldExit =
      currentState === "CLOSING" ||
      currentState === "TERMINATED" ||
      context.exitRequested ||
      intent === "unsubscribe" ||
      intent === "emergency";

    // Check if we should stop TTS (barge-in)
    const shouldStopTTS =
      scenario.category === "caller_behavior" &&
        (scenario.type === "interruption" || scenario.type === "talking_over");

    // Get TTS settings from tone preset
    const ttsSettings = getTTSSettingsFromPreset(this.tonePreset);

    // Update state based on response
    if (currentState === "GREETING") {
      this.stateMachine.transitionTo("IDENTIFICATION", "Greeting delivered");
    } else if (currentState === "IDENTIFICATION" && context.callerIdentified) {
      if (this.options.callType === "outbound" && !context.hasDeliveredPurpose) {
        this.stateMachine.transitionTo("PURPOSE_DELIVERY", "Caller identified, delivering purpose");
      } else {
        this.stateMachine.transitionTo("INTERACTION", "Caller identified");
      }
    } else if (currentState === "PURPOSE_DELIVERY") {
      this.stateMachine.markPurposeDelivered();
      this.stateMachine.transitionTo("INTERACTION", "Purpose delivered");
    }

    return {
      response: finalResponse,
      state: this.stateMachine.getContext().state,
      shouldExit,
      shouldStopTTS,
      ttsSettings,
      context: this.stateMachine.getContext(),
    };
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return this.stateMachine.getContext().state;
  }

  /**
   * Get current context
   */
  getContext(): AlohaCallContext {
    return this.stateMachine.getContext();
  }

  /**
   * Mark caller as identified
   */
  markCallerIdentified(name?: string): void {
    this.stateMachine.markCallerIdentified(name);
  }

  /**
   * Request exit
   */
  requestExit(): void {
    this.stateMachine.requestExit();
  }

  /**
   * Request human follow-up
   */
  requestHumanFollowup(): void {
    this.stateMachine.requestHumanFollowup();
  }
}

