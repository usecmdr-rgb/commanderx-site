"use client";

import { useEffect, useState } from "react";
import type { AgentStatsDaily } from "@/types";

export const emptyAgentStats: AgentStatsDaily = {
  id: "",
  date: "",
  alpha_calls_total: 0,
  alpha_calls_missed: 0,
  alpha_appointments: 0,
  xi_important_emails: 0,
  xi_missed_emails: 0,
  xi_payments_bills: 0,
  xi_invoices: 0,
  mu_media_edits: 0,
  beta_insights_count: 0,
};

export function useAgentStats() {
  const [stats, setStats] = useState<AgentStatsDaily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/agent-stats", {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Failed to load stats");
        }

        setStats(Array.isArray(payload.data) ? payload.data[0] ?? null : null);
        setError(null);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return { stats, loading, error };
}

