/**
 * Aloha Campaign Purpose Definitions
 * 
 * Defines campaign purpose categories and their characteristics.
 * Each purpose has specific script templates, tone requirements, and behavior patterns.
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

export type ScriptStyle = "friendly" | "professional" | "energetic" | "calm" | "casual";

export interface CampaignPurposeDefinition {
  id: CampaignPurpose;
  label: string;
  description: string;
  subTypes: string[];
  defaultScriptStyle: ScriptStyle;
  requiresBusinessContext: boolean;
  requiresPurposeDetails: boolean; // Whether purpose_details is required
  introTemplate: string;
  closingTemplate: string;
  keyQuestions?: string[];
  complianceNotes?: string;
  messagePlaceholder?: string; // Placeholder text for purpose_details field
}

export const CAMPAIGN_PURPOSES: Record<CampaignPurpose, CampaignPurposeDefinition> = {
  lead_generation_sales: {
    id: "lead_generation_sales",
    label: "Lead Generation / Sales",
    description: "Cold outreach, warm follow-ups, lead qualification, promotions, reactivation",
    subTypes: [
      "Cold outreach",
      "Warm follow-ups",
      "Lead qualification",
      "Promotions / offers",
      "Reactivation campaigns",
    ],
    defaultScriptStyle: "professional",
    requiresBusinessContext: true,
    requiresPurposeDetails: false, // Optional but recommended
    introTemplate: "Hi, this is {displayName} calling from {businessName}. I hope I'm not catching you at a bad time. Is now a good time to talk?",
    closingTemplate: "Thank you for your time. Would you like me to send you more information, or would you prefer to schedule a follow-up call?",
    keyQuestions: [
      "Are you interested in learning more about our services?",
      "What challenges are you currently facing?",
      "Would you be open to a brief conversation about how we can help?",
    ],
    complianceNotes: "Must respect DNC lists and provide opt-out options.",
    messagePlaceholder: "Introduce our new premium package and ask if they'd like more information or a quote.",
  },

  feedback_satisfaction: {
    id: "feedback_satisfaction",
    label: "Feedback & Satisfaction",
    description: "Product feedback, service satisfaction, NPS scoring, testimonials, issue resolution",
    subTypes: [
      "Product feedback",
      "Service satisfaction follow-up",
      "NPS scoring",
      "Testimonial requests",
      "Issue resolution follow-ups",
    ],
    defaultScriptStyle: "friendly",
    requiresBusinessContext: true,
    requiresPurposeDetails: false, // Optional but recommended
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling to follow up on your recent experience with us. Do you have a few minutes?",
    closingTemplate: "Thank you so much for your feedback. We really appreciate it and will use it to improve our services.",
    keyQuestions: [
      "How satisfied were you with your recent experience?",
      "Is there anything we could have done better?",
      "Would you recommend us to others?",
      "Would you be willing to share a testimonial?",
    ],
    messagePlaceholder: "Ask customers how satisfied they were with their recent service and if they would recommend us.",
  },

  appointment_management: {
    id: "appointment_management",
    label: "Appointment Management",
    description: "Reminders, confirmations, rescheduling, no-show recovery, post-appointment check-ins",
    subTypes: [
      "Appointment reminders",
      "Confirmations",
      "Rescheduling",
      "No-show recovery",
      "Post-appointment check-ins",
    ],
    defaultScriptStyle: "friendly",
    requiresBusinessContext: true,
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling about your upcoming appointment. Is this a good time?",
    closingTemplate: "Great! We'll see you then. If you need to reschedule, just give us a call. Have a great day!",
    keyQuestions: [
      "Are you still able to make your appointment on {date} at {time}?",
      "Would you like to confirm or reschedule?",
      "Is there anything we should know before your visit?",
    ],
    messagePlaceholder: "Remind customers about their appointment on [date] at [time] and confirm they can still make it.",
  },

  order_project_updates: {
    id: "order_project_updates",
    label: "Order / Project Updates",
    description: "Status updates, delivery scheduling, milestone updates, payment reminders",
    subTypes: [
      "Status updates",
      "Delivery or pickup scheduling",
      "Milestone updates",
      "Payment reminders (soft tone)",
    ],
    defaultScriptStyle: "professional",
    requiresBusinessContext: true,
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling with an update on your {order/project}. Do you have a moment?",
    closingTemplate: "Is there anything else you'd like to know? We'll keep you updated as things progress.",
    keyQuestions: [
      "Would you like to schedule delivery/pickup?",
      "Do you have any questions about the current status?",
      "Is there a preferred time for delivery?",
    ],
    complianceNotes: "Payment reminders must be soft and respectful.",
    messagePlaceholder: "Inform customers that their order is ready for pickup and ask when they'd like to schedule delivery.",
  },

  administrative_operations: {
    id: "administrative_operations",
    label: "Administrative Operations",
    description: "Verifying customer information, clarifying missing details, document requests, scheduling changes",
    subTypes: [
      "Verifying customer information",
      "Clarifying missing details",
      "Document requests",
      "Scheduling changes",
    ],
    defaultScriptStyle: "professional",
    requiresBusinessContext: false,
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling to verify some information. Is now a good time?",
    closingTemplate: "Thank you for your time. We'll update our records and get back to you if we need anything else.",
    keyQuestions: [
      "Can you confirm your {information type}?",
      "Do you have {document/information} available?",
      "Would you prefer to provide this information via email or phone?",
    ],
    messagePlaceholder: "Verify customer's email address and phone number for our records.",
  },

  loyalty_relationship: {
    id: "loyalty_relationship",
    label: "Loyalty & Relationship",
    description: "Thank-you calls, announcing new services, event invitations, holiday greetings",
    subTypes: [
      "Thank-you calls",
      "Announcing new services",
      "Event invitations",
      "Holiday greetings",
    ],
    defaultScriptStyle: "friendly",
    requiresBusinessContext: true,
    requiresPurposeDetails: false,
    introTemplate: "Hi, this is {displayName} from {businessName}. I wanted to reach out personally to {thank you/let you know about...}. Is this a good time?",
    closingTemplate: "Thank you for being such a valued customer. We really appreciate your business!",
    keyQuestions: [
      "Would you be interested in learning about our new {service/offer}?",
      "Are you available to attend our upcoming event?",
      "Is there anything else we can do for you?",
    ],
    messagePlaceholder: "Thank customers for their recent purchase and invite them to our upcoming event on [date].",
  },

  urgent_notifications: {
    id: "urgent_notifications",
    label: "Urgent Notifications",
    description: "Recalls, urgent schedule changes, service outages",
    subTypes: [
      "Recalls",
      "Urgent schedule changes",
      "Service outages",
    ],
    defaultScriptStyle: "professional",
    requiresBusinessContext: true,
    requiresPurposeDetails: true, // REQUIRED for urgent notifications
    introTemplate: "Hi, this is {displayName} from {businessName}. I'm calling with an important update. Do you have a moment?",
    closingTemplate: "Thank you for your attention. If you have any questions or concerns, please don't hesitate to call us.",
    keyQuestions: [
      "Do you have any questions about this update?",
      "Would you like us to reschedule your appointment?",
      "Is there anything we can do to help?",
    ],
    complianceNotes: "Urgent notifications may require immediate action. Ensure clear communication.",
    messagePlaceholder: "Tell customers that all appointments on Friday are canceled due to a power outage and offer to reschedule them next week.",
  },

  custom: {
    id: "custom",
    label: "Custom",
    description: "User-provided custom campaign purpose and instructions",
    subTypes: [],
    defaultScriptStyle: "professional",
    requiresBusinessContext: true,
    requiresPurposeDetails: true, // REQUIRED for custom campaigns
    introTemplate: "Hi, this is {displayName} from {businessName}. {Custom intro based on purpose_details}",
    closingTemplate: "Thank you for your time. Is there anything else I can help you with?",
    keyQuestions: [],
    messagePlaceholder: "Describe what Aloha should tell these contacts and how it should behave during the calls...",
  },
};

/**
 * Get purpose definition by ID
 */
export function getPurposeDefinition(purpose: CampaignPurpose): CampaignPurposeDefinition {
  return CAMPAIGN_PURPOSES[purpose];
}

/**
 * Get all available purposes
 */
export function getAllPurposes(): CampaignPurposeDefinition[] {
  return Object.values(CAMPAIGN_PURPOSES);
}

/**
 * Validate purpose
 */
export function isValidPurpose(purpose: string): purpose is CampaignPurpose {
  return purpose in CAMPAIGN_PURPOSES;
}

/**
 * Get default script style for a purpose
 */
export function getDefaultScriptStyle(purpose: CampaignPurpose): ScriptStyle {
  return CAMPAIGN_PURPOSES[purpose].defaultScriptStyle;
}

