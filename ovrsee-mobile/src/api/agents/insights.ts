import { httpRequest } from "../http";
import { Insight, ApiResponse } from "@/types";

export async function getInsightsFeed(): Promise<ApiResponse<Insight[]>> {
  return httpRequest<Insight[]>("/agents/insights/feed");
}

// Action functions for Insights agent
export async function generateInsight(type?: string, dateRange?: { start: string; end: string }): Promise<ApiResponse<{ insightId: string }>> {
  return httpRequest<{ insightId: string }>("/agents/insights/generate", {
    method: "POST",
    body: JSON.stringify({ type, dateRange }),
  });
}

export async function exportInsight(insightId: string, format: "pdf" | "csv" | "json"): Promise<ApiResponse<{ downloadUrl: string }>> {
  return httpRequest<{ downloadUrl: string }>(`/agents/insights/${insightId}/export`, {
    method: "POST",
    body: JSON.stringify({ format }),
  });
}
