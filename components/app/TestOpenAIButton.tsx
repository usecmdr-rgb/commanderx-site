"use client";

import { useState, useEffect } from "react";
import { supabaseBrowserClient } from "@/lib/supabaseClient";

// Admin email addresses (matches lib/auth.ts)
const ADMIN_EMAILS = ["usecmdr@gmail.com"];

export function TestOpenAIButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  // Check if component should render (dev mode or admin user)
  useEffect(() => {
    const checkAccess = async () => {
      const isDev = process.env.NODE_ENV !== 'production';
      
      // Get user from session
      let user: { email?: string | null; role?: string } | null = null;
      try {
        const { data: { session } } = await supabaseBrowserClient.auth.getSession();
        if (session?.user?.email) {
          // Check if user email is in admin list
          // Since system uses email-based admin, we treat admin emails as role === 'admin'
          const userIsAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());
          user = {
            email: session.user.email,
            role: userIsAdmin ? 'admin' : undefined
          };
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }

      // Use exact gating logic as requested
      const isAdmin = user?.role === 'admin';
      
      // Apply guard at component level - entire section disappears for normal users
      if (!isDev && !isAdmin) {
        setShouldRender(false);
        return;
      }
      
      setShouldRender(true);
    };

    checkAccess();
  }, []);

  // Don't render if not dev and not admin - nothing remains in DOM
  if (!shouldRender) {
    return null;
  }

  async function handleClick() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/test-openai", {
        method: "POST",
      });

      const data = await res.json();
      console.log("Test OpenAI response:", data);

      if (!res.ok || !data.ok) {
        setError(
          data?.error ||
            "Test request failed. Check the server logs for more details."
        );
        return;
      }

      setResult(data.reply || "OpenAI responded successfully.");
    } catch (err: any) {
      console.error("Failed to call /api/test-openai:", err);
      setError(err?.message || "Unexpected error calling /api/test-openai.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 sm:mt-6 rounded-2xl border border-dashed border-slate-200 p-3 sm:p-4 dark:border-slate-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            Test OpenAI backend connection
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
            This button sends a server-side request to{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-800">
              /api/test-openai
            </code>{" "}
            using your <code>OPENAI_API_KEY</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900"
        >
          {loading ? "Testing..." : "Run OpenAI Test"}
        </button>
      </div>
      {result && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          {result}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}










