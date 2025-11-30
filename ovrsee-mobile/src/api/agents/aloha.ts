import { httpRequest } from "../http";
import { CallRecord, ApiResponse } from "@/types";

export async function getAlohaRecentCalls(): Promise<ApiResponse<CallRecord[]>> {
  return httpRequest<CallRecord[]>("/agents/aloha/calls/recent");
}

export async function getAlohaCallDetail(callId: string): Promise<ApiResponse<CallRecord>> {
  return httpRequest<CallRecord>(`/agents/aloha/calls/${callId}`);
}

// Action functions for Aloha agent
export async function handleCall(callId: string): Promise<ApiResponse<{ handled: boolean }>> {
  return httpRequest<{ handled: boolean }>(`/agents/aloha/calls/${callId}/handle`, {
    method: "POST",
  });
}

export async function bookAppointment(callId: string, dateTime: string, notes?: string): Promise<ApiResponse<{ appointmentId: string }>> {
  return httpRequest<{ appointmentId: string }>(`/agents/aloha/calls/${callId}/book-appointment`, {
    method: "POST",
    body: JSON.stringify({ dateTime, notes }),
  });
}

export async function returnCall(callId: string): Promise<ApiResponse<{ calling: boolean }>> {
  return httpRequest<{ calling: boolean }>(`/agents/aloha/calls/${callId}/return`, {
    method: "POST",
  });
}

export async function toggleAlohaStatus(active: boolean): Promise<ApiResponse<{ active: boolean }>> {
  return httpRequest<{ active: boolean }>("/agents/aloha/status", {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}
