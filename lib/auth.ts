import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { AgentId } from "@/lib/config/agents";
import { isSuperAdminEmail } from "@/lib/config/superAdmins";

// Admin email addresses (deprecated - use SUPER_ADMIN_EMAILS from config/superAdmins.ts)
// Keeping for backward compatibility
const ADMIN_EMAILS = ["usecmdr@gmail.com"];

// Agent access by tier
const AGENT_ACCESS_BY_TIER: Record<string, AgentId[]> = {
  trial: ["sync", "aloha", "studio", "insight"], // Trial: All agents (full access during trial)
  basic: ["sync"], // Basic tier: Sync only
  advanced: ["sync", "aloha", "studio"], // Advanced: Sync + Aloha + Studio
  elite: ["sync", "aloha", "studio", "insight"], // Elite: All agents
  // trial_expired: [] - No access
};

/**
 * Check if a user email is an admin (super admin)
 * Uses the centralized SUPER_ADMIN_EMAILS config
 */
export async function isAdmin(email: string | undefined | null): Promise<boolean> {
  return isSuperAdminEmail(email);
}

/**
 * Check if a user email is a super admin
 * Alias for isAdmin, but more explicit
 */
export function isSuperAdmin(email: string | undefined | null): boolean {
  return isSuperAdminEmail(email);
}

/**
 * Get user's subscription tier from Supabase
 * Prefers subscriptions table over profiles table
 * 
 * Super admins always return "elite" tier regardless of actual subscription
 */
export async function getUserSubscriptionTier(userId: string, userEmail?: string | null): Promise<string | null> {
  // Check if user is super admin - super admins always get elite tier
  const email = userEmail || await getUserEmail(userId);
  if (email && isSuperAdminEmail(email)) {
    return "elite";
  }

  const supabase = getSupabaseServerClient();
  
  // Try subscriptions table first (primary source of truth)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();

  if (subscription) {
  // Return tier if subscription is active, trialing, or trial (even if expired, we need to know)
  if (subscription.status === "active" || subscription.status === "trialing" || subscription.tier === "trial" || subscription.tier === "trial_expired") {
    return subscription.tier || null;
  }
  return null;
  }

  // Fallback to profiles table (for backward compatibility)
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", userId)
    .single();

  // Return tier if subscription is active, trialing, or trial (even if expired, we need to know)
  if (
    profile?.subscription_status === "active" || 
    profile?.subscription_status === "trialing" || 
    profile?.subscription_tier === "trial" || 
    profile?.subscription_tier === "trial_expired"
  ) {
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
  // Check if user is super admin - super admins have access to all agents
  const email = await getUserEmail(userId, userEmail);
  if (email && isSuperAdminEmail(email)) {
    return true;
  }

  // Get user's subscription tier (super admins will get "elite" from getUserSubscriptionTier)
  const tier = await getUserSubscriptionTier(userId, email);
  
  if (!tier) {
    return false; // No active subscription
  }

  // Trial expired users have no access (unless super admin, which is already handled above)
  if (tier === "trial_expired") {
    return false;
  }

  // Check if agent is included in user's tier
  const allowedAgents = AGENT_ACCESS_BY_TIER[tier] || [];
  return allowedAgents.includes(agentId);
}

/**
 * Get list of agents user has access to
 */
export async function getUserAccessibleAgents(userId: string, userEmail?: string | null): Promise<AgentId[]> {
  // Check if user is super admin - super admins have access to all agents
  const email = await getUserEmail(userId, userEmail);
  if (email && isSuperAdminEmail(email)) {
    return ["sync", "aloha", "studio", "insight"];
  }

  // Get user's subscription tier (super admins will get "elite" from getUserSubscriptionTier)
  const tier = await getUserSubscriptionTier(userId, email);
  
  if (!tier) {
    return []; // No active subscription
  }

  // Trial expired users have no access (unless super admin, which is already handled above)
  if (tier === "trial_expired") {
    return [];
  }

  return AGENT_ACCESS_BY_TIER[tier] || [];
}

