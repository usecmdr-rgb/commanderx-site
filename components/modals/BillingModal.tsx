"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAppState } from "@/context/AppStateContext";
import { useSupabase } from "@/components/SupabaseProvider";

const BillingModal = () => {
  const { showBillingModal, setShowBillingModal } = useAppState();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        alert("Please log in to manage your subscription");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error("Portal error:", error);
        alert("Failed to open customer portal. Please try again.");
        setLoading(false);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open customer portal. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Billing & Subscription"
      description="Manage your subscription and billing information."
      open={showBillingModal}
      onClose={() => setShowBillingModal(false)}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage your subscription, update payment methods, view invoices, and more through the Stripe customer portal.
        </p>
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          {loading ? "Loading..." : "Manage Subscription"}
        </button>
      </div>
    </Modal>
  );
};

export default BillingModal;
