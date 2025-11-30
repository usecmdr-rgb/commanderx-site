"use client";

import { useState, useEffect } from "react";
import { FileText, Mail, Phone, Calendar, TrendingUp, TrendingDown, Minus, Loader2, ArrowRight } from "lucide-react";
import type { CommandSummary } from "@/app/api/command/summary/route";

export default function CommandSummaryCard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CommandSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/command/summary");
      const result = await response.json();

      if (result.ok) {
        setSummary(result.data);
      } else {
        setError(result.error || "Failed to load summary");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          <span className="ml-2 text-sm text-slate-500">Loading today&apos;s brief...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Today's Brief */}
      {summary.brief && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-xl font-semibold">{summary.brief.title}</h3>
          </div>
          <div className="space-y-4">
            {summary.brief.sections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
                <ul className="space-y-1">
                  {section.bulletPoints.map((point, pointIdx) => (
                    <li key={pointIdx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight Score */}
      {summary.insightScore && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Insight Score</p>
              <p className="mt-1 text-2xl font-semibold">{summary.insightScore.value}</p>
            </div>
            {summary.insightScore.trend && (
              <div className="flex items-center gap-2">
                {summary.insightScore.trend === "up" && (
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                {summary.insightScore.trend === "down" && (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                {summary.insightScore.trend === "flat" && (
                  <Minus className="h-5 w-5 text-slate-400" />
                )}
                {summary.insightScore.delta !== undefined && summary.insightScore.delta > 0 && (
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {summary.insightScore.delta > 0 ? "+" : ""}{summary.insightScore.delta}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Insights */}
      {summary.topInsights.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-xl font-semibold mb-4">Top Insights</h3>
          <div className="space-y-3">
            {summary.topInsights.slice(0, 5).map((insight) => (
              <div
                key={insight.id}
                className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{insight.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {insight.severity} {insight.personalized && "• Personalized"}
                    </p>
                  </div>
                  <a
                    href="/insight"
                    className="text-brand-accent hover:underline flex items-center gap-1 text-xs"
                  >
                    View <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Emails */}
      {summary.criticalEmails.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-xl font-semibold">Important Emails</h3>
          </div>
          <div className="space-y-2">
            {summary.criticalEmails.slice(0, 5).map((email) => (
              <a
                key={email.id}
                href={`/sync?email=${email.id}`}
                className="block rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
              >
                <p className="font-semibold">{email.subject}</p>
                <p className="text-xs text-slate-500 mt-1">{email.from}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Important Calls */}
      {summary.importantCalls.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-xl font-semibold">Important Calls</h3>
          </div>
          <div className="space-y-2">
            {summary.importantCalls.slice(0, 5).map((call) => (
              <a
                key={call.id}
                href="/aloha"
                className="block rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {call.contactName || call.contactIdentifier || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {call.missed ? "Missed call" : "Call"} • {new Date(call.time).toLocaleTimeString()}
                    </p>
                  </div>
                  {call.missed && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Missed
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Today */}
      {summary.calendarToday.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-slate-600 dark:text-slate-400" />
            <h3 className="text-xl font-semibold">Calendar Today</h3>
          </div>
          <div className="space-y-2">
            {summary.calendarToday.slice(0, 5).map((event) => (
              <a
                key={event.id}
                href="/sync?tab=calendar"
                className="block rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
              >
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(event.start).toLocaleTimeString()} {event.location && `• ${event.location}`}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {summary.recommendedActions.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-xl font-semibold mb-4">Recommended Actions</h3>
          <div className="space-y-2">
            {summary.recommendedActions.slice(0, 5).map((action) => (
              <button
                key={action.id}
                onClick={async () => {
                  const res = await fetch("/api/actions/run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      actionId: action.id,
                      type: "create_task", // Default type
                      payload: {},
                    }),
                  });
                  const result = await res.json();
                  if (result.ok && result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                  }
                }}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
              >
                <p className="font-semibold">{action.label}</p>
                {action.description && (
                  <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

