/**
 * Aloha Campaign Filters
 * 
 * Functions to filter campaign targets based on do-not-call flags and other criteria.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { normalizePhoneNumber, shouldNotCall } from "./contact-memory";

/**
 * Filter out contacts with do-not-call flag from campaign targets
 */
export async function filterDoNotCallContacts(
  userId: string,
  phoneNumbers: string[]
): Promise<{
  allowed: string[];
  blocked: string[];
}> {
  const supabase = getSupabaseServerClient();
  const normalized = phoneNumbers.map(normalizePhoneNumber);
  
  const allowed: string[] = [];
  const blocked: string[] = [];
  
  // Check each phone number
  for (const phoneNumber of normalized) {
    if (!phoneNumber || phoneNumber.length < 10) {
      blocked.push(phoneNumber); // Invalid number
      continue;
    }
    
    // Check do-not-call flag
    const isDoNotCall = await shouldNotCall(userId, phoneNumber);
    
    if (isDoNotCall) {
      blocked.push(phoneNumber);
    } else {
      allowed.push(phoneNumber);
    }
  }
  
  return { allowed, blocked };
}

/**
 * Get do-not-call count for a campaign target list
 */
export async function getDoNotCallCount(
  userId: string,
  phoneNumbers: string[]
): Promise<number> {
  const supabase = getSupabaseServerClient();
  const normalized = phoneNumbers.map(normalizePhoneNumber).filter(Boolean);
  
  if (normalized.length === 0) {
    return 0;
  }
  
  const { count, error } = await supabase
    .from("contact_profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("do_not_call", true)
    .in("phone_number", normalized);
  
  if (error) {
    console.error("Error counting do-not-call contacts:", error);
    return 0;
  }
  
  return count || 0;
}

