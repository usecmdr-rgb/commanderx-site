"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { SubscriptionData } from "@/types";

/**
 * Hook to get trial status for the current user
 * 
 * Provides:
 * - hasUsedTrial: Whether the user's email has ever used a trial
 * - isOnTrial: Whether the user is currently on an active trial
 * - isTrialExpired: Whether the user's trial has expired
 * - canStartTrial: Whether the user is eligible to start a new trial
 * 
 * All checks are server-side enforced, this hook just provides UI state
 */
export function useTrialStatus() {
  const { supabase } = useSupabase();
  const [trialStatus, setTrialStatus] = useState<{
    hasUsedTrial: boolean;
    isOnTrial: boolean;
    isTrialExpired: boolean;
    canStartTrial: boolean;
    loading: boolean;
    error: string | null;
  }>({
    hasUsedTrial: false,
    isOnTrial: false,
    isTrialExpired: false,
    canStartTrial: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setTrialStatus((prev) => ({
            ...prev,
            loading: false,
          }));
          return;
        }

        // Fetch subscription data which includes trial info
        // Endpoint uses authenticated user from session, no need to pass userId
        const response = await fetch(`/api/subscription`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch subscription");
        }
        
        const data: SubscriptionData = await response.json();

        const subscription = data.subscription;
        const trial = data.trial;

        const hasUsedTrial = trial?.hasUsedTrial || false;
        const isTrialExpired = trial?.isExpired || false;
        const isOnTrial = subscription.status === "trialing";

        setTrialStatus({
          hasUsedTrial,
          isOnTrial,
          isTrialExpired,
          canStartTrial: !hasUsedTrial && !isOnTrial && !isTrialExpired,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        console.error("Error fetching trial status:", error);
        setTrialStatus((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load trial status",
        }));
      }
    }

    fetchTrialStatus();
  }, [supabase]);

  return trialStatus;
}

