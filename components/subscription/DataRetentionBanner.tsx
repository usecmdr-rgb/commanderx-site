"use client";

import { useDataRetention } from "@/hooks/useDataRetention";
import { AlertTriangle, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

/**
 * Data Retention Banner Component
 * 
 * Displays warnings to users about data retention status:
 * - Trial expired: Shows 30-day retention countdown
 * - Paid canceled: Shows 60-day retention countdown
 * - Data cleared: Shows that data has been cleared
 */
export default function DataRetentionBanner() {
  const {
    isTrialExpired,
    isInRetentionWindow,
    daysRemaining,
    isDataCleared,
    retentionReason,
    loading,
  } = useDataRetention();

  if (loading) {
    return null;
  }

  // Don't show banner if user has active access
  if (!isTrialExpired && !isInRetentionWindow && !isDataCleared) {
    return null;
  }

  // Data has been cleared
  if (isDataCleared) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start">
            <Trash2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Previous chat history cleared
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Your previous chat history has been cleared due to inactivity. Your account and agents are still here.{" "}
                <Link
                  href="/pricing"
                  className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Choose a plan to continue using the app.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In retention window - trial expired
  if (isTrialExpired && isInRetentionWindow && retentionReason === "trial_expired") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Your free trial has ended
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Your agents and chat history will be kept for{" "}
                <strong>{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</strong>. After that, your history will be cleared.{" "}
                <Link
                  href="/pricing"
                  className="font-medium underline hover:text-orange-900 dark:hover:text-orange-100"
                >
                  Choose a plan to keep everything and continue using the app.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In retention window - paid canceled/paused
  if (isInRetentionWindow && (retentionReason === "paid_canceled" || retentionReason === "paid_paused")) {
    const actionText = retentionReason === "paid_paused" ? "paused" : "canceled";
    return (
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Your subscription is {actionText}
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Your agents and chat history will be kept for{" "}
                <strong>{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</strong>. After that, your history will be cleared.{" "}
                <Link
                  href="/pricing"
                  className="font-medium underline hover:text-blue-900 dark:hover:text-blue-100"
                >
                  Reactivate your subscription to keep everything.
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

