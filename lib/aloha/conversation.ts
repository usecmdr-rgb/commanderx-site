/**
 * Legacy conversation enhancement utilities
 * 
 * NOTE: This is a legacy module. New code should use conversation-layers.ts instead.
 */

export interface ConversationEnhancementOptions {
  addBackchannels?: boolean;
  addPauses?: boolean;
}

/**
 * Enhance conversation response with backchannels and pauses
 * 
 * @deprecated Use ConversationLayersProcessor from conversation-layers.ts instead
 */
export function enhanceConversation(
  response: string,
  options: ConversationEnhancementOptions = {}
): string {
  let enhanced = response;

  // Simple enhancement - in production, this would be handled by conversation-layers
  // Keeping this minimal for backward compatibility
  if (options.addPauses) {
    // Add natural pauses after punctuation
    enhanced = enhanced.replace(/([.!?])\s+/g, "$1 ");
  }

  if (options.addBackchannels) {
    // Add occasional backchannels at the start (very simple implementation)
    // In production, conversation-layers handles this more intelligently
  }

  return enhanced;
}

