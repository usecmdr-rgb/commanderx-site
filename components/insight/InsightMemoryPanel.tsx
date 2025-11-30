"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp, Edit2, Trash2, X, Plus, Target, Users, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import type { InsightMemoryFact, InsightUserGoal, InsightRelationship } from "@/types";
import { formatRelativeTime } from "@/lib/insight/utils";

interface InsightMemoryPanelProps {
  collapsed?: boolean;
}

export default function InsightMemoryPanel({ collapsed: initialCollapsed = false }: InsightMemoryPanelProps) {
  const { supabase } = useSupabase();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [loading, setLoading] = useState(true);
  const [memoryFacts, setMemoryFacts] = useState<InsightMemoryFact[]>([]);
  const [goals, setGoals] = useState<InsightUserGoal[]>([]);
  const [relationships, setRelationships] = useState<InsightRelationship[]>([]);
  const [editingFact, setEditingFact] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMemoryData();
  }, []);

  async function loadMemoryData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get workspace ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (!workspace) return;

      const workspaceId = workspace.id;

      // Fetch memory facts (workspace-based)
      const { data: facts } = await supabase
        .from('insight_memory_facts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('confidence', 0.5)
        .order('importance_score', { ascending: false })
        .limit(20);

      // Fetch goals (workspace-based)
      const { data: goalsData } = await supabase
        .from('insight_user_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('priority', { ascending: false });

      // Fetch relationships (workspace-based)
      const { data: relationshipsData } = await supabase
        .from('insight_relationships')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('importance_score', 60)
        .order('importance_score', { ascending: false })
        .limit(10);

      setMemoryFacts((facts || []).map(f => ({
        id: f.id,
        workspaceId: f.workspace_id,
        type: f.type,
        key: f.key,
        value: f.value,
        confidence: f.confidence,
        importanceScore: f.importance_score,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })));

      setGoals((goalsData || []).map(g => ({
        id: g.id,
        workspaceId: g.workspace_id,
        goalLabel: g.goal_label,
        description: g.description,
        priority: g.priority,
        status: g.status,
        dueDate: g.due_date,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })));

      setRelationships((relationshipsData || []).map(r => ({
        id: r.id,
        workspaceId: r.workspace_id,
        entityType: r.entity_type,
        entityIdentifier: r.entity_identifier,
        displayName: r.display_name,
        interactionCount: r.interaction_count,
        sentimentScore: r.sentiment_score,
        lastContactAt: r.last_contact_at,
        importanceScore: r.importance_score,
        notes: r.notes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })));

      // Find most recent update
      const allDates = [
        ...(facts || []).map(f => new Date(f.updated_at)),
        ...(goalsData || []).map(g => new Date(g.updated_at)),
        ...(relationshipsData || []).map(r => new Date(r.updated_at)),
      ];
      if (allDates.length > 0) {
        setLastUpdated(new Date(Math.max(...allDates.map(d => d.getTime()))));
      }
    } catch (error) {
      console.error('Error loading memory data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteMemoryFact(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get workspace ID
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (!workspace) return;

    const { error } = await supabase
      .from('insight_memory_facts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.id);

    if (!error) {
      setMemoryFacts(facts => facts.filter(f => f.id !== id));
    }
  }

  function formatMemoryKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  function formatMemoryValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      if (value.hour !== undefined) {
        return `${value.hour}:00`;
      }
      if (value.dayName) {
        return value.dayName;
      }
      if (value.percentage) {
        return `${value.percentage.toFixed(0)}%`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-slate-400 animate-pulse" />
          <p className="text-sm text-slate-500">Loading memory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold">Insight Memory</h3>
        </div>
        {collapsed ? (
          <ChevronDown size={20} className="text-slate-400" />
        ) : (
          <ChevronUp size={20} className="text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 space-y-6">
          {/* Top Contacts */}
          {relationships.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-600 dark:text-slate-400" />
                <h4 className="font-semibold text-sm">Your Top Contacts</h4>
              </div>
              <div className="space-y-2">
                {relationships.slice(0, 5).map(rel => (
                  <div
                    key={rel.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rel.entityIdentifier}</span>
                      <span className="text-xs text-slate-500">
                        {rel.importanceScore}/100 importance
                      </span>
                    </div>
                    {rel.notes && (
                      <p className="text-xs text-slate-500 mt-1">{rel.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-slate-600 dark:text-slate-400" />
                <h4 className="font-semibold text-sm">Your Goals</h4>
              </div>
              <div className="space-y-2">
                {goals.map(goal => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.goalLabel}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Priority {goal.priority}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-slate-500 mt-1">{goal.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns & Preferences */}
          {memoryFacts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-slate-600 dark:text-slate-400" />
                <h4 className="font-semibold text-sm">Your Patterns</h4>
              </div>
              <div className="space-y-2">
                {memoryFacts
                  .filter(f => f.type === 'pattern' || f.type === 'behavior')
                  .slice(0, 5)
                  .map(fact => (
                    <div
                      key={fact.id}
                      className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{formatMemoryKey(fact.key)}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatMemoryValue(fact.value)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {Math.round(fact.confidence * 100)}%
                          </span>
                          <button
                            onClick={() => deleteMemoryFact(fact.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete this memory"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Known Weaknesses */}
          {memoryFacts.filter(f => f.type === 'risk').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-semibold text-sm">Known Weaknesses</h4>
              </div>
              <div className="space-y-2">
                {memoryFacts
                  .filter(f => f.type === 'risk')
                  .map(fact => (
                    <div
                      key={fact.id}
                      className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-800 dark:bg-yellow-900/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-yellow-800 dark:text-yellow-300">
                            {formatMemoryKey(fact.key)}
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            {formatMemoryValue(fact.value)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteMemoryFact(fact.id)}
                          className="text-yellow-600 hover:text-red-600"
                          title="Delete this memory"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {lastUpdated && (
            <p className="text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
              Last updated: {formatRelativeTime(lastUpdated)}
            </p>
          )}

          {memoryFacts.length === 0 && goals.length === 0 && relationships.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Brain size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No memory data yet. Memory builds over time as you use Insight.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

