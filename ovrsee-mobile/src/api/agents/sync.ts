import { httpRequest } from "../http";
import { SyncOverview, AgendaItem, EmailDigest, EmailDraft, ApiResponse } from "@/types";

export async function getSyncOverview(): Promise<ApiResponse<SyncOverview>> {
  return httpRequest<SyncOverview>("/agents/sync/overview");
}

export async function getTodayAgenda(): Promise<ApiResponse<AgendaItem[]>> {
  return httpRequest<AgendaItem[]>("/agents/sync/agenda/today");
}

export async function getEmailDigest(): Promise<ApiResponse<EmailDigest>> {
  return httpRequest<EmailDigest>("/agents/sync/email-digest");
}

export async function getEmailDrafts(): Promise<ApiResponse<EmailDraft[]>> {
  return httpRequest<EmailDraft[]>("/agents/sync/emails/drafts");
}

// Action functions for Sync agent
export async function draftEmailReply(emailId: string): Promise<ApiResponse<{ draft: string }>> {
  return httpRequest<{ draft: string }>(`/agents/sync/emails/${emailId}/draft`, {
    method: "POST",
  });
}

export async function sendEmail(emailId: string, draft?: string): Promise<ApiResponse<{ success: boolean }>> {
  return httpRequest<{ success: boolean }>(`/agents/sync/emails/${emailId}/send`, {
    method: "POST",
    body: JSON.stringify({ draft }),
  });
}

export async function approveEmailAction(emailId: string, action: "archive" | "delete" | "mark-important"): Promise<ApiResponse<{ success: boolean }>> {
  return httpRequest<{ success: boolean }>(`/agents/sync/emails/${emailId}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function syncCalendar(date?: string): Promise<ApiResponse<{ synced: boolean }>> {
  return httpRequest<{ synced: boolean }>("/agents/sync/calendar/sync", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
}
