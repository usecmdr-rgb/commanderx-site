/**
 * Super Admin Configuration
 * 
 * Email addresses that have permanent super admin access to all features,
 * regardless of subscription tier.
 * 
 * Super admins:
 * - Have access to all agents (Aloha, Sync, Studio, Insight)
 * - Are treated as having the highest tier (elite) for all feature checks
 * - Bypass all paywalls and tier restrictions
 * - Have account mode set to "subscribed"
 */

export const SUPER_ADMIN_EMAILS = [
  "usecmdr@gmail.com",
] as const;

/**
 * Check if an email is a super admin
 * Uses strict lowercase string matching
 */
export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase() as any);
}

