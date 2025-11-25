/**
 * Aloha Intent Classification System
 * 
 * Classifies caller utterances to understand intent and route responses appropriately.
 * Analyzes STT transcripts to detect:
 * - Question types (pricing, availability, services, appointment, refund, product support)
 * - Statement types (complaint, praise, confusion, correction)
 * - Social intent (greeting, small talk, exit intent)
 * - Emotional state (angry, upset, stressed, neutral, happy)
 * - Call flow intent (wants callback, wants email, wants unsubscribe, wants reschedule)
 * - Unknown intent → triggers clarification
 */

export type QuestionIntent =
  | "pricing"
  | "availability"
  | "services"
  | "appointment"
  | "refund"
  | "product_support"
  | "hours"
  | "location"
  | "contact"
  | "policy";

export type StatementIntent =
  | "complaint"
  | "praise"
  | "confusion"
  | "correction"
  | "information_provided";

export type SocialIntent = "greeting" | "small_talk" | "exit_intent" | "thanks";

export type EmotionalState =
  | "angry"
  | "upset"
  | "stressed"
  | "neutral"
  | "happy"
  | "frustrated"
  | "confused";

export type CallFlowIntent =
  | "wants_callback"
  | "wants_email"
  | "wants_unsubscribe"
  | "wants_reschedule"
  | "wants_appointment"
  | "wants_information"
  | "none";

export type IntentClassification = {
  primaryIntent: QuestionIntent | StatementIntent | SocialIntent | "unknown";
  emotionalState: EmotionalState;
  callFlowIntent: CallFlowIntent;
  confidence: number; // 0-1
  requiresClarification: boolean;
  metadata?: {
    keywords?: string[];
    questionType?: string;
    urgency?: "low" | "medium" | "high";
  };
};

/**
 * Classify question intent from transcript
 */
function classifyQuestionIntent(transcript: string): {
  intent: QuestionIntent | null;
  confidence: number;
  keywords: string[];
} {
  const lower = transcript.toLowerCase();
  const keywords: string[] = [];

  // Pricing questions
  if (
    lower.match(
      /\b(?:how much|price|pricing|cost|fee|charge|rate|dollar|expensive|cheap|afford|budget)\b/
    )
  ) {
    keywords.push("pricing");
    return { intent: "pricing", confidence: 0.85, keywords };
  }

  // Availability questions
  if (
    lower.match(
      /\b(?:available|in stock|have|do you have|when can|when will|when is)\b/
    ) &&
    !lower.match(/\b(?:hour|time|open|close)\b/)
  ) {
    keywords.push("availability");
    return { intent: "availability", confidence: 0.8, keywords };
  }

  // Services questions
  if (
    lower.match(
      /\b(?:what (?:services|do you|can you)|service|offer|provide|sell|do)\b/
    )
  ) {
    keywords.push("services");
    return { intent: "services", confidence: 0.85, keywords };
  }

  // Appointment questions
  if (
    lower.match(
      /\b(?:appointment|schedule|book|reserve|meeting|when can i|when are you|available)\b/
    )
  ) {
    keywords.push("appointment");
    return { intent: "appointment", confidence: 0.9, keywords };
  }

  // Refund questions
  if (
    lower.match(
      /\b(?:refund|return|money back|cancel|reimbursement|get my money)\b/
    )
  ) {
    keywords.push("refund");
    return { intent: "refund", confidence: 0.9, keywords };
  }

  // Product support
  if (
    lower.match(
      /\b(?:help with|support|broken|not working|issue|problem|fix|repair)\b/
    )
  ) {
    keywords.push("product_support");
    return { intent: "product_support", confidence: 0.85, keywords };
  }

  // Hours questions
  if (
    lower.match(
      /\b(?:hour|hours|open|close|when (?:are you|do you)|what time|business hours)\b/
    )
  ) {
    keywords.push("hours");
    return { intent: "hours", confidence: 0.9, keywords };
  }

  // Location questions
  if (
    lower.match(
      /\b(?:where|location|address|located|find you|come|directions|map)\b/
    )
  ) {
    keywords.push("location");
    return { intent: "location", confidence: 0.9, keywords };
  }

  // Contact questions
  if (
    lower.match(
      /\b(?:phone|email|contact|reach|call|text|number|how to contact)\b/
    )
  ) {
    keywords.push("contact");
    return { intent: "contact", confidence: 0.85, keywords };
  }

  // Policy questions
  if (
    lower.match(
      /\b(?:policy|policies|terms|conditions|rules|procedure|process|how)\b/
    )
  ) {
    keywords.push("policy");
    return { intent: "policy", confidence: 0.8, keywords };
  }

  return { intent: null, confidence: 0, keywords: [] };
}

/**
 * Classify statement intent from transcript
 */
function classifyStatementIntent(transcript: string): {
  intent: StatementIntent | null;
  confidence: number;
  keywords: string[];
} {
  const lower = transcript.toLowerCase();
  const keywords: string[] = [];

  // Complaint
  if (
    lower.match(
      /\b(?:complaint|complain|problem|issue|wrong|bad|terrible|awful|horrible|unacceptable|not happy|not satisfied|disappointed)\b/
    )
  ) {
    keywords.push("complaint");
    return { intent: "complaint", confidence: 0.85, keywords };
  }

  // Praise
  if (
    lower.match(
      /\b(?:great|excellent|amazing|wonderful|love|thank|appreciate|good job|perfect|fantastic|happy with)\b/
    ) &&
    !lower.match(/\b(?:not|don't|didn't)\b/)
  ) {
    keywords.push("praise");
    return { intent: "praise", confidence: 0.8, keywords };
  }

  // Confusion
  if (
    lower.match(
      /\b(?:confused|don't understand|unclear|not sure|what|huh|pardon|sorry|repeat|didn't catch|what did you|what do you mean)\b/
    )
  ) {
    keywords.push("confusion");
    return { intent: "confusion", confidence: 0.9, keywords };
  }

  // Correction
  if (
    lower.match(
      /\b(?:actually|no that's|that's not|wrong|incorrect|mistake|correction|not|no|that's not right)\b/
    )
  ) {
    keywords.push("correction");
    return { intent: "correction", confidence: 0.85, keywords };
  }

  // Information provided (statements that provide info)
  if (
    lower.length > 20 &&
    !lower.match(/^(?:hi|hello|hey|thanks|thank you|bye|goodbye)$/i) &&
    !lower.includes("?")
  ) {
    keywords.push("information");
    return { intent: "information_provided", confidence: 0.6, keywords };
  }

  return { intent: null, confidence: 0, keywords: [] };
}

/**
 * Classify social intent from transcript
 */
function classifySocialIntent(transcript: string): {
  intent: SocialIntent | null;
  confidence: number;
  keywords: string[];
} {
  const lower = transcript.toLowerCase().trim();
  const keywords: string[] = [];

  // Greeting
  if (
    lower.match(/^(?:hi|hello|hey|good morning|good afternoon|good evening|greetings)/i) ||
    lower.match(/\b(?:hi there|hello there|hey there)\b/i)
  ) {
    keywords.push("greeting");
    return { intent: "greeting", confidence: 0.95, keywords };
  }

  // Exit intent
  if (
    lower.match(
      /\b(?:bye|goodbye|gotta go|have to go|that's all|nothing else|that's it|all set|done|finished|okay thanks|ok thanks|okay thank you|ok thank you)\b/i
    ) ||
    lower.match(/^(?:okay|ok|yep|yeah|sure|fine|sounds good|alright)(?:,|\.|\s|$)/i) &&
      lower.length < 30
  ) {
    keywords.push("exit");
    return { intent: "exit_intent", confidence: 0.85, keywords };
  }

  // Thanks
  if (
    lower.match(
      /\b(?:thank|thanks|appreciate|grateful|thank you very much|thanks so much)\b/i
    ) &&
    !lower.match(/\b(?:don't|not|no)\b/i)
  ) {
    keywords.push("thanks");
    return { intent: "thanks", confidence: 0.9, keywords };
  }

  // Small talk (short, conversational statements)
  if (
    lower.length < 50 &&
    !lower.includes("?") &&
    lower.match(
      /\b(?:how are you|how's it going|nice weather|have a good|how was|nice day)\b/i
    )
  ) {
    keywords.push("small_talk");
    return { intent: "small_talk", confidence: 0.7, keywords };
  }

  return { intent: null, confidence: 0, keywords: [] };
}

/**
 * Detect emotional state from transcript
 */
export function detectEmotionalState(transcript: string): {
  state: EmotionalState;
  confidence: number;
  keywords: string[];
} {
  const lower = transcript.toLowerCase();
  const keywords: string[] = [];

  // Angry indicators
  const angryPatterns = [
    /\b(?:angry|mad|furious|livid|irate|rage|hate|terrible|awful|horrible|worst|disgusted|outraged)\b/,
    /\b(?:this is ridiculous|unacceptable|unbelievable|are you kidding)\b/,
  ];
  if (angryPatterns.some((p) => p.test(lower))) {
    keywords.push("angry");
    return { state: "angry", confidence: 0.85, keywords };
  }

  // Upset indicators
  if (
    lower.match(
      /\b(?:upset|disappointed|unhappy|sad|heartbroken|hurt|distressed)\b/
    )
  ) {
    keywords.push("upset");
    return { state: "upset", confidence: 0.8, keywords };
  }

  // Frustrated indicators
  if (
    lower.match(
      /\b(?:frustrated|annoyed|irritated|fed up|tired of|sick of|had enough)\b/
    )
  ) {
    keywords.push("frustrated");
    return { state: "frustrated", confidence: 0.85, keywords };
  }

  // Stressed indicators
  if (
    lower.match(
      /\b(?:stressed|overwhelmed|rushed|hurried|in a rush|running late|urgent|asap|as soon as possible)\b/
    )
  ) {
    keywords.push("stressed");
    return { state: "stressed", confidence: 0.8, keywords };
  }

  // Confused indicators
  if (
    lower.match(
      /\b(?:confused|don't understand|unclear|not sure|what|huh|pardon|lost)\b/
    )
  ) {
    keywords.push("confused");
    return { state: "confused", confidence: 0.85, keywords };
  }

  // Happy indicators
  if (
    lower.match(
      /\b(?:happy|great|excellent|wonderful|love|amazing|fantastic|perfect|thrilled|delighted|pleased)\b/
    ) &&
    !lower.match(/\b(?:not|don't|didn't|can't)\b/)
  ) {
    keywords.push("happy");
    return { state: "happy", confidence: 0.75, keywords };
  }

  // Default to neutral
  return { state: "neutral", confidence: 0.6, keywords: [] };
}

/**
 * Detect call flow intent from transcript
 */
function detectCallFlowIntent(transcript: string): {
  intent: CallFlowIntent;
  confidence: number;
  keywords: string[];
} {
  const lower = transcript.toLowerCase();
  const keywords: string[] = [];

  // Wants callback
  if (
    lower.match(
      /\b(?:call me back|call back|callback|call me later|call me at|call me when|can you call|would you call)\b/
    )
  ) {
    keywords.push("callback");
    return { intent: "wants_callback", confidence: 0.9, keywords };
  }

  // Wants email
  if (
    lower.match(
      /\b(?:email|email me|send me an email|email address|email it|email that)\b/
    )
  ) {
    keywords.push("email");
    return { intent: "wants_email", confidence: 0.9, keywords };
  }

  // Wants unsubscribe
  if (
    lower.match(
      /\b(?:stop calling|don't call|remove|unsubscribe|opt out|take me off|do not call|don't call me)\b/
    )
  ) {
    keywords.push("unsubscribe");
    return { intent: "wants_unsubscribe", confidence: 0.95, keywords };
  }

  // Wants reschedule
  if (
    lower.match(
      /\b(?:reschedule|change appointment|move|different time|another time|rebook|reschedule my)\b/
    )
  ) {
    keywords.push("reschedule");
    return { intent: "wants_reschedule", confidence: 0.9, keywords };
  }

  // Wants appointment
  if (
    lower.match(
      /\b(?:schedule|book|appointment|make an appointment|set up|reserve)\b/
    )
  ) {
    keywords.push("appointment");
    return { intent: "wants_appointment", confidence: 0.85, keywords };
  }

  // Wants information (general)
  if (
    lower.match(/\b(?:tell me|what|how|when|where|who|why|can you tell|information|info|details)\b/) ||
    lower.includes("?")
  ) {
    keywords.push("information");
    return { intent: "wants_information", confidence: 0.7, keywords };
  }

  return { intent: "none", confidence: 0.5, keywords: [] };
}

/**
 * Main intent classification function
 */
export function classifyIntent(transcript: string): IntentClassification {
  // Clean transcript
  const cleaned = transcript.trim();
  if (!cleaned || cleaned.length === 0) {
    return {
      primaryIntent: "unknown",
      emotionalState: "neutral",
      callFlowIntent: "none",
      confidence: 0,
      requiresClarification: true,
    };
  }

  // Check for [inaudible] or low confidence markers
  if (cleaned.match(/\[(?:inaudible|unclear|unintelligible)\]/i)) {
    return {
      primaryIntent: "unknown",
      emotionalState: "neutral",
      callFlowIntent: "none",
      confidence: 0,
      requiresClarification: true,
      metadata: {
        keywords: ["inaudible"],
      },
    };
  }

  // Classify each intent type
  const questionResult = classifyQuestionIntent(cleaned);
  const statementResult = classifyStatementIntent(cleaned);
  const socialResult = classifySocialIntent(cleaned);
  const emotionalResult = detectEmotionalState(cleaned);
  const callFlowResult = detectCallFlowIntent(cleaned);

  // Determine primary intent (priority: social > question > statement)
  let primaryIntent: QuestionIntent | StatementIntent | SocialIntent | "unknown" = "unknown";
  let confidence = 0;

  if (socialResult.intent && socialResult.confidence > 0.7) {
    primaryIntent = socialResult.intent;
    confidence = socialResult.confidence;
  } else if (questionResult.intent && questionResult.confidence > 0.7) {
    primaryIntent = questionResult.intent;
    confidence = questionResult.confidence;
  } else if (statementResult.intent && statementResult.confidence > 0.7) {
    primaryIntent = statementResult.intent;
    confidence = statementResult.confidence;
  } else {
    // Low confidence - require clarification
    primaryIntent = "unknown";
    confidence = Math.max(
      questionResult.confidence,
      statementResult.confidence,
      socialResult.confidence
    );
  }

  // Determine if clarification is needed
  const requiresClarification =
    primaryIntent === "unknown" ||
    confidence < 0.6 ||
    cleaned.length < 3 ||
    (questionResult.intent === null &&
      statementResult.intent === null &&
      socialResult.intent === null);

  // Determine urgency
  let urgency: "low" | "medium" | "high" = "low";
  if (
    emotionalResult.state === "angry" ||
    emotionalResult.state === "upset" ||
    emotionalResult.state === "frustrated"
  ) {
    urgency = "high";
  } else if (
    emotionalResult.state === "stressed" ||
    callFlowResult.intent === "wants_unsubscribe"
  ) {
    urgency = "medium";
  }

  // Collect all keywords
  const allKeywords = [
    ...questionResult.keywords,
    ...statementResult.keywords,
    ...socialResult.keywords,
    ...emotionalResult.keywords,
    ...callFlowResult.keywords,
  ];

  return {
    primaryIntent,
    emotionalState: emotionalResult.state,
    callFlowIntent: callFlowResult.intent,
    confidence,
    requiresClarification,
    metadata: {
      keywords: allKeywords,
      questionType: questionResult.intent || undefined,
      urgency,
    },
  };
}

