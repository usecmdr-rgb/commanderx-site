/**
 * Aloha Scenario Detection System
 * 
 * Detects and categorizes real-world caller scenarios to enable
 * appropriate handling and fallback responses.
 */

export type ScenarioCategory =
  | "audio_technical"
  | "caller_behavior"
  | "emotional_social"
  | "identity_issues"
  | "business_logic"
  | "safety_compliance"
  | "normal";

export type AudioIssueType =
  | "bad_connection"
  | "static_robotic"
  | "caller_cannot_hear"
  | "aloha_cannot_hear"
  | "distorted_audio"
  | "background_noise"
  | "echo_feedback"
  | "call_lag"
  | "conference_call"
  | "voicemail";

export type CallerBehaviorType =
  | "interruption"
  | "talking_over"
  | "silence_pause"
  | "fast_talker"
  | "slow_talker"
  | "topic_switch"
  | "thinks_human"
  | "testing_ai"
  | "strong_accent"
  | "unrelated_question";

export type EmotionalType =
  | "angry"
  | "rude"
  | "upset_frustrated"
  | "crying"
  | "emergency"
  | "grief_loss";

export type IdentityIssueType =
  | "not_intended_customer"
  | "refuses_identity"
  | "pretending_identity"
  | "child";

export type BusinessLogicType =
  | "unavailable_service"
  | "outside_hours"
  | "conflicting_info"
  | "unsubscribe_dnc"
  | "legal_concern"
  | "pricing_unavailable";

export interface ScenarioContext {
  // Audio/Technical metrics
  sttConfidence?: number; // 0-1, lower = less confident
  audioQuality?: number; // 0-1, lower = worse quality
  hasBackgroundNoise?: boolean;
  hasEcho?: boolean;
  callLatency?: number; // ms
  isVoicemail?: boolean;
  multipleSpeakers?: boolean;

  // Caller behavior indicators
  interruptionCount?: number;
  silenceDuration?: number; // seconds
  speechRate?: number; // words per minute
  topicSwitches?: number;
  unrelatedQuestions?: number;

  // Emotional/social indicators
  emotionalKeywords?: string[];
  toneIndicators?: string[];

  // Identity indicators
  callerName?: string;
  callerVerification?: boolean;

  // Business context
  businessHours?: boolean;
  requestedService?: string;
  requestedInfo?: string;
}

export interface DetectedScenario {
  category: ScenarioCategory;
  type?: AudioIssueType | CallerBehaviorType | EmotionalType | IdentityIssueType | BusinessLogicType;
  severity: "low" | "medium" | "high";
  confidence: number; // 0-1
  requiresImmediateAction: boolean;
  suggestedResponse?: string;
}

/**
 * Detect audio and technical issues
 */
export function detectAudioIssues(context: ScenarioContext): DetectedScenario | null {
  const issues: DetectedScenario[] = [];

  // Low STT confidence
  if (context.sttConfidence !== undefined && context.sttConfidence < 0.5) {
    issues.push({
      category: "audio_technical",
      type: "aloha_cannot_hear",
      severity: context.sttConfidence < 0.3 ? "high" : "medium",
      confidence: 1 - context.sttConfidence,
      requiresImmediateAction: context.sttConfidence < 0.3,
    });
  }

  // Poor audio quality
  if (context.audioQuality !== undefined && context.audioQuality < 0.6) {
    issues.push({
      category: "audio_technical",
      type: context.audioQuality < 0.3 ? "bad_connection" : "distorted_audio",
      severity: context.audioQuality < 0.3 ? "high" : "medium",
      confidence: 1 - context.audioQuality,
      requiresImmediateAction: context.audioQuality < 0.3,
    });
  }

  // Background noise
  if (context.hasBackgroundNoise) {
    issues.push({
      category: "audio_technical",
      type: "background_noise",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    });
  }

  // Echo/feedback
  if (context.hasEcho) {
    issues.push({
      category: "audio_technical",
      type: "echo_feedback",
      severity: "medium",
      confidence: 0.8,
      requiresImmediateAction: false,
    });
  }

  // Call lag
  if (context.callLatency && context.callLatency > 1000) {
    issues.push({
      category: "audio_technical",
      type: "call_lag",
      severity: context.callLatency > 2000 ? "high" : "medium",
      confidence: 0.6,
      requiresImmediateAction: context.callLatency > 2000,
    });
  }

  // Voicemail detection
  if (context.isVoicemail) {
    issues.push({
      category: "audio_technical",
      type: "voicemail",
      severity: "high",
      confidence: 0.9,
      requiresImmediateAction: true,
    });
  }

  // Multiple speakers (conference call)
  if (context.multipleSpeakers) {
    issues.push({
      category: "audio_technical",
      type: "conference_call",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    });
  }

  // Return highest priority issue
  if (issues.length === 0) return null;
  return issues.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.severity] - priority[a.severity];
  })[0];
}

/**
 * Detect caller behavior variations
 */
export function detectCallerBehavior(context: ScenarioContext): DetectedScenario | null {
  const behaviors: DetectedScenario[] = [];

  // Interruptions
  if (context.interruptionCount && context.interruptionCount > 2) {
    behaviors.push({
      category: "caller_behavior",
      type: "interruption",
      severity: "medium",
      confidence: 0.8,
      requiresImmediateAction: false,
    });
  }

  // Long silence
  if (context.silenceDuration && context.silenceDuration > 5) {
    behaviors.push({
      category: "caller_behavior",
      type: "silence_pause",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    });
  }

  // Fast talker
  if (context.speechRate && context.speechRate > 180) {
    behaviors.push({
      category: "caller_behavior",
      type: "fast_talker",
      severity: "low",
      confidence: 0.6,
      requiresImmediateAction: false,
    });
  }

  // Slow talker
  if (context.speechRate && context.speechRate < 100) {
    behaviors.push({
      category: "caller_behavior",
      type: "slow_talker",
      severity: "low",
      confidence: 0.6,
      requiresImmediateAction: false,
    });
  }

  // Topic switches
  if (context.topicSwitches && context.topicSwitches > 2) {
    behaviors.push({
      category: "caller_behavior",
      type: "topic_switch",
      severity: "low",
      confidence: 0.7,
      requiresImmediateAction: false,
    });
  }

  // Unrelated questions
  if (context.unrelatedQuestions && context.unrelatedQuestions > 1) {
    behaviors.push({
      category: "caller_behavior",
      type: "unrelated_question",
      severity: "low",
      confidence: 0.7,
      requiresImmediateAction: false,
    });
  }

  if (behaviors.length === 0) return null;
  return behaviors[0]; // Return first detected behavior
}

/**
 * Detect emotional/social scenarios
 */
export function detectEmotionalScenario(
  context: ScenarioContext,
  transcript: string
): DetectedScenario | null {
  const lowerTranscript = transcript.toLowerCase();

  // Emergency keywords
  const emergencyKeywords = [
    "emergency",
    "ambulance",
    "police",
    "fire",
    "help me",
    "urgent",
    "911",
    "accident",
    "hurt",
    "injured",
  ];
  if (emergencyKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "emotional_social",
      type: "emergency",
      severity: "high",
      confidence: 0.9,
      requiresImmediateAction: true,
    };
  }

  // Angry keywords
  const angryKeywords = [
    "angry",
    "mad",
    "furious",
    "terrible",
    "awful",
    "horrible",
    "worst",
    "hate",
    "disgusted",
  ];
  if (angryKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "emotional_social",
      type: "angry",
      severity: "high",
      confidence: 0.8,
      requiresImmediateAction: false,
    };
  }

  // Rude keywords
  const rudeKeywords = [
    "stupid",
    "idiot",
    "dumb",
    "shut up",
    "hang up",
    "waste of time",
  ];
  if (rudeKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "emotional_social",
      type: "rude",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    };
  }

  // Upset/frustrated keywords
  const upsetKeywords = [
    "frustrated",
    "upset",
    "disappointed",
    "unhappy",
    "not satisfied",
    "problem",
    "issue",
    "complaint",
  ];
  if (upsetKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "emotional_social",
      type: "upset_frustrated",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    };
  }

  // Crying indicators (would need audio analysis in production)
  // For now, detect through transcript patterns
  if (lowerTranscript.includes("crying") || lowerTranscript.match(/sob|weep|tears/i)) {
    return {
      category: "emotional_social",
      type: "crying",
      severity: "high",
      confidence: 0.6,
      requiresImmediateAction: false,
    };
  }

  // Grief/loss indicators
  const griefKeywords = [
    "passed away",
    "died",
    "death",
    "funeral",
    "mourning",
    "grief",
    "loss",
  ];
  if (griefKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "emotional_social",
      type: "grief_loss",
      severity: "high",
      confidence: 0.8,
      requiresImmediateAction: false,
    };
  }

  return null;
}

/**
 * Detect identity issues
 */
export function detectIdentityIssues(
  context: ScenarioContext,
  transcript: string
): DetectedScenario | null {
  const lowerTranscript = transcript.toLowerCase();

  // Not the intended customer
  if (
    lowerTranscript.includes("wrong number") ||
    lowerTranscript.includes("not me") ||
    lowerTranscript.includes("don't know") ||
    lowerTranscript.includes("never heard")
  ) {
    return {
      category: "identity_issues",
      type: "not_intended_customer",
      severity: "medium",
      confidence: 0.8,
      requiresImmediateAction: false,
    };
  }

  // Refuses to identify
  if (
    lowerTranscript.includes("none of your business") ||
    lowerTranscript.includes("won't tell") ||
    lowerTranscript.includes("not telling")
  ) {
    return {
      category: "identity_issues",
      type: "refuses_identity",
      severity: "medium",
      confidence: 0.7,
      requiresImmediateAction: false,
    };
  }

  // Child indicators (would need voice analysis in production)
  // For now, detect through language patterns
  if (
    lowerTranscript.match(/\b(mom|dad|mommy|daddy|parent)\b/i) &&
    lowerTranscript.length < 50
  ) {
    return {
      category: "identity_issues",
      type: "child",
      severity: "high",
      confidence: 0.6,
      requiresImmediateAction: true,
    };
  }

  return null;
}

/**
 * Detect business logic scenarios
 */
export function detectBusinessLogicScenario(
  context: ScenarioContext,
  transcript: string
): DetectedScenario | null {
  const lowerTranscript = transcript.toLowerCase();

  // Unsubscribe/Do-not-call
  const dncKeywords = [
    "remove",
    "unsubscribe",
    "don't call",
    "stop calling",
    "do not call",
    "take me off",
    "opt out",
  ];
  if (dncKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "business_logic",
      type: "unsubscribe_dnc",
      severity: "high",
      confidence: 0.9,
      requiresImmediateAction: true,
    };
  }

  // Legal concerns
  const legalKeywords = [
    "lawyer",
    "attorney",
    "legal",
    "sue",
    "lawsuit",
    "court",
    "litigation",
  ];
  if (legalKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "business_logic",
      type: "legal_concern",
      severity: "high",
      confidence: 0.8,
      requiresImmediateAction: true,
    };
  }

  // Outside business hours
  if (context.businessHours === false) {
    return {
      category: "business_logic",
      type: "outside_hours",
      severity: "low",
      confidence: 1.0,
      requiresImmediateAction: false,
    };
  }

  // Testing AI / thinks human
  const aiTestKeywords = [
    "are you a robot",
    "are you ai",
    "are you real",
    "are you human",
    "artificial intelligence",
    "chatbot",
  ];
  if (aiTestKeywords.some((kw) => lowerTranscript.includes(kw))) {
    return {
      category: "caller_behavior",
      type: "testing_ai",
      severity: "low",
      confidence: 0.9,
      requiresImmediateAction: false,
    };
  }

  // Thinks human
  if (
    lowerTranscript.includes("thank you so much") &&
    lowerTranscript.includes("person") &&
    !lowerTranscript.includes("ai")
  ) {
    return {
      category: "caller_behavior",
      type: "thinks_human",
      severity: "low",
      confidence: 0.6,
      requiresImmediateAction: false,
    };
  }

  return null;
}

/**
 * Main scenario detection function
 * Analyzes context and transcript to detect which scenario is active
 */
export function detectScenario(
  context: ScenarioContext,
  transcript: string
): DetectedScenario {
  // Priority order: safety > emotional > audio > identity > business > behavior

  // 1. Safety & compliance (highest priority)
  const businessLogic = detectBusinessLogicScenario(context, transcript);
  if (businessLogic && businessLogic.requiresImmediateAction) {
    return businessLogic;
  }

  // 2. Emotional scenarios (high priority)
  const emotional = detectEmotionalScenario(context, transcript);
  if (emotional && emotional.requiresImmediateAction) {
    return emotional;
  }

  // 3. Identity issues (high priority for safety)
  const identity = detectIdentityIssues(context, transcript);
  if (identity && identity.requiresImmediateAction) {
    return identity;
  }

  // 4. Audio issues
  const audio = detectAudioIssues(context);
  if (audio && audio.requiresImmediateAction) {
    return audio;
  }

  // 5. Return other detected scenarios
  if (emotional) return emotional;
  if (audio) return audio;
  if (identity) return identity;
  if (businessLogic) return businessLogic;

  // 6. Caller behavior (lowest priority)
  const behavior = detectCallerBehavior(context);
  if (behavior) return behavior;

  // 7. Normal scenario
  return {
    category: "normal",
    severity: "low",
    confidence: 1.0,
    requiresImmediateAction: false,
  };
}

/**
 * Check if scenario requires graceful exit
 */
export function requiresGracefulExit(scenario: DetectedScenario): boolean {
  if (scenario.category === "emotional_social" && scenario.type === "emergency") {
    return true;
  }
  if (scenario.category === "business_logic" && scenario.type === "unsubscribe_dnc") {
    return true;
  }
  if (scenario.category === "identity_issues" && scenario.type === "child") {
    return true;
  }
  if (scenario.category === "audio_technical" && scenario.type === "voicemail") {
    return true;
  }
  return false;
}

/**
 * Get retry count for scenario
 */
export function getRetryCount(scenario: DetectedScenario): number {
  if (scenario.category === "audio_technical") {
    return 2; // Retry twice for audio issues
  }
  return 0; // No retry for other scenarios
}
