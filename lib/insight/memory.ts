/**
 * Insight Memory & Personalization Engine
 * 
 * Workspace-based memory system that learns from behavior patterns,
 * preferences, goals, and relationships.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { differenceInHours } from "date-fns";
import type { InsightMemoryFact, InsightRelationship } from "@/types";

export interface BehaviorSignals {
  workspaceId: string;
  missedCallsLast7Days: number;
  missedCallsPrev7Days: number;
  avgResponseTimeHours: number;
  avgResponseTimePrevHours: number;
  unreadImportantEmails: number;
  overdueTasks: number;
  negativeSentimentRatio: number; // 0..1
  activeHoursHistogram: number[]; // length 24, counts per hour
}

export interface ContactMetrics {
  entityIdentifier: string;
  displayName?: string;
  interactionCount: number;
  lastContactAt?: Date;
  sentimentScore?: number; // -1..1
}

/**
 * Score a contact's importance using interaction count, recency, sentiment.
 * Returns a 0..100 score.
 */
export function scoreContactImportance(metrics: ContactMetrics): number {
  const { interactionCount, lastContactAt, sentimentScore } = metrics;

  const base = Math.min(interactionCount * 5, 50); // 10+ interactions -> 50

  let recencyScore = 0;
  if (lastContactAt) {
    const hoursAgo = differenceInHours(new Date(), lastContactAt);
    if (hoursAgo < 24) recencyScore = 30;
    else if (hoursAgo < 72) recencyScore = 25;
    else if (hoursAgo < 168) recencyScore = 20;
    else if (hoursAgo < 720) recencyScore = 10;
  }

  let sentimentScoreNorm = 10;
  if (typeof sentimentScore === "number") {
    // map -1..1 to 0..20
    sentimentScoreNorm = ((sentimentScore + 1) / 2) * 20;
  }

  return Math.round(
    Math.max(
      0,
      Math.min(100, base + recencyScore + sentimentScoreNorm)
    )
  );
}

/**
 * Detect the user's main working window from activity histogram (0-23h).
 */
export function detectPrimaryWorkingWindow(
  hist: number[]
): { startHour: number; endHour: number; label: string } | null {
  if (!hist || hist.length !== 24) return null;

  // 3-hour sliding window to find peak
  let bestStart = 9;
  let bestSum = -1;

  for (let start = 0; start < 24; start++) {
    const idx1 = start;
    const idx2 = (start + 1) % 24;
    const idx3 = (start + 2) % 24;
    const sum = hist[idx1] + hist[idx2] + hist[idx3];
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = start;
    }
  }

  const startHour = bestStart;
  const endHour = (bestStart + 3) % 24;

  let label = "General hours";
  if (startHour >= 5 && endHour <= 12) label = "Morning focus window";
  else if (startHour >= 12 && endHour <= 18) label = "Afternoon focus window";
  else label = "Evening focus window";

  return { startHour, endHour, label };
}

/**
 * Build memory facts from behavior metrics.
 */
export function deriveBehaviorMemoryFacts(
  signals: BehaviorSignals
): Array<{
  type: "behavior" | "pattern" | "risk";
  key: string;
  value: Record<string, any>;
  confidence: number;
  importanceScore: number;
}> {
  const facts: Array<{
    type: "behavior" | "pattern" | "risk";
    key: string;
    value: Record<string, any>;
    confidence: number;
    importanceScore: number;
  }> = [];

  const {
    missedCallsLast7Days,
    missedCallsPrev7Days,
    avgResponseTimeHours,
    avgResponseTimePrevHours,
    unreadImportantEmails,
    overdueTasks,
    negativeSentimentRatio,
    activeHoursHistogram,
  } = signals;

  // missed calls trend
  const missedDelta = missedCallsLast7Days - missedCallsPrev7Days;
  if (Math.abs(missedDelta) >= 3) {
    facts.push({
      type: "pattern",
      key: "missed_calls_trend",
      value: {
        current: missedCallsLast7Days,
        previous: missedCallsPrev7Days,
        delta: missedDelta,
      },
      confidence: 0.7,
      importanceScore: missedCallsLast7Days > 0 ? 70 : 40,
    });
  }

  // response time behavior
  if (avgResponseTimeHours > 0) {
    facts.push({
      type: "behavior",
      key: "avg_response_time_hours",
      value: {
        current: avgResponseTimeHours,
        previous: avgResponseTimePrevHours,
      },
      confidence: 0.8,
      importanceScore: avgResponseTimeHours > 4 ? 80 : 50,
    });
  }

  // unread important emails
  if (unreadImportantEmails > 0) {
    facts.push({
      type: "risk",
      key: "unread_important_emails",
      value: { count: unreadImportantEmails },
      confidence: 0.9,
      importanceScore: 85,
    });
  }

  // overdue tasks
  if (overdueTasks > 0) {
    facts.push({
      type: "risk",
      key: "overdue_tasks",
      value: { count: overdueTasks },
      confidence: 0.9,
      importanceScore: 80,
    });
  }

  // negative sentiment
  if (negativeSentimentRatio > 0.3) {
    facts.push({
      type: "risk",
      key: "negative_sentiment_ratio",
      value: { ratio: negativeSentimentRatio },
      confidence: 0.7,
      importanceScore: 75,
    });
  }

  // working window
  const window = detectPrimaryWorkingWindow(activeHoursHistogram);
  if (window) {
    facts.push({
      type: "behavior",
      key: "primary_working_window",
      value: window,
      confidence: 0.85,
      importanceScore: 60,
    });
  }

  return facts;
}

/**
 * Upsert a memory fact in DB.
 */
export async function upsertMemoryFact(params: {
  workspaceId: string;
  type: string;
  key: string;
  value: Record<string, any>;
  confidence: number;
  importanceScore: number;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  const { error } = await supabase
    .from("insight_memory_facts")
    .upsert(
      {
        workspace_id: params.workspaceId,
        type: params.type,
        key: params.key,
        value: params.value,
        confidence: params.confidence,
        importance_score: params.importanceScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,type,key" }
    );

  if (error) {
    console.error(`Error upserting memory fact (${params.key}):`, error);
    // Don't throw - allow memory updates to continue even if one fails
  }
}

/**
 * Main entry point: updateInsightMemory
 * Call this from your cron after generating insights.
 */
export async function updateInsightMemory(
  workspaceId: string,
  signals: BehaviorSignals,
  topContacts: ContactMetrics[]
): Promise<void> {
  const supabase = getSupabaseServerClient();

  // 1) Behavior + pattern facts
  const behaviorFacts = deriveBehaviorMemoryFacts(signals);
  await Promise.all(
    behaviorFacts.map((f) =>
      upsertMemoryFact({
        workspaceId,
        type: f.type,
        key: f.key,
        value: f.value,
        confidence: f.confidence,
        importanceScore: f.importanceScore,
      })
    )
  );

  // 2) Contacts → insight_relationships and memory facts
  for (const contact of topContacts) {
    const importanceScore = scoreContactImportance(contact);

    // Upsert relationship row
    const { error: relationshipError } = await supabase
      .from("insight_relationships")
      .upsert(
        {
          workspace_id: workspaceId,
          entity_type: "contact",
          entity_identifier: contact.entityIdentifier,
          display_name: contact.displayName,
          interaction_count: contact.interactionCount,
          sentiment_score: contact.sentimentScore,
          last_contact_at: contact.lastContactAt?.toISOString(),
          importance_score: importanceScore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,entity_type,entity_identifier" }
      );

    if (relationshipError) {
      console.error(`Error upserting relationship for ${contact.entityIdentifier}:`, relationshipError);
      // Continue with next contact
      continue;
    }

    // Also store memory fact
    await upsertMemoryFact({
      workspaceId,
      type: "pattern",
      key: `contact_${contact.entityIdentifier}_importance`,
      value: {
        entityIdentifier: contact.entityIdentifier,
        displayName: contact.displayName,
        importanceScore,
      },
      confidence: 0.8,
      importanceScore,
    });
  }
}

/**
 * Get memory facts for a workspace
 */
export async function getMemoryFacts(
  workspaceId: string,
  minConfidence: number = 0.5
): Promise<InsightMemoryFact[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("insight_memory_facts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("confidence", minConfidence)
    .order("importance_score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching memory facts:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    importanceScore: row.importance_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get user goals for a workspace
 */
export async function getUserGoals(
  workspaceId: string,
  status?: "active" | "completed" | "archived"
) {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("insight_user_goals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("priority", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching goals:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    goalLabel: row.goal_label,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get important relationships for a workspace
 */
export async function getImportantRelationships(
  workspaceId: string,
  minImportance: number = 60
): Promise<InsightRelationship[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("insight_relationships")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("importance_score", minImportance)
    .order("importance_score", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching relationships:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    entityType: row.entity_type,
    entityIdentifier: row.entity_identifier,
    displayName: row.display_name,
    interactionCount: row.interaction_count,
    sentimentScore: row.sentiment_score,
    lastContactAt: row.last_contact_at,
    importanceScore: row.importance_score,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
