# Aloha Campaign Purpose System

This document describes the purpose-aware campaign system for Aloha outbound calls.

## Overview

The campaign purpose system allows users to specify the intent behind each campaign, enabling Aloha to:
- Adjust intro scripts based on purpose
- Use appropriate tone and style
- Ask relevant questions
- Handle compliance requirements
- Generate purpose-specific scripts automatically

## Campaign Purpose Categories

### 1. Lead Generation / Sales
- **Sub-types**: Cold outreach, warm follow-ups, lead qualification, promotions, reactivation
- **Default Style**: Professional
- **Requires Business Context**: Yes
- **Key Features**: DNC compliance, opt-out options, qualification questions

### 2. Feedback & Satisfaction
- **Sub-types**: Product feedback, service satisfaction, NPS scoring, testimonials, issue resolution
- **Default Style**: Friendly
- **Requires Business Context**: Yes
- **Key Features**: Feedback collection, satisfaction scoring, testimonial requests

### 3. Appointment Management
- **Sub-types**: Reminders, confirmations, rescheduling, no-show recovery, post-appointment check-ins
- **Default Style**: Friendly
- **Requires Business Context**: Yes
- **Key Features**: Appointment confirmation, rescheduling support

### 4. Order / Project Updates
- **Sub-types**: Status updates, delivery scheduling, milestone updates, payment reminders
- **Default Style**: Professional
- **Requires Business Context**: Yes
- **Key Features**: Status communication, soft payment reminders

### 5. Administrative Operations
- **Sub-types**: Information verification, clarifying details, document requests, scheduling changes
- **Default Style**: Professional
- **Requires Business Context**: No
- **Key Features**: Data verification, information collection

### 6. Loyalty & Relationship
- **Sub-types**: Thank-you calls, new service announcements, event invitations, holiday greetings
- **Default Style**: Friendly
- **Requires Business Context**: Yes
- **Key Features**: Relationship building, service announcements

### 7. Urgent Notifications
- **Sub-types**: Recalls, urgent schedule changes, service outages
- **Default Style**: Professional
- **Requires Business Context**: Yes
- **Key Features**: Important updates, immediate action required

### 8. Custom
- **Sub-types**: User-defined
- **Default Style**: Professional
- **Requires Business Context**: Yes
- **Key Features**: User-provided instructions in `purpose_details`

## Database Schema

### New Columns in `call_campaigns`

```sql
purpose TEXT -- Campaign purpose category
purpose_details TEXT -- Optional specific instructions
script_style TEXT -- Tone: friendly, professional, energetic, calm, casual
business_context_required BOOLEAN -- Whether business context is needed
```

### Migration

Run: `supabase/migrations/20241202000000_campaign_purposes.sql`

## Script Generation

### Automatic Script Generation

When a campaign has a purpose, Aloha automatically generates:
- **Intro**: Purpose-specific introduction using display name and business name
- **Key Points**: Talking points based on purpose and business context
- **Questions**: Relevant questions for the purpose
- **Closing**: Appropriate closing statement
- **Tone**: Script style (friendly, professional, etc.)

### Script Templates

Each purpose has predefined templates that are customized with:
- User's Aloha display name
- Business name
- Business context (services, hours, location, etc.)
- Custom instructions (if provided)

### Custom Purpose Scripts

For "custom" purposes:
- User provides instructions in `purpose_details`
- System generates script based on those instructions
- LLM can be used to refine scripts (future enhancement)

## Backend Integration

### Campaign Creation

```typescript
POST /api/campaigns
{
  name: "Q1 Outreach",
  purpose: "lead_generation_sales",
  purposeDetails: "Focus on new service offerings",
  scriptStyle: "professional",
  // ... other fields
}
```

### Script Preview

```typescript
POST /api/campaigns/preview-script
{
  purpose: "lead_generation_sales",
  purposeDetails: "...",
  scriptStyle: "professional"
}

// Returns:
{
  ok: true,
  script: {
    intro: "Hi, this is Sarah from Acme Corp...",
    keyPoints: [...],
    questions: [...],
    closing: "...",
    tone: "professional"
  }
}
```

### Campaign Execution

When executing a campaign:
1. System loads campaign purpose
2. Generates purpose-aware system prompt for Aloha
3. Uses prompt to configure Aloha's behavior for each call
4. Aloha adapts intro, tone, questions, and closing based on purpose

## UI Features

### Campaign Creation Page

- **Purpose Dropdown**: Select from 8 purpose categories
- **Purpose Details**: Optional instructions (required for "custom")
- **Script Style**: Override default tone
- **Script Preview**: Generate and preview script before creating campaign
- **Purpose Descriptions**: Help text explaining each purpose

### Campaign List Page

- Shows purpose badge alongside campaign type
- Displays purpose label for easy identification

## Enforcement Rules

All existing rules are preserved:

✅ **Aloha NEVER starts campaigns** - Only user can start via explicit action
✅ **Time windows enforced** - Campaigns only run within allowed time windows
✅ **Knowledge gaps logged** - If Aloha lacks information, it logs gaps instead of guessing
✅ **Business Info protected** - Aloha cannot modify Business Info

## Purpose-Aware Behavior

### Intro Scripts

Each purpose has a template intro that:
- Uses Aloha's configured display name
- References business name
- Sets appropriate context
- Asks permission to continue

Example (Lead Generation):
> "Hi, this is Sarah from Acme Corp. I hope I'm not catching you at a bad time. Is now a good time to talk?"

### Tone & Style

- **Friendly**: Warm, approachable (Feedback, Appointments, Loyalty)
- **Professional**: Business-like (Lead Generation, Updates, Administrative)
- **Energetic**: Upbeat (Sales, Promotions)
- **Calm**: Relaxed (Follow-ups, Check-ins)
- **Casual**: Informal (Relationship building)

### Question Flow

Each purpose has relevant questions:
- **Lead Generation**: Qualification questions, interest assessment
- **Feedback**: Satisfaction scoring, improvement suggestions
- **Appointments**: Confirmation, rescheduling options
- **Updates**: Status questions, scheduling preferences

### Compliance Handling

- **DNC Lists**: Lead generation campaigns respect Do Not Call lists
- **Opt-out Options**: Clear opt-out provided where required
- **Payment Reminders**: Soft, respectful tone
- **Urgent Notifications**: Clear, actionable communication

## Integration with Call Handler

When a campaign call is made:

```typescript
// Campaign execution generates system prompt
const systemPrompt = await generateCampaignSystemPrompt({
  userId,
  campaignId,
  purpose: campaign.purpose,
  purposeDetails: campaign.purpose_details,
  scriptStyle: campaign.script_style,
});

// Use prompt to configure Aloha for this call
const handler = await createAlohaCallHandler(userId, callId, "outbound", {
  enableFillerSpeech: true,
  // System prompt is injected into Aloha's configuration
});
```

## Knowledge Gap Logging

If Aloha encounters missing information during a campaign call:
1. Aloha politely says: "I don't have that information available right now. I'll make sure someone follows up with you about this."
2. System logs knowledge gap to `agent_knowledge_gaps` table
3. User can resolve gap by updating business info or knowledge base
4. Future calls will have the information

## Files Created/Modified

### Created:
- `supabase/migrations/20241202000000_campaign_purposes.sql` - Database schema
- `lib/aloha/campaign-purposes.ts` - Purpose definitions
- `lib/aloha/campaign-scripts.ts` - Script generation logic
- `app/api/campaigns/preview-script/route.ts` - Script preview API
- `app/api/campaigns/[id]/script-preview/route.ts` - Campaign script preview

### Modified:
- `app/api/campaigns/route.ts` - Added purpose fields to creation
- `app/api/campaigns/[id]/execute/route.ts` - Purpose-aware script generation
- `app/aloha/campaigns/new/page.tsx` - Purpose selection UI
- `app/aloha/campaigns/page.tsx` - Purpose display in list

## Usage Examples

### Creating a Lead Generation Campaign

```typescript
POST /api/campaigns
{
  name: "Q1 Sales Outreach",
  purpose: "lead_generation_sales",
  purposeDetails: "Focus on our new premium service tier",
  scriptStyle: "professional",
  phoneNumbers: ["+1234567890", ...],
  // ... time window settings
}
```

### Creating a Custom Campaign

```typescript
POST /api/campaigns
{
  name: "Special Event Invitation",
  purpose: "custom",
  purposeDetails: "Invite VIP customers to our annual event. Be warm and personal. Emphasize exclusivity.",
  scriptStyle: "friendly",
  phoneNumbers: ["+1234567890", ...],
}
```

### Previewing Script

```typescript
POST /api/campaigns/preview-script
{
  purpose: "feedback_satisfaction",
  scriptStyle: "friendly"
}

// Returns generated script with intro, key points, questions, closing
```

## Future Enhancements

1. **LLM-Powered Script Refinement**: Use LLM to refine custom purpose scripts
2. **A/B Testing**: Test different script variations
3. **Performance Analytics**: Track success rates by purpose
4. **Dynamic Scripts**: Adjust scripts based on call outcomes
5. **Multi-language Support**: Purpose-aware scripts in multiple languages

## Summary

The campaign purpose system enables:
✅ 8 purpose categories with specific behaviors
✅ Automatic script generation based on purpose
✅ Purpose-aware Aloha behavior during calls
✅ Custom purpose support with user instructions
✅ Script preview before campaign creation
✅ All existing enforcement rules preserved
✅ Knowledge gap logging for missing information

The system is ready for integration with your telephony provider and will make Aloha's outbound calls more effective and contextually appropriate.

