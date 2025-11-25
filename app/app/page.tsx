"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, DollarSign } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { agents } from "@/lib/data";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgentStats, emptyAgentStats } from "@/hooks/useAgentStats";
import type { AgentKey } from "@/types";
import { formatMoney as formatCurrency } from "@/lib/currency";

import { AGENT_BY_ID } from "@/lib/config/agents";

const agentRouteMap: Record<AgentKey, string> = {
  aloha: "/aloha",
  sync: "/sync",
  studio: "/studio",
  insight: "/insight",
};

  const dataByTimeframe = {
    today: {
      aloha: { calls: 32, missed: 2, appointments: 5 },
      sync: { important: 6, unread: 4, payments: 3, alerts: 2 },
      studio: { media: 4, last: "Spring promo" },
      insight: { summary: "You had 32 calls, 6 important emails, and 5 appointments." },
    },
    week: {
      aloha: { calls: 180, missed: 11, appointments: 22 },
      sync: { important: 28, unread: 12, payments: 7, alerts: 5 },
      studio: { media: 17, last: "Testimonials reel" },
      insight: { summary: "This week CX saved ~14 hours through agent coverage." },
    },
    month: {
      aloha: { calls: 680, missed: 40, appointments: 88 },
      sync: { important: 90, unread: 32, payments: 23, alerts: 18 },
      studio: { media: 52, last: "FY25 media kit" },
      insight: { summary: "Monthly trend: calls +18%, important emails -11%." },
    },
  } as const;

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<keyof typeof dataByTimeframe>("today");
  const pathname = usePathname();
  const { businessInfo, language } = useAppState();
  const t = useTranslation();
  const stats = dataByTimeframe[timeframe];
  const { stats: agentStats, loading: statsLoading } = useAgentStats();
  
  // Reset timeframe to "today" when navigating to dashboard to ensure consistent UI
  useEffect(() => {
    if (pathname === "/app" || pathname === "/dashboard") {
      setTimeframe("today");
    }
  }, [pathname]);
  
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
  
  const latestStats = agentStats ?? fallbackStats;
  
  // Calculate time saved (in minutes) from all agent activities
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

  const timeframes = useMemo(
    () => [
      { id: "today" as const, label: t("today") },
      { id: "week" as const, label: t("thisWeek") },
      { id: "month" as const, label: t("thisMonth") },
    ],
    [t]
  );

  const resume = useMemo(
    () => [
      {
        title: AGENT_BY_ID.aloha.label,
        key: "aloha" as AgentKey,
        subtitle: t("callsAppointments"),
        content: `${stats.aloha.calls} ${t("handled")} / ${stats.aloha.missed} ${t("missed")}` as string,
        footer: `${stats.aloha.appointments} ${t("newAppointments")}`,
      },
      {
        title: AGENT_BY_ID.sync.label,
        key: "sync" as AgentKey,
        subtitle: t("emailCalendar"),
        content: `${stats.sync.important} ${t("important")} - ${stats.sync.unread} ${t("needReply")}`,
        footer: `${stats.sync.payments} ${t("paymentsBills")} - ${stats.sync.alerts} ${t("alerts")}`,
      },
      {
        title: AGENT_BY_ID.studio.label,
        key: "studio" as AgentKey,
        subtitle: t("media"),
        content: `${stats.studio.media} ${t("itemsTouched")}`,
        footer: `${t("last")}: ${stats.studio.last}`,
      },
      {
        title: AGENT_BY_ID.insight.label,
        key: "insight" as AgentKey,
        subtitle: t("insights"),
        content: stats.insight.summary,
        footer: t("timeframeSmartSummary"),
      },
    ],
    [stats, t]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">{t("dashboard")}</p>
          <h1 className="text-3xl font-semibold">{t("resumeOfTheDay")}</h1>
          {businessInfo.businessName && (
            <p className="text-sm text-slate-500">
              {t("forBusiness")} {businessInfo.businessName} - {businessInfo.location || t("locationTbd")}
            </p>
          )}
        </div>
        <div className="flex gap-2 rounded-full border border-slate-200 p-1 text-sm font-semibold dark:border-slate-800">
          {timeframes.map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeframe(item.id as keyof typeof dataByTimeframe)}
              className={`rounded-full px-4 py-2 ${
                timeframe === item.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {resume.map((card) => {
          const agent = agents.find((a) => a.key === card.key);
          const agentConfig = AGENT_BY_ID[card.key];
          const Icon = agentConfig?.icon;
          return (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 text-center">
              <div className="flex flex-col items-center gap-4">
                {agent && Icon && (
                  <Link
                    href={agentRouteMap[card.key] as any}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${agent.accent} text-white transition-opacity hover:opacity-80 cursor-pointer`}
                  >
                    <Icon size={22} className="text-white" />
                  </Link>
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">{card.subtitle}</p>
                  <h3 className="mt-1 text-2xl font-semibold">{card.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-200">{card.content}</p>
              <p className="mt-2 text-sm text-slate-500">{card.footer}</p>
            </div>
          );
        })}
      </div>
      
      {/* Time and money saved bubble - placed under all agents */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Time Saved</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {statsLoading ? "..." : formatTime(timeSaved)}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Money Saved</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {statsLoading ? "..." : formatMoney(moneySaved)}
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
  );
}
