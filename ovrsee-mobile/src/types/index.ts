// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Agent types (in required order)
export type AgentKey = "sync" | "aloha" | "studio" | "insight";

export interface AgentInfo {
  key: AgentKey;
  name: string;
  role: string;
  description: string;
}

// Sync agent types
export interface SyncOverview {
  gmailConnected: boolean;
  calendarConnected: boolean;
  syncHealth: "healthy" | "warning" | "error";
}

export interface AgendaItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  type: "meeting" | "event" | "task";
}

export interface EmailDigest {
  importantCount: number;
  followUpNeeds: number;
  newslettersFiled: number;
}

export interface EmailDraft {
  id: string;
  to: string;
  subject: string;
  body: string;
  context?: string; // Context about why this draft was created
  createdAt: string;
  emailId?: string; // Original email this is replying to
}

// Aloha agent types
export interface CallRecord {
  id: string;
  contactName: string;
  contactNumber: string;
  timestamp: string;
  summary: string;
  status: "handled" | "missed" | "needsFollowUp";
  transcript?: string;
  duration?: number;
}

// Studio agent types
export interface StudioItem {
  id: string;
  title: string;
  thumbnail?: string;
  status: "draft" | "review" | "published";
  description: string;
  createdAt: string;
}

// Insights agent types
export interface Insight {
  id: string;
  title: string;
  explanation: string;
  tag: string;
  chart?: {
    type: "line" | "bar" | "pie";
    data: number[];
  };
  createdAt: string;
}

// Summary types
export interface TodaySummary {
  callsHandled: number;
  emailsProcessed: number;
  insightsGenerated: number;
  creativeUpdates: number;
}

export interface AgentSummary {
  agentKey: AgentKey;
  agentName: string;
  bullets: string[];
}

// Integration types
export interface IntegrationStatus {
  gmail: boolean;
  calendar: boolean;
  openai: boolean;
}

// Settings types
export interface Settings {
  theme: "light" | "dark";
  notifications: boolean;
  agents: {
    sync: boolean;
    aloha: boolean;
    studio: boolean;
    insight: boolean;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
