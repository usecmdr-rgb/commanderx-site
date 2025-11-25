/**
 * Aloha Call Handler
 * 
 * Main entry point for handling Aloha voice calls (inbound and outbound).
 * Integrates filler speech, voice settings, and conversational enhancements.
 * 
 * This module provides the middleware layer between STT → LLM → TTS that:
 * - Detects generation delays
 * - Starts filler speech when needed
 * - Cuts off filler when response is ready
 * - Handles interruptions
 * - Respects voice and display name settings
 */

import { CallResponseHandler, type CallContext } from "./filler-speech";
import { getAlohaVoice, getAlohaDisplayName } from "./profile";
import { enhanceConversation } from "./conversation";
import { generateSpeech, streamSpeech } from "./tts";
import { generateResponse, type ConversationContext } from "./response-generator";
import { ConversationLayersProcessor, type CallerInput, type LayerProcessingOptions } from "./conversation-layers";
import type { AlohaVoice } from "./voices";

/**
 * Call handler options
 */
export interface CallHandlerOptions {
  enableFillerSpeech?: boolean;
  fillerDelayThreshold?: number; // ms
  enableConversationEnhancement?: boolean;
  enableConversationLayers?: boolean; // NEW: Enable new conversation layers
  streaming?: boolean;
}

/**
 * Call turn result
 */
export interface CallTurnResult {
  response: string;
  enhancedResponse: string;
  audioStream?: ReadableStream;
  usedFiller: boolean;
  fillerText?: string;
  responseTime: number; // ms
  intent?: any; // Intent classification result
  shouldEndCall?: boolean; // Whether call should end
  conversationSummary?: any; // Conversation state summary
}

/**
 * Aloha Call Handler
 * 
 * Handles complete call turns with filler speech and enhancements
 */
export class AlohaCallHandler {
  private context: CallContext;
  private options: Required<CallHandlerOptions>;
  private responseHandler: CallResponseHandler | null = null;
  private conversationLayersProcessor: ConversationLayersProcessor | null = null;

  constructor(context: CallContext, options: CallHandlerOptions = {}) {
    this.context = context;
    this.options = {
      enableFillerSpeech: options.enableFillerSpeech ?? true,
      fillerDelayThreshold: options.fillerDelayThreshold ?? 300,
      enableConversationEnhancement: options.enableConversationEnhancement ?? true,
      enableConversationLayers: options.enableConversationLayers ?? true, // NEW
      streaming: options.streaming ?? true,
    };
  }

  /**
   * Initialize handler (loads voice and display name)
   */
  async initialize(): Promise<void> {
    // Ensure voice and display name are loaded
    if (!this.context.voice) {
      this.context.voice = await getAlohaVoice(this.context.userId);
    }
    if (!this.context.displayName) {
      this.context.displayName = await getAlohaDisplayName(this.context.userId);
    }

    // Initialize response handler
    if (this.options.enableFillerSpeech) {
      this.responseHandler = new CallResponseHandler(this.context);
    }

    // Initialize conversation layers processor
    if (this.options.enableConversationLayers) {
      this.conversationLayersProcessor = new ConversationLayersProcessor(this.context.callType);
    }
  }

  /**
   * Process a call turn: STT → LLM → TTS with filler speech, fallback phrases, and voice shaping
   * 
   * @param sttText - Transcribed caller speech
   * @param llmGenerator - Function that generates LLM response (calls /api/brain)
   * @param conversationContext - Optional conversation context for fallback detection
   * @param sttMetadata - Optional STT metadata for communication resilience
   * @returns Call turn result with response and audio
   */
  async processCallTurn(
    sttText: string,
    llmGenerator: (text: string) => Promise<string>,
    conversationContext?: Partial<ConversationContext>,
    sttMetadata?: { confidence?: number; hasInaudible?: boolean; isEmpty?: boolean }
  ): Promise<CallTurnResult> {
    const startTime = Date.now();

    // Ensure initialized
    if (!this.context.voice || !this.context.displayName) {
      await this.initialize();
    }

    let response: string;
    let usedFiller = false;
    let fillerText: string | undefined;
    let intent: any = null;
    let shouldEndCall = false;
    let conversationSummary: any = null;

    // NEW: Process through conversation layers if enabled
    if (this.options.enableConversationLayers && this.conversationLayersProcessor) {
      // First, get LLM response
      if (this.options.enableFillerSpeech && this.responseHandler) {
        const fillerResult = await this.responseHandler.handleCallTurn(sttText, llmGenerator);
        response = fillerResult.response;
        usedFiller = fillerResult.usedFiller;
        fillerText = fillerResult.fillerText;
      } else {
        response = await llmGenerator(sttText);
      }

      // Process through conversation layers
      const callerInput: CallerInput = {
        transcript: sttText,
        sttMetadata: sttMetadata ? {
          confidence: sttMetadata.confidence,
          hasInaudible: sttMetadata.hasInaudible,
          isEmpty: sttMetadata.isEmpty,
        } : undefined,
        hasSpeech: sttText.trim().length > 0,
      };

      const layerOptions: LayerProcessingOptions = {
        callType: this.context.callType,
        callerRushed: conversationContext?.responseTime !== undefined && conversationContext.responseTime < 500,
        purposeDelivered: conversationContext?.conversationState === "middle" || conversationContext?.conversationState === "closing",
        conversationContext: conversationContext as Record<string, any>,
      };

      const layerResult = await this.conversationLayersProcessor.processCallerInput(
        callerInput,
        response,
        layerOptions
      );

      // Use processed response from layers
      response = layerResult.response;
      intent = layerResult.intent;
      shouldEndCall = layerResult.shouldEndCall || false;
      conversationSummary = layerResult.conversationSummary;

      // If fallback message is provided, use it
      if (layerResult.fallbackMessage) {
        response = layerResult.fallbackMessage;
      }

      // If silence check-in is provided, use it
      if (layerResult.silenceCheckIn) {
        response = layerResult.silenceCheckIn;
      }

      // If end-of-call message is provided, use it
      if (layerResult.endOfCallMessage) {
        response = layerResult.endOfCallMessage;
        shouldEndCall = true;
      }
    } else {
      // Legacy processing path (backward compatibility)
      // Process with filler speech if enabled
      if (this.options.enableFillerSpeech && this.responseHandler) {
        const result = await this.responseHandler.handleCallTurn(sttText, llmGenerator);
        response = result.response;
        usedFiller = result.usedFiller;
        fillerText = result.fillerText;
      } else {
        // No filler speech, just generate response
        response = await llmGenerator(sttText);
      }

      // Build conversation context for response generation
      const context: ConversationContext = {
        agentName: this.context.displayName,
        businessName: conversationContext?.businessName,
        campaignReason: conversationContext?.campaignReason,
        phone: conversationContext?.phone,
        conversationState: conversationContext?.conversationState || "middle",
        ...conversationContext,
      };

      // Apply response generation layer: fallback phrases + voice shaping
      response = generateResponse(response, context, {
        useFallback: true,
        applyVoiceShaping: this.options.enableConversationEnhancement,
      });
    }

    // Apply legacy conversation enhancement if not using new layers
    let enhancedResponse = response;
    if (!this.options.enableConversationLayers && this.options.enableConversationEnhancement) {
      enhancedResponse = enhanceConversation(response, {
        addBackchannels: true,
        addPauses: true,
      });
    }

    // Generate TTS audio using voice profile
    let audioStream: ReadableStream | undefined;

    // Get voice profile for the user
    const voiceProfile = await getAlohaVoiceProfile(this.context.userId);

    if (this.options.streaming) {
      // Stream TTS for real-time playback using voice profile
      audioStream = await streamSpeech(enhancedResponse, voiceProfile);
    } else {
      // Generate complete audio (for non-streaming scenarios)
      const ttsResult = await generateSpeech({
        voiceProfile,
        text: enhancedResponse,
        streaming: false,
      });
      // Convert buffer to stream if needed
      if (ttsResult.audioBuffer) {
        audioStream = new ReadableStream({
          start(controller) {
            controller.enqueue(ttsResult.audioBuffer);
            controller.close();
          },
        });
      }
    }

    const responseTime = Date.now() - startTime;

    return {
      response,
      enhancedResponse,
      audioStream,
      usedFiller,
      fillerText,
      responseTime,
      intent,
      shouldEndCall,
      conversationSummary,
    };
  }

  /**
   * Handle caller interruption
   */
  handleInterruption(): void {
    if (this.responseHandler) {
      this.responseHandler.handleInterruption();
    }
    if (this.conversationLayersProcessor) {
      this.conversationLayersProcessor.handleInterruption();
    }
  }

  /**
   * Mark greeting as done (for conversation state tracking)
   */
  markGreetingDone(): void {
    if (this.conversationLayersProcessor) {
      this.conversationLayersProcessor.markGreetingDone();
    }
  }

  /**
   * Mark purpose as delivered (for outbound calls)
   */
  markPurposeDelivered(): void {
    if (this.conversationLayersProcessor) {
      this.conversationLayersProcessor.markPurposeDelivered();
    }
  }

  /**
   * Get conversation summary (for analytics/debugging)
   */
  getConversationSummary(): any {
    if (this.conversationLayersProcessor) {
      return this.conversationLayersProcessor.getConversationSummary();
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.responseHandler) {
      this.responseHandler.cleanup();
    }
  }
}

/**
 * Create Aloha call handler for a call
 * 
 * @param userId - User ID
 * @param callId - Optional call ID
 * @param callType - "inbound" or "outbound"
 * @param options - Handler options
 */
export async function createAlohaCallHandler(
  userId: string,
  callId: string | undefined,
  callType: "inbound" | "outbound",
  options?: CallHandlerOptions
): Promise<AlohaCallHandler> {
  const context: CallContext = {
    userId,
    callId,
    callType,
  };

  const handler = new AlohaCallHandler(context, options);
  await handler.initialize();

  return handler;
}

/**
 * Example integration with telephony system
 * 
 * This shows how to integrate the call handler with your telephony provider.
 * Adapt this to your specific telephony integration (Twilio, Vonage, etc.)
 */
export async function handleAlohaCallTurn(
  userId: string,
  callId: string,
  callType: "inbound" | "outbound",
  sttText: string,
  llmApiCall: (text: string) => Promise<string>
): Promise<{
  audioStream: ReadableStream;
  response: string;
  usedFiller: boolean;
}> {
  // Create handler
  const handler = await createAlohaCallHandler(userId, callId, callType, {
    enableFillerSpeech: true,
    enableConversationEnhancement: true,
    streaming: true,
  });

  try {
    // Process call turn
    const result = await handler.processCallTurn(sttText, llmApiCall);

    return {
      audioStream: result.audioStream!,
      response: result.enhancedResponse,
      usedFiller: result.usedFiller,
    };
  } finally {
    // Cleanup
    handler.cleanup();
  }
}

