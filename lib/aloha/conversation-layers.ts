/**
 * Aloha Conversation Layers Integration
 * 
 * Integrates all conversation layers:
 * - Intent Classification
 * - Voice Dynamics
 * - Emotional Intelligence
 * - Communication Resilience
 * - Conversation State Management
 * - End-of-Call Intelligence
 * 
 * This is the main orchestration layer that processes caller input
 * and generates contextually appropriate responses.
 */

import { classifyIntent, type IntentClassification } from "./intent-classification";
import { applyVoiceDynamics } from "./voice-dynamics";
import { applyEmotionalIntelligence, needsEmpathyStatement } from "./emotional-intelligence";
import {
  createCommunicationState,
  detectBadConnection,
  updateSilenceState,
  shouldCheckInForSilence,
  detectTalkativeCaller,
  getBadConnectionFallback,
  shouldEndCallDueToBadConnection,
  type CommunicationState,
  type STTMetadata,
} from "./communication-resilience";
import {
  createConversationState,
  markGreetingDone,
  markPurposeDelivered,
  updateIntent,
  checkEmpathyNeeded,
  markEmpathyProvided,
  trackFallbackAttempt,
  checkReadyToClose,
  incrementTurnCount,
  type ConversationState,
} from "./conversation-state";
import {
  processEndOfCall,
  detectExitIntent,
  type EndOfCallOptions,
} from "./end-of-call";
import { getResponseSnippet } from "./response-snippets";

export interface CallerInput {
  transcript: string;
  sttMetadata?: STTMetadata;
  hasSpeech?: boolean; // For silence detection
}

export interface LayerProcessingOptions {
  callType: "inbound" | "outbound";
  callerRushed?: boolean;
  purposeDelivered?: boolean;
  conversationContext?: Record<string, any>;
}

export interface LayerProcessingResult {
  response: string;
  intent: IntentClassification;
  shouldUseFallback: boolean;
  fallbackMessage?: string;
  silenceCheckIn?: string;
  shouldEndCall: boolean;
  endOfCallMessage?: string;
  conversationSummary?: any;
  metadata?: {
    usedEmpathy?: boolean;
    voiceShaped?: boolean;
    emotionalAdjustments?: boolean;
    shortenedResponse?: boolean;
  };
}

/**
 * Main conversation layers processor
 * Processes caller input through all layers and generates response
 */
export class ConversationLayersProcessor {
  private conversationState: ConversationState;
  private communicationState: CommunicationState;
  private callType: "inbound" | "outbound";

  constructor(callType: "inbound" | "outbound" = "inbound") {
    this.callType = callType;
    this.conversationState = createConversationState(callType);
    this.communicationState = createCommunicationState();
  }

  /**
   * Process caller input through all layers
   */
  async processCallerInput(
    input: CallerInput,
    llmResponse: string, // Response from LLM
    options: LayerProcessingOptions = {}
  ): Promise<LayerProcessingResult> {
    const { transcript, sttMetadata, hasSpeech } = input;
    
    // Increment turn count
    incrementTurnCount(this.conversationState);
    
    // Update silence state
    updateSilenceState(this.communicationState, hasSpeech ?? true);
    
    // 1. INTENT CLASSIFICATION
    const intent = classifyIntent(transcript);
    updateIntent(this.conversationState, intent);
    
    // Track question if it's a question
    if (intent.primaryIntent && typeof intent.primaryIntent === "string" && 
        (intent.primaryIntent.includes("pricing") || 
         intent.primaryIntent.includes("availability") ||
         intent.primaryIntent.includes("services") ||
         intent.primaryIntent.includes("appointment"))) {
      trackQuestionAsked(this.conversationState, transcript);
    }
    
    // 2. COMMUNICATION RESILIENCE - Bad Connection Detection
    let shouldUseFallback = false;
    let fallbackMessage: string | undefined;
    
    if (sttMetadata) {
      const badConnection = detectBadConnection(sttMetadata, this.communicationState);
      
      if (badConnection.shouldUseFallback) {
        shouldUseFallback = true;
        fallbackMessage = getBadConnectionFallback(badConnection.severity);
        
        // Check if too many bad connection attempts - consider ending call
        if (shouldEndCallDueToBadConnection(this.communicationState)) {
          return {
            response: getResponseSnippet("exit_if_connection_bad").text,
            intent,
            shouldUseFallback: true,
            fallbackMessage: getResponseSnippet("exit_if_connection_bad").text,
            shouldEndCall: true,
            endOfCallMessage: getResponseSnippet("exit_if_connection_bad").text,
          };
        }
        
        // Return fallback message instead of processing further
        return {
          response: fallbackMessage,
          intent,
          shouldUseFallback: true,
          fallbackMessage,
          shouldEndCall: false,
        };
      }
    }
    
    // 3. SILENCE HANDLING
    const silenceCheck = shouldCheckInForSilence(this.communicationState);
    if (silenceCheck.shouldCheckIn && silenceCheck.message) {
      // Silence is tracked internally by communication state (checkInsUsed)
      return {
        response: silenceCheck.message,
        intent,
        shouldUseFallback: false,
        silenceCheckIn: silenceCheck.message,
        shouldEndCall: silenceCheck.checkInType === "long",
      };
    }
    
    // 4. TALKATIVE CALLER DETECTION
    const talkativeCheck = detectTalkativeCaller(transcript, this.communicationState);
    if (talkativeCheck.shouldRedirect && talkativeCheck.redirectMessage) {
      // Use redirect message instead of LLM response
      return {
        response: talkativeCheck.redirectMessage,
        intent,
        shouldUseFallback: false,
        shouldEndCall: false,
      };
    }
    
    // 5. CLARIFICATION HANDLING
    if (intent.requiresClarification) {
      const clarificationResult = trackFallbackAttempt(this.conversationState, "clarification");
      
      if (clarificationResult.canUseFallback) {
        const clarificationSnippet = getResponseSnippet("clarification_request");
        return {
          response: clarificationSnippet.text,
          intent,
          shouldUseFallback: true,
          fallbackMessage: clarificationSnippet.text,
          shouldEndCall: false,
        };
      }
    }
    
    // 6. END-OF-CALL PROCESSING
    const endOfCallOptions: EndOfCallOptions = {
      callerWasUpset: this.conversationState.empathyProvided,
      connectionWasBad: this.communicationState.badConnectionDetected,
      emotionalState: intent.emotionalState,
      conversationState: this.conversationState,
    };
    
    const endOfCallResult = processEndOfCall(
      transcript,
      this.conversationState,
      endOfCallOptions
    );
    
    if (endOfCallResult.action === "end") {
      return {
        response: "",
        intent,
        shouldUseFallback: false,
        shouldEndCall: true,
        conversationSummary: this.getConversationSummary(),
      };
    }
    
    if (endOfCallResult.action === "check_in") {
      return {
        response: endOfCallResult.message || "",
        intent,
        shouldUseFallback: false,
        shouldEndCall: false,
      };
    }
    
    if (endOfCallResult.action === "close") {
      return {
        response: endOfCallResult.message || "",
        intent,
        shouldUseFallback: false,
        shouldEndCall: false,
        endOfCallMessage: endOfCallResult.message || undefined,
      };
    }
    
    // 7. EMOTIONAL INTELLIGENCE
    let processedResponse = llmResponse;
    const needsEmpathy = checkEmpathyNeeded(this.conversationState, intent);
    
    if (needsEmpathy || needsEmpathyStatement(intent.emotionalState, llmResponse)) {
      processedResponse = applyEmotionalIntelligence(processedResponse, {
        emotionalState: intent.emotionalState,
        callerRushed: options.callerRushed,
        callerConfused: intent.emotionalState === "confused",
        needsEmpathy,
      });
      
      markEmpathyProvided(this.conversationState);
    }
    
    // 8. VOICE DYNAMICS
    processedResponse = applyVoiceDynamics(processedResponse, {
      emotion: intent.emotionalState,
      context: this.getVoiceContext(),
      callerRushed: options.callerRushed,
      callerConfused: intent.emotionalState === "confused",
      intensity: "moderate",
    });
    
    // 9. SHORTEN RESPONSE IF RUSHED
    let shortenedResponse = false;
    if (options.callerRushed || intent.emotionalState === "stressed") {
      const originalLength = processedResponse.length;
      processedResponse = processedResponse.substring(0, 200); // Simple truncation
      if (processedResponse.length < originalLength) {
        shortenedResponse = true;
        processedResponse += "...";
      }
    }
    
    // Mark question as answered if response is provided
    if (intent.primaryIntent && processedResponse && processedResponse.length > 10) {
      trackQuestionAnswered(this.conversationState, transcript);
    }
    
    return {
      response: processedResponse,
      intent,
      shouldUseFallback: false,
      shouldEndCall: false,
      metadata: {
        usedEmpathy: needsEmpathy,
        voiceShaped: true,
        emotionalAdjustments: needsEmpathy,
        shortenedResponse,
      },
    };
  }
  
  /**
   * Get voice context based on conversation phase
   */
  private getVoiceContext(): "greeting" | "question_answering" | "clarification" | "closing" | "normal" {
    switch (this.conversationState.phase) {
      case "greeting":
        return "greeting";
      case "clarification":
        return "clarification";
      case "closing":
        return "closing";
      case "active_conversation":
        return "question_answering";
      default:
        return "normal";
    }
  }
  
  /**
   * Mark greeting as done
   */
  markGreetingDone(): void {
    markGreetingDone(this.conversationState);
  }
  
  /**
   * Mark purpose as delivered
   */
  markPurposeDelivered(): void {
    markPurposeDelivered(this.conversationState);
  }
  
  /**
   * Get conversation summary
   */
  getConversationSummary() {
    const summary = {
      duration: Date.now() - this.conversationState.startTime,
      turnCount: this.conversationState.turnCount,
      phase: this.conversationState.phase,
      questionsAsked: this.conversationState.questionsAsked.length,
      questionsAnswered: this.conversationState.questionsAnswered.length,
      empathyProvided: this.conversationState.empathyProvided,
      exitIntentDetected: this.conversationState.exitIntentDetected,
      needsHumanCallback: this.conversationState.needsHumanCallback,
      fallbackAttempts: { ...this.conversationState.fallbackAttempts },
      badConnectionDetected: this.communicationState.badConnectionDetected,
    };
    return summary;
  }
  
  /**
   * Handle interruption
   */
  handleInterruption(): void {
    // Reset silence state
    this.communicationState.silenceState.lastSpeechTime = Date.now();
    this.communicationState.silenceState.currentSilenceDuration = 0;
  }
}

