# Campaign Message Requirement Implementation

This document describes the implementation of explicit campaign message/goal requirements for Aloha campaigns.

## Overview

Campaign messages are now **explicit and required** for certain campaign types. The `purpose_details` field contains the authoritative instruction for what Aloha should tell contacts during calls.

## Requirements

### Required For:
- **Urgent Notifications** - Must have explicit message (cannot guess what the urgent notification is)
- **Custom Campaigns** - Must have user-provided instructions

### Recommended For:
- All other campaign purposes (optional but strongly recommended)

## UI Changes

### Campaign Creation Form

Added prominent **"What should Aloha tell these contacts?"** field:

- **Label**: "What should Aloha tell these contacts?"
- **Required indicator**: Shows `*` for required purposes, "(Recommended)" for others
- **Purpose-specific placeholders**:
  - Urgent Notifications: "Tell customers that all appointments on Friday are canceled due to a power outage and offer to reschedule them next week."
  - Feedback: "Ask customers how satisfied they were with their recent service and if they would recommend us."
  - Sales: "Introduce our new premium package and ask if they'd like more information or a quote."
  - And more for each purpose type
- **Validation**: Prevents form submission if required field is empty
- **Help text**: Explains requirement level and importance

## Backend Validation

### Campaign Creation (`POST /api/campaigns`)

```typescript
// Validates purpose_details for required purposes
if (purposeDef.requiresPurposeDetails && !purposeDetails?.trim()) {
  return error: "Campaign message is required for [Purpose] campaigns"
}
```

### Campaign Start (`PATCH /api/campaigns/[id]` with action='start')

```typescript
// Prevents starting campaigns without required purpose_details
if (purposeDef.requiresPurposeDetails && !campaign.purpose_details?.trim()) {
  return error: "Cannot start campaign: Campaign message is required"
}
```

## Script Generation

### Priority System

`purpose_details` is treated as the **authoritative instruction**:

1. **For Urgent Notifications & Custom**:
   - `purpose_details` IS the complete message
   - Aloha follows it exactly
   - No guessing or assumptions

2. **For Other Purposes**:
   - `purpose_details` becomes the primary key point
   - Supporting points from purpose template are added
   - `purpose_details` takes priority

### System Prompt Generation

The system prompt explicitly prioritizes `purpose_details`:

```
CRITICAL - CAMPAIGN MESSAGE (AUTHORITATIVE INSTRUCTION):
[user's purpose_details text]

This is the EXACT message and goal for this campaign. Follow this instruction precisely.
```

For urgent notifications, additional safeguard:
```
CRITICAL: For urgent notifications, you MUST follow the exact message provided above.
Do not guess or assume what the urgent notification is about - only use the information
explicitly provided in the campaign message.
```

## Database Schema

The `purpose_details` field already exists in `call_campaigns`:

```sql
purpose_details TEXT -- Optional specific instructions or custom messaging
```

No schema changes needed - validation is enforced at the application level.

## Examples

### Urgent Notification Campaign

**Purpose**: `urgent_notifications`
**Message** (required): "Tell customers that all appointments on Friday are canceled due to a water leak and help them reschedule."

**Aloha Behavior**:
- Introduces itself
- States: "I'm calling to let you know that all appointments on Friday are canceled due to a water leak"
- Offers rescheduling: "Would you like me to help you reschedule your appointment?"
- Confirms new time or logs callback request
- **Never guesses** what the urgent notification is - only uses the provided message

### Custom Campaign

**Purpose**: `custom`
**Message** (required): "Invite VIP customers to our annual event. Be warm and personal. Emphasize exclusivity and mention the special guest speaker."

**Aloha Behavior**:
- Uses the custom message as the complete instruction
- Adapts tone to be "warm and personal"
- Emphasizes exclusivity
- Mentions special guest speaker
- Follows the custom instructions precisely

### Sales Campaign (Optional Message)

**Purpose**: `lead_generation_sales`
**Message** (optional): "Introduce our new premium package and ask if they'd like more information or a quote."

**Aloha Behavior**:
- Uses standard sales intro template
- Primary message: Introduces new premium package
- Asks about interest in information or quote
- Adds supporting points from business context (services, etc.)

## Safeguards

### 1. UI Validation
- Form prevents submission if required field is empty
- Clear error messages explain requirement
- Visual indicators (red asterisk) show required fields

### 2. Backend Validation
- API rejects campaigns without required `purpose_details`
- Campaign start is blocked if required message is missing
- Clear error messages guide users

### 3. Script Generation
- System prompt explicitly states `purpose_details` is authoritative
- For urgent notifications, extra safeguard against guessing
- Aloha never invents information - logs knowledge gaps instead

### 4. Campaign Execution
- System prompt is generated with `purpose_details` as priority
- Aloha follows the exact message provided
- No assumptions or guessing

## Files Modified

### UI:
- `app/aloha/campaigns/new/page.tsx`
  - Added prominent "What should Aloha tell these contacts?" field
  - Purpose-specific placeholders
  - Required validation
  - Help text

### Backend:
- `app/api/campaigns/route.ts`
  - Validation for required `purpose_details` on creation
- `app/api/campaigns/[id]/route.ts`
  - Validation before starting campaigns
- `lib/aloha/campaign-purposes.ts`
  - Added `requiresPurposeDetails` flag to all purposes
  - Added `messagePlaceholder` for each purpose
- `lib/aloha/campaign-scripts.ts`
  - Updated to prioritize `purpose_details` as authoritative
  - Enhanced system prompt generation
  - Updated key points generation

## Testing Checklist

- [ ] Create urgent notification campaign without message → Should show validation error
- [ ] Create custom campaign without message → Should show validation error
- [ ] Create other campaign without message → Should allow (optional)
- [ ] Try to start urgent campaign without message → Should be blocked
- [ ] Verify script preview shows purpose_details prominently
- [ ] Verify system prompt prioritizes purpose_details
- [ ] Test that Aloha follows exact message for urgent notifications

## Summary

The campaign message system ensures:
✅ Explicit messages required for urgent/custom campaigns
✅ Purpose-specific placeholders guide users
✅ Backend validation prevents invalid campaigns
✅ Script generation prioritizes user's message
✅ Aloha never guesses - only follows provided instructions
✅ Clear error messages guide users to fix issues

The system is ready and will ensure Aloha delivers the exact message users intend for their campaigns.

