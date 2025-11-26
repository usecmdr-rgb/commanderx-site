/**
 * Legacy response generator utilities
 * 
 * NOTE: This is a legacy module for backward compatibility.
 * In production, responses are generated via the brain route.
 */

export interface ConversationContext {
  userId?: string;
  transcript?: string;
  businessContext?: any;
  callContext?: any;
  responseTime?: number;
  conversationState?: string;
  agentName?: string;
  businessName?: any;
  campaignReason?: any;
  phone?: any;
}

/**
 * Generate response for conversation
 * 
 * @deprecated Responses are generated via /api/brain route
 */
export async function generateResponse(
  context: ConversationContext
): Promise<string> {
  // This is a placeholder - in production, responses come from /api/brain
  throw new Error("Response generation is handled by /api/brain route");
}

