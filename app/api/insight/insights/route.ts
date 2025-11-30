import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { openai } from "@/lib/openai";
import { getWorkspaceIdFromAuth } from "@/lib/workspace-helpers";
import { getMemoryFacts, getUserGoals, getImportantRelationships } from "@/lib/insight/memory";
import { generateInsightsForRange } from "@/lib/insight/generator";
import { AGENT_CONFIG } from "@/lib/agents/config";
import type { InsightRequest, InsightResponse, TimeRange } from "@/types";
import { mockCalls, mockEmails, mockMediaItems } from "@/lib/data";

// Helper to query Aloha for insights
async function queryAloha(question: string, timeframe: string) {
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    alpha_calls_total: 0,
    alpha_calls_missed: 0,
    alpha_appointments: 0,
  };

  const missedCalls = latestStats.alpha_calls_missed;
  const totalCalls = latestStats.alpha_calls_total;
  const appointments = latestStats.alpha_appointments;

  return {
    data: {
      calls: { total: totalCalls, missed: missedCalls },
      appointments,
      recentCalls: mockCalls.slice(0, 3),
    },
    insights: [
      missedCalls > 0 
        ? `You have ${missedCalls} missed calls that need follow-up`
        : "All calls handled successfully",
      appointments > 0 
        ? `${appointments} new appointments scheduled`
        : "No new appointments today",
    ],
    decisions: missedCalls > 0 ? [{
      id: "decision-aloha-calls",
      decision: "Follow up on missed calls",
      context: `${missedCalls} calls need attention`,
      urgency: "high" as const,
    }] : [],
    risks: missedCalls > totalCalls * 0.1 ? [{
      id: "risk-aloha-missed",
      risk: "High missed call rate",
      severity: "medium" as const,
      agent: "aloha" as const,
    }] : [],
  };
}

// Helper to query Sync for insights
async function querySync(question: string, timeframe: string) {
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    xi_important_emails: 0,
    xi_missed_emails: 0,
    xi_payments_bills: 0,
    xi_invoices: 0,
  };

  const importantEmails = latestStats.xi_important_emails;
  const unreadEmails = latestStats.xi_missed_emails;
  const payments = latestStats.xi_payments_bills;
  const invoices = latestStats.xi_invoices;

  const needsReply = mockEmails.filter((e) => e.status === "needs_reply");
  const paymentEmails = mockEmails.filter((e) => e.categoryId === "payments" || e.categoryId === "invoices");

  return {
    data: {
      importantEmails,
      unreadEmails,
      payments,
      invoices,
      needsReply: needsReply.length,
    },
    insights: [
      importantEmails > 0 
        ? `${importantEmails} important emails flagged for attention`
        : "No urgent emails",
      unreadEmails > 5 
        ? `${unreadEmails} unread emails need triage`
        : "Inbox is well managed",
      payments > 0 || invoices > 0
        ? `${payments + invoices} payment-related items need processing`
        : "No pending payments",
    ],
    decisions: [
      ...needsReply.slice(0, 2).map((e, idx) => ({
        id: `decision-sync-${e.id}`,
        decision: `Reply to: ${e.subject}`,
        context: `From ${e.sender}`,
        urgency: "high" as const,
      })),
      ...(payments > 0 ? [{
        id: "decision-sync-payments",
        decision: "Process payment-related emails",
        context: `${payments} items need attention`,
        urgency: "medium" as const,
      }] : []),
    ],
    risks: unreadEmails > 10 ? [{
      id: "risk-sync-unread",
      risk: "High unread email backlog",
      severity: "medium" as const,
      agent: "sync" as const,
    }] : [],
  };
}

// Helper to query Studio for insights
async function queryStudio(question: string, timeframe: string) {
  const supabase = getSupabaseServerClient();
  const { data: stats } = await supabase
    .from("agent_stats_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const latestStats = stats || {
    mu_media_edits: 0,
  };

  const totalImpressions = mockMediaItems.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalLikes = mockMediaItems.reduce((sum, item) => sum + (item.likes || 0), 0);
  const avgEngagement = mockMediaItems.length > 0 
    ? (totalLikes / totalImpressions) * 100 
    : 0;

  const trend = avgEngagement > 3 ? "up" : avgEngagement < 1.5 ? "down" : "stable";

  return {
    data: {
      mediaEdits: latestStats.mu_media_edits,
      impressions: totalImpressions,
      likes: totalLikes,
      engagement: avgEngagement,
    },
    insights: [
      `Media engagement rate: ${avgEngagement.toFixed(1)}%`,
      trend === "up" 
        ? "Engagement trending upward - content performing well"
        : trend === "down"
        ? "Engagement below average - consider content refresh"
        : "Engagement stable",
    ],
    decisions: avgEngagement < 1.5 ? [{
      id: "decision-studio-engagement",
      decision: "Review and refresh content strategy",
      context: "Engagement below target",
      urgency: "medium" as const,
    }] : [],
    risks: avgEngagement < 1 ? [{
      id: "risk-studio-engagement",
      risk: "Very low engagement rate",
      severity: "high" as const,
      agent: "studio" as const,
    }] : [],
    trends: [{
      agent: "studio" as const,
      trend: `Engagement rate: ${avgEngagement.toFixed(1)}%`,
      direction: trend as "up" | "down" | "stable",
      impact: avgEngagement < 1.5 ? "high" as const : "medium" as const,
    }],
  };
}

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

    const body: InsightRequest & { language?: string; range?: TimeRange } = await request.json();
    const { question, timeframe = "today", language, range = "daily" } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get workspace ID for memory/context
    const workspaceId = await getWorkspaceIdFromAuth();
    
    // Fetch memory facts and relationships for personalization
    const [memoryFacts, goals, relationships] = workspaceId ? await Promise.all([
      getMemoryFacts(workspaceId, 0.5),
      getUserGoals(workspaceId, 'active'),
      getImportantRelationships(workspaceId, 60),
    ]) : [[], [], []];

    // Query all agents in parallel
    const [alohaResults, syncResults, studioResults] = await Promise.all([
      queryAloha(question, timeframe),
      querySync(question, timeframe),
      queryStudio(question, timeframe),
    ]);

    // Generate insights from database
    const dbInsights = await generateInsightsForRange(user.id, range as TimeRange);

    // Merge raw insights
    const rawKeyInsights = [
      ...alohaResults.insights,
      ...syncResults.insights,
      ...studioResults.insights,
    ];

    // Merge priority decisions
    const rawPriorityDecisions = [
      ...alohaResults.decisions.map((d) => ({ ...d, agent: "aloha" as const })),
      ...syncResults.decisions.map((d) => ({ ...d, agent: "sync" as const })),
      ...studioResults.decisions.map((d) => ({ ...d, agent: "studio" as const })),
    ];

    // Merge trends
    const rawTrends: InsightResponse["trends"] = [
      ...(studioResults.trends || []),
      {
        agent: "aloha" as const,
        trend: alohaResults.data.calls.missed > 0 
          ? "Missed calls need attention"
          : "Call handling optimal",
        direction: alohaResults.data.calls.missed > 0 ? "down" as const : "up" as const,
        impact: alohaResults.data.calls.missed > 0 ? "medium" as const : "low" as const,
      },
      {
        agent: "sync" as const,
        trend: syncResults.data.unreadEmails > 5
          ? "Unread email backlog growing"
          : "Email management efficient",
        direction: syncResults.data.unreadEmails > 5 ? "down" as const : "up" as const,
        impact: syncResults.data.unreadEmails > 5 ? "medium" as const : "low" as const,
      },
    ];

    // Merge risks
    const rawRisks = [
      ...alohaResults.risks,
      ...syncResults.risks,
      ...studioResults.risks,
    ];

    // Generate raw recommendations
    const rawRecommendations = [
      ...(alohaResults.data.calls.missed > 0 ? [{
        id: "rec-aloha-calls",
        recommendation: "Review call routing and availability",
        rationale: `${alohaResults.data.calls.missed} missed calls detected`,
        priority: "high" as const,
      }] : []),
      ...(syncResults.data.unreadEmails > 5 ? [{
        id: "rec-sync-emails",
        recommendation: "Prioritize email triage and response",
        rationale: `${syncResults.data.unreadEmails} unread emails need attention`,
        priority: "medium" as const,
      }] : []),
      ...(studioResults.data.engagement < 1.5 ? [{
        id: "rec-studio-content",
        recommendation: "Refresh content strategy",
        rationale: `Engagement rate at ${studioResults.data.engagement.toFixed(1)}% is below target`,
        priority: "medium" as const,
      }] : []),
    ];

    // Enhance with OpenAI
    let enhancedResponse: InsightResponse;
    
    try {
      const systemPrompt = `You are the OVRSEE Insight Agent. Analyze the user's question and provided data from all agents (Aloha, Sync, Studio) to generate enhanced, personalized insights.

Rules:
- Be specific and actionable
- Reference memory facts and user goals when relevant
- Prioritize insights by importance
- Suggest practical recommendations
- Identify patterns and trends
- Be concise but insightful`;

      const userPrompt = `User Question: "${question}"
Time Range: ${range}

=== RAW DATA FROM AGENTS ===
Aloha: ${JSON.stringify(alohaResults.data, null, 2)}
Sync: ${JSON.stringify(syncResults.data, null, 2)}
Studio: ${JSON.stringify(studioResults.data, null, 2)}

=== RAW INSIGHTS ===
${JSON.stringify(rawKeyInsights, null, 2)}

=== DATABASE INSIGHTS ===
${JSON.stringify(dbInsights.slice(0, 10).map(i => ({ title: i.title, description: i.description, severity: i.severity })), null, 2)}

=== MEMORY FACTS ===
${JSON.stringify(memoryFacts.slice(0, 10), null, 2)}

=== USER GOALS ===
${JSON.stringify(goals.slice(0, 5), null, 2)}

=== IMPORTANT RELATIONSHIPS ===
${JSON.stringify(relationships.slice(0, 5), null, 2)}

Generate an enhanced InsightResponse JSON with:
1. keyInsights: 5-10 most important insights (enhanced with context)
2. priorityDecisions: Top 5 decisions needing action (prioritized)
3. trends: Enhanced trend analysis
4. risks: Top risks with severity assessment
5. recommendations: 3-5 actionable recommendations
6. followUpQuestions: 2-3 suggested follow-up questions

Return ONLY valid JSON matching the InsightResponse interface.`;

      const completion = await openai.chat.completions.create({
        model: AGENT_CONFIG.insight.primaryModel, // Use gpt-4o for business intelligence
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        enhancedResponse = {
          question,
          generatedAt: new Date().toISOString(),
          keyInsights: parsed.keyInsights || rawKeyInsights,
          priorityDecisions: parsed.priorityDecisions || rawPriorityDecisions,
          trends: parsed.trends || rawTrends,
          risks: parsed.risks || rawRisks,
          recommendations: parsed.recommendations || rawRecommendations,
          followUpQuestions: parsed.followUpQuestions || [
            "What are the top priorities right now?",
            "What trends should I watch?",
          ],
        };
      } else {
        throw new Error("No content from LLM");
      }
    } catch (llmError: any) {
      console.error("LLM error, using raw insights:", llmError);
      // Fallback to raw merged insights
      enhancedResponse = {
        question,
        generatedAt: new Date().toISOString(),
        keyInsights: rawKeyInsights,
        priorityDecisions: rawPriorityDecisions,
        trends: rawTrends,
        risks: rawRisks,
        recommendations: rawRecommendations,
        followUpQuestions: [
          "What are the top priorities right now?",
          "What trends should I watch?",
        ],
      };
    }

    return NextResponse.json({ ok: true, data: enhancedResponse });
  } catch (error: any) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}

