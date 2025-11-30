import {
  SyncOverview,
  AgendaItem,
  EmailDigest,
  EmailDraft,
  CallRecord,
  StudioItem,
  Insight,
  TodaySummary,
  AgentSummary,
} from "@/types";

export const mockSyncOverview: SyncOverview = {
  gmailConnected: true,
  calendarConnected: true,
  syncHealth: "healthy",
};

export const mockAgendaItems: AgendaItem[] = [
  {
    id: "1",
    title: "Team Standup",
    time: "10:00 AM",
    description: "Daily sync with engineering team",
    type: "meeting",
  },
  {
    id: "2",
    title: "Client Presentation",
    time: "2:00 PM",
    description: "Q4 Review presentation",
    type: "meeting",
  },
  {
    id: "3",
    title: "Review Marketing Campaign",
    time: "4:00 PM",
    type: "task",
  },
];

export const mockEmailDigest: EmailDigest = {
  importantCount: 12,
  followUpNeeds: 5,
  newslettersFiled: 23,
};

export const mockEmailDrafts: EmailDraft[] = [
  {
    id: "draft-1",
    to: "sarah.johnson@example.com",
    subject: "Re: Follow-up meeting confirmation",
    body: "Hi Sarah,\n\nThank you for reaching out. I'd be happy to schedule a follow-up meeting next week. How does Tuesday or Wednesday work for you?\n\nLooking forward to discussing this further.\n\nBest regards,",
    context: "Reply to meeting request - OpenAI generated based on email thread",
    createdAt: "2024-01-15T09:00:00Z",
    emailId: "email-1",
  },
  {
    id: "draft-2",
    to: "team@company.com",
    subject: "Q4 Review Presentation - Agenda",
    body: "Hi Team,\n\nAs discussed, here's the agenda for our Q4 review presentation:\n\n1. Key metrics overview\n2. Sales performance\n3. Product updates\n4. Q1 roadmap\n\nPlease let me know if you'd like to add anything.\n\nThanks!",
    context: "Follow-up email for meeting - OpenAI suggested based on calendar event",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "draft-3",
    to: "client@business.com",
    subject: "Thank you for your inquiry",
    body: "Dear Client,\n\nThank you for your interest in our services. I've reviewed your requirements and I believe we can help you achieve your goals.\n\nI've attached a detailed proposal for your review. Would you be available for a brief call this week to discuss?\n\nBest regards,",
    context: "Response to product inquiry - OpenAI generated professional response",
    createdAt: "2024-01-15T14:15:00Z",
    emailId: "email-2",
  },
];

export const mockCallRecords: CallRecord[] = [
  {
    id: "1",
    contactName: "Sarah Johnson",
    contactNumber: "+1 (555) 123-4567",
    timestamp: "2024-01-15T09:30:00Z",
    summary: "Scheduled follow-up meeting for next week",
    status: "handled",
    duration: 180,
  },
  {
    id: "2",
    contactName: "Mike Chen",
    contactNumber: "+1 (555) 234-5678",
    timestamp: "2024-01-15T11:15:00Z",
    summary: "Missed call - no voicemail left",
    status: "missed",
  },
  {
    id: "3",
    contactName: "Emily Rodriguez",
    contactNumber: "+1 (555) 345-6789",
    timestamp: "2024-01-15T14:20:00Z",
    summary: "Inquiry about product pricing - needs callback",
    status: "needsFollowUp",
    duration: 420,
  },
];

export const mockStudioItems: StudioItem[] = [
  {
    id: "1",
    title: "Holiday Campaign Concept",
    status: "published",
    description: "Q4 holiday marketing visuals and copy",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "2",
    title: "Product Launch Video",
    status: "review",
    description: "Social media video for new feature announcement",
    createdAt: "2024-01-12T10:30:00Z",
  },
  {
    id: "3",
    title: "Website Banner Update",
    status: "draft",
    description: "Updated hero banner with new messaging",
    createdAt: "2024-01-14T16:00:00Z",
  },
];

export const mockInsights: Insight[] = [
  {
    id: "1",
    title: "Lead conversion +14% this week",
    explanation: "Increased conversion rate driven by improved email follow-ups from Sync agent",
    tag: "Sales",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2",
    title: "Call volume up 23%",
    explanation: "More inbound calls handled successfully by Aloha, reducing missed opportunities",
    tag: "Ops",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "3",
    title: "Content engagement trending up",
    explanation: "Studio-created content showing 18% higher engagement rates",
    tag: "Marketing",
    createdAt: "2024-01-14T15:00:00Z",
  },
];

export const mockTodaySummary: TodaySummary = {
  callsHandled: 8,
  emailsProcessed: 45,
  insightsGenerated: 3,
  creativeUpdates: 5,
};

export const mockAgentSummaries: AgentSummary[] = [
  {
    agentKey: "sync",
    agentName: "Sync",
    bullets: [
      "Processed 45 emails, prioritizing 12 as important",
      "Auto-filed 23 newsletters to keep inbox clean",
      "Synchronized 3 calendar events across platforms",
      "Drafted 8 email replies for your review",
    ],
  },
  {
    agentKey: "aloha",
    agentName: "Aloha",
    bullets: [
      "Handled 8 incoming calls successfully",
      "Booked 3 appointments automatically",
      "2 calls require your follow-up attention",
      "Missed 1 call with no voicemail",
    ],
  },
  {
    agentKey: "studio",
    agentName: "Studio",
    bullets: [
      "Published holiday campaign visuals",
      "Completed 3 image edits and optimizations",
      "2 items pending your review",
      "Generated 5 social media assets",
    ],
  },
  {
    agentKey: "insight",
    agentName: "Insights",
    bullets: [
      "Generated 3 new business insights",
      "Identified 14% increase in lead conversion",
      "Detected trend in call volume increase",
      "Prepared weekly analytics report",
    ],
  },
];
