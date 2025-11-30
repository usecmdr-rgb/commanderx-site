"use client";

import { useState } from "react";
import { FileText, Loader2, AlertCircle, Calendar, TrendingUp, CheckCircle, ListChecks } from "lucide-react";
import type { InsightBrief } from "@/types";
import { useAppState } from "@/context/AppStateContext";
import { getLanguageFromLocale } from "@/lib/localization";

interface DailyBriefCardProps {
  range?: 'daily' | 'weekly' | 'monthly';
}

export default function DailyBriefCard({ range = 'daily' }: DailyBriefCardProps) {
  const { language } = useAppState();
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<InsightBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBrief = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/insight/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: getLanguageFromLocale(language),
          range,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setBrief(result.data);
      } else {
        setError(result.error || "Failed to generate brief");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Daily Command Brief</h3>
          <p className="text-sm text-slate-500 mt-1">Unified briefing from all agents</p>
        </div>
        <button
          onClick={generateBrief}
          disabled={loading}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText size={16} />
              Generate Brief
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {brief && (
        <div className="mt-6 space-y-6">
          {/* Sections */}
          {brief.sections.map((section, idx) => (
            <div key={idx}>
              <h4 className="font-semibold mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.bulletPoints.map((point, pointIdx) => (
                  <li key={pointIdx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Key Risks */}
          {brief.keyRisks && brief.keyRisks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                <h4 className="font-semibold">Key Risks</h4>
              </div>
              <ul className="space-y-2">
                {brief.keyRisks.map((risk, idx) => (
                  <li key={idx} className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300">{risk}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Priorities */}
          {brief.priorities && brief.priorities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={18} className="text-slate-600 dark:text-slate-400" />
                <h4 className="font-semibold">Priorities</h4>
              </div>
              <ul className="space-y-2">
                {brief.priorities.map((priority, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">{idx + 1}.</span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
            Generated at {new Date(brief.generatedAt).toLocaleString()}
          </p>
        </div>
      )}

      {!brief && !loading && !error && (
        <div className="mt-6 text-center py-8 text-slate-500">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />

          <p>Click &quot;Generate Brief&quot; to create your daily command brief</p>
        </div>
      )}
    </div>
  );
}





