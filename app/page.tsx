"use client";

import Link from "next/link";
import { Phone, Mail, Brush, BarChart3 } from "lucide-react";
import { agents } from "@/lib/data";
import type { AgentKey } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { AGENT_BY_ID } from "@/lib/config/agents";

const iconMap: Record<AgentKey, JSX.Element> = {
  aloha: <Phone size={22} className="text-white" />,
  sync: <Mail size={22} className="text-white" />,
  studio: <Brush size={22} className="text-white" />,
  insight: <BarChart3 size={22} className="text-white" />,
};

export default function HomePage() {
  const t = useTranslation();

  // Fake impressive stats for promo page
  const fakeStats = {
    aloha: {
      calls: 247,
      missed: 8,
      appointments: 32,
      alerts: 2,
    },
    sync: {
      important: 18,
      paymentsBills: 7,
      invoices: 4,
      missed: 3,
      alerts: 5,
    },
    studio: {
      impressions: 12450,
      likes: 892,
      reports: 23,
      alerts: 1,
    },
    insight: {
      insights: 42,
      alerts: 3,
    },
  };

  return (
    <div className="space-y-6 sm:space-y-12">
      <section className="rounded-3xl border border-slate-200 bg-white/70 p-4 sm:p-6 md:p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-500">
          {t("multiAgentCockpit")}
        </p>
        <h1 className="mt-3 sm:mt-4 text-2xl sm:text-4xl font-semibold leading-tight md:text-5xl">
          {t("delegateTitle")}
        </h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
          {t("delegateDescription")}
        </p>
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <a
            href="#agents"
            className="rounded-full bg-slate-900 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            {t("meetAgents")}
          </a>
          <Link
            href="/about"
            className="rounded-full border border-slate-200 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:border-slate-700"
          >
            {t("seeHowWorks")}
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-slate-500">{t("dailyAgentStats")}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Live activity from today</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
          {/* Aloha / Voice */}
          <div className="rounded-2xl border border-slate-200 p-3 sm:p-5 dark:border-slate-800 relative">
            {fakeStats.aloha.alerts > 0 && (
              <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {fakeStats.aloha.alerts}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">Aloha / Voice</p>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {[
                { label: t("calls"), value: fakeStats.aloha.calls },
                { label: t("missed"), value: fakeStats.aloha.missed, alert: fakeStats.aloha.missed > 0 },
                { label: t("appts"), value: fakeStats.aloha.appointments },
                { label: "Alerts", value: fakeStats.aloha.alerts, alert: fakeStats.aloha.alerts > 0 },
              ].map((item) => (
                <div key={item.label} className="relative text-center">
                  {item.alert && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500"></span>
                  )}
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">{item.label}</p>
                  <p className="mt-1 text-xl sm:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sync / Inbox */}
          <div className="rounded-2xl border border-slate-200 p-3 sm:p-5 dark:border-slate-800 relative">
            {fakeStats.sync.alerts > 0 && (
              <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {fakeStats.sync.alerts}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">Sync / Inbox</p>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {[
                { label: t("important"), value: fakeStats.sync.important, alert: true },
                { label: t("paymentsBills"), value: fakeStats.sync.paymentsBills },
                { label: t("invoices"), value: fakeStats.sync.invoices },
                { label: t("missed"), value: fakeStats.sync.missed, alert: fakeStats.sync.missed > 0 },
              ].map((item) => (
                <div key={item.label} className="relative text-center min-w-0">
                  {item.alert && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-500 text-center whitespace-nowrap leading-tight px-0.5 sm:px-1">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl sm:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Studio / Media */}
          <div className="rounded-2xl border border-slate-200 p-3 sm:p-5 dark:border-slate-800 relative">
            {fakeStats.studio.alerts > 0 && (
              <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white">
                {fakeStats.studio.alerts}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">Studio / Media</p>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              {[
                { label: "Impressions", value: fakeStats.studio.impressions.toLocaleString() },
                { label: "Likes", value: fakeStats.studio.likes },
                { label: "Reports", value: fakeStats.studio.reports, alert: true },
              ].map((item) => (
                <div key={item.label} className="relative text-center">
                  {item.alert && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-violet-500"></span>
                  )}
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">{item.label}</p>
                  <p className="mt-1 text-xl sm:text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs text-slate-400">
              <span>+1.2K impressions today</span>
            </div>
          </div>

          {/* Insight / Data */}
          <div className="rounded-2xl border border-slate-200 p-3 sm:p-5 dark:border-slate-800 relative">
            {fakeStats.insight.alerts > 0 && (
              <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                {fakeStats.insight.alerts}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 text-center">Insight / Data</p>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white text-center">{fakeStats.insight.insights}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 text-center">{t("betaInsightsGenerated")}</p>
            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs text-slate-400">
              <span>3 new today</span>
            </div>
          </div>
        </div>
      </section>

      <section id="agents" className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {agents.map((agent) => {
          const agentConfig = AGENT_BY_ID[agent.key as keyof typeof AGENT_BY_ID];
          const Icon = agentConfig?.icon || Phone;
          return (
          <div
            key={agent.key}
            className="rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/40 text-center"
          >
            <div className="flex justify-center">
              <div className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${agent.accent} text-white`}>
                <Icon size={20} className="sm:w-[22px] sm:h-[22px] text-white" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <h3 className="text-lg sm:text-xl font-semibold">{agent.name}</h3>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-slate-500">{agent.role}</p>
            </div>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">{agent.description}</p>
            <div className="mt-3 sm:mt-4 rounded-2xl border border-dashed border-slate-200 p-3 sm:p-4 text-xs sm:text-sm text-slate-500 dark:border-slate-700">
              {agent.key === "aloha" && t("alohaDetails")}
              {agent.key === "sync" && t("syncDetails")}
              {agent.key === "studio" && t("studioDetails")}
              {agent.key === "insight" && t("insightDetails")}
            </div>
          </div>
        );
        })}
      </section>
    </div>
  );
}
