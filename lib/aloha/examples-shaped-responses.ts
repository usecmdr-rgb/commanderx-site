/**
 * Examples of Final Shaped Responses
 * 
 * This file demonstrates how responses are transformed through the
 * voice shaping and fallback phrase system before TTS.
 * 
 * These examples show the BEFORE and AFTER of the response generation pipeline.
 */

import { generateResponse, type ConversationContext } from "./response-generator";
import { shapeVoice } from "./voice-shaping";
import { getFallbackPhrase } from "./fallback-phrases";

/**
 * Example 1: Angry Caller
 */
export const example1 = {
  scenario: "Angry caller complaining about delayed delivery",
  baseResponse: "I understand your concern about the delayed delivery. We're working to resolve this.",
  context: {
    callerEmotion: "angry",
    intent: "complaint",
    conversationState: "handling_issue",
    sttConfidence: 0.9,
    agentName: "Sarah",
    businessName: "Acme Corp",
  } as ConversationContext,
  expectedShaped: "I hear your frustration, and I'm really sorry about that. I understand your concern about the delayed delivery. We're working to resolve this. Let's see what we can do to fix this. Happy to help.",
};

/**
 * Example 2: Low STT Confidence
 */
export const example2 = {
  scenario: "Low STT confidence - caller unclear",
  baseResponse: "I'm not sure I understood that correctly.",
  context: {
    sttConfidence: 0.5,
    callerEmotion: "neutral",
    conversationState: "middle",
    agentName: "Aloha",
  } as ConversationContext,
  expectedShaped: "Sorry, I didn't catch that — could you repeat it? I'm not sure I understood that correctly. No worries at all.",
};

/**
 * Example 3: Knowledge Gap
 */
export const example3 = {
  scenario: "Aloha doesn't have requested information",
  baseResponse: "I don't have that information available.",
  context: {
    hasKnowledgeGap: true,
    intent: "unknown_info",
    conversationState: "middle",
    agentName: "Sarah",
    businessName: "Acme Corp",
  } as ConversationContext,
  expectedShaped: "I'm not seeing that info right now, but I can have someone follow up. I don't have that information available, but I'll make sure someone gets back to you with it. That makes sense.",
};

/**
 * Example 4: Emergency Situation
 */
export const example4 = {
  scenario: "Caller reports emergency",
  baseResponse: "This is an emergency situation.",
  context: {
    intent: "emergency",
    callerEmotion: "emergency",
    conversationState: "handling_issue",
  } as ConversationContext,
  expectedShaped: "I'm not equipped for emergencies — please contact local emergency services right away.",
};

/**
 * Example 5: Confused Caller
 */
export const example5 = {
  scenario: "Caller is confused about process",
  baseResponse: "The process involves three steps: first, you submit the form, then we review it, and finally we send confirmation.",
  context: {
    callerEmotion: "confused",
    intent: "confused",
    conversationState: "middle",
    contentComplexity: "complex",
  } as ConversationContext,
  expectedShaped: "No problem — let me explain it another way. The process involves three steps: first, you submit the form, then we review it, and finally we send confirmation. ... Totally understandable. Here's the simple version.",
};

/**
 * Example 6: Rushed Caller
 */
export const example6 = {
  scenario: "Caller is in a hurry",
  baseResponse: "I can help you with that. Let me check your account information.",
  context: {
    callerEmotion: "rushed",
    intent: "busy",
    responseTime: 300,
    conversationState: "middle",
  } as ConversationContext,
  expectedShaped: "I'll keep this short. I can help you with that. Let me check your account information.",
};

/**
 * Example 7: Emotional Caller (Personal Loss)
 */
export const example7 = {
  scenario: "Caller experiencing personal loss",
  baseResponse: "I understand this is a difficult time.",
  context: {
    callerEmotion: "grief",
    intent: "personal_loss",
    conversationState: "handling_issue",
  } as ConversationContext,
  expectedShaped: "I'm so sorry for your loss. I understand this is a difficult time. I'll make sure you don't receive further calls about this.",
};

/**
 * Example 8: Voicemail Detection
 */
export const example8 = {
  scenario: "Call went to voicemail",
  baseResponse: "This is a voicemail message.",
  context: {
    intent: "voicemail",
    conversationState: "opening",
    agentName: "Sarah",
    businessName: "Acme Corp",
    campaignReason: "following up on your recent order",
    phone: "+1-555-123-4567",
  } as ConversationContext,
  expectedShaped: "Hi, this is Sarah from Acme Corp. I'm calling because following up on your recent order. You can reach us at +1-555-123-4567. Have a great day.",
};

/**
 * Example 9: Graceful Closing
 */
export const example9 = {
  scenario: "Natural conversation ending",
  baseResponse: "That should answer your question.",
  context: {
    conversationState: "closing",
    intent: "goodbye",
    callerEmotion: "neutral",
  } as ConversationContext,
  expectedShaped: "That should answer your question. Thanks again for your time — really appreciate it.",
};

/**
 * Example 10: Repetitive Question
 */
export const example10 = {
  scenario: "Caller asks same question again",
  baseResponse: "As I mentioned, the delivery will arrive tomorrow.",
  context: {
    isRepetitiveQuestion: true,
    intent: "repetitive",
    conversationState: "middle",
  } as ConversationContext,
  expectedShaped: "No problem, I can go over that again. As I mentioned, the delivery will arrive tomorrow. Sure thing.",
};

/**
 * Generate example responses
 */
export function generateExampleResponses() {
  const examples = [
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
    example7,
    example8,
    example9,
    example10,
  ];

  return examples.map((ex) => {
    const shaped = generateResponse(ex.baseResponse, ex.context, {
      useFallback: true,
      applyVoiceShaping: true,
    });

    return {
      scenario: ex.scenario,
      baseResponse: ex.baseResponse,
      shapedResponse: shaped,
      context: ex.context,
    };
  });
}

/**
 * Test voice shaping only (no fallback)
 */
export function testVoiceShapingOnly() {
  const testCases = [
    {
      text: "I'll help you with that right away.",
      options: { callerTone: "rushed" as const },
    },
    {
      text: "I'm really sorry to hear about your situation.",
      options: { callerTone: "emotional" as const, conversationState: "handling_issue" as const },
    },
    {
      text: "The process involves multiple steps that require careful attention to detail.",
      options: { contentComplexity: "complex" as const, callerTone: "confused" as const },
    },
  ];

  return testCases.map((tc) => ({
    original: tc.text,
    shaped: shapeVoice(tc.text, tc.options),
    options: tc.options,
  }));
}

/**
 * Test fallback phrases only (no voice shaping)
 */
export function testFallbackPhrasesOnly() {
  const scenarios: Array<{ scenario: any; context?: any }> = [
    { scenario: "angry" },
    { scenario: "emergency" },
    { scenario: "voicemail", context: { agentName: "Sarah", businessName: "Acme Corp", campaignReason: "test", phone: "+1-555-123-4567" } },
    { scenario: "unknown_info" },
    { scenario: "graceful_closing" },
  ];

  return scenarios.map((s) => ({
    scenario: s.scenario,
    phrase: getFallbackPhrase(s.scenario, s.context),
  }));
}

