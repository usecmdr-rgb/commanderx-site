/**
 * Aloha Contact Memory System
 * 
 * Manages lightweight contact profiles per phone number.
 * Provides lookup, creation, and update functions for contact memory.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export interface ContactProfile {
  id: string;
  user_id: string;
  phone_number: string;
  name: string | null;
  notes: string | null;
  do_not_call: boolean;
  preferred_call_window: any | null; // JSONB
  last_called_at: string | null;
  last_campaign_id: string | null;
  last_outcome: string | null;
  times_contacted: number;
  created_at: string;
  updated_at: string;
}

export interface ContactProfileInsert {
  user_id: string;
  phone_number: string;
  name?: string | null;
  notes?: string | null;
  do_not_call?: boolean;
  preferred_call_window?: any | null;
}

export interface ContactProfileUpdate {
  name?: string | null;
  notes?: string | null;
  do_not_call?: boolean;
  preferred_call_window?: any | null;
  last_called_at?: string | null;
  last_campaign_id?: string | null;
  last_outcome?: string | null;
  times_contacted?: number;
}

/**
 * Normalize phone number to E.164 format
 * Basic implementation - can be enhanced
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "");
  
  // If doesn't start with +, assume US number
  if (!normalized.startsWith("+")) {
    // If starts with 1 and has 11 digits total, add +
    if (normalized.length === 11 && normalized.startsWith("1")) {
      normalized = "+" + normalized;
    }
    // If has 10 digits, assume US and add +1
    else if (normalized.length === 10) {
      normalized = "+1" + normalized;
    }
  }
  
  return normalized;
}

/**
 * Look up or create a contact profile for a phone number
 */
export async function lookupOrCreateContact(
  userId: string,
  phoneNumber: string
): Promise<ContactProfile | null> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  
  if (!normalized || normalized.length < 10) {
    return null; // Invalid phone number
  }
  
  // Try to find existing contact
  const { data: existing, error: lookupError } = await supabase
    .from("contact_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("phone_number", normalized)
    .maybeSingle();
  
  if (lookupError) {
    console.error("Error looking up contact:", lookupError);
    return null;
  }
  
  if (existing) {
    return existing as ContactProfile;
  }
  
  // Create new contact profile
  const { data: newContact, error: createError } = await supabase
    .from("contact_profiles")
    .insert({
      user_id: userId,
      phone_number: normalized,
      times_contacted: 0,
      do_not_call: false,
    })
    .select()
    .single();
  
  if (createError) {
    console.error("Error creating contact profile:", createError);
    return null;
  }
  
  return newContact as ContactProfile;
}

/**
 * Update contact profile after a call
 */
export async function updateContactAfterCall(
  userId: string,
  phoneNumber: string,
  update: ContactProfileUpdate & {
    last_campaign_id?: string | null;
    sentiment?: string | null;
  }
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  
  if (!normalized) {
    return false;
  }
  
  // Find contact
  const { data: contact } = await supabase
    .from("contact_profiles")
    .select("id, times_contacted")
    .eq("user_id", userId)
    .eq("phone_number", normalized)
    .maybeSingle();
  
  if (!contact) {
    // Contact should exist, but if not, create it
    await lookupOrCreateContact(userId, normalized);
    return false; // Will update on next call
  }
  
  // Prepare update
  const updateData: any = {
    ...update,
  };
  
  // Increment times_contacted
  if (update.last_called_at) {
    updateData.times_contacted = (contact.times_contacted || 0) + 1;
  }
  
  // Update contact profile
  const { error: updateError } = await supabase
    .from("contact_profiles")
    .update(updateData)
    .eq("id", contact.id);
  
  if (updateError) {
    console.error("Error updating contact profile:", updateError);
    return false;
  }
  
  return true;
}

/**
 * Check if a contact should not be called (do-not-call flag)
 */
export async function shouldNotCall(
  userId: string,
  phoneNumber: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  
  if (!normalized) {
    return false;
  }
  
  const { data: contact } = await supabase
    .from("contact_profiles")
    .select("do_not_call")
    .eq("user_id", userId)
    .eq("phone_number", normalized)
    .maybeSingle();
  
  return contact?.do_not_call === true;
}

/**
 * Set do-not-call flag for a contact
 */
export async function setDoNotCall(
  userId: string,
  phoneNumber: string,
  doNotCall: boolean = true
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizePhoneNumber(phoneNumber);
  
  if (!normalized) {
    return false;
  }
  
  // Look up or create contact
  const contact = await lookupOrCreateContact(userId, normalized);
  if (!contact) {
    return false;
  }
  
  // Update do_not_call flag
  const { error } = await supabase
    .from("contact_profiles")
    .update({ do_not_call: doNotCall })
    .eq("id", contact.id);
  
  if (error) {
    console.error("Error setting do-not-call flag:", error);
    return false;
  }
  
  return true;
}

/**
 * Extract caller name from transcript or conversation
 * Simple heuristic - can be enhanced
 */
export function extractCallerName(transcript: string, previousContext?: string): string | null {
  // Look for patterns like "I'm John" or "This is John" or "My name is John"
  const namePatterns = [
    /(?:I'?m|I am|this is|my name is|it'?s|it is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:speaking|calling) (?:with|to) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  
  const fullText = previousContext ? `${previousContext} ${transcript}` : transcript;
  
  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Basic validation: name should be 2-50 characters and not common words
      if (name.length >= 2 && name.length <= 50 && 
          !["Hi", "Hello", "Hey", "Yes", "No", "Sure", "Okay"].includes(name)) {
        return name;
      }
    }
  }
  
  return null;
}

/**
 * Update contact name if we learn it during the call
 */
export async function updateContactNameIfLearned(
  userId: string,
  phoneNumber: string,
  transcript: string,
  previousContext?: string
): Promise<boolean> {
  const contact = await lookupOrCreateContact(userId, phoneNumber);
  if (!contact || contact.name) {
    return false; // Contact doesn't exist or already has a name
  }
  
  const extractedName = extractCallerName(transcript, previousContext);
  if (!extractedName) {
    return false;
  }
  
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("contact_profiles")
    .update({ name: extractedName })
    .eq("id", contact.id);
  
  if (error) {
    console.error("Error updating contact name:", error);
    return false;
  }
  
  return true;
}

/**
 * Get contact profile for call context
 */
export async function getContactForCallContext(
  userId: string,
  phoneNumber: string
): Promise<ContactProfile | null> {
  return await lookupOrCreateContact(userId, phoneNumber);
}

/**
 * Determine call outcome from conversation
 */
export function determineCallOutcome(
  intent: any,
  transcript: string,
  summary?: string
): string | null {
  const lowerTranscript = transcript.toLowerCase();
  const lowerSummary = summary?.toLowerCase() || "";
  
  // Check for explicit outcomes in transcript or summary
  if (lowerTranscript.includes("do not call") || lowerTranscript.includes("don't call") ||
      lowerSummary.includes("do not call") || lowerSummary.includes("don't call")) {
    return "do_not_call";
  }
  
  if (lowerTranscript.includes("unsubscribe") || lowerSummary.includes("unsubscribe")) {
    return "do_not_call";
  }
  
  if (lowerTranscript.includes("reschedule") || lowerSummary.includes("reschedule")) {
    return "rescheduled";
  }
  
  if (lowerTranscript.includes("feedback") || lowerSummary.includes("feedback")) {
    return "feedback_collected";
  }
  
  if (lowerTranscript.includes("email") && (lowerTranscript.includes("send") || lowerTranscript.includes("follow"))) {
    return "asked_for_email";
  }
  
  if (lowerTranscript.includes("not interested") || lowerSummary.includes("not interested")) {
    return "not_interested";
  }
  
  if (intent?.callFlowIntent === "wants_unsubscribe") {
    return "do_not_call";
  }
  
  if (intent?.callFlowIntent === "wants_reschedule") {
    return "rescheduled";
  }
  
  // Default: return null to let caller specify
  return null;
}

