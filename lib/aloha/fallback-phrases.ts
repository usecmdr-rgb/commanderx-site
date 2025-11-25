/**
 * Aloha Fallback Phrase Library
 * 
 * Structured library of phrases for different conversation scenarios.
 * These phrases are used dynamically based on conversation context and intent detection.
 * NOT exposed to users - internal-only fallback system.
 */

export type FallbackScenario =
  | "clarification"
  | "bad_connection"
  | "caller_cant_hear"
  | "aloha_cant_hear"
  | "angry"
  | "upset"
  | "confused"
  | "busy"
  | "human_request"
  | "unknown_info"
  | "wrong_person"
  | "off_topic"
  | "exit_intent"
  | "emotional"
  | "personal_loss"
  | "emergency"
  | "silence"
  | "voicemail"
  | "unsubscribe"
  | "callback"
  | "repetitive_question"
  | "unexpected_behavior"
  | "graceful_closing";

export interface FallbackPhraseLibrary {
  clarification: string[];
  bad_connection: string[];
  caller_cant_hear: string[];
  aloha_cant_hear: string[];
  angry: string[];
  upset: string[];
  confused: string[];
  busy: string[];
  human_request: string[];
  unknown_info: string[];
  wrong_person: string[];
  off_topic: string[];
  exit_intent: string[];
  emotional: string[];
  personal_loss: string[];
  emergency: string[];
  silence: string[];
  voicemail: string[];
  unsubscribe: string[];
  callback: string[];
  repetitive_question: string[];
  unexpected_behavior: string[];
  graceful_closing: string[];
}

/**
 * Fallback phrase library
 * Phrases are selected randomly from each category to avoid repetition
 */
export const FALLBACK_PHRASES: FallbackPhraseLibrary = {
  clarification: [
    "Sorry, I didn't catch that — could you repeat it?",
    "Would you mind saying that again?",
    "Could you say that a bit slower?",
    "I want to make sure I understand — could you repeat that?",
    "Let me make sure I got that right — could you say it again?",
  ],

  bad_connection: [
    "It sounds like we might have a connection issue — can you hear me okay?",
    "I'm getting some static on my end. Can you hear me clearly?",
    "The connection seems a bit choppy. Are you still there?",
  ],

  caller_cant_hear: [
    "It sounds like I might be quiet on your end — can you hear me now?",
    "If it's still unclear, I can follow up by message.",
    "Can you hear me better now? If not, I can send you a message instead.",
  ],

  aloha_cant_hear: [
    "I'm getting a bit of static — could you repeat that?",
    "I want to help, but I'm not hearing you clearly.",
    "The connection seems a bit fuzzy on my end — could you say that again?",
    "I'm having trouble hearing you clearly. Could you repeat that?",
  ],

  angry: [
    "I hear your frustration, and I'm really sorry about that.",
    "Let's see what we can do to fix this.",
    "I completely understand why you're upset, and I want to help resolve this.",
    "I'm sorry this has been so frustrating. Let me see what I can do.",
  ],

  upset: [
    "I'm really sorry this has been difficult.",
    "Take your time, I'm here to help.",
    "I can hear this is really upsetting. Let's work through this together.",
    "I'm sorry you're going through this. How can I help make it better?",
  ],

  confused: [
    "No problem — let me explain it another way.",
    "Totally understandable. Here's the simple version.",
    "I can see how that might be confusing. Let me break it down differently.",
    "That's a fair question. Let me clarify that for you.",
  ],

  busy: [
    "I'll keep this short.",
    "If you prefer, I can call back at a better time.",
    "I understand you're busy. I'll make this quick.",
    "No problem — I can call back later if that works better for you.",
  ],

  human_request: [
    "Absolutely, I can arrange that.",
    "I'll have someone reach out directly.",
    "I'll connect you with someone who can help with that.",
    "Let me get you in touch with the right person for that.",
  ],

  unknown_info: [
    "I'm not seeing that info right now, but I can have someone follow up.",
    "Let me have the team confirm this for you.",
    "I don't have that information available, but I'll make sure someone gets back to you with it.",
    "That's a great question. Let me have someone from the team reach out with that information.",
  ],

  wrong_person: [
    "Thanks for letting me know. I'll update our notes.",
    "Sorry for the mix-up.",
    "I appreciate you letting me know. I'll make sure our records are updated.",
    "No problem — thanks for catching that. I'll fix it right away.",
  ],

  off_topic: [
    "That's a good question — let me see what I can find.",
    "I can help with general info, or have someone follow up.",
    "That's outside my area, but I can have someone who specializes in that reach out.",
    "I want to make sure you get the right answer. Let me have someone follow up on that.",
  ],

  exit_intent: [
    "Of course, thanks for your time.",
    "No problem — have a good day.",
    "Absolutely. Thanks for taking the time to speak with me.",
    "Understood. Have a great day!",
  ],

  emotional: [
    "I'm really sorry you're going through that.",
    "Take your time — I'm here.",
    "I can hear this is really difficult. I'm here to help however I can.",
    "I'm sorry to hear that. Is there anything I can do to help?",
  ],

  personal_loss: [
    "I'm so sorry for your loss.",
    "I'll make sure you don't receive further calls about this.",
    "I'm deeply sorry. I'll make sure you're not contacted about this again.",
    "My condolences. I'll update our records right away.",
  ],

  emergency: [
    "I'm not equipped for emergencies — please contact local emergency services right away.",
    "For emergencies, please call 911 immediately. I'm not able to handle emergency situations.",
    "This sounds like an emergency. Please contact emergency services right away.",
  ],

  silence: [
    "Are you still there?",
    "Take your time — no rush.",
    "It seems we may be disconnected. I'll end the call for now.",
    "I'm here when you're ready.",
    "No rush — I'm here whenever you're ready to continue.",
  ],

  voicemail: [
    "Hi, this is {AGENT_NAME} from {BUSINESS_NAME}. I'm calling because {CAMPAIGN_REASON}. You can reach us at {PHONE}. Have a great day.",
    "Hello, this is {AGENT_NAME} from {BUSINESS_NAME}. I wanted to reach out about {CAMPAIGN_REASON}. Feel free to call us back at {PHONE} when convenient. Thanks!",
  ],

  unsubscribe: [
    "Absolutely — I'll make a note.",
    "No problem, I'll remove you from future calls.",
    "Of course. I'll update our records right away.",
    "I'll take care of that for you. You won't receive any more calls.",
  ],

  callback: [
    "Sure thing — what time works best?",
    "Happy to set that up for you.",
    "Absolutely. When would be a good time to call back?",
    "I can definitely do that. What time works for you?",
  ],

  repetitive_question: [
    "No problem, I can go over that again.",
    "Here's the quick version.",
    "Sure, let me explain that one more time.",
    "Of course — let me break that down again.",
  ],

  unexpected_behavior: [
    "Glad to hear some good energy — how can I help?",
    "I'm Aloha, I assist the team here. How can I help with your question?",
    "I'm here to help. What can I do for you?",
    "I'm Aloha from {BUSINESS_NAME}. How can I assist you today?",
  ],

  graceful_closing: [
    "Thanks again for your time — really appreciate it.",
    "That's everything from my side. Have a great day.",
    "Take care, and thanks for speaking with me.",
    "Thanks so much for your time. Have a wonderful day!",
    "I really appreciate you taking the time. Have a great day!",
  ],
};

/**
 * Get a random phrase from a scenario category
 */
export function getFallbackPhrase(
  scenario: FallbackScenario,
  context?: {
    agentName?: string;
    businessName?: string;
    campaignReason?: string;
    phone?: string;
  }
): string {
  const phrases = FALLBACK_PHRASES[scenario];
  if (!phrases || phrases.length === 0) {
    return "";
  }

  // Select random phrase
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  // Replace placeholders if context provided
  if (context) {
    return phrase
      .replace(/{AGENT_NAME}/g, context.agentName || "Aloha")
      .replace(/{BUSINESS_NAME}/g, context.businessName || "our business")
      .replace(/{CAMPAIGN_REASON}/g, context.campaignReason || "I wanted to reach out")
      .replace(/{PHONE}/g, context.phone || "our main number");
  }

  return phrase;
}

/**
 * Get all phrases for a scenario (for testing/debugging)
 */
export function getFallbackPhrases(scenario: FallbackScenario): string[] {
  return FALLBACK_PHRASES[scenario] || [];
}

/**
 * Check if a scenario exists in the library
 */
export function isValidFallbackScenario(scenario: string): scenario is FallbackScenario {
  return scenario in FALLBACK_PHRASES;
}

