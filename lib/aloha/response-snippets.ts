/**
 * Response Snippets Library for Aloha
 * 
 * Pre-defined polite, professional responses for various scenarios.
 * These maintain consistency with Aloha's voice and persona.
 */

export type ResponseSnippetId =
  // Audio/Technical
  | "audio_poor_quality"
  | "audio_cannot_hear"
  | "audio_echo"
  | "audio_lag"
  | "voicemail_detected"
  | "stt_low_confidence"
  | "bad_connection_detected"
  | "connection_rough"
  // Caller Behavior
  | "interruption_acknowledge"
  | "please_repeat"
  | "please_repeat_slower"
  | "topic_redirect"
  | "testing_ai_response"
  | "thinks_human_clarify"
  | "caller_silent_short"
  | "caller_silent_medium"
  | "caller_silent_long"
  | "caller_talkative_redirect"
  // Emotional/Social
  | "angry_caller_empathy"
  | "upset_caller_support"
  | "frustrated_caller_help"
  | "crying_caller_compassion"
  | "emergency_redirect"
  | "angry_caller_deescalate"
  | "confused_caller_repair"
  | "upset_caller_acknowledge"
  // Identity
  | "unidentified_caller"
  | "child_caller_safe"
  // Business Logic
  | "opt_out_confirm"
  | "opt_out_processing"
  | "legal_concern_defer"
  | "unavailable_service"
  | "missing_info_defer"
  | "knowledge_gap_logged"
  | "knowledge_gap_fallback"
  // Safety/Compliance
  | "cannot_advise_medical"
  | "cannot_advise_legal"
  | "cannot_advise_financial"
  | "end_call_anytime"
  // Clarification
  | "clarification_request"
  | "clarification_request_alternative"
  | "unclear_what_you_need"
  // Empathy & Sensitivity
  | "empathy_general"
  | "empathy_sensitive_scenario"
  | "empathy_difficult_situation"
  // Exit/Closing
  | "exit_natural_standard"
  | "exit_if_upset"
  | "exit_if_connection_bad"
  | "exit_check_needs_anything"
  | "exit_check_needs_anything_upset"
  | "exit_graceful"
  // General
  | "callback_offer"
  | "thank_you"
  | "goodbye";

export interface ResponseSnippet {
  id: ResponseSnippetId;
  text: string;
  tone: "calm" | "empathetic" | "professional" | "friendly" | "neutral";
  useCase: string;
}

/**
 * Get response snippet by ID
 */
export function getResponseSnippet(id: ResponseSnippetId): ResponseSnippet {
  return RESPONSE_SNIPPETS[id];
}

/**
 * Get multiple snippets (for building complex responses)
 */
export function getResponseSnippets(ids: ResponseSnippetId[]): ResponseSnippet[] {
  return ids.map((id) => RESPONSE_SNIPPETS[id]);
}

const RESPONSE_SNIPPETS: Record<ResponseSnippetId, ResponseSnippet> = {
  // Audio/Technical
  audio_poor_quality: {
    id: "audio_poor_quality",
    text: "I'm having trouble hearing you clearly. Could you speak a bit louder, or would you prefer I call you back?",
    tone: "calm",
    useCase: "When audio quality is poor",
  },
  audio_cannot_hear: {
    id: "audio_cannot_hear",
    text: "I'm having difficulty hearing you. Could you repeat that, or would you like me to call you back at a better time?",
    tone: "calm",
    useCase: "When Aloha cannot hear caller",
  },
  audio_echo: {
    id: "audio_echo",
    text: "I'm hearing some echo on the line. Could you try moving to a quieter location, or would you prefer I call you back?",
    tone: "calm",
    useCase: "When echo is detected",
  },
  audio_lag: {
    id: "audio_lag",
    text: "I notice there's a bit of delay on the call. Let me slow down so we can communicate clearly.",
    tone: "calm",
    useCase: "When call lag is detected",
  },
  voicemail_detected: {
    id: "voicemail_detected",
    text: "Hello, this is Aloha from {business_name}. I'm calling to {purpose}. Please call us back at {phone} or visit {website}. Thank you!",
    tone: "professional",
    useCase: "When voicemail is detected",
  },
  stt_low_confidence: {
    id: "stt_low_confidence",
    text: "I'm having trouble understanding what you said. Could you repeat that a bit more clearly?",
    tone: "calm",
    useCase: "When STT confidence is low",
  },

  // Caller Behavior
  interruption_acknowledge: {
    id: "interruption_acknowledge",
    text: "I hear you. Go ahead.",
    tone: "friendly",
    useCase: "When caller interrupts",
  },
  please_repeat: {
    id: "please_repeat",
    text: "I'm sorry, could you repeat that?",
    tone: "calm",
    useCase: "When Aloha didn't understand",
  },
  please_repeat_slower: {
    id: "please_repeat_slower",
    text: "I'm having trouble following. Could you repeat that a bit slower?",
    tone: "calm",
    useCase: "When caller speaks too fast",
  },
  topic_redirect: {
    id: "topic_redirect",
    text: "I understand. Let me help you with {original_topic}. How can I assist with that?",
    tone: "friendly",
    useCase: "When caller switches topics",
  },
  testing_ai_response: {
    id: "testing_ai_response",
    text: "I'm Aloha, an AI assistant from {business_name}. I'm here to help you today. How can I assist you?",
    tone: "friendly",
    useCase: "When caller tests if Aloha is AI",
  },
  thinks_human_clarify: {
    id: "thinks_human_clarify",
    text: "I'm Aloha, an AI assistant from {business_name}. I'm here to help you today. How can I assist you?",
    tone: "friendly",
    useCase: "When caller thinks Aloha is human",
  },

  // Emotional/Social
  angry_caller_empathy: {
    id: "angry_caller_empathy",
    text: "I understand you're frustrated, and I'm sorry for any inconvenience. Let me see how I can help resolve this for you.",
    tone: "empathetic",
    useCase: "When caller is angry",
  },
  upset_caller_support: {
    id: "upset_caller_support",
    text: "I'm sorry to hear you're upset. I'm here to help. Can you tell me what's going on so I can assist you?",
    tone: "empathetic",
    useCase: "When caller is upset",
  },
  frustrated_caller_help: {
    id: "frustrated_caller_help",
    text: "I understand this is frustrating. Let me help you get this sorted out. What can I do for you today?",
    tone: "empathetic",
    useCase: "When caller is frustrated",
  },
  crying_caller_compassion: {
    id: "crying_caller_compassion",
    text: "I can hear this is difficult for you. I'm here to help. Would you like to take a moment, or would you prefer I call you back later?",
    tone: "empathetic",
    useCase: "When caller is crying",
  },
  emergency_redirect: {
    id: "emergency_redirect",
    text: "I understand you mentioned an emergency. For emergencies, please call 911 immediately. I'm an AI assistant and cannot help with emergencies. Please hang up and call 911 if you need emergency assistance.",
    tone: "calm",
    useCase: "When caller mentions emergency",
  },

  // Identity
  unidentified_caller: {
    id: "unidentified_caller",
    text: "I'd like to make sure I'm speaking with the right person. Could you confirm your name, or would you prefer I call back at a better time?",
    tone: "professional",
    useCase: "When caller is not identified",
  },
  child_caller_safe: {
    id: "child_caller_safe",
    text: "Hi there! Is there a grown-up nearby I could speak with? I'd like to make sure I'm talking to the right person.",
    tone: "friendly",
    useCase: "When caller appears to be a child",
  },

  // Business Logic
  opt_out_confirm: {
    id: "opt_out_confirm",
    text: "I understand you'd like to stop receiving calls from us. I'll make sure you're removed from our calling list. Is that correct?",
    tone: "professional",
    useCase: "When caller wants to opt out",
  },
  opt_out_processing: {
    id: "opt_out_processing",
    text: "I've noted your request to stop receiving calls. You've been removed from our calling list. Is there anything else I can help you with today?",
    tone: "professional",
    useCase: "After confirming opt-out",
  },
  legal_concern_defer: {
    id: "legal_concern_defer",
    text: "I understand you have legal concerns. I'm an AI assistant and cannot provide legal advice. I'll make sure someone from our team follows up with you about this. Is there anything else I can help with today?",
    tone: "professional",
    useCase: "When caller mentions legal concerns",
  },
  unavailable_service: {
    id: "unavailable_service",
    text: "I understand you're interested in {service}. That's not something we currently offer, but I'd be happy to tell you about our available services. Would that be helpful?",
    tone: "friendly",
    useCase: "When caller requests unavailable service",
  },
  missing_info_defer: {
    id: "missing_info_defer",
    text: "I don't have that information available right now, but I'll make sure someone follows up with you about this. Is there anything else I can help you with today?",
    tone: "professional",
    useCase: "When information is missing",
  },
  knowledge_gap_logged: {
    id: "knowledge_gap_logged",
    text: "I don't have that information available right now, but I've logged your question and someone will follow up with you. Is there anything else I can help with?",
    tone: "professional",
    useCase: "After logging knowledge gap",
  },

  // Safety/Compliance
  cannot_advise_medical: {
    id: "cannot_advise_medical",
    text: "I'm an AI assistant and cannot provide medical advice. For medical concerns, please consult with a healthcare professional. Is there anything else I can help you with?",
    tone: "professional",
    useCase: "When caller asks for medical advice",
  },
  cannot_advise_legal: {
    id: "cannot_advise_legal",
    text: "I'm an AI assistant and cannot provide legal advice. For legal matters, please consult with an attorney. Is there anything else I can help you with?",
    tone: "professional",
    useCase: "When caller asks for legal advice",
  },
  cannot_advise_financial: {
    id: "cannot_advise_financial",
    text: "I'm an AI assistant and cannot provide financial advice. For financial matters, please consult with a financial advisor. Is there anything else I can help you with?",
    tone: "professional",
    useCase: "When caller asks for financial advice",
  },
  end_call_anytime: {
    id: "end_call_anytime",
    text: "Of course. You can end this call at any time. Is there anything else I can help you with before you go?",
    tone: "friendly",
    useCase: "When caller wants to end call",
  },

  // General
  callback_offer: {
    id: "callback_offer",
    text: "Would you like me to call you back at a better time? I can schedule a callback for you.",
    tone: "friendly",
    useCase: "When offering callback",
  },
  thank_you: {
    id: "thank_you",
    text: "Thank you for calling. Have a great day!",
    tone: "friendly",
    useCase: "Ending call politely",
  },
  goodbye: {
    id: "goodbye",
    text: "Goodbye! Take care.",
    tone: "friendly",
    useCase: "Ending call",
  },

  // NEW: Bad connection snippets
  bad_connection_detected: {
    id: "bad_connection_detected",
    text: "I'm having trouble hearing you clearly. Could you repeat that one more time?",
    tone: "calm",
    useCase: "When bad connection is detected",
  },
  connection_rough: {
    id: "connection_rough",
    text: "It sounds like the connection is a little rough. Can you still hear me clearly?",
    tone: "calm",
    useCase: "When connection quality is poor",
  },

  // NEW: Caller silence handling
  caller_silent_short: {
    id: "caller_silent_short",
    text: "Are you still there?",
    tone: "friendly",
    useCase: "After 2-3 seconds of silence",
  },
  caller_silent_medium: {
    id: "caller_silent_medium",
    text: "It might be a quiet moment, no rush.",
    tone: "friendly",
    useCase: "After 6-7 seconds of silence",
  },
  caller_silent_long: {
    id: "caller_silent_long",
    text: "It seems we may have lost connection. I'll end the call for now, but you're welcome to call back anytime.",
    tone: "professional",
    useCase: "After 10+ seconds of silence",
  },
  caller_talkative_redirect: {
    id: "caller_talkative_redirect",
    text: "I understand. Let me make sure we get to the main reason for my call today.",
    tone: "friendly",
    useCase: "When caller is overly talkative",
  },

  // NEW: Enhanced emotional responses
  angry_caller_deescalate: {
    id: "angry_caller_deescalate",
    text: "I hear your frustration, and I'm sorry you're dealing with this. Let's see how I can help.",
    tone: "empathetic",
    useCase: "When caller is angry - de-escalation",
  },
  confused_caller_repair: {
    id: "confused_caller_repair",
    text: "I can see how that might be confusing. Let me explain it a different way.",
    tone: "calm",
    useCase: "When caller is confused - repair",
  },
  upset_caller_acknowledge: {
    id: "upset_caller_acknowledge",
    text: "I understand this is difficult. I'm here to help work through this with you.",
    tone: "empathetic",
    useCase: "When caller is upset - acknowledge",
  },

  // NEW: Clarification snippets
  clarification_request: {
    id: "clarification_request",
    text: "Sorry, I didn't quite catch that — could you repeat it one more time?",
    tone: "calm",
    useCase: "When caller is unclear",
  },
  clarification_request_alternative: {
    id: "clarification_request_alternative",
    text: "I'm not sure I heard you clearly, would you mind saying that again?",
    tone: "calm",
    useCase: "Alternative clarification request",
  },
  unclear_what_you_need: {
    id: "unclear_what_you_need",
    text: "I want to make sure I understand correctly. Could you clarify what you need?",
    tone: "friendly",
    useCase: "When intent is unclear",
  },

  // NEW: Knowledge gap fallback
  knowledge_gap_fallback: {
    id: "knowledge_gap_fallback",
    text: "I don't have that information right now, but I can make sure someone follows up with you.",
    tone: "professional",
    useCase: "When Aloha doesn't know the answer",
  },

  // NEW: Empathy snippets
  empathy_general: {
    id: "empathy_general",
    text: "I can understand how that feels.",
    tone: "empathetic",
    useCase: "General empathy",
  },
  empathy_sensitive_scenario: {
    id: "empathy_sensitive_scenario",
    text: "I appreciate you sharing that with me. Let me see how I can help.",
    tone: "empathetic",
    useCase: "For sensitive scenarios",
  },
  empathy_difficult_situation: {
    id: "empathy_difficult_situation",
    text: "I'm sorry you're going through this. I'm here to help in any way I can.",
    tone: "empathetic",
    useCase: "For difficult situations",
  },

  // NEW: Natural exit/closing snippets
  exit_natural_standard: {
    id: "exit_natural_standard",
    text: "Okay great, thanks so much for your time. Have a wonderful day.",
    tone: "friendly",
    useCase: "Standard natural closing",
  },
  exit_if_upset: {
    id: "exit_if_upset",
    text: "I appreciate your patience. We'll follow up to make this right. Thank you for taking the time to speak with me.",
    tone: "empathetic",
    useCase: "If caller was upset",
  },
  exit_if_connection_bad: {
    id: "exit_if_connection_bad",
    text: "Since the line is a bit rough, I'll end the call here. Thanks for your time.",
    tone: "professional",
    useCase: "If connection was bad",
  },
  exit_check_needs_anything: {
    id: "exit_check_needs_anything",
    text: "Before I let you go, is there anything else I can help with today?",
    tone: "friendly",
    useCase: "Check before closing",
  },
  exit_check_needs_anything_upset: {
    id: "exit_check_needs_anything_upset",
    text: "Is there anything else I can help you with before we wrap up?",
    tone: "empathetic",
    useCase: "Check before closing if caller was upset",
  },
  exit_graceful: {
    id: "exit_graceful",
    text: "Okay, that's everything from my side. Thanks again for your time and have a good day.",
    tone: "friendly",
    useCase: "Natural graceful closing",
  },
};

/**
 * Format snippet with variables
 */
export function formatSnippet(
  snippet: ResponseSnippet,
  variables: Record<string, string>
): string {
  let text = snippet.text;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return text;
}

