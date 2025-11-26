/**
 * Aloha Campaign Script Generator
 * 
 * Generates purpose-aware scripts for Aloha campaigns.
 * Combines campaign purpose, business context, Aloha profile, and user instructions.
 */

import { getPurposeDefinition, type CampaignPurpose, type ScriptStyle } from "./campaign-purposes";
import { getAlohaDisplayName, getAlohaVoice } from "./profile";
import { getBusinessContext } from "@/lib/business-context";
import type { BusinessContext } from "@/lib/business-context";

export interface CampaignScriptContext {
  userId: string;
  campaignId: string;
  purpose: CampaignPurpose;
  purposeDetails?: string;
  extraInstructions?: string; // User-provided additional instructions
  scriptStyle?: ScriptStyle;
  businessContext?: BusinessContext;
  displayName?: string;
}

export interface GeneratedScript {
  intro: string;
  keyPoints: string[];
  questions: string[];
  closing: string;
  tone: ScriptStyle;
  complianceNotes?: string;
}

/**
 * Generate campaign script based on purpose and context
 */
export async function generateCampaignScript(
  context: CampaignScriptContext
): Promise<GeneratedScript> {
  const purposeDef = getPurposeDefinition(context.purpose);
  const scriptStyle = context.scriptStyle || purposeDef.defaultScriptStyle;

  // Load Aloha profile if not provided
  let displayName = context.displayName;
  if (!displayName) {
    displayName = await getAlohaDisplayName(context.userId);
  }

  // Load business context if required and not provided
  let businessContext = context.businessContext;
  if (purposeDef.requiresBusinessContext && !businessContext) {
    const fetchedContext = await getBusinessContext(context.userId);
    businessContext = fetchedContext || undefined;
  }

  const businessName = businessContext?.profile.businessName || "[Your Business Name]";

  // Generate intro
  let intro = purposeDef.introTemplate
    .replace("{displayName}", displayName)
    .replace("{businessName}", businessName);

  // If purpose_details is provided, it takes priority for intro
  // For custom and urgent_notifications, purpose_details is required and authoritative
  if (context.purposeDetails) {
    if (context.purpose === "custom") {
      // For custom, use purpose_details as the intro
      intro = `Hi, this is ${displayName} from ${businessName}. ${context.purposeDetails}`;
    } else {
      // For other purposes, purpose_details provides the core message
      // Keep the template intro but note that purpose_details contains the main message
      intro = purposeDef.introTemplate
        .replace("{displayName}", displayName)
        .replace("{businessName}", businessName);
    }
  }

  // Generate key points based on purpose
  // If purpose_details exists, it becomes the primary key point
  const keyPoints = generateKeyPoints(context.purpose, businessContext || null, context.purposeDetails);

  // Generate questions
  const questions = purposeDef.keyQuestions || [];
  if (context.purpose === "custom" && context.purposeDetails) {
    // For custom, extract questions from purpose_details if provided
    // This is a simple extraction - in production, could use LLM
  }

  // Generate closing
  let closing = purposeDef.closingTemplate
    .replace("{displayName}", displayName)
    .replace("{businessName}", businessName);

  return {
    intro,
    keyPoints,
    questions,
    closing,
    tone: scriptStyle,
    complianceNotes: purposeDef.complianceNotes,
  };
}

/**
 * Generate key talking points based on purpose and business context
 */
function generateKeyPoints(
  purpose: CampaignPurpose,
  businessContext: BusinessContext | null,
  purposeDetails?: string
): string[] {
  const points: string[] = [];

  // PURPOSE_DETAILS is AUTHORITATIVE - if provided, it becomes the primary key point
  if (purposeDetails && purposeDetails.trim()) {
    // For urgent_notifications and custom, purpose_details IS the message
    if (purpose === "urgent_notifications" || purpose === "custom") {
      points.push(purposeDetails.trim());
      return points; // Return early - purpose_details is the complete instruction
    } else {
      // For other purposes, purpose_details is the primary message, add supporting points
      points.push(purposeDetails.trim());
    }
  }

  // Add supporting points based on purpose (only if purpose_details doesn't override)
  switch (purpose) {
    case "lead_generation_sales":
      if (!purposeDetails) {
        if (businessContext?.profile.services) {
          const services = Array.isArray(businessContext.profile.services)
            ? businessContext.profile.services.join(", ")
            : businessContext.profile.services;
          points.push(`We offer: ${services}`);
        }
        if (businessContext?.profile.description) {
          points.push(businessContext.profile.description);
        }
      }
      break;

    case "feedback_satisfaction":
      if (!purposeDetails) {
        points.push("We value your feedback and use it to improve our services");
        points.push("Your experience matters to us");
      }
      break;

    case "appointment_management":
      if (!purposeDetails) {
        points.push("We want to make sure your appointment works for your schedule");
        points.push("We're here to help if you need to make any changes");
      }
      break;

    case "order_project_updates":
      if (!purposeDetails) {
        points.push("We want to keep you informed about your order/project status");
        points.push("We're here to answer any questions you might have");
      }
      break;

    case "administrative_operations":
      if (!purposeDetails) {
        points.push("We need to verify some information to ensure accuracy");
        points.push("This will help us serve you better");
      }
      break;

    case "loyalty_relationship":
      if (!purposeDetails && businessContext?.profile.services) {
        points.push("We wanted to personally reach out to our valued customers");
      }
      break;

    case "urgent_notifications":
      // purpose_details is required and authoritative - already handled above
      break;

    case "custom":
      // purpose_details is required and authoritative - already handled above
      break;
  }

  return points;
}

/**
 * Generate system prompt for Aloha based on campaign purpose
 */
export async function generateCampaignSystemPrompt(
  context: CampaignScriptContext
): Promise<string> {
  const script = await generateCampaignScript(context);
  const purposeDef = getPurposeDefinition(context.purpose);

  // Load business context
  let businessContext = context.businessContext;
  if (!businessContext) {
    const fetched = await getBusinessContext(context.userId);
    businessContext = fetched || undefined;
  }

  const businessName = businessContext?.profile.businessName || "[Business Name]";
  const displayName = context.displayName || (await getAlohaDisplayName(context.userId));

  // PURPOSE_DETAILS is the AUTHORITATIVE instruction - it takes priority
  let prompt = `You are ${displayName}, calling from ${businessName} as part of a ${purposeDef.label} campaign.

CAMPAIGN PURPOSE: ${purposeDef.description}

TONE: ${script.tone}

${context.purposeDetails 
  ? `CRITICAL - CAMPAIGN MESSAGE (AUTHORITATIVE INSTRUCTION):
${context.purposeDetails}

This is the EXACT message and goal for this campaign. Follow this instruction precisely. This is what you must tell these contacts and how you should behave during the calls.

`
  : ""}SCRIPT GUIDELINES:
- Introduction: ${script.intro}
- Key Points to Cover: ${script.keyPoints.join("; ")}
- Questions to Ask: ${script.questions.join("; ")}
- Closing: ${script.closing}

${context.extraInstructions
  ? `ADDITIONAL USER INSTRUCTIONS:
The user has provided the following additional guidance for this campaign:
"${context.extraInstructions}"

Incorporate these instructions into your behavior during the call. These are high-level behavioral guidelines that should influence how you:
- Adjust your tone or approach
- Handle specific situations
- Modify timing or pacing
- Respond to caller reactions

`
  : ""}IMPORTANT RULES:
1. Use your configured name "${displayName}" when introducing yourself
2. Maintain a ${script.tone} tone throughout the call
3. Be respectful of the caller's time
4. ${context.purposeDetails 
    ? `FOLLOW THE CAMPAIGN MESSAGE ABOVE - it is the authoritative instruction for what to tell contacts`
    : `If asked about information you don't have, politely say: "I don't have that information available right now. I'll make sure someone follows up with you about this."`}
5. Never invent or guess information - log a knowledge gap instead
6. Respect the caller's wishes if they want to end the call
7. Support barge-in: If the caller starts speaking while you're talking, immediately stop and listen
${context.purpose === "urgent_notifications" && context.purposeDetails
  ? `8. CRITICAL: For urgent notifications, you MUST follow the exact message provided above. Do not guess or assume what the urgent notification is about - only use the information explicitly provided in the campaign message.`
  : ""}

REAL-WORLD SCENARIO HANDLING:
You must gracefully handle all real-world caller scenarios professionally:
- Audio issues: Offer callback if quality is poor, ask for repetition politely
- Interruptions: Stop immediately when caller speaks, let them finish
- Emotional situations: Stay calm, empathetic, never escalate
- Identity issues: Keep responses general, don't reveal sensitive info
- Business logic: For opt-outs, comply immediately; for emergencies, redirect to 911
- Safety: Never pretend to be human, never give medical/legal/financial advice
- Always remain polite, calm, and professional regardless of caller behavior
`;

  if (script.complianceNotes) {
    prompt += `\nCOMPLIANCE NOTES: ${script.complianceNotes}\n`;
  }

  if (businessContext) {
    prompt += `\nBUSINESS CONTEXT:\n`;
    if (businessContext.profile.services) {
      const services = Array.isArray(businessContext.profile.services)
        ? businessContext.profile.services.join(", ")
        : businessContext.profile.services;
      prompt += `- Services: ${services}\n`;
    }
    if (businessContext.profile.hours) {
      prompt += `- Hours: ${businessContext.profile.hours}\n`;
    }
    if (businessContext.profile.location) {
      prompt += `- Location: ${businessContext.profile.location}\n`;
    }
  }

  return prompt;
}

