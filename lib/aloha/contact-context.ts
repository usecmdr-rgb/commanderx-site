/**
 * Aloha Contact Context
 * 
 * Helper functions to build contact context for LLM prompts and call handling.
 * Ensures contact memory is used in a safe, privacy-conscious way.
 */

import type { ContactProfile } from "./contact-memory";

export interface ContactContext {
  hasContact: boolean;
  name: string | null;
  timesContacted: number;
  lastOutcome: string | null;
  notes: string | null;
  doNotCall: boolean;
  lastCalledAt: string | null;
}

/**
 * Build contact context for LLM prompt
 * Only includes safe, non-sensitive information
 */
export function buildContactContext(contact: ContactProfile | null): ContactContext {
  if (!contact) {
    return {
      hasContact: false,
      name: null,
      timesContacted: 0,
      lastOutcome: null,
      notes: null,
      doNotCall: false,
      lastCalledAt: null,
    };
  }

  return {
    hasContact: true,
    name: contact.name,
    timesContacted: contact.times_contacted || 0,
    lastOutcome: contact.last_outcome,
    notes: contact.notes,
    doNotCall: contact.do_not_call,
    lastCalledAt: contact.last_called_at,
  };
}

/**
 * Build contact context string for LLM system prompt
 * Safe, natural-sounding context that doesn't sound creepy
 */
export function buildContactContextPrompt(contact: ContactProfile | null): string {
  if (!contact) {
    return "";
  }

  const parts: string[] = [];

  // Name (if known)
  if (contact.name) {
    parts.push(`The caller's name is ${contact.name}.`);
  }

  // Prior interaction count (if contacted before)
  if (contact.times_contacted > 0) {
    const timesText = contact.times_contacted === 1 ? "once before" : `${contact.times_contacted} times before`;
    parts.push(`You've spoken with this caller ${timesText}.`);
  }

  // Last outcome (if known and relevant)
  if (contact.last_outcome) {
    switch (contact.last_outcome) {
      case "rescheduled":
        parts.push("In a previous call, they rescheduled an appointment.");
        break;
      case "feedback_collected":
        parts.push("You've collected feedback from them before.");
        break;
      case "asked_for_email":
        parts.push("In a previous call, they requested email follow-up.");
        break;
      case "not_interested":
        parts.push("They previously indicated they weren't interested.");
        break;
      // Don't mention do_not_call in prompt - handle separately
    }
  }

  // Notes (if they contain safe, actionable information)
  if (contact.notes) {
    // Only include notes if they're short and non-sensitive
    const safeNotes = contact.notes.length <= 100 ? contact.notes : null;
    if (safeNotes && !safeNotes.toLowerCase().includes("sensitive")) {
      parts.push(`Note: ${safeNotes}`);
    }
  }

  // Last called time (if recent, mention it naturally)
  if (contact.last_called_at) {
    const lastCalled = new Date(contact.last_called_at);
    const daysAgo = Math.floor((Date.now() - lastCalled.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) {
      parts.push("You spoke with them earlier today.");
    } else if (daysAgo === 1) {
      parts.push("You spoke with them yesterday.");
    } else if (daysAgo < 7) {
      parts.push(`You spoke with them ${daysAgo} days ago.`);
    }
  }

  if (parts.length === 0) {
    return "";
  }

  return `\n\nCONTACT CONTEXT:\n${parts.join(" ")}\n`;
}

/**
 * Build greeting adjustment based on contact context
 */
export function buildGreetingAdjustment(
  contact: ContactProfile | null,
  agentName: string,
  businessName: string
): string {
  if (!contact || contact.times_contacted === 0) {
    // First time contact - standard greeting
    if (contact?.name) {
      return `Hi, this is ${agentName} from ${businessName}. Am I speaking with ${contact.name}?`;
    }
    return `Hi, this is ${agentName} from ${businessName}.`;
  }

  // Returning contact
  const parts: string[] = [];
  
  if (contact.name) {
    parts.push(`Hi ${contact.name},`);
  } else {
    parts.push("Hi,");
  }
  
  parts.push(`this is ${agentName} from ${businessName}.`);

  // Acknowledge prior interaction if recent
  if (contact.last_outcome === "rescheduled") {
    parts.push("I'm just following up on the appointment we discussed.");
  } else if (contact.last_outcome === "feedback_collected") {
    parts.push("Thanks again for your feedback last time.");
  } else if (contact.times_contacted > 1) {
    parts.push("Thanks for taking the time to speak with me again.");
  }

  return parts.join(" ");
}

/**
 * Check if contact outcome suggests negative sentiment
 */
export function hasNegativeSentiment(contact: ContactProfile | null): boolean {
  if (!contact || !contact.last_outcome) {
    return false;
  }

  const negativeOutcomes = ["not_interested", "do_not_call"];
  return negativeOutcomes.includes(contact.last_outcome);
}

/**
 * Build tone adjustment based on contact history
 */
export function getToneAdjustment(contact: ContactProfile | null): string {
  if (!contact) {
    return "";
  }

  if (hasNegativeSentiment(contact)) {
    return "Be extra empathetic and respectful. The caller may have had a negative prior experience.";
  }

  if (contact.times_contacted > 3) {
    return "This is a returning caller - be efficient and acknowledge the relationship.";
  }

  return "";
}

