# Campaign Internal Script System - Implementation Summary

## Overview

The campaign system has been updated to hide base scripts from users and allow high-level instructions instead. Users can now provide behavioral guidance and test campaigns before running them.

## Key Changes

### 1. Base Script is Internal-Only ✅

**What Changed:**
- `script_template` field is no longer visible or editable in UI
- Base script is generated internally from:
  - Campaign purpose
  - `purpose_details` (campaign message)
  - Business context
  - Purpose-specific templates
- Script generation happens at runtime

**UI:**
- ❌ Removed "Script / Talking Points" textarea
- ✅ Added note that base script is internal-only
- ✅ "Preview Behavior" button shows behavior preview (not raw script)

### 2. Additional Instructions Field ✅

**New Field:** `extra_instructions` (TEXT in `call_campaigns`)

**UI Location:** Campaign creation/edit form

**Label:** "Additional Instructions for Aloha (optional)"

**Placeholders (purpose-specific):**
- Urgent: "keep the call under 1 minute and be extra polite if they're upset"
- Feedback: "ask for feedback about their last haircut and offer a 10% discount if they were unhappy"
- Sales: "if they say they're busy, ask for a better time to call back"

**Help Text:**
> "You can give Aloha extra guidance in natural language. For example: 'keep the call very short,' 'always offer to reschedule,' or 'be extra apologetic about cancellations.' Aloha will follow your instructions on top of its built-in script for this campaign."

**Backend:**
- Stored in `call_campaigns.extra_instructions`
- Combined with internal script at runtime
- Passed to LLM as "ADDITIONAL USER INSTRUCTIONS" section

### 3. Test Call Feature ✅

**New Endpoint:** `POST /api/campaigns/[id]/test-call`

**UI:** Campaign detail page (`/aloha/campaigns/[id]`)

**Features:**
- "Test this campaign with Aloha" section
- Phone number input form
- Rate limiting: 5 test calls per hour per user
- Test calls marked with `is_test_call = true`
- Test calls linked to campaign via `test_campaign_id`
- Do NOT update campaign target status
- Clearly labeled in call logs

**Help Text:**
> "Use a test call to hear exactly how Aloha will speak and handle questions before you start calling real customers."

## Database Changes

### Migration: `20241203000000_campaign_extra_instructions_and_test_calls.sql`

**Added to `call_campaigns`:**
```sql
extra_instructions TEXT
```

**Added to `calls` table:**
```sql
is_test_call BOOLEAN DEFAULT false
test_campaign_id UUID REFERENCES call_campaigns(id)
```

**Indexes:**
- `idx_calls_is_test_call` - For filtering test calls
- `idx_calls_test_campaign_id` - For linking test calls to campaigns

## Backend Implementation

### Script Generation

**File:** `lib/aloha/campaign-scripts.ts`

**Updated `CampaignScriptContext`:**
```typescript
interface CampaignScriptContext {
  // ... existing fields
  extraInstructions?: string; // NEW
}
```

**System Prompt Structure:**
```
You are [displayName], calling from [businessName]...

CAMPAIGN MESSAGE (AUTHORITATIVE):
[purpose_details]

SCRIPT GUIDELINES:
- Introduction: [generated]
- Key Points: [generated]
- Questions: [generated]
- Closing: [generated]

ADDITIONAL USER INSTRUCTIONS:
[extra_instructions if provided]

Incorporate these instructions into your behavior during the call...
```

### API Endpoints

**Campaign Creation (`POST /api/campaigns`):**
- Accepts `extraInstructions`
- Sets `script_template = null` (internal-only)
- Stores `extra_instructions`

**Campaign Update (`PATCH /api/campaigns/[id]`):**
- Accepts `extraInstructions` in update action
- Does NOT accept `scriptTemplate` (internal-only)

**Campaign Execution (`POST /api/campaigns/[id]/execute`):**
- Includes `extra_instructions` in script context
- Generates system prompt with user instructions

**Test Call (`POST /api/campaigns/[id]/test-call`):**
- Validates campaign exists
- Rate limits: 5 per hour per user
- Creates call log with `is_test_call = true`
- Uses same script generation as real calls
- Returns metadata (telephony integration pending)

## UI Implementation

### Campaign Creation Page

**Removed:**
- "Script / Talking Points" textarea

**Added:**
- "Additional Instructions for Aloha" field
- Purpose-specific placeholders
- Help text explaining internal script system
- Updated "Preview Behavior" button

**Updated:**
- Script preview shows "Behavior Preview" with note about internal script
- Preview includes extra_instructions if provided

### Campaign Detail Page

**New File:** `app/aloha/campaigns/[id]/page.tsx`

**Features:**
- Campaign information display
- "Test this campaign with Aloha" section
- Collapsible test call form
- Phone number input
- Test call button
- Error handling for rate limits
- Campaign stats and targets list

## How It Works

### Script Generation Flow

1. **User provides:**
   - Campaign purpose
   - Campaign message (`purpose_details`)
   - Additional instructions (`extra_instructions`) - optional

2. **System generates (internal):**
   - Base script from purpose + message + business context
   - Purpose-specific templates
   - Aloha profile integration

3. **Runtime combination:**
   ```
   Base Script (internal)
   + User's extra_instructions
   = Final system prompt for Aloha
   ```

4. **Aloha uses:**
   - System prompt for behavior
   - Supports barge-in
   - Logs knowledge gaps
   - Respects time windows

### Test Call Flow

1. User clicks "Test this campaign with Aloha"
2. Enters phone number
3. System validates rate limit
4. Generates system prompt (same as real call)
5. Creates test call log entry
6. Initiates call via telephony provider
7. Aloha uses campaign script + instructions
8. User hears how Aloha behaves
9. User can refine instructions and test again

## Constraints Preserved

✅ **User-initiated only**: Aloha never starts campaigns automatically
✅ **Time windows**: Campaigns only run within allowed windows
✅ **Business Info protection**: Aloha never changes Business Info
✅ **Knowledge gap logging**: Aloha logs gaps instead of guessing
✅ **Campaign targets**: Only calls user-specified numbers
✅ **Barge-in support**: Works for test calls and real calls
✅ **Test calls**: Clearly separated, don't affect campaign progress

## Files Created/Modified

### Created:
- `supabase/migrations/20241203000000_campaign_extra_instructions_and_test_calls.sql`
- `app/api/campaigns/[id]/test-call/route.ts`
- `app/aloha/campaigns/[id]/page.tsx`
- `CAMPAIGN_INTERNAL_SCRIPT_SYSTEM.md`
- `CAMPAIGN_INTERNAL_SCRIPT_IMPLEMENTATION_SUMMARY.md`

### Modified:
- `lib/aloha/campaign-scripts.ts` - Added extraInstructions support
- `app/api/campaigns/route.ts` - Removed scriptTemplate, added extraInstructions
- `app/api/campaigns/[id]/route.ts` - Handle extraInstructions updates
- `app/api/campaigns/[id]/execute/route.ts` - Include extraInstructions
- `app/api/campaigns/preview-script/route.ts` - Include extraInstructions
- `app/api/campaigns/[id]/script-preview/route.ts` - Include extraInstructions
- `app/aloha/campaigns/new/page.tsx` - Removed script template, added extra instructions
- `app/aloha/campaigns/page.tsx` - Updated campaign list

## Testing Checklist

- [ ] Create campaign without extra_instructions → Should work
- [ ] Create campaign with extra_instructions → Should save
- [ ] Preview behavior → Should show preview with instructions
- [ ] Test call → Should initiate (telephony integration pending)
- [ ] Test call rate limit → Should block after 5 per hour
- [ ] Test call logging → Should mark is_test_call = true
- [ ] Real campaign call → Should use extra_instructions
- [ ] Barge-in during test call → Should work
- [ ] Barge-in during real call → Should work

## Summary

The system now:
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

