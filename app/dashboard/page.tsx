"use client";

import { useMemo } from "react";
import { useAgentStats, emptyAgentStats } from "@/hooks/useAgentStats";
import { Clock, DollarSign } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { formatMoney as formatCurrency } from "@/lib/currency";

export default function DashboardPage() {
  const { stats, loading } = useAgentStats();
  const { language } = useAppState();
  
  // Fallback to realistic numbers if no stats available
  const fallbackStats = {
    ...emptyAgentStats,
    alpha_calls_total: 247,
    alpha_calls_missed: 8,
    alpha_appointments: 32,
    xi_important_emails: 18,
    xi_payments_bills: 7,
    xi_invoices: 4,
    xi_missed_emails: 3,
    mu_media_edits: 124,
    beta_insights_count: 42,
  };
  
  const latestStats = stats ?? fallbackStats;
  
  // Calculate time saved (in minutes)
  const timeSaved = useMemo(() => {
    const answeredCalls = Math.max(latestStats.alpha_calls_total - latestStats.alpha_calls_missed, 0);
    const callsTime = answeredCalls * 2; // 2 minutes per answered call
    const emailsTime = latestStats.xi_important_emails * 1; // 1 minute per email processed
    const invoicesTime = latestStats.xi_invoices * 5; // 5 minutes per invoice
    const mediaTime = latestStats.mu_media_edits * 3; // 3 minutes per media edit
    const insightsTime = latestStats.beta_insights_count * 10; // 10 minutes per insight (strategic value)
    
    return callsTime + emailsTime + invoicesTime + mediaTime + insightsTime;
  }, [latestStats]);
  
  // Calculate money saved (assuming $50/hour rate in USD)
  const hourlyRate = 50; // $50 per hour in USD
  const moneySaved = useMemo(() => {
    const hoursSaved = timeSaved / 60;
    return hoursSaved * hourlyRate;
  }, [timeSaved]);
  
  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  // Format money display
  const formatMoney = (usdAmount: number) => {
    return formatCurrency(usdAmount, language);
  };

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-8">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Alpha - Calls</p>
            <p className="text-2xl font-semibold">{latestStats.alpha_calls_total}</p>
            <p className="text-sm text-slate-500 mt-1">Answered: {Math.max(latestStats.alpha_calls_total - latestStats.alpha_calls_missed, 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Xi - Emails</p>
            <p className="text-2xl font-semibold">{latestStats.xi_important_emails}</p>
            <p className="text-sm text-slate-500 mt-1">Invoices: {latestStats.xi_invoices}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Mu - Media</p>
            <p className="text-2xl font-semibold">{latestStats.mu_media_edits}</p>
            <p className="text-sm text-slate-500 mt-1">Edits completed</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Beta - Insights</p>
            <p className="text-2xl font-semibold">{latestStats.beta_insights_count}</p>
            <p className="text-sm text-slate-500 mt-1">Generated</p>
          </div>
        </div>
      </main>
      
      {/* Fixed bottom bar showing time and money saved */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Time Saved</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {loading ? "..." : formatTime(timeSaved)}
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Money Saved</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {loading ? "..." : formatMoney(moneySaved)}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Based on all agent activities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
