/**
 * Aloha Natural Voice Dynamics
 * 
 * Shapes text BEFORE sending to TTS to make Aloha sound more human.
 * Features:
 * - Micro pauses ("…") between clauses
 * - Natural disfluencies (sparingly)
 * - Softening phrases
 * - Vary sentence lengths
 * - Avoid robotic patterns
 * - Adjust style based on detected emotion
 */

import type { EmotionalState } from "./intent-classification";

export interface VoiceDynamicsOptions {
  emotion?: EmotionalState;
  context?: "greeting" | "question_answering" | "clarification" | "closing" | "normal";
  callerRushed?: boolean;
  callerConfused?: boolean;
  intensity?: "subtle" | "moderate" | "natural"; // How much to apply dynamics
}

/**
 * Softening phrases to make responses more natural
 */
const SOFTENING_PHRASES = [
  "I can help with that",
  "No worries",
  "That makes sense",
  "Absolutely",
  "Sure thing",
  "Of course",
  "I understand",
  "Got it",
  "Right",
  "Okay",
];

/**
 * Natural disfluencies (used sparingly)
 */
const DISFLUENCIES = [
  "okay",
  "so",
  "let me see",
  "sure",
  "right",
  "well",
  "um",
  "actually",
];

/**
 * Phrases to avoid (too robotic)
 */
const ROBOTIC_PATTERNS = [
  /as an AI assistant/gi,
  /as an artificial intelligence/gi,
  /I am programmed to/gi,
  /my programming/gi,
  /based on my training data/gi,
];

/**
 * Add micro pauses between clauses
 */
function addMicroPauses(text: string, intensity: "subtle" | "moderate" | "natural"): string {
  if (intensity === "subtle") {
    // Only add pauses after longer sentences
    return text.replace(/\.(\s+[A-Z])/g, (match, space) => {
      if (Math.random() < 0.15) {
        return `…${space}`;
      }
      return `.${space}`;
    });
  } else if (intensity === "moderate") {
    // Add pauses more frequently
    return text.replace(/([,;]|\band\b|\bbut\b|\bor\b)(\s+)/g, (match, punc, space) => {
      if (Math.random() < 0.25 && match.length > 50) {
        return `${punc}…${space}`;
      }
      return match;
    }).replace(/\.(\s+[A-Z])/g, (match, space) => {
      if (Math.random() < 0.3) {
        return `…${space}`;
      }
      return `.${space}`;
    });
  } else {
    // Natural - more pauses in natural places
    return text
      .replace(/([,;])(\s+)/g, (match, punc, space) => {
        if (Math.random() < 0.3) {
          return `${punc}…${space}`;
        }
        return match;
      })
      .replace(/(\band\b|\bbut\b|\bor\b)(\s+)/g, (match, conj, space) => {
        if (Math.random() < 0.2 && match.length > 60) {
          return `${conj}…${space}`;
        }
        return match;
      })
      .replace(/\.(\s+[A-Z])/g, (match, space) => {
        if (Math.random() < 0.4) {
          return `…${space}`;
        }
        return `.${space}`;
      });
  }
}

/**
 * Add natural disfluencies (sparingly, context-aware)
 */
function addDisfluencies(
  text: string,
  context: VoiceDynamicsOptions["context"],
  intensity: "subtle" | "moderate" | "natural"
): string {
  // Don't add disfluencies in greetings or closings
  if (context === "greeting" || context === "closing") {
    return text;
  }

  // Be very sparing in clarifications
  if (context === "clarification" && intensity === "subtle") {
    return text;
  }

  const threshold = intensity === "subtle" ? 0.05 : intensity === "moderate" ? 0.12 : 0.2;
  
  // Add disfluency at start of longer responses (only if natural)
  if (text.length > 50 && Math.random() < threshold) {
    const disfluency = DISFLUENCIES[Math.floor(Math.random() * DISFLUENCIES.length)];
    // Only add if it makes sense contextually
    if (text.toLowerCase().startsWith("i ") || text.toLowerCase().startsWith("we ")) {
      return `${disfluency.charAt(0).toUpperCase() + disfluency.slice(1)}, ${text}`;
    }
  }

  return text;
}

/**
 * Add softening phrases when appropriate
 */
function addSofteningPhrases(
  text: string,
  emotion?: EmotionalState,
  context?: VoiceDynamicsOptions["context"]
): string {
  // Don't add softening phrases in greetings/closings
  if (context === "greeting" || context === "closing") {
    return text;
  }

  // Add softening phrases when caller is upset/angry
  if (emotion === "angry" || emotion === "upset" || emotion === "frustrated") {
    // 40% chance to add softening phrase at the start
    if (Math.random() < 0.4 && !text.toLowerCase().startsWith("i understand")) {
      const softening = SOFTENING_PHRASES[Math.floor(Math.random() * SOFTENING_PHRASES.length)];
      return `${softening}. ${text}`;
    }
  }

  // Add softening phrase when clarifying
  if (context === "clarification" && Math.random() < 0.3) {
    const softening = SOFTENING_PHRASES[Math.floor(Math.random() * SOFTENING_PHRASES.length)];
    return `${softening}. ${text}`;
  }

  return text;
}

/**
 * Vary sentence lengths (avoid all short or all long)
 */
function varySentenceLengths(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) {
    return text; // Can't vary if only one sentence
  }

  // If all sentences are very short, combine some
  const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  if (avgLength < 30 && sentences.length > 2) {
    // Combine some short sentences
    const combined: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      if (i + 1 < sentences.length && sentences[i].length < 40 && sentences[i + 1].length < 40) {
        combined.push(sentences[i] + " " + sentences[i + 1].toLowerCase());
      } else {
        combined.push(sentences[i]);
      }
    }
    return combined.join(" ");
  }

  // If all sentences are very long, keep as is but may have already been split
  return text;
}

/**
 * Remove robotic patterns
 */
function removeRoboticPatterns(text: string): string {
  let cleaned = text;
  for (const pattern of ROBOTIC_PATTERNS) {
    cleaned = cleaned.replace(pattern, (match) => {
      // Replace with more natural alternatives
      if (match.toLowerCase().includes("ai assistant")) {
        return "";
      }
      if (match.toLowerCase().includes("artificial intelligence")) {
        return "";
      }
      if (match.toLowerCase().includes("programmed")) {
        return "I can";
      }
      return "";
    });
  }
  return cleaned.trim();
}

/**
 * Adjust pace based on emotion and context
 */
function adjustPace(text: string, options: VoiceDynamicsOptions): string {
  let adjusted = text;

  // If caller is rushed, shorten responses
  if (options.callerRushed) {
    // Remove extra words, make it more concise
    adjusted = adjusted.replace(/\s+/g, " ").trim();
    // Remove redundant phrases
    adjusted = adjusted.replace(/\b(I|We) (can|will) (definitely|certainly|absolutely) /gi, "$1 $2 ");
    adjusted = adjusted.replace(/\b(I|We) (think|believe) that /gi, "");
    adjusted = adjusted.replace(/\bfor your information\b/gi, "");
  }

  // If caller is confused, add more explicit breaks
  if (options.callerConfused) {
    // Add pauses between concepts
    adjusted = adjusted.replace(/(\w+)(\s+)(first|second|third|next|then|finally)/gi, "$1…$2$3");
  }

  // If caller is stressed, be more reassuring and slower-paced
  if (options.emotion === "stressed") {
    // Add gentle phrases
    if (!adjusted.toLowerCase().includes("no worries") && !adjusted.toLowerCase().includes("don't worry")) {
      if (Math.random() < 0.3) {
        adjusted = `No worries, ${adjusted.charAt(0).toLowerCase() + adjusted.slice(1)}`;
      }
    }
  }

  return adjusted;
}

/**
 * Apply emotion-aware adjustments
 */
function applyEmotionAwareAdjustments(
  text: string,
  emotion?: EmotionalState
): string {
  let adjusted = text;

  switch (emotion) {
    case "angry":
    case "upset":
    case "frustrated":
      // Use gentle, de-escalating language
      adjusted = adjusted.replace(/\bI can't\b/gi, "I'm not able to");
      adjusted = adjusted.replace(/\bNo\b/gi, "Unfortunately, no");
      adjusted = adjusted.replace(/\bCan't\b/gi, "Unfortunately can't");
      // Ensure empathy phrase is present
      if (!adjusted.toLowerCase().includes("understand") && !adjusted.toLowerCase().includes("sorry")) {
        if (Math.random() < 0.5) {
          adjusted = `I understand. ${adjusted}`;
        } else {
          adjusted = `I'm sorry to hear that. ${adjusted}`;
        }
      }
      break;

    case "confused":
      // Be more explicit and clear
      adjusted = adjusted.replace(/\bit\b/gi, (match, offset) => {
        // Replace vague "it" with more explicit references when possible
        return match;
      });
      // Add clarity phrases
      if (!adjusted.toLowerCase().includes("to be clear") && Math.random() < 0.4) {
        adjusted = `To be clear, ${adjusted.charAt(0).toLowerCase() + adjusted.slice(1)}`;
      }
      break;

    case "stressed":
      // Be reassuring and efficient
      adjusted = adjusted.replace(/\bI understand\b/gi, "I completely understand");
      if (!adjusted.toLowerCase().includes("quick") && !adjusted.toLowerCase().includes("fast")) {
        if (Math.random() < 0.3) {
          adjusted = `I'll keep this quick. ${adjusted}`;
        }
      }
      break;

    case "happy":
      // Match the positive energy
      if (!adjusted.toLowerCase().includes("great") && !adjusted.toLowerCase().includes("wonderful")) {
        if (Math.random() < 0.2) {
          adjusted = `That's great! ${adjusted}`;
        }
      }
      break;
  }

  return adjusted;
}

/**
 * Main function: Apply natural voice dynamics to text
 */
export function applyVoiceDynamics(
  text: string,
  options: VoiceDynamicsOptions = {}
): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const {
    emotion,
    context = "normal",
    callerRushed = false,
    callerConfused = false,
    intensity = "moderate",
  } = options;

  let shaped = text;

  // 1. Remove robotic patterns first
  shaped = removeRoboticPatterns(shaped);

  // 2. Apply emotion-aware adjustments
  shaped = applyEmotionAwareAdjustments(shaped, emotion);

  // 3. Add softening phrases
  shaped = addSofteningPhrases(shaped, emotion, context);

  // 4. Adjust pace based on context
  shaped = adjustPace(shaped, { emotion, context, callerRushed, callerConfused, intensity });

  // 5. Vary sentence lengths
  shaped = varySentenceLengths(shaped);

  // 6. Add natural disfluencies (sparingly)
  shaped = addDisfluencies(shaped, context, intensity);

  // 7. Add micro pauses
  shaped = addMicroPauses(shaped, intensity);

  // Clean up any double spaces or odd punctuation
  shaped = shaped.replace(/\s+/g, " ").trim();
  shaped = shaped.replace(/…+/g, "…"); // Multiple pauses become one
  shaped = shaped.replace(/…\s*…/g, "…"); // Remove consecutive pauses

  return shaped;
}

