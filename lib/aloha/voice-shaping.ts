/**
 * Aloha Voice Shaping Layer
 * 
 * Applies human-like voice rules to all Aloha responses before TTS.
 * This layer makes Aloha sound more natural and conversational.
 * 
 * Rules applied:
 * - Natural pacing
 * - Micro-pauses
 * - Light disfluencies
 * - Softening language
 * - Tone adjustments
 * - Grounding cues
 * - Clean endings
 */

export interface VoiceShapingOptions {
  callerTone?: "rushed" | "calm" | "emotional" | "confused" | "neutral";
  contentComplexity?: "simple" | "moderate" | "complex";
  conversationState?: "opening" | "middle" | "closing" | "handling_issue";
  enableDisfluencies?: boolean; // Default: true
  enableSoftening?: boolean; // Default: true
  enableGrounding?: boolean; // Default: true
}

/**
 * Softening phrases to make language more human and less robotic
 */
const SOFTENING_PHRASES = [
  "No worries at all.",
  "Happy to help.",
  "Totally understand.",
  "That makes sense.",
  "Absolutely.",
  "Of course.",
  "Sure thing.",
  "No problem.",
  "I get that.",
  "That's totally fair.",
];

/**
 * Grounding cues for active listening
 */
const GROUNDING_CUES = [
  "mm-hmm",
  "I see",
  "okay",
  "understood",
  "right",
  "that helps, thank you",
  "got it",
  "makes sense",
  "I hear you",
  "absolutely",
];

/**
 * Light disfluencies (use sparingly)
 */
const DISFLUENCIES = [
  "okay",
  "right",
  "let me see",
  "sure",
  "alright",
  "got it",
  "hmm",
  "well",
  "you know",
];

/**
 * Apply natural pacing markers based on caller tone and content complexity
 */
function applyPacingMarkers(text: string, options: VoiceShapingOptions): string {
  const { callerTone, contentComplexity } = options;

  // For rushed callers, keep it crisp and short
  if (callerTone === "rushed") {
    // Remove unnecessary words, keep sentences short
    return text
      .replace(/\s+/g, " ")
      .replace(/\.\s+/g, ". ")
      .trim();
  }

  // For complex content or emotional situations, add subtle slow-down markers
  if (contentComplexity === "complex" || callerTone === "emotional") {
    // Add slight pauses before important information
    return text.replace(/([.!?])\s+([A-Z])/g, "$1 ... $2");
  }

  return text;
}

/**
 * Insert micro-pauses at natural sentence boundaries
 */
function insertMicroPauses(text: string, options: VoiceShapingOptions): string {
  // Don't add pauses if caller is rushed
  if (options.callerTone === "rushed") {
    return text;
  }

  // Add micro-pauses after sentences (but not every one)
  let result = text;
  const sentences = text.split(/([.!?])\s+/);
  
  // Add pauses to ~30% of sentence boundaries (random but consistent)
  if (sentences.length > 2) {
    const pauseProbability = 0.3;
    let modified = false;
    
    result = text.replace(/([.!?])\s+([A-Z])/g, (match, punct, next) => {
      if (Math.random() < pauseProbability && !modified) {
        modified = true;
        return `${punct} ... ${next}`;
      }
      return match;
    });
  }

  return result;
}

/**
 * Add light disfluencies sparingly (not every sentence)
 */
function addDisfluencies(text: string, options: VoiceShapingOptions): string {
  if (!options.enableDisfluencies) {
    return text;
  }

  // Only add disfluencies to ~15% of responses
  if (Math.random() > 0.15) {
    return text;
  }

  const disfluency = DISFLUENCIES[Math.floor(Math.random() * DISFLUENCIES.length)];
  
  // Add at the start of a sentence, but not always
  if (text.length > 50 && Math.random() < 0.3) {
    return `${disfluency}, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }

  return text;
}

/**
 * Apply softening language to make responses more human
 */
function applySoftening(text: string, options: VoiceShapingOptions): string {
  if (!options.enableSoftening) {
    return text;
  }

  // Add softening phrases to ~20% of responses
  if (Math.random() > 0.2) {
    return text;
  }

  const softening = SOFTENING_PHRASES[Math.floor(Math.random() * SOFTENING_PHRASES.length)];
  
  // Add at the end of responses (before closing)
  if (text.length > 30 && !text.endsWith(".") && !text.endsWith("!") && !text.endsWith("?")) {
    return `${text}. ${softening}`;
  }

  // Or add at the beginning for certain contexts
  if (options.conversationState === "handling_issue" && Math.random() < 0.4) {
    return `${softening} ${text}`;
  }

  return text;
}

/**
 * Add grounding cues to show active listening
 */
function addGroundingCues(text: string, options: VoiceShapingOptions): string {
  if (!options.enableGrounding) {
    return text;
  }

  // Add grounding cues to ~25% of responses
  if (Math.random() > 0.25) {
    return text;
  }

  const cue = GROUNDING_CUES[Math.floor(Math.random() * GROUNDING_CUES.length)];
  
  // Add after the caller provides information
  if (options.conversationState === "middle" && text.length > 40) {
    // Insert after first sentence
    const firstSentenceEnd = text.search(/[.!?]/);
    if (firstSentenceEnd > 0) {
      return `${text.slice(0, firstSentenceEnd + 1)} ${cue}, ${text.slice(firstSentenceEnd + 1).trim()}`;
    }
  }

  return text;
}

/**
 * Adjust tone and prosody markers based on caller tone
 */
function applyToneMarkers(text: string, options: VoiceShapingOptions): string {
  const { callerTone } = options;

  // Warm tone → slightly more melodic (add emphasis markers)
  if (callerTone === "calm" || callerTone === "neutral") {
    // Add subtle emphasis to key words (represented as slight pauses)
    return text;
  }

  // Professional → steady and clear (remove unnecessary pauses)
  if (callerTone === "rushed") {
    return text.replace(/\s+/g, " ").trim();
  }

  // Empathetic → softer, slower (add gentle pauses)
  if (callerTone === "emotional" || callerTone === "confused") {
    return text.replace(/([.!?])\s+/g, "$1 ... ");
  }

  return text;
}

/**
 * Ensure clean endings (avoid abrupt hang-ups)
 */
function ensureCleanEnding(text: string, options: VoiceShapingOptions): string {
  const { conversationState } = options;

  // If this is a closing, ensure it ends naturally
  if (conversationState === "closing") {
    // Check if it already has a natural closing
    const hasClosing = /(thanks|thank you|appreciate|have a|take care|goodbye|bye)/i.test(text);
    
    if (!hasClosing && text.length > 20) {
      const closings = [
        "Thanks again for your time.",
        "Have a great day!",
        "Take care!",
        "Thanks so much!",
      ];
      const closing = closings[Math.floor(Math.random() * closings.length)];
      return `${text} ${closing}`;
    }
  }

  return text;
}

/**
 * Remove any AI-revealing language
 */
function removeAIRevealingLanguage(text: string): string {
  return text
    .replace(/\b(as an AI|I am an AI|I'm an AI|I am a machine|I'm a machine|as a machine)\b/gi, "I'm Aloha")
    .replace(/\b(I am a bot|I'm a bot|as a bot)\b/gi, "I'm Aloha")
    .replace(/\b(artificial intelligence|AI assistant)\b/gi, "assistant");
}

/**
 * Main voice shaping function
 * Applies all human voice rules to a response before TTS
 */
export function shapeVoice(
  text: string,
  options: VoiceShapingOptions = {}
): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Default options
  const opts: VoiceShapingOptions = {
    callerTone: options.callerTone || "neutral",
    contentComplexity: options.contentComplexity || "moderate",
    conversationState: options.conversationState || "middle",
    enableDisfluencies: options.enableDisfluencies !== false,
    enableSoftening: options.enableSoftening !== false,
    enableGrounding: options.enableGrounding !== false,
  };

  let shaped = text;

  // 1. Remove AI-revealing language first
  shaped = removeAIRevealingLanguage(shaped);

  // 2. Apply natural pacing
  shaped = applyPacingMarkers(shaped, opts);

  // 3. Insert micro-pauses
  shaped = insertMicroPauses(shaped, opts);

  // 4. Add light disfluencies (sparingly)
  shaped = addDisfluencies(shaped, opts);

  // 5. Apply softening language
  shaped = applySoftening(shaped, opts);

  // 6. Add grounding cues
  shaped = addGroundingCues(shaped, opts);

  // 7. Apply tone markers
  shaped = applyToneMarkers(shaped, opts);

  // 8. Ensure clean endings
  shaped = ensureCleanEnding(shaped, opts);

  // Clean up any double spaces or punctuation
  shaped = shaped.replace(/\s+/g, " ").replace(/\s+([.!?])/g, "$1").trim();

  return shaped;
}

/**
 * Detect caller tone from conversation context
 */
export function detectCallerTone(context: {
  sttConfidence?: number;
  callerEmotion?: string;
  responseTime?: number;
  conversationLength?: number;
}): "rushed" | "calm" | "emotional" | "confused" | "neutral" {
  // Low STT confidence might indicate confusion or bad connection
  if (context.sttConfidence && context.sttConfidence < 0.7) {
    return "confused";
  }

  // Fast response time might indicate rushed caller
  if (context.responseTime && context.responseTime < 500) {
    return "rushed";
  }

  // Explicit emotion detection
  if (context.callerEmotion) {
    if (["angry", "frustrated", "upset"].includes(context.callerEmotion)) {
      return "emotional";
    }
    if (["confused", "uncertain"].includes(context.callerEmotion)) {
      return "confused";
    }
  }

  // Default to neutral/calm
  return "neutral";
}

/**
 * Detect content complexity from text
 */
export function detectContentComplexity(text: string): "simple" | "moderate" | "complex" {
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

  // Complex: long sentences, technical terms, multiple clauses
  if (avgWordsPerSentence > 20 || wordCount > 100) {
    return "complex";
  }

  // Simple: short sentences, basic vocabulary
  if (avgWordsPerSentence < 10 && wordCount < 30) {
    return "simple";
  }

  return "moderate";
}

