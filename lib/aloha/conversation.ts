/**
 * Aloha Conversational Middleware
 * 
 * Enhances Aloha's responses to be more human-like:
 * - Adds natural backchannels
 * - Splits long responses into chunks
 * - Adds micro-pauses
 * - Varies sentence structure
 */

export interface ConversationOptions {
  addBackchannels?: boolean;
  splitLongResponses?: boolean;
  addPauses?: boolean;
  maxChunkLength?: number; // Maximum characters per chunk
}

const BACKCHANNELS = [
  "Mm-hmm",
  "Got it",
  "Okay",
  "I see",
  "Right",
  "Sure",
  "Absolutely",
  "Of course",
];

/**
 * Add natural backchannels to responses when appropriate
 */
function addBackchannels(text: string): string {
  // Only add backchannels if the response is long enough and contains complex information
  if (text.length < 100) {
    return text;
  }

  // Check if response contains explanations or lists
  const hasComplexContent =
    text.includes("because") ||
    text.includes("however") ||
    text.includes("also") ||
    text.match(/\d+\./g) || // Numbered lists
    text.split("\n").length > 2;

  if (!hasComplexContent) {
    return text;
  }

  // Randomly add a backchannel after the first sentence (30% chance)
  if (Math.random() < 0.3) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 1) {
      const backchannel = BACKCHANNELS[Math.floor(Math.random() * BACKCHANNELS.length)];
      return `${sentences[0]}. ${backchannel}. ${sentences.slice(1).join(". ")}.`;
    }
  }

  return text;
}

/**
 * Split long responses into chunks with natural breaks
 */
function splitIntoChunks(text: string, maxLength: number = 300): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Add micro-pauses between sentences in long responses
 */
function addMicroPauses(text: string): string {
  // Add small pauses (represented as ...) after sentences in longer responses
  if (text.length < 150) {
    return text;
  }

  // Replace some periods with ellipses for natural pauses (20% chance per sentence)
  return text.replace(/\.(\s+[A-Z])/g, (match, p1) => {
    if (Math.random() < 0.2) {
      return `...${p1}`;
    }
    return `.${p1}`;
  });
}

/**
 * Process Aloha's response to make it more human-like
 */
export function enhanceConversation(
  text: string,
  options: ConversationOptions = {}
): string {
  const {
    addBackchannels: enableBackchannels = true,
    splitLongResponses: enableSplitting = false,
    addPauses: enablePauses = true,
    maxChunkLength = 300,
  } = options;

  let enhanced = text;

  // Add backchannels
  if (enableBackchannels) {
    enhanced = addBackchannels(enhanced);
  }

  // Add micro-pauses
  if (enablePauses) {
    enhanced = addMicroPauses(enhanced);
  }

  // Note: Splitting is handled separately for streaming purposes
  // We return the enhanced text, and chunks can be created via splitIntoChunks()

  return enhanced;
}

/**
 * Get chunks for streaming (for real-time TTS)
 */
export function getStreamingChunks(
  text: string,
  maxChunkLength: number = 300
): string[] {
  return splitIntoChunks(text, maxChunkLength);
}

/**
 * Check if response should include a check-in question
 */
export function shouldAddCheckIn(text: string): boolean {
  // Add check-in questions for longer explanations (40% chance)
  if (text.length > 200 && Math.random() < 0.4) {
    return true;
  }
  return false;
}

/**
 * Add a natural check-in question to the end of a response
 */
export function addCheckIn(text: string): string {
  const checkIns = [
    "Does that answer your question?",
    "Is that helpful?",
    "Does that make sense?",
    "Is that okay for you?",
    "Would you like me to clarify anything?",
  ];

  const checkIn = checkIns[Math.floor(Math.random() * checkIns.length)];
  return `${text} ${checkIn}`;
}

