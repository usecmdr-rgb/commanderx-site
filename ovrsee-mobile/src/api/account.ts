import { ApiResponse } from "@/types";
import { httpRequest as makeRequest } from "./http";

/**
 * Request account deletion for the current authenticated user.
 * 
 * This sends a request to the backend to initiate account deletion.
 * The backend must implement the /account/delete-request endpoint to:
 * - Delete the user from Supabase Auth
 * - Delete all associated data (profiles, agent data, etc.)
 * - Handle cleanup of any external services
 * 
 * TODO: Backend must implement POST /account/delete-request endpoint
 * The endpoint should:
 * 1. Verify the authenticated user's identity
 * 2. Delete all user data from Supabase (profiles table, etc.)
 * 3. Delete the user from Supabase Auth
 * 4. Clean up any external service integrations
 * 5. Return success/error response
 */
export async function requestAccountDeletion(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  try {
    const response = await makeRequest<{ success: boolean; message?: string }>(
      "/account/delete-request",
      {
        method: "POST",
      }
    );

    if (response.error) {
      return {
        data: null as any,
        error: response.error,
      };
    }

    return {
      data: response.data || { success: true },
    };
  } catch (error) {
    console.error("Account deletion request failed:", error);
    return {
      data: null as any,
      error: error instanceof Error ? error.message : "Failed to request account deletion",
    };
  }
}

