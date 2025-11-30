"use client";

import { useState, useEffect } from "react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateInsightHealth, getHealthScoreColor, getHealthScoreBgColor, getHealthScoreLabel, getHealthScoreTrendMessage, type InsightHealthData } from "@/lib/insight/scoring";
import { useSupabase } from "@/components/SupabaseProvider";

interface InsightScoreWidgetProps {
  range?: 'daily' | 'weekly' | 'monthly';
}

export default function InsightScoreWidget({ range = 'daily' }: InsightScoreWidgetProps) {
  const { supabase } = useSupabase();
  const [score, setScore] = useState<number | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendMessage, setTrendMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScore() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Calculate date range
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);
        
        if (range === 'daily') {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
        } else if (range === 'weekly') {
          const dayOfWeek = start.getDay();
          const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
        } else {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
          end.setHours(23, 59, 59, 999);
        }

        // Fetch current period data
        const { data: currentStats } = await supabase
          .from('agent_stats_daily')
          .select('alpha_calls_missed, xi_important_emails, xi_missed_emails')
          .eq('user_id', user.id)
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Fetch previous period data
        const prevStart = new Date(start);
        const prevEnd = new Date(end);
        if (range === 'daily') {
          prevStart.setDate(prevStart.getDate() - 1);
          prevEnd.setDate(prevEnd.getDate() - 1);
        } else if (range === 'weekly') {
          prevStart.setDate(prevStart.getDate() - 7);
          prevEnd.setDate(prevEnd.getDate() - 7);
        } else {
          prevStart.setMonth(prevStart.getMonth() - 1);
          prevEnd.setMonth(prevEnd.getMonth() - 1);
        }

        const { data: previousStats } = await supabase
          .from('agent_stats_daily')
          .select('alpha_calls_missed, xi_important_emails, xi_missed_emails')
          .eq('user_id', user.id)
          .gte('date', prevStart.toISOString().split('T')[0])
          .lte('date', prevEnd.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Fetch emails for response time calculation
        const { data: emails } = await supabase
          .from('email_summaries')
          .select('is_important, is_read, created_at')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        // Calculate metrics
        const missedCalls = currentStats?.alpha_calls_missed || 0;
        const importantEmails = currentStats?.xi_important_emails || 0;
        const unreadImportant = emails?.filter(e => e.is_important && !e.is_read).length || 0;
        const unreadEmails = currentStats?.xi_missed_emails || 0;
        
        // Estimate response time (simplified)
        const responseTimeAvg = unreadEmails > 0 ? unreadEmails * 0.5 : 2;

        // Calculate health data
        const healthData: InsightHealthData = {
          missedCalls,
          overdueEmails: 0, // Would need to check actual dates
          unreadImportantEmails: unreadImportant,
          overdueTasks: 0, // Would need task data
          customerSentiment: 0.7, // Placeholder - would need sentiment analysis
          responseTimeAvg,
        };

        const currentScore = calculateInsightHealth(healthData);
        setScore(currentScore);

        // Calculate previous score if data available
        if (previousStats) {
          const prevHealthData: InsightHealthData = {
            missedCalls: previousStats.alpha_calls_missed || 0,
            overdueEmails: 0,
            unreadImportantEmails: previousStats.xi_important_emails || 0,
            overdueTasks: 0,
            customerSentiment: 0.7,
            responseTimeAvg: 2,
          };
          const prevScore = calculateInsightHealth(prevHealthData);
          setPreviousScore(prevScore);
          const message = getHealthScoreTrendMessage(currentScore, prevScore);
          setTrendMessage(message);
        }
      } catch (error) {
        console.error('Error fetching insight score:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [range, supabase]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-slate-400 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm text-slate-500">Calculating Insight Score...</p>
          </div>
        </div>
      </div>
    );
  }

  if (score === null) {
    return null;
  }

  const colorClass = getHealthScoreColor(score);
  const bgClass = getHealthScoreBgColor(score);
  const label = getHealthScoreLabel(score);
  const trend = previousScore !== null ? (score > previousScore ? 'up' : score < previousScore ? 'down' : 'flat') : null;

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Insight Score</h3>
          <p className="text-xs text-slate-500 mt-1">Communication efficiency</p>
        </div>
        <div className={`rounded-full p-3 ${bgClass}`}>
          <Activity size={24} className={colorClass} />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-4xl font-bold ${colorClass}`}>
          {score}
        </span>
        <span className="text-lg text-slate-500">/100</span>
        {trend && (
          <div className="ml-auto">
            {trend === 'up' && <TrendingUp size={20} className="text-green-600 dark:text-green-400" />}
            {trend === 'down' && <TrendingDown size={20} className="text-red-600 dark:text-red-400" />}
            {trend === 'flat' && <Minus size={20} className="text-slate-400" />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${colorClass}`}>
          {label}
        </span>
        {previousScore !== null && (
          <span className="text-xs text-slate-500">
            {score > previousScore ? '+' : ''}{score - previousScore} from last {range}
          </span>
        )}
      </div>

      {trendMessage && (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 italic">
          {trendMessage}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 70
              ? 'bg-green-500'
              : score >= 40
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

