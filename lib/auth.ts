import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { AgentId } from "@/lib/config/agents";

// Admin email addresses
const ADMIN_EMAILS = ["usecmdr@gmail.com"];

// Agent access by tier
const AGENT_ACCESS_BY_TIER: Record<string, AgentId[]> = {
  basic: ["sync"], // Basic tier: Sync only
  advanced: ["sync", "aloha", "studio"], // Advanced: Sync + Aloha + Studio
  elite: ["sync", "aloha", "studio", "insight"], // Elite: All agents
};

/**
 * Check if a user email is an admin
 */
export async function isAdmin(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get user's subscription tier from Supabase
 */
export async function getUserSubscriptionTier(userId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", userId)
    .single();

  // Only return tier if subscription is active or trialing
  if (profile?.subscription_status === "active" || profile?.subscription_status === "trialing") {
    return profile.subscription_tier || null;
  }

  return null;
}

/**
 * Get user's email from Supabase auth
 * Note: This function should be called with the user object from auth.getUser() when possible
 */
export async function getUserEmail(userId: string, userEmail?: string | null): Promise<string | null> {
  // If email is already provided, use it
  if (userEmail) {
    return userEmail;
  }

  // Fallback: try to get from profiles table
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  
  return profile?.email || null;
}

/**
 * Check if user has access to a specific agent
 */
export async function hasAgentAccess(userId: string, agentId: AgentId, userEmail?: string | null): Promise<boolean> {
  // Check if user is admin - admins have access to all agents
  const email = await getUserEmail(userId, userEmail);
  if (email && await isAdmin(email)) {
    return true;
  }

  // Get user's subscription tier
  const tier = await getUserSubscriptionTier(userId);
  
  if (!tier) {
    return false; // No active subscription
  }

  // Check if agent is included in user's tier
  const allowedAgents = AGENT_ACCESS_BY_TIER[tier] || [];
  return allowedAgents.includes(agentId);
}

/**
 * Get list of agents user has access to
 */
export async function getUserAccessibleAgents(userId: string, userEmail?: string | null): Promise<AgentId[]> {
  // Check if user is admin - admins have access to all agents
  const email = await getUserEmail(userId, userEmail);
  if (email && await isAdmin(email)) {
    return ["sync", "aloha", "studio", "insight"];
  }

  // Get user's subscription tier
  const tier = await getUserSubscriptionTier(userId);
  
  if (!tier) {
    return []; // No active subscription
  }

  return AGENT_ACCESS_BY_TIER[tier] || [];
}

