"use client";

import { useState, useEffect } from "react";
import type { ActivityMixResponse, TimeRange } from "@/types";
import TrialExpiredLock from "./TrialExpiredLock";

interface ActivityMixChartProps {
  range: TimeRange;
}

export default function ActivityMixChart({ range }: ActivityMixChartProps) {
  const [data, setData] = useState<ActivityMixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorized(false);

    try {
      const response = await fetch(`/api/insight/activity-mix?range=${range}`);
      const result = await response.json();

      if (result.ok) {
        setData(result.data);
      } else {
        const isAuthError = response.status === 401 || result.error === "Unauthorized";
        setIsUnauthorized(isAuthError);
        if (!isAuthError) {
          setError(result.error || "Failed to fetch activity data");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch activity data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold mb-4">Calls vs Emails</h2>
        <div className="h-32 flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold mb-4">Calls vs Emails</h2>
        <TrialExpiredLock />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold mb-4">Calls vs Emails</h2>
        <div className="h-32 flex items-center justify-center text-sm text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.buckets.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold mb-4">Calls vs Emails</h2>
        <div className="h-32 flex items-center justify-center text-sm text-slate-500">
          No data available
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.buckets.map((b) => Math.max(b.calls, b.emails)),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="text-lg font-semibold mb-4">Calls vs Emails</h2>
      <div className="mt-2">
        <div className="grid h-32 items-end gap-2" style={{ gridTemplateColumns: `repeat(${data.buckets.length}, minmax(0, 1fr))` }}>
          {data.buckets.map((bucket, index) => {
            const callsHeight = (bucket.calls / maxValue) * 100;
            const emailsHeight = (bucket.emails / maxValue) * 100;
            
            return (
              <div key={index} className="space-y-1 text-center">
                <div className="relative h-full flex items-end justify-center gap-0.5">
                  {/* Calls bar */}
                  <div
                    className="w-full rounded-t bg-blue-500 dark:bg-blue-600"
                    style={{ height: `${callsHeight}%`, minHeight: bucket.calls > 0 ? '4px' : '0' }}
                    title={`Calls: ${bucket.calls}`}
                  />
                  {/* Emails bar */}
                  <div
                    className="w-full rounded-t bg-emerald-500 dark:bg-emerald-600"
                    style={{ height: `${emailsHeight}%`, minHeight: bucket.emails > 0 ? '4px' : '0' }}
                    title={`Emails: ${bucket.emails}`}
                  />
                </div>
                <p className="text-xs text-slate-500">{bucket.label}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Calls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Emails</span>
          </div>
        </div>
      </div>
    </div>
  );
}

