"use client";

import { useState } from "react";

export function StudioAgentChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "studio",
          message,
          taskType: "default",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply || "No reply from agent." },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error talking to Studio." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1 max-h-64 overflow-y-auto text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={m.role === "user" ? "text-blue-300" : "text-gray-200"}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded px-3 py-2 bg-slate-900 text-sm"
          placeholder="Add a tweak request…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="px-3 py-2 rounded bg-white/10 text-sm"
        >
          {loading ? "Thinking…" : "Send"}
        </button>
      </div>
    </div>
  );
}




