"use client";

import { useState, useEffect } from "react";
import { mockCalls } from "@/lib/data";
import type { CallRecord } from "@/types";
import { useAgentStats, emptyAgentStats } from "@/hooks/useAgentStats";
import { useAgentAccess } from "@/hooks/useAgentAccess";
import PreviewBanner from "@/components/agent/PreviewBanner";
import { AGENT_BY_ID } from "@/lib/config/agents";
import Link from "next/link";
import { 
  Phone, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Heart,
  Brain,
  Settings,
  BarChart3,
  Shield,
  Clock
} from "lucide-react";

const appointments = [
  { title: "Discovery call", when: "Fri - 9:30 AM", with: "Maria Gomez" },
  { title: "Onboarding", when: "Tue - 1:00 PM", with: "Alex Chen" },
];

interface ContactMemoryStats {
  totalContacts: number;
  doNotCallCount: number;
  recentlyContacted: number;
  averageContactFrequency: number;
}

interface ConversationStats {
  intentAccuracy: number;
  sentimentDistribution: {
    happy: number;
    neutral: number;
    upset: number;
    angry: number;
  };
  avgConversationDuration: number;
  empathyUsed: number;
}

export default function AlohaPage() {
  const { hasAccess, isLoading: accessLoading } = useAgentAccess("aloha");
  const { stats, loading, error } = useAgentStats();
  const [contactStats, setContactStats] = useState<ContactMemoryStats | null>(null);
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "calls" | "contacts" | "analytics">("overview");
  
  // Use preview/mock data if user doesn't have access
  const isPreview = !hasAccess && !accessLoading;
  
  // Fallback to realistic random numbers if no stats available or in preview mode
  const fallbackStats = {
    ...emptyAgentStats,
    alpha_calls_total: isPreview ? 156 : 247,
    alpha_calls_missed: isPreview ? 5 : 8,
    alpha_appointments: isPreview ? 18 : 32,
  };
  const latestStats = stats ?? fallbackStats;
  const answeredCalls = Math.max(latestStats.alpha_calls_total - latestStats.alpha_calls_missed, 0);
  const noStats = !stats && !loading && !error;
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(mockCalls[0]);

  const agentConfig = AGENT_BY_ID["aloha"];

  useEffect(() => {
    // Fetch contact memory stats
    if (hasAccess && !accessLoading) {
      fetchContactStats();
      fetchConversationStats();
    }
  }, [hasAccess, accessLoading]);

  const fetchContactStats = async () => {
    try {
      // TODO: Create API endpoint for contact stats
      // For now, use mock data
      setContactStats({
        totalContacts: 142,
        doNotCallCount: 8,
        recentlyContacted: 23,
        averageContactFrequency: 2.4,
      });
    } catch (err) {
      console.error("Error fetching contact stats:", err);
    }
  };

  const fetchConversationStats = async () => {
    try {
      // TODO: Create API endpoint for conversation stats
      // For now, use mock data
      setConversationStats({
        intentAccuracy: 94.2,
        sentimentDistribution: {
          happy: 45,
          neutral: 38,
          upset: 12,
          angry: 5,
        },
        avgConversationDuration: 245, // seconds
        empathyUsed: 17,
      });
    } catch (err) {
      console.error("Error fetching conversation stats:", err);
    }
  };

  return (
    <div className="space-y-8">
      {isPreview && (
        <PreviewBanner 
          agentName={agentConfig.label} 
          requiredTier={agentConfig.requiredTier}
        />
      )}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">Aloha agent</p>
          <h1 className="text-3xl font-semibold">Calls & appointments overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/aloha/contacts"
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Contacts
          </Link>
          <Link
            href="/aloha/settings"
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("calls")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "calls"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Call Logs
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "contacts"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Contact Memory
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-brand-accent text-brand-accent"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Conversation Analytics
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Key Stats */}
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Latest stats</p>
              {loading && <p className="text-xs text-slate-500">Loading stats…</p>}
              {error && <p className="text-xs text-red-500">Couldn&apos;t load stats</p>}
              {noStats && <p className="text-xs text-slate-500">No stats yet</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total calls", value: latestStats.alpha_calls_total, icon: Phone },
                { label: "Answered", value: answeredCalls, icon: MessageSquare },
                { label: "Missed", value: latestStats.alpha_calls_missed, icon: Phone },
                { label: "New appointments", value: latestStats.alpha_appointments, icon: Clock },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-slate-500" />
                    <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
                  </div>
                  <p className="mt-2 text-2xl">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature Highlights */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Memory Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Contact Memory</h3>
                  <p className="text-xs text-slate-500">Lightweight per-phone-number memory</p>
                </div>
              </div>
              {contactStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Contacts</span>
                    <span className="text-lg font-semibold">{contactStats.totalContacts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Do-Not-Call</span>
                    <span className="text-lg font-semibold text-red-600">{contactStats.doNotCallCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Recently Contacted</span>
                    <span className="text-lg font-semibold">{contactStats.recentlyContacted}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Loading contact statistics...</p>
              )}
              <Link
                href="/aloha/contacts"
                className="mt-4 inline-block text-sm text-brand-accent hover:underline"
              >
                View all contacts →
              </Link>
            </div>

            {/* Conversation Intelligence Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Conversation Intelligence</h3>
                  <p className="text-xs text-slate-500">Intent classification & emotional intelligence</p>
                </div>
              </div>
              {conversationStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Intent Accuracy</span>
                    <span className="text-lg font-semibold">{conversationStats.intentAccuracy}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Empathy Used</span>
                    <span className="text-lg font-semibold">{conversationStats.empathyUsed} calls</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Avg Duration</span>
                    <span className="text-lg font-semibold">{Math.floor(conversationStats.avgConversationDuration / 60)}m</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Loading conversation statistics...</p>
              )}
              <Link
                href="/aloha?tab=analytics"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("analytics");
                }}
                className="mt-4 inline-block text-sm text-brand-accent hover:underline"
              >
                View analytics →
              </Link>
            </div>

            {/* Voice Dynamics Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Natural Voice Dynamics</h3>
                  <p className="text-xs text-slate-500">Human-like pauses, disfluencies & tone</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Micro pauses for natural flow
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Context-aware disfluencies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Emotion-aware adjustments
                </li>
              </ul>
            </div>

            {/* Communication Resilience Card */}
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Communication Resilience</h3>
                  <p className="text-xs text-slate-500">Handles connection issues & silence gracefully</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Bad connection detection
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Silence handling (2s, 6s, 10s)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  Talkative caller management
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Calls Tab */}
      {activeTab === "calls" && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Call transcripts</h2>
              <p className="text-sm text-slate-500">Click to inspect</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2">Caller</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Outcome</th>
                    <th className="py-2">Sentiment</th>
                    <th className="py-2">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className={`cursor-pointer border-t border-slate-100 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60 ${
                        selectedCall?.id === call.id ? "bg-slate-100 dark:bg-slate-800/80" : ""
                      }`}
                    >
                      <td className="py-3 font-semibold">{call.caller}</td>
                      <td className="py-3">{call.time}</td>
                      <td className="py-3 capitalize">{call.outcome}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Neutral
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{call.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <h3 className="text-lg font-semibold mb-3">Call details</h3>
              {selectedCall ? (
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    <span className="font-semibold">Caller:</span> {selectedCall.caller}
                  </p>
                  <p>
                    <span className="font-semibold">Outcome:</span> {selectedCall.outcome}
                  </p>
                  <div>
                    <span className="font-semibold">Intent Classification:</span>
                    <div className="mt-1 space-y-1">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Question: Services
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Emotional State:</span>
                    <div className="mt-1">
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Neutral
                      </span>
                    </div>
                  </div>
                  <p>
                    <span className="font-semibold">Summary:</span> {selectedCall.summary}
                  </p>
                  <p>
                    <span className="font-semibold">Contact:</span> {selectedCall.contact}
                  </p>
                  {selectedCall.appointmentLink && (
                    <a href={selectedCall.appointmentLink} className="text-brand-accent underline">
                      View appointment
                    </a>
                  )}
                  <div className="rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-800/60">
                    <p className="text-xs font-semibold mb-1">Transcript:</p>
                    <p className="text-xs">{selectedCall.transcript}</p>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Follow up: {selectedCall.followUp}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a call to inspect the transcript.</p>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <h3 className="text-lg font-semibold mb-3">Upcoming appointments</h3>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {appointments.map((appt) => (
                  <li key={appt.title} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                    <p className="font-semibold">{appt.title}</p>
                    <p>{appt.when}</p>
                    <p className="text-slate-500">with {appt.with}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Contact Memory</h2>
            <Link
              href="/aloha/contacts"
              className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
            >
              Manage Contacts
            </Link>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Aloha remembers basic information about callers to provide personalized, context-aware conversations.
          </p>
          {contactStats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Total Contacts</p>
                <p className="text-2xl font-semibold">{contactStats.totalContacts}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Do-Not-Call</p>
                <p className="text-2xl font-semibold text-red-600">{contactStats.doNotCallCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Recently Contacted</p>
                <p className="text-2xl font-semibold">{contactStats.recentlyContacted}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Avg Frequency</p>
                <p className="text-2xl font-semibold">{contactStats.averageContactFrequency}x</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading contact statistics...</p>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {conversationStats ? (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
                  <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Happy</span>
                        <span>{conversationStats.sentimentDistribution.happy}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${conversationStats.sentimentDistribution.happy}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Neutral</span>
                        <span>{conversationStats.sentimentDistribution.neutral}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${conversationStats.sentimentDistribution.neutral}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Upset</span>
                        <span>{conversationStats.sentimentDistribution.upset}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${conversationStats.sentimentDistribution.upset}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Angry</span>
                        <span>{conversationStats.sentimentDistribution.angry}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${conversationStats.sentimentDistribution.angry}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
                  <h3 className="text-lg font-semibold mb-4">Conversation Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Intent Classification Accuracy</p>
                      <p className="text-3xl font-semibold">{conversationStats.intentAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Average Conversation Duration</p>
                      <p className="text-3xl font-semibold">{Math.floor(conversationStats.avgConversationDuration / 60)}m {conversationStats.avgConversationDuration % 60}s</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Empathy Used</p>
                      <p className="text-3xl font-semibold">{conversationStats.empathyUsed} calls</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Loading conversation analytics...</p>
          )}
        </div>
      )}
    </div>
  );
}
