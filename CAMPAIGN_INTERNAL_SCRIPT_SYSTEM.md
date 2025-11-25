# Campaign Internal Script System

This document describes the updated campaign system where base scripts are internal-only and users provide high-level instructions instead.

## Overview

The campaign script system has been updated to:
- **Hide base scripts** from users (internal-only)
- **Allow user instructions** via "Additional Instructions for Aloha" field
- **Support test calls** so users can hear Aloha's behavior
- **Maintain all existing constraints** (time windows, user-initiated only, etc.)

## Key Changes

### 1. Base Script is Internal-Only

**Before:**
- Users could see and edit `script_template` field
- Raw template text was visible in UI

**After:**
- `script_template` is generated internally from:
  - Campaign purpose
  - `purpose_details` (campaign message)
  - Business context
  - Purpose-specific templates
- Users **cannot** see or edit the base script
- Script is generated at runtime and used internally

### 2. Additional Instructions Field

**New Field:** `extra_instructions` (TEXT)

**UI:**
- Label: "Additional Instructions for Aloha (optional)"
- Purpose-specific placeholders:
  - Urgent: "keep the call under 1 minute and be extra polite if they're upset"
  - Feedback: "ask for feedback about their last haircut and offer a 10% discount if they were unhappy"
  - Sales: "if they say they're busy, ask for a better time to call back"
- Help text explains this is for behavioral guidance, not script editing

**Backend:**
- Stored in `call_campaigns.extra_instructions`
- Combined with internal script at runtime
- Passed to LLM as "operator prompt"

### 3. Test Call Feature

**New Endpoint:** `POST /api/campaigns/[id]/test-call`

**Features:**
- User enters phone number (usually their own)
- Aloha places a test call using the campaign's script
- Test calls are marked with `is_test_call = true`
- Rate limited: 5 test calls per hour per user
- Does NOT update campaign target status
- Clearly labeled in call logs

**UI:**
- "Test this campaign with Aloha" button on campaign detail page
- Phone number input form
- Help text: "Use a test call to hear exactly how Aloha will speak and handle questions before you start calling real customers."

## Database Changes

### Migration: `20241203000000_campaign_extra_instructions_and_test_calls.sql`

**Added:**
- `call_campaigns.extra_instructions` (TEXT) - User-provided additional instructions
- `calls.is_test_call` (BOOLEAN) - Marks test calls
- `calls.test_campaign_id` (UUID) - Links test call to campaign (optional)

**Note:**
- `script_template` remains in database but is now internal-only
- Generated automatically, not user-editable

## Script Generation Flow

### Internal Script Generation

1. **Base Script** (internal, not visible to user):
   - Generated from `purpose` + `purpose_details`
   - Uses purpose-specific templates
   - Incorporates business context
   - Includes Aloha display name and voice settings

2. **User Instructions** (visible, editable):
   - `extra_instructions` field
   - High-level behavioral guidance
   - Examples: "keep call short", "be extra polite", "offer rescheduling"

3. **Combined at Runtime**:
   ```
   Base Script (internal)
   + User's extra_instructions
   = Final system prompt for Aloha
   ```

### System Prompt Structure

```
You are [displayName], calling from [businessName]...

CAMPAIGN PURPOSE: [purpose description]

CAMPAIGN MESSAGE (AUTHORITATIVE):
[purpose_details]

SCRIPT GUIDELINES:
- Introduction: [generated intro]
- Key Points: [generated points]
- Questions: [generated questions]
- Closing: [generated closing]

ADDITIONAL USER INSTRUCTIONS:
[extra_instructions if provided]

IMPORTANT RULES:
1. Use configured name
2. Maintain tone
3. Support barge-in
4. Never guess information
...
```

## Test Call Implementation

### API Endpoint

**POST `/api/campaigns/[id]/test-call`**

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Test call initiated",
  "callLogId": "...",
  "phoneNumber": "+1234567890"
}
```

**Rate Limiting:**
- Max 5 test calls per hour per user
- Returns 429 if limit exceeded

**Behavior:**
1. Validates campaign exists and belongs to user
2. Checks rate limit
3. Generates system prompt (same as real campaign)
4. Creates call log with `is_test_call = true`
5. Initiates call via telephony provider (integration pending)
6. Uses same script logic as real calls

### Test Call Logging

Test calls are logged with:
- `is_test_call = true`
- `test_campaign_id` (optional, links to campaign)
- `outcome = "test_initiated"` or actual outcome
- Clear labeling in UI/analytics

**Important:**
- Test calls do NOT update `call_campaign_targets` status
- Test calls do NOT count toward campaign progress
- Test calls are clearly separated in call history

## UI Updates

### Campaign Creation Page

**Removed:**
- ❌ "Script / Talking Points" textarea (was `scriptTemplate`)
- ❌ Direct script editing

**Added:**
- ✅ "Additional Instructions for Aloha" field
- ✅ Purpose-specific placeholders
- ✅ Help text explaining internal script system
- ✅ "Preview Behavior" button (shows behavior preview, not raw script)

**Updated:**
- Script preview now shows "Behavior Preview" with note that base script is internal
- Preview includes extra_instructions if provided

### Campaign Detail Page

**Added:**
- ✅ "Test this campaign with Aloha" section
- ✅ Phone number input form
- ✅ Test call button
- ✅ Help text explaining test call purpose

**Features:**
- Collapsible test call form
- Error handling for rate limits
- Success message after test call initiated

## Backend Changes

### Campaign Creation (`POST /api/campaigns`)

**Updated:**
- No longer accepts `scriptTemplate` from user
- Sets `script_template = null` (will be generated internally)
- Accepts `extraInstructions` and stores in `extra_instructions`

### Campaign Update (`PATCH /api/campaigns/[id]`)

**Updated:**
- Accepts `extraInstructions` for updates
- Removed `scriptTemplate` from updateable fields
- Note: `script_template` is internal-only

### Campaign Execution (`POST /api/campaigns/[id]/execute`)

**Updated:**
- Includes `extra_instructions` in script context
- Generates system prompt with user instructions
- Passes to telephony integration

### Script Generation (`lib/aloha/campaign-scripts.ts`)

**Updated:**
- `CampaignScriptContext` includes `extraInstructions`
- System prompt includes user instructions as "operator prompt"
- Instructions are clearly marked as additional guidance

## Barge-In Support

Barge-in behavior is maintained for:
- ✅ Real campaign calls
- ✅ Test calls

**Behavior:**
- If caller speaks while Aloha is talking:
  - Stop TTS immediately
  - Listen and transcribe
  - Respond contextually
- Works regardless of:
  - Campaign purpose
  - Extra instructions content
  - Call type (test or real)

## Constraints Preserved

All existing constraints remain:

✅ **User-initiated only**: Aloha never starts campaigns automatically
✅ **Time windows**: Campaigns only run within allowed windows
✅ **Business Info protection**: Aloha never changes Business Info
✅ **Knowledge gap logging**: Aloha logs gaps instead of guessing
✅ **Campaign targets**: Only calls user-specified numbers
✅ **Test calls**: Clearly separated, don't affect campaign progress

## Files Created/Modified

### Created:
- `supabase/migrations/20241203000000_campaign_extra_instructions_and_test_calls.sql`
- `app/api/campaigns/[id]/test-call/route.ts`
- `app/aloha/campaigns/[id]/page.tsx` - Campaign detail page with test call

### Modified:
- `lib/aloha/campaign-scripts.ts` - Added extraInstructions support
- `app/api/campaigns/route.ts` - Removed scriptTemplate, added extraInstructions
- `app/api/campaigns/[id]/route.ts` - Updated to handle extraInstructions
- `app/api/campaigns/[id]/execute/route.ts` - Include extraInstructions in script context
- `app/api/campaigns/preview-script/route.ts` - Include extraInstructions
- `app/api/campaigns/[id]/script-preview/route.ts` - Include extraInstructions
- `app/aloha/campaigns/new/page.tsx` - Removed script template, added extra instructions
- `app/aloha/campaigns/page.tsx` - Updated campaign list

## Usage Examples

### Creating Campaign with Instructions

```typescript
POST /api/campaigns
{
  name: "Q1 Sales Outreach",
  purpose: "lead_generation_sales",
  purposeDetails: "Introduce our new premium package",
  extraInstructions: "Keep the call under 2 minutes. If they say they're busy, ask for a better time to call back.",
  // ... other fields
}
```

### Test Call

```typescript
POST /api/campaigns/[id]/test-call
{
  phoneNumber: "+1234567890"
}

// Aloha calls the number using:
// - Campaign purpose
// - Campaign message (purpose_details)
// - Extra instructions
// - Business context
// - Aloha profile (name, voice)
```

### Script Generation

```typescript
const scriptContext = {
  userId,
  campaignId,
  purpose: "lead_generation_sales",
  purposeDetails: "Introduce premium package",
  extraInstructions: "Keep call under 2 minutes",
  scriptStyle: "professional",
};

const systemPrompt = await generateCampaignSystemPrompt(scriptContext);

// systemPrompt includes:
// - Base script (internal, generated)
// - Campaign message (purpose_details)
// - User instructions (extra_instructions)
// - Business context
```

## UI Copy Updates

### Additional Instructions Field

**Label:** "Additional Instructions for Aloha (optional)"

**Help Text:**
> "You can give Aloha extra guidance in natural language. For example: 'keep the call very short,' 'always offer to reschedule,' or 'be extra apologetic about cancellations.' Aloha will follow your instructions on top of its built-in script for this campaign."

**Note:**
> "Note: The base script is automatically generated from your campaign purpose and message. You can't edit it directly, but you can influence Aloha's behavior with these additional instructions."

### Test Call Section

**Title:** "Test This Campaign with Aloha"

**Help Text:**
> "Use a test call to hear exactly how Aloha will speak and handle questions before you start calling real customers."

## Summary

The campaign system now:
✅ Hides base scripts from users (internal-only)
✅ Allows user instructions via `extra_instructions`
✅ Supports test calls for previewing behavior
✅ Maintains all existing constraints
✅ Supports barge-in for all call types
✅ Provides clear UI guidance

Users can:
- Provide high-level instructions in natural language
- Test campaigns before running them
- Refine instructions based on test call experience
- Never see or edit raw script templates

The system is ready for telephony integration and provides a better user experience while maintaining full control over Aloha's behavior.

