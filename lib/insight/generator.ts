/**
 * Insight Generation Service
 * 
 * Automatically generates insights by analyzing:
 * - Aloha calls (transcripts, missed calls, durations)
 * - Sync emails (inbound/outbound, important/unread, deadlines)
 * - Studio artifacts (summaries, branding, deadlines, approvals)
 * - Workflow events
 * - User behavior (response time, missed follow-ups)
 * - Stats tables (daily call/email counts, media content, etc.)
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getTimeRangeBounds } from "@/lib/insight/utils";
import { compareToPreviousPeriod } from "@/lib/insight/patterns";
import { predictValue } from "@/lib/insight/forecast";
import { getMemoryFacts, getImportantRelationships } from "@/lib/insight/memory";
import type { Insight, TimeRange, InsightSource, InsightCategory, InsightSeverity, InsightAction } from "@/types";

export interface InsightGenerationData {
  // Aloha data
  calls: {
    total: number;
    missed: number;
    answered: number;
    avgDuration?: number;
    recentMissed: Array<{ id: string; caller: string; timestamp: string }>;
  };
  
  // Sync data
  emails: {
    important: number;
    unread: number;
    overdue: number;
    responseTimeAvg?: number; // in hours
    invoices: number;
    payments: number;
  };
  
  // Studio data
  media: {
    total: number;
    untagged: number;
    recentUploads: number;
  };
  
  // Workflow data
  workflows: {
    total: number;
    executed: number;
    failed: number;
  };
  
  // Stats data
  stats: {
    current: any; // AgentStatsDaily
    previous: any; // AgentStatsDaily
  };
}

/**
 * Generate insights for a user within a time range
 */
export async function generateInsightsForRange(
  userId: string,
  range: TimeRange
): Promise<Insight[]> {
  const supabase = getSupabaseServerClient();
  const { start, end } = getTimeRangeBounds(range);
  
  // Calculate previous period for comparison
  const prevStart = new Date(start);
  const prevEnd = new Date(end);
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  if (range === 'daily') {
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (range === 'weekly') {
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd.setDate(prevEnd.getDate() - 7);
  } else if (range === 'monthly') {
    prevStart.setMonth(prevStart.getMonth() - 1);
    prevEnd.setMonth(prevEnd.getMonth() - 1);
  }

  // Fetch data from all sources
  const data = await fetchInsightData(userId, start, end, prevStart, prevEnd);
  
  // Fetch memory facts and relationships for personalization
  const [memoryFacts, relationships] = await Promise.all([
    getMemoryFacts(userId, 0.5), // Get facts with at least 50% confidence
    getImportantRelationships(userId, 60), // Get relationships with 60+ importance
  ]);
  
  // Generate insights using heuristic pattern detection
  const insights: Insight[] = [];
  
  // 1. Missed calls spike (personalized with memory)
  if (data.calls.missed > 0) {
    const comparison = compareToPreviousPeriod(
      data.calls.missed,
      data.stats.previous?.alpha_calls_missed || 0
    );
    
    if (comparison.percent > 20) {
      // Check for high-priority missed calls
      const highPriorityMissed = data.calls.recentMissed.filter(call => {
        return relationships.some(rel => 
          rel.entityIdentifier.toLowerCase().includes(call.caller.toLowerCase()) ||
          call.caller.toLowerCase().includes(rel.entityIdentifier.toLowerCase())
        );
      });
      
      // Check memory for poor afternoon response pattern
      const poorAfternoonMemory = memoryFacts.find(f => f.key === 'poor_afternoon_response');
      const isAfternoon = new Date().getHours() >= 13 && new Date().getHours() <= 17;
      
      let title = 'Missed Calls Increased';
      let description = `Missed calls increased by ${comparison.percent.toFixed(0)}% compared to ${range === 'daily' ? 'yesterday' : range === 'weekly' ? 'last week' : 'last month'}.`;
      
      if (highPriorityMissed.length > 0) {
        title = 'High-Priority Missed Calls';
        description = `${highPriorityMissed.length} missed call${highPriorityMissed.length > 1 ? 's from' : ' from'} high-priority contact${highPriorityMissed.length > 1 ? 's' : ''}. ${description}`;
      }
      
      if (poorAfternoonMemory && isAfternoon) {
        description += ` This aligns with your typical afternoon response pattern. Should I queue these for tomorrow morning?`;
      }
      
      insights.push(createInsight({
        userId,
        source: 'aloha',
        category: 'communication',
        severity: highPriorityMissed.length > 0 || comparison.percent > 50 ? 'warning' : 'info',
        title,
        description,
        tags: ['calls', 'missed', 'communication', ...(highPriorityMissed.length > 0 ? ['high-priority'] : [])],
        actions: [{
          id: 'review-calls',
          type: 'view_call_log',
          label: 'Review Missed Calls',
          description: 'View and follow up on missed calls',
        }],
        metadata: {
          current: data.calls.missed,
          previous: data.stats.previous?.alpha_calls_missed || 0,
          trend: comparison.trend,
          personalized: true,
          highPriorityCount: highPriorityMissed.length,
        },
      }));
    }
  }
  
  // 2. Slow email response time
  if (data.emails.responseTimeAvg !== undefined && data.emails.responseTimeAvg > 2) {
    const comparison = compareToPreviousPeriod(
      data.emails.responseTimeAvg,
      data.stats.previous?.avg_response_time || data.emails.responseTimeAvg * 0.5
    );
    
    if (comparison.percent > 30) {
      insights.push(createInsight({
        userId,
        source: 'sync',
        category: 'productivity',
        severity: data.emails.responseTimeAvg > 6 ? 'warning' : 'info',
        title: 'Email Response Time Slowed',
        description: `Your average response time ${range === 'daily' ? 'today' : `this ${range}`} was ${data.emails.responseTimeAvg.toFixed(1)} hours (${comparison.percent > 0 ? `${comparison.percent.toFixed(0)}% slower` : `${Math.abs(comparison.percent).toFixed(0)}% faster`} than usual).`,
        tags: ['email', 'response-time', 'productivity'],
        actions: [{
          id: 'prioritize-emails',
          type: 'view_email_thread',
          label: 'Review Important Emails',
          description: 'Prioritize and respond to important emails',
        }],
        metadata: {
          current: data.emails.responseTimeAvg,
          previous: data.stats.previous?.avg_response_time || 0,
          trend: comparison.trend,
        },
      }));
    }
  }
  
  // 3. Uncategorized media items
  if (data.media.untagged > 0) {
    insights.push(createInsight({
      userId,
      source: 'studio',
      category: 'ops',
      severity: data.media.untagged > 10 ? 'warning' : 'info',
      title: 'Untagged Media Items',
      description: `${data.media.untagged} new media item${data.media.untagged > 1 ? 's were' : ' was'} uploaded without tags.`,
      tags: ['media', 'organization', 'studio'],
      actions: [{
        id: 'tag-media',
        type: 'open_resource',
        label: 'Tag Media Items',
        description: 'Add tags to improve organization',
      }],
      metadata: {
        count: data.media.untagged,
      },
    }));
  }
  
  // 4. Unpaid invoices / follow-ups
  if (data.emails.invoices > 0) {
    // Check for overdue invoices (7+ days)
    const overdueInvoices = data.emails.invoices; // Simplified - would check actual dates
    if (overdueInvoices > 0) {
      insights.push(createInsight({
        userId,
        source: 'sync',
        category: 'finance',
        severity: overdueInvoices > 3 ? 'critical' : 'warning',
        title: 'Overdue Invoices',
        description: `There ${overdueInvoices === 1 ? 'is' : 'are'} ${overdueInvoices} unpaid invoice${overdueInvoices > 1 ? 's' : ''} overdue by 7+ days.`,
        tags: ['invoices', 'finance', 'overdue'],
        actions: [{
          id: 'review-invoices',
          type: 'view_email_thread',
          label: 'Review Invoices',
          description: 'Follow up on overdue invoices',
        }],
        metadata: {
          count: overdueInvoices,
        },
      }));
    }
  }
  
  // 5. Task backlog growth
  const currentTasks = data.emails.important + data.emails.unread;
  const previousTasks = (data.stats.previous?.xi_important_emails || 0) + (data.stats.previous?.xi_missed_emails || 0);
  
  if (currentTasks > previousTasks) {
    const comparison = compareToPreviousPeriod(currentTasks, previousTasks);
    if (comparison.percent > 10) {
      insights.push(createInsight({
        userId,
        source: 'insight_agent',
        category: 'productivity',
        severity: comparison.percent > 30 ? 'warning' : 'info',
        title: 'Task Backlog Growing',
        description: `Your task backlog grew by ${comparison.percent.toFixed(0)}% ${range === 'daily' ? 'today' : `this ${range}`}.`,
        tags: ['tasks', 'backlog', 'productivity'],
        actions: [{
          id: 'review-tasks',
          type: 'create_task',
          label: 'Review Task List',
          description: 'Prioritize and organize tasks',
        }],
        metadata: {
          current: currentTasks,
          previous: previousTasks,
          trend: comparison.trend,
        },
      }));
    }
  }
  
  // 6. Sentiment shift (if available in metadata)
  // This would require sentiment analysis on calls/emails
  // For now, we'll skip this as it requires additional processing
  
  // 7. High unread important emails (personalized with memory)
  if (data.emails.important > 5) {
    // Check for high-priority contacts in unread emails
    const responsePeakMemory = memoryFacts.find(f => f.key === 'response_time_peak');
    const peakHour = responsePeakMemory?.value?.hour;
    const currentHour = new Date().getHours();
    const isPeakTime = peakHour !== undefined && Math.abs(currentHour - peakHour) <= 1;
    
    let description = `${data.emails.important} important email${data.emails.important > 1 ? 's are' : ' is'} waiting for your response.`;
    
    if (isPeakTime && responsePeakMemory) {
      description += ` This is typically your most responsive time of day.`;
    } else if (responsePeakMemory) {
      const hoursUntilPeak = peakHour > currentHour ? peakHour - currentHour : (24 - currentHour) + peakHour;
      description += ` Your peak response time (${peakHour}:00) is in ${hoursUntilPeak} hour${hoursUntilPeak > 1 ? 's' : ''}.`;
    }
    
    insights.push(createInsight({
      userId,
      source: 'sync',
      category: 'communication',
      severity: data.emails.important > 10 ? 'warning' : 'info',
      title: 'Important Emails Need Attention',
      description,
      tags: ['email', 'important', 'communication'],
      actions: [{
        id: 'review-important',
        type: 'view_email_thread',
        label: 'Review Important Emails',
        description: 'Prioritize important emails',
      }],
      metadata: {
        count: data.emails.important,
        personalized: true,
      },
    }));
  }
  
  // 8. Workflow failures
  if (data.workflows.failed > 0) {
    insights.push(createInsight({
      userId,
      source: 'insight_agent',
      category: 'ops',
      severity: data.workflows.failed > 3 ? 'warning' : 'info',
      title: 'Workflow Execution Issues',
      description: `${data.workflows.failed} workflow${data.workflows.failed > 1 ? 's failed' : ' failed'} to execute properly.`,
      tags: ['workflows', 'automation', 'ops'],
      actions: [{
        id: 'review-workflows',
        type: 'open_workflow',
        label: 'Review Workflows',
        description: 'Check and fix workflow configurations',
      }],
      metadata: {
        failed: data.workflows.failed,
        total: data.workflows.total,
      },
    }));
  }
  
  // Insert insights into database
  if (insights.length > 0) {
    const { error } = await supabase
      .from('insights')
      .insert(insights.map(insight => ({
        user_id: insight.userId,
        source: insight.source,
        category: insight.category,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        time_range: range,
        tags: insight.tags,
        actions: insight.actions,
        metadata: insight.metadata,
        is_read: false,
      })));
    
    if (error) {
      console.error('Error inserting insights:', error);
    }
  }
  
  return insights;
}

/**
 * Fetch all data needed for insight generation
 */
async function fetchInsightData(
  userId: string,
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date
): Promise<InsightGenerationData> {
  const supabase = getSupabaseServerClient();
  
  // Fetch current period stats
  const { data: currentStats } = await supabase
    .from('agent_stats_daily')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start.toISOString().split('T')[0])
    .lte('date', end.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  // Fetch previous period stats
  const { data: previousStats } = await supabase
    .from('agent_stats_daily')
    .select('*')
    .eq('user_id', userId)
    .gte('date', prevStart.toISOString().split('T')[0])
    .lte('date', prevEnd.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  // Fetch recent missed calls
  const { data: missedCalls } = await supabase
    .from('calls')
    .select('id, caller_name, created_at')
    .eq('user_id', userId)
    .eq('outcome', 'missed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Fetch email data
  const { data: emails } = await supabase
    .from('email_summaries')
    .select('id, is_important, is_read, category, created_at')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  
  // Calculate email metrics
  const importantEmails = emails?.filter(e => e.is_important && !e.is_read).length || 0;
  const unreadEmails = emails?.filter(e => !e.is_read).length || 0;
  const invoiceEmails = emails?.filter(e => e.category === 'invoice' || e.category === 'billing').length || 0;
  const paymentEmails = emails?.filter(e => e.category === 'payment' || e.category === 'billing').length || 0;
  
  // Calculate average response time (simplified - would need actual response timestamps)
  // For now, estimate based on unread count
  const responseTimeAvg = unreadEmails > 0 ? unreadEmails * 0.5 : undefined;
  
  // Fetch media data (would need studio_media table - using placeholder for now)
  // const { data: media } = await supabase...
  const media = {
    total: 0,
    untagged: 0,
    recentUploads: 0,
  };
  
  // Fetch workflow execution data
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, last_run_at, run_count, enabled')
    .eq('user_id', userId);
  
  const workflowData = {
    total: workflows?.length || 0,
    executed: workflows?.filter(w => w.last_run_at).length || 0,
    failed: 0, // Would need workflow_logs table to track failures
  };
  
  return {
    calls: {
      total: currentStats?.alpha_calls_total || 0,
      missed: currentStats?.alpha_calls_missed || 0,
      answered: (currentStats?.alpha_calls_total || 0) - (currentStats?.alpha_calls_missed || 0),
      recentMissed: (missedCalls || []).map(c => ({
        id: c.id,
        caller: c.caller_name || 'Unknown',
        timestamp: c.created_at,
      })),
    },
    emails: {
      important: importantEmails,
      unread: unreadEmails,
      overdue: 0, // Would need to check actual dates
      responseTimeAvg,
      invoices: invoiceEmails,
      payments: paymentEmails,
    },
    media,
    workflows: workflowData,
    stats: {
      current: currentStats,
      previous: previousStats,
    },
  };
}

/**
 * Helper to create an Insight object
 */
function createInsight({
  userId,
  source,
  category,
  severity,
  title,
  description,
  tags = [],
  actions = [],
  metadata = {},
  timeRange,
}: {
  userId: string;
  source: InsightSource;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  tags?: string[];
  actions?: InsightAction[];
  metadata?: Record<string, any>;
  timeRange?: string;
}): Insight {
  return {
    id: '', // Will be generated by database
    userId,
    source,
    category,
    severity,
    title,
    description,
    timeRange,
    tags,
    actions,
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
}

