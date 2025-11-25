"use client";

import { Brain, Heart, MessageSquare, TrendingUp, Clock, Phone, User } from "lucide-react";

interface CallDetailsProps {
  call: {
    id: string;
    caller?: string;
    phone_number?: string;
    time?: string;
    outcome?: string;
    summary?: string;
    transcript?: string;
    sentiment?: string;
    intent?: {
      primaryIntent?: string;
      emotionalState?: string;
      callFlowIntent?: string;
      confidence?: number;
    };
    conversationState?: {
      phase?: string;
      empathyProvided?: boolean;
      questionsAsked?: number;
      questionsAnswered?: number;
    };
    contactProfile?: {
      name?: string | null;
      times_contacted?: number;
      last_outcome?: string | null;
    };
    duration?: number;
  };
}

export default function CallDetailsView({ call }: CallDetailsProps) {
  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment?.toLowerCase()) {
      case "happy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "angry":
      case "upset":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "frustrated":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "confused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  const getEmotionalStateLabel = (state: string | undefined) => {
    if (!state) return "Neutral";
    return state.charAt(0).toUpperCase() + state.slice(1);
  };

  const getIntentLabel = (intent: string | undefined) => {
    if (!intent) return "Unknown";
    return intent.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Call Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {call.caller || "Unknown Caller"}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              {call.phone_number && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{call.phone_number}</span>
                </div>
              )}
              {call.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{call.time}</span>
                </div>
              )}
              {call.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                </div>
              )}
            </div>
          </div>
          {call.outcome && (
            <span className="px-3 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
              {call.outcome}
            </span>
          )}
        </div>

        {/* Contact Profile Info */}
        {call.contactProfile && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">Contact Memory</span>
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              {call.contactProfile.name && (
                <p>Name: {call.contactProfile.name}</p>
              )}
              {call.contactProfile.times_contacted !== undefined && (
                <p>Times contacted: {call.contactProfile.times_contacted}</p>
              )}
              {call.contactProfile.last_outcome && (
                <p>Last outcome: {call.contactProfile.last_outcome.replace(/_/g, " ")}</p>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {call.summary && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-1">Summary</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{call.summary}</p>
          </div>
        )}
      </div>

      {/* Conversation Intelligence */}
      {call.intent && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold">Conversation Intelligence</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Primary Intent</p>
              <p className="text-sm font-semibold">{getIntentLabel(call.intent.primaryIntent)}</p>
              {call.intent.confidence && (
                <p className="text-xs text-slate-500 mt-1">
                  Confidence: {(call.intent.confidence * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Emotional State</p>
              <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getSentimentColor(call.intent.emotionalState)}`}>
                {getEmotionalStateLabel(call.intent.emotionalState)}
              </span>
            </div>
            {call.intent.callFlowIntent && call.intent.callFlowIntent !== "none" && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Call Flow Intent</p>
                <p className="text-sm font-semibold">{getIntentLabel(call.intent.callFlowIntent)}</p>
              </div>
            )}
            {call.sentiment && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Detected Sentiment</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getSentimentColor(call.sentiment)}`}>
                  {getEmotionalStateLabel(call.sentiment)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversation State */}
      {call.conversationState && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold">Conversation State</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {call.conversationState.phase && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Phase</p>
                <p className="text-sm font-semibold capitalize">{call.conversationState.phase.replace(/_/g, " ")}</p>
              </div>
            )}
            {call.conversationState.empathyProvided !== undefined && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Empathy</p>
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${call.conversationState.empathyProvided ? "text-red-500" : "text-slate-400"}`} />
                  <span className="text-sm font-semibold">
                    {call.conversationState.empathyProvided ? "Provided" : "Not Needed"}
                  </span>
                </div>
              </div>
            )}
            {call.conversationState.questionsAsked !== undefined && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Questions</p>
                <p className="text-sm font-semibold">
                  {call.conversationState.questionsAnswered || 0} / {call.conversationState.questionsAsked} answered
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript */}
      {call.transcript && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold">Transcript</h3>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{call.transcript}</p>
          </div>
        </div>
      )}
    </div>
  );
}

