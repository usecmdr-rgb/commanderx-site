/**
 * Ask Insight Anything - Enhanced with deep cross-agent search
 * 
 * POST /api/insight/ask
 * 
 * Searches across:
 * - insights
 * - stats
 * - calls/emails
 * - patterns
 * - predictions
 * 
 * Returns:
 * - answer
 * - related insights
 * - suggested follow-up questions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { openai } from "@/lib/openai";
import { getTimeRangeBounds } from "@/lib/insight/utils";
import { compareToPreviousPeriod } from "@/lib/insight/patterns";
import { predictTrend } from "@/lib/insight/forecast";
import { getMemoryFacts, getUserGoals, getImportantRelationships } from "@/lib/insight/memory";
import { buildAskSystemPrompt, buildAskUserPrompt } from "@/lib/insight/prompts";
import { getWorkspaceIdFromAuth } from "@/lib/workspace-helpers";
import type { AskInsightAnswer, TimeRange, Insight } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, range = 'daily' as TimeRange } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get workspace ID
    const workspaceId = await getWorkspaceIdFromAuth();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const { start, end } = getTimeRangeBounds(range);

    // Fetch memory facts, goals, and relationships for personalization (workspace-based)
    const [memoryFacts, goals, relationships] = await Promise.all([
      getMemoryFacts(workspaceId, 0.5),
      getUserGoals(workspaceId, 'active'),
      getImportantRelationships(workspaceId, 60),
    ]);

    // 1. Fetch insights
    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // 2. Fetch stats
    const { data: currentStats } = await supabase
      .from('agent_stats_daily')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // 3. Fetch recent calls
    const { data: recentCalls } = await supabase
      .from('calls')
      .select('id, caller_name, outcome, summary, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // 4. Fetch recent emails
    const { data: recentEmails } = await supabase
      .from('email_summaries')
      .select('id, subject, sender, is_important, is_read, category, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // 5. Fetch historical stats for patterns
    const thirtyDaysAgo = new Date(start);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: historicalStats } = await supabase
      .from('agent_stats_daily')
      .select('date, alpha_calls_total, alpha_calls_missed, xi_important_emails, xi_missed_emails')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // 6. Calculate patterns and predictions
    const patterns: string[] = [];
    const predictions: string[] = [];

    if (historicalStats && historicalStats.length >= 2) {
      const missedCallsHistory = historicalStats.map(s => s.alpha_calls_missed || 0);
      const importantEmailsHistory = historicalStats.map(s => s.xi_important_emails || 0);
      
      if (missedCallsHistory.length >= 2) {
        const current = missedCallsHistory[missedCallsHistory.length - 1];
        const previous = missedCallsHistory[missedCallsHistory.length - 2];
        const comparison = compareToPreviousPeriod(current, previous);
        if (Math.abs(comparison.percent) > 10) {
          patterns.push(`Missed calls ${comparison.trend} by ${Math.abs(comparison.percent).toFixed(0)}%`);
        }
        
        if (missedCallsHistory.length >= 5) {
          const forecast = predictTrend(missedCallsHistory);
          predictions.push(`Predicted missed calls next period: ~${Math.round(forecast.value)} (${Math.round(forecast.confidence * 100)}% confidence)`);
        }
      }
      
      if (importantEmailsHistory.length >= 2) {
        const current = importantEmailsHistory[importantEmailsHistory.length - 1];
        const previous = importantEmailsHistory[importantEmailsHistory.length - 2];
        const comparison = compareToPreviousPeriod(current, previous);
        if (Math.abs(comparison.percent) > 10) {
          patterns.push(`Important emails ${comparison.trend} by ${Math.abs(comparison.percent).toFixed(0)}%`);
        }
      }
    }

    // 7. Build context for LLM (including memory)
    const context = {
      question,
      range,
      insights: insights?.slice(0, 10).map(i => ({
        title: i.title,
        description: i.description,
        severity: i.severity,
        category: i.category,
      })) || [],
      stats: currentStats ? {
        calls: {
          total: currentStats.alpha_calls_total || 0,
          missed: currentStats.alpha_calls_missed || 0,
        },
        emails: {
          important: currentStats.xi_important_emails || 0,
          unread: currentStats.xi_missed_emails || 0,
        },
      } : null,
      recentCalls: recentCalls?.slice(0, 5).map(c => ({
        caller: c.caller_name,
        outcome: c.outcome,
        summary: c.summary,
      })) || [],
      recentEmails: recentEmails?.slice(0, 5).map(e => ({
        subject: e.subject,
        sender: e.sender,
        important: e.is_important,
        category: e.category,
      })) || [],
      patterns,
      predictions,
      memory: {
        facts: memoryFacts.map(f => ({
          type: f.type,
          key: f.key,
          value: f.value,
          confidence: f.confidence,
        })),
        goals: goals.map(g => ({
          label: g.goalLabel,
          description: g.description,
          priority: g.priority,
        })),
        importantContacts: relationships.slice(0, 10).map(r => ({
          name: r.entityIdentifier,
          importance: r.importanceScore,
        })),
      },
    };

    // 8. Generate answer using LLM with new prompt builders
    const systemPrompt = buildAskSystemPrompt();
    const userPrompt = buildAskUserPrompt({
      question,
      range,
      insights: (insights?.slice(0, 20).map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        severity: i.severity,
        category: i.category,
      })) || []) as Insight[],
      stats: currentStats ? {
        calls: {
          total: currentStats.alpha_calls_total || 0,
          missed: currentStats.alpha_calls_missed || 0,
        },
        emails: {
          important: currentStats.xi_important_emails || 0,
          unread: currentStats.xi_missed_emails || 0,
        },
      } : {},
      forecasts: predictions,
      memoryFacts,
      goals,
      relationships,
    });

    let answerData: AskInsightAnswer;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content from LLM");
      }

      const parsed = JSON.parse(content);
      answerData = {
        answer: parsed.answer || "I couldn't generate an answer based on the available data.",
        sources: [
          ...(insights && insights.length > 0 ? [{ type: 'insights', id: 'list', label: `${insights.length} insights` }] : []),
          ...(recentCalls && recentCalls.length > 0 ? [{ type: 'calls', id: 'list', label: `${recentCalls.length} recent calls` }] : []),
          ...(recentEmails && recentEmails.length > 0 ? [{ type: 'emails', id: 'list', label: `${recentEmails.length} recent emails` }] : []),
        ],
        followUpQuestions: parsed.followUpQuestions || [
          "What caused the increase in missed calls?",
          "What are the top priorities right now?",
          "What trends should I watch?",
        ],
      };
    } catch (llmError: any) {
      console.error("LLM error:", llmError);
      // Fallback answer
      answerData = {
        answer: `Based on your ${range} data: ${currentStats ? `${currentStats.alpha_calls_missed || 0} missed calls, ${currentStats.xi_important_emails || 0} important emails` : 'limited data available'}. ${insights && insights.length > 0 ? `You have ${insights.length} insights that may be relevant.` : ''}`,
        sources: [],
        followUpQuestions: [
          "What are the top priorities right now?",
          "What trends should I watch?",
        ],
      };
    }

    return NextResponse.json({ ok: true, data: answerData });
  } catch (error: any) {
    console.error("Error in ask endpoint:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

