import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import type { DailyBrief } from "@/types";
import { mockCalls, mockEmails, mockMediaItems } from "@/lib/data";

// Helper function to fetch Alpha data (calls, appointments, deadlines)
async function fetchAlphaData() {
  // In production, this would query the actual Alpha agent data
  // For now, we'll use mock data and stats
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

  // Get recent calls and appointments
  const recentCalls = mockCalls.slice(0, 5);
  const importantCalls = recentCalls.filter((c) => c.outcome === "missed" || c.followUp);
  
  return {
    calls: {
      total: latestStats.alpha_calls_total,
      missed: latestStats.alpha_calls_missed,
      recent: recentCalls,
    },
    appointments: latestStats.alpha_appointments,
    deadlines: importantCalls.map((c) => ({
      id: c.id,
      description: c.followUp,
      dueDate: new Date().toISOString(),
    })),
    conflicts: [], // Would check calendar for conflicts
  };
}

// Helper function to fetch Xi data (emails, tasks, reminders)
async function fetchXiData() {
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

  // Get important emails
  const importantEmails = mockEmails.filter((e) => e.categoryId === "important" || e.status === "needs_reply");
  const paymentEmails = mockEmails.filter((e) => e.categoryId === "payments" || e.categoryId === "invoices");

  return {
    importantEmails: latestStats.xi_important_emails,
    unreadEmails: latestStats.xi_missed_emails,
    payments: latestStats.xi_payments_bills,
    invoices: latestStats.xi_invoices,
    tasks: importantEmails.map((e) => ({
      id: e.id,
      description: `Reply to: ${e.subject}`,
      priority: e.status === "needs_reply" ? "high" as const : "medium" as const,
    })),
    reminders: paymentEmails.map((e) => ({
      id: e.id,
      message: `${e.subject} - ${e.sender}`,
      type: e.categoryId === "payments" ? "payment" as const : "deadline" as const,
    })),
  };
}

// Helper function to fetch Mu data (metrics, anomalies, performance)
async function fetchMuData() {
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

  // Calculate metrics from media items
  const totalImpressions = mockMediaItems.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalLikes = mockMediaItems.reduce((sum, item) => sum + (item.likes || 0), 0);
  const avgEngagement = mockMediaItems.length > 0 
    ? (totalLikes / totalImpressions) * 100 
    : 0;

  return {
    mediaEdits: latestStats.mu_media_edits,
    metrics: {
      impressions: totalImpressions,
      likes: totalLikes,
      engagement: avgEngagement,
    },
    anomalies: avgEngagement < 2 ? ["Low engagement rate detected"] : [],
    performance: {
      trend: avgEngagement > 3 ? "up" as const : avgEngagement < 1.5 ? "down" as const : "stable" as const,
      insight: avgEngagement > 3 
        ? "Strong engagement on recent posts"
        : avgEngagement < 1.5
        ? "Engagement below average - consider content refresh"
        : "Engagement stable",
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Fetch data from all agents
    const [alphaData, xiData, muData] = await Promise.all([
      fetchAlphaData(),
      fetchXiData(),
      fetchMuData(),
    ]);

    // Generate top 5 priorities
    const topPriorities = [
      ...alphaData.deadlines.slice(0, 2).map((d) => d.description),
      ...xiData.tasks.slice(0, 2).map((t) => t.description),
      muData.anomalies.length > 0 ? muData.anomalies[0] : "Review media performance metrics",
    ].slice(0, 5);

    // Generate action items
    const actionItems = [
      ...xiData.tasks.map((task) => ({
        id: `task-${task.id}`,
        description: task.description,
        agent: "xi" as const,
        priority: task.priority,
      })),
      ...alphaData.deadlines.map((deadline) => ({
        id: `deadline-${deadline.id}`,
        description: deadline.description,
        agent: "alpha" as const,
        priority: "high" as const,
      })),
    ].slice(0, 10);

    // Generate alerts
    const alerts = [
      ...alphaData.calls.missed > 0 ? [{
        id: "alert-missed-calls",
        type: "deadline" as const,
        message: `${alphaData.calls.missed} missed calls need follow-up`,
        agent: "alpha" as const,
      }] : [],
      ...xiData.payments > 0 ? [{
        id: "alert-payments",
        type: "payment" as const,
        message: `${xiData.payments} payment-related emails need attention`,
        agent: "xi" as const,
      }] : [],
      ...xiData.invoices > 0 ? [{
        id: "alert-invoices",
        type: "deadline" as const,
        message: `${xiData.invoices} invoices to process`,
        agent: "xi" as const,
      }] : [],
      ...muData.anomalies.map((anomaly, idx) => ({
        id: `alert-mu-${idx}`,
        type: "deadline" as const,
        message: anomaly,
        agent: "mu" as const,
      })),
    ];

    // Calendar issues (would check actual calendar)
    const calendarIssues: DailyBrief["calendarIssues"] = [];

    // Metric insights
    const metricInsights: DailyBrief["metricInsights"] = [
      {
        agent: "alpha",
        metric: "Calls",
        value: alphaData.calls.total,
        trend: alphaData.calls.missed > alphaData.calls.total * 0.1 ? "down" : "up",
        insight: alphaData.calls.missed > 0 
          ? `${alphaData.calls.missed} missed calls need attention`
          : "All calls handled successfully",
      },
      {
        agent: "xi",
        metric: "Important Emails",
        value: xiData.importantEmails,
        trend: xiData.importantEmails > 5 ? "up" : "stable",
        insight: `${xiData.importantEmails} important emails flagged`,
      },
      {
        agent: "mu",
        metric: "Engagement Rate",
        value: `${muData.metrics.engagement.toFixed(1)}%`,
        trend: muData.performance.trend,
        insight: muData.performance.insight,
      },
    ];

    // Suggested corrections
    const suggestedCorrections: DailyBrief["suggestedCorrections"] = [
      ...alphaData.calls.missed > 0 ? [{
        id: "correction-alpha-calls",
        issue: "Missed calls detected",
        suggestion: "Review call routing and availability settings",
        agent: "alpha" as const,
      }] : [],
      ...xiData.unreadEmails > 5 ? [{
        id: "correction-xi-emails",
        issue: "High unread email count",
        suggestion: "Prioritize email triage and response automation",
        agent: "xi" as const,
      }] : [],
      ...muData.anomalies.map((anomaly, idx) => ({
        id: `correction-mu-${idx}`,
        issue: anomaly,
        suggestion: "Review content strategy and posting schedule",
        agent: "mu" as const,
      })),
    ];

    // Follow-up list
    const followUpList: DailyBrief["followUpList"] = [
      ...alphaData.deadlines.map((deadline) => ({
        id: `followup-${deadline.id}`,
        item: deadline.description,
        agent: "alpha" as const,
        priority: "high" as const,
      })),
      ...xiData.tasks.slice(0, 3).map((task) => ({
        id: `followup-${task.id}`,
        item: task.description,
        agent: "xi" as const,
        priority: task.priority,
      })),
    ];

    const brief: DailyBrief = {
      title: "Daily Command Brief",
      generatedAt: new Date().toISOString(),
      topPriorities,
      actionItems,
      alerts,
      calendarIssues,
      metricInsights,
      suggestedCorrections,
      followUpList,
    };

    return NextResponse.json({ ok: true, data: brief });
  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate brief" },
      { status: 500 }
    );
  }
}

