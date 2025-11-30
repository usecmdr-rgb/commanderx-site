import { httpRequest } from "../http";
import { StudioItem, ApiResponse } from "@/types";

export async function getStudioFeed(): Promise<ApiResponse<StudioItem[]>> {
  return httpRequest<StudioItem[]>("/agents/studio/feed");
}

export async function getStudioItemDetail(itemId: string): Promise<ApiResponse<StudioItem>> {
  return httpRequest<StudioItem>(`/agents/studio/items/${itemId}`);
}

// Action functions for Studio agent
export async function editMedia(itemId: string, edits: { filters?: string; crop?: any; overlay?: string }): Promise<ApiResponse<{ editedUrl: string }>> {
  return httpRequest<{ editedUrl: string }>(`/agents/studio/items/${itemId}/edit`, {
    method: "POST",
    body: JSON.stringify({ edits }),
  });
}

export async function approveMediaEdit(itemId: string, approved: boolean): Promise<ApiResponse<{ approved: boolean }>> {
  return httpRequest<{ approved: boolean }>(`/agents/studio/items/${itemId}/approve`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}

export async function createCampaign(title: string, mediaIds: string[], description?: string): Promise<ApiResponse<{ campaignId: string }>> {
  return httpRequest<{ campaignId: string }>("/agents/studio/campaigns", {
    method: "POST",
    body: JSON.stringify({ title, mediaIds, description }),
  });
}

export async function publishMedia(itemId: string, platforms: string[]): Promise<ApiResponse<{ published: boolean }>> {
  return httpRequest<{ published: boolean }>(`/agents/studio/items/${itemId}/publish`, {
    method: "POST",
    body: JSON.stringify({ platforms }),
  });
}
