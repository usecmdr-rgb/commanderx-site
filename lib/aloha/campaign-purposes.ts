/**
 * Aloha Campaign Purposes System
 * 
 * Defines available campaign purposes and script styles for Aloha campaigns.
 */

export type CampaignPurpose =
  | "lead_generation_sales"
  | "feedback_satisfaction"
  | "appointment_management"
  | "order_project_updates"
  | "administrative_operations"
  | "loyalty_relationship"
  | "urgent_notifications"
  | "custom";

export type ScriptStyle = "conversational" | "professional" | "friendly" | "formal";

export interface PurposeDefinition {
  id: CampaignPurpose;
  label: string;
  description: string;
  defaultScriptStyle: ScriptStyle;
  requiresPurposeDetails: boolean;
  introTemplate: string;
  closingTemplate: string;
  keyQuestions: string[];
  complianceNotes?: string;
  requiresBusinessContext?: boolean;
}

const PURPOSE_DEFINITIONS: PurposeDefinition[] = [
  {
    id: "lead_generation_sales",
    label: "Lead Generation / Sales",
    description: "Reach out to potential customers to generate leads or make sales",
    defaultScriptStyle: "conversational",
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm reaching out because...",
    closingTemplate: "Thank you for your time. {displayName} from {businessName}.",
    keyQuestions: ["Are you interested in learning more?", "When would be a good time to follow up?"],
    requiresBusinessContext: true,
  },
  {
    id: "feedback_satisfaction",
    label: "Feedback & Satisfaction",
    description: "Collect feedback from customers about their experience",
    defaultScriptStyle: "friendly",
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. We'd love to hear about your recent experience.",
    closingTemplate: "Thank you for your feedback! {displayName} from {businessName}.",
    keyQuestions: ["How was your experience?", "Is there anything we could improve?"],
  },
  {
    id: "appointment_management",
    label: "Appointment Management",
    description: "Confirm, reschedule, or remind about appointments",
    defaultScriptStyle: "professional",
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling about your appointment.",
    closingTemplate: "Thank you. {displayName} from {businessName}.",
    keyQuestions: ["Does this time still work for you?", "Would you like to reschedule?"],
  },
  {
    id: "order_project_updates",
    label: "Order / Project Updates",
    description: "Provide updates on orders or project status",
    defaultScriptStyle: "professional",
    requiresPurposeDetails: true,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling with an update about your order.",
    closingTemplate: "Thank you. {displayName} from {businessName}.",
    keyQuestions: ["Do you have any questions about the update?"],
    requiresBusinessContext: true,
  },
  {
    id: "administrative_operations",
    label: "Administrative Operations",
    description: "Handle administrative tasks like confirmations, verifications",
    defaultScriptStyle: "professional",
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling regarding your account.",
    closingTemplate: "Thank you. {displayName} from {businessName}.",
    keyQuestions: ["Can you confirm this information?", "Is there anything else you need?"],
  },
  {
    id: "loyalty_relationship",
    label: "Loyalty & Relationship",
    description: "Maintain relationships with existing customers",
    defaultScriptStyle: "friendly",
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. We wanted to reach out and check in.",
    closingTemplate: "Thank you for being a valued customer! {displayName} from {businessName}.",
    keyQuestions: ["How are things going?", "Is there anything we can help with?"],
  },
  {
    id: "urgent_notifications",
    label: "Urgent Notifications",
    description: "Send time-sensitive information or urgent updates",
    defaultScriptStyle: "professional",
    requiresPurposeDetails: true,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling with an urgent update.",
    closingTemplate: "Thank you. {displayName} from {businessName}.",
    keyQuestions: ["Do you understand the information?", "Do you need any clarification?"],
    requiresBusinessContext: true,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Create a custom campaign with your own script",
    defaultScriptStyle: "conversational",
    requiresPurposeDetails: true,
    introTemplate: "Hi, this is {displayName} from {businessName}.",
    closingTemplate: "Thank you. {displayName} from {businessName}.",
    keyQuestions: [],
  },
];

/**
 * Get all campaign purposes
 */
export function getAllPurposes(): PurposeDefinition[] {
  return PURPOSE_DEFINITIONS;
}

/**
 * Get purpose definition by ID
 */
export function getPurposeDefinition(purpose: CampaignPurpose): PurposeDefinition {
  const definition = PURPOSE_DEFINITIONS.find((p) => p.id === purpose);
  if (!definition) {
    throw new Error(`Invalid campaign purpose: ${purpose}`);
  }
  return definition;
}

/**
 * Validate if a purpose is valid
 */
export function isValidPurpose(purpose: string | null | undefined): purpose is CampaignPurpose {
  if (!purpose) return false;
  return PURPOSE_DEFINITIONS.some((p) => p.id === purpose);
}

