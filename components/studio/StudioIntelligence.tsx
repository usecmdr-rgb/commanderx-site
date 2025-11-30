"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, Zap, Image } from "lucide-react";

export default function StudioIntelligence() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [suggestedAssets, setSuggestedAssets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSuggestedAssets([]);

    try {
      const response = await fetch("/api/studio/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const result = await response.json();

      if (result.ok) {
        setAnswer(result.data.answer);
        setSuggestedAssets(result.data.suggestedAssets || []);
        setQuestion("");
      } else {
        setError(result.error || "Failed to get answer");
      }
    } catch (err: any) {
      setError(err.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = (asset: any) => {
    // Prefill Studio with asset details
    const params = new URLSearchParams({
      type: asset.type || "image",
      tone: asset.tone || "",
      label: asset.label || "",
    });
    window.location.href = `/studio?${params.toString()}`;
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-slate-600 dark:text-slate-400" />
        <h3 className="text-xl font-semibold">Studio Intelligence</h3>
      </div>

      <form onSubmit={handleAsk} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about branding, tone, or content ideas..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-transparent px-4 py-2 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-50 dark:border-slate-700"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {answer && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 p-4 text-sm text-white dark:bg-slate-800">
            {answer}
          </div>

          {suggestedAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image size={16} className="text-slate-600 dark:text-slate-400" aria-hidden="true" />
                <p className="text-sm font-semibold">Suggested Content</p>
              </div>
              <div className="space-y-2">
                {suggestedAssets.map((asset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCreateAsset(asset)}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
                  >
                    <p className="font-semibold">{asset.label}</p>
                    {asset.description && (
                      <p className="text-xs text-slate-500 mt-1">{asset.description}</p>
                    )}
                    {asset.tone && (
                      <p className="text-xs text-slate-400 mt-1">Tone: {asset.tone}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

