// lib/agents/config.ts

import type { AgentId } from "@/lib/config/agents";

export type AgentKey = AgentId; // Re-export for backward compatibility

export type TaskType =
  | "final_summary"
  | "important_call"
  | "bulk_triage"
  | "daily_digest"
  | "reply_draft"
  | "explain_email"
  | "creative_longform"
  | "default";

export interface AgentConfig {
  key: AgentKey;
  name: string;
  primaryModel: string;
  secondaryModel?: string;
  useSecondaryFor?: TaskType[];
}

export const AGENT_CONFIG: Record<AgentKey, AgentConfig> = {
  aloha: {
    key: "aloha",
    name: "Aloha",
    primaryModel: "gpt-4o", // voice calls
    secondaryModel: "gpt-4o-mini", // optional for cheap background stuff
    useSecondaryFor: [], // you can fill later if you want
  },
  insight: {
    key: "insight",
    name: "Insight",
    primaryModel: "gpt-4o",
  },
  studio: {
    key: "studio",
    name: "Studio",
    primaryModel: "gpt-4o", // vision-capable model for image analysis
    secondaryModel: "gpt-4o-mini", // optional, for non-vision/light tasks
    useSecondaryFor: [], // Studio always uses vision-capable model
  },
  sync: {
    key: "sync",
    name: "Sync",
    primaryModel: "gpt-4o-mini",
    secondaryModel: "gpt-4o",
    useSecondaryFor: ["daily_digest", "reply_draft", "explain_email"],
  },
};

