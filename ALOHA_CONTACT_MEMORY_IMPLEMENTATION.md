# Aloha Contact Memory Implementation

This document summarizes the lightweight contact memory feature added to Aloha, allowing it to remember basic info about callers and past calls.

## Overview

The contact memory system provides:
- **Per-phone-number memory** of basic caller information
- **Do-not-call flag** enforcement for outbound campaigns
- **Natural greeting adjustments** based on prior interactions
- **Privacy-conscious storage** with no sensitive data
- **Automatic updates** after each call

## Database Schema

### contact_profiles Table

**File:** `supabase/migrations/20241204000000_contact_profiles.sql`

Stores lightweight contact memory per phone number:

```sql
CREATE TABLE contact_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL, -- Normalized (E.164 format)
  name TEXT, -- Caller's preferred name, if learned
  notes TEXT, -- Short notes like "prefers evenings"
  do_not_call BOOLEAN DEFAULT false,
  preferred_call_window JSONB, -- Optional future use
  last_called_at TIMESTAMPTZ,
  last_campaign_id UUID REFERENCES call_campaigns(id),
  last_outcome TEXT, -- e.g. 'feedback_collected', 'rescheduled', 'not_interested', 'do_not_call'
  times_contacted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, phone_number)
);
```

**RLS Policies:** Users can only see/modify their own contact profiles.

### calls Table Extensions

Added columns to existing `calls` table:

- `contact_id` (UUID, FK to contact_profiles.id)
- `sentiment` (TEXT: 'angry', 'neutral', 'happy', 'upset', etc.)
- `direction` (TEXT: 'inbound' | 'outbound')
- `campaign_id` (UUID, FK to call_campaigns.id)
- `phone_number` (TEXT, normalized for quick lookup)

## Implementation Files

### 1. Contact Memory Library

**File:** `lib/aloha/contact-memory.ts`

Core functions for contact management:

#### Key Functions

```typescript
// Normalize phone number to E.164 format
normalizePhoneNumber(phone: string): string

// Look up or create contact profile
lookupOrCreateContact(userId: string, phoneNumber: string): Promise<ContactProfile | null>

// Update contact after call
updateContactAfterCall(
  userId: string,
  phoneNumber: string,
  update: ContactProfileUpdate
): Promise<boolean>

// Check if contact should not be called
shouldNotCall(userId: string, phoneNumber: string): Promise<boolean>

// Set do-not-call flag
setDoNotCall(userId: string, phoneNumber: string, doNotCall: boolean): Promise<boolean>

// Extract caller name from transcript
extractCallerName(transcript: string, previousContext?: string): string | null

// Determine call outcome from conversation
determineCallOutcome(intent: any, transcript: string, summary?: string): string | null
```

### 2. Contact Context Builder

**File:** `lib/aloha/contact-context.ts`

Builds safe, natural-sounding context for LLM prompts:

```typescript
// Build contact context for prompt
buildContactContextPrompt(contact: ContactProfile | null): string

// Build greeting adjustment
buildGreetingAdjustment(
  contact: ContactProfile | null,
  agentName: string,
  businessName: string
): string

// Get tone adjustment based on history
getToneAdjustment(contact: ContactProfile | null): string
```

### 3. Campaign Filters

**File:** `lib/aloha/campaign-filters.ts`

Filters campaign targets based on do-not-call flags:

```typescript
// Filter out do-not-call contacts
filterDoNotCallContacts(
  userId: string,
  phoneNumbers: string[]
): Promise<{ allowed: string[], blocked: string[] }>

// Get do-not-call count
getDoNotCallCount(userId: string, phoneNumbers: string[]): Promise<number>
```

## Integration Points

### 1. Brain Route (`app/api/brain/route.ts`)

#### Contact Lookup

```typescript
// Fetch contact profile for Aloha calls
if (agent === "aloha" && callContext?.phoneNumber) {
  contactProfile = await getContactForCallContext(userId, callContext.phoneNumber);
}
```

#### Contact Context in System Prompt

Contact context is added to the LLM system prompt:

```typescript
if (contactProfile) {
  const contactContext = buildContactContextPrompt(contactProfile);
  systemPrompt += contactContext;
  
  // Special handling for do-not-call contacts
  if (contactProfile.do_not_call) {
    systemPrompt += "\n\nIMPORTANT: This contact has requested not to receive calls...";
  }
}
```

#### Call Linking and Contact Updates

After a call is created:

```typescript
// Link call to contact profile
await supabase.from("calls").insert({
  contact_id: contactId,
  phone_number: phoneNumber,
  sentiment: sentiment,
  // ... other fields
});

// Update contact profile after call
await updateContactAfterCall(userId, phoneNumber, {
  last_called_at: new Date().toISOString(),
  last_campaign_id: campaignId,
  last_outcome: callOutcome,
  times_contacted: times_contacted + 1,
});
```

### 2. Do-Not-Call Handling

#### Outbound Campaigns

Before dialing, filter out do-not-call contacts:

```typescript
const { allowed, blocked } = await filterDoNotCallContacts(userId, phoneNumbers);
// Only call numbers in 'allowed' array
```

#### Inbound Calls

Do-not-call contacts can still receive inbound calls, but Aloha:
- Does NOT try to sell, upsell, or push campaigns
- Focuses only on immediate needs
- Remains respectful and helpful

#### Setting Do-Not-Call Flag

When caller explicitly opts out:

```typescript
// From scenario handler or explicit request
if (scenarioResponse.shouldOptOut) {
  await setDoNotCall(userId, phoneNumber, true);
  await updateContactAfterCall(userId, phoneNumber, {
    last_outcome: "do_not_call",
    do_not_call: true,
  });
}
```

## Contact Memory Usage

### Greeting Adjustments

**First-time contact:**
- Standard greeting: "Hi, this is {AGENT_NAME} from {BUSINESS_NAME}."

**Returning contact with name:**
- "Hi {NAME}, this is {AGENT_NAME} from {BUSINESS_NAME}."

**Returning contact (multiple times):**
- "Hi, this is {AGENT_NAME} from {BUSINESS_NAME}. Thanks for taking the time to speak with me again."

**Prior interaction acknowledgment:**
- "We spoke previously about your appointment."
- "I'm just following up on the update we shared last time."

### Tone Adjustments

Based on contact history:

- **Negative prior outcome** → Extra empathetic tone
- **Multiple contacts** → Efficient, acknowledge relationship
- **Recent contact** → Acknowledge recency ("We spoke earlier today")

### Outcome Tracking

Call outcomes are automatically determined and stored:

- `feedback_collected` - Feedback was collected
- `rescheduled` - Appointment was rescheduled
- `not_interested` - Caller indicated lack of interest
- `asked_for_email` - Caller requested email follow-up
- `do_not_call` - Caller requested to opt out
- `no_answer` - Call was not answered

## Privacy and Safety

### Data Stored

**Safe to store:**
- Caller name (if volunteered)
- Basic preferences (e.g., "prefers evenings")
- Call outcomes (non-sensitive)
- Contact frequency
- Do-not-call flag

**NOT stored:**
- Full conversation transcripts in notes
- Sensitive personal information
- Health, legal, or financial details
- Detailed call content

### Notes Field Guidelines

- Keep notes short (≤100 characters recommended)
- Use non-sensitive language
- Focus on actionable preferences
- Examples: "prefers evenings", "likes short calls", "asked for email follow-up"

### Data Retention

Contact profiles respect existing data retention policies:
- Deleted when account is deleted (CASCADE)
- Can be manually deleted by user
- No automatic expiration (can be added if needed)

## Example Flow

### Outbound Campaign Call

1. **Campaign starts** → Get target phone numbers
2. **Filter do-not-call** → Remove contacts with `do_not_call = true`
3. **Dial number** → Call proceeds
4. **Lookup contact** → Find or create contact profile
5. **Build context** → Include contact memory in LLM prompt
6. **Call completes** → Update contact profile:
   - Increment `times_contacted`
   - Update `last_called_at`
   - Store `last_outcome`
   - Link to `campaign_id`

### Inbound Call

1. **Call arrives** → Get caller's phone number
2. **Lookup contact** → Find or create contact profile
3. **Check do-not-call** → If true, adjust behavior (no selling)
4. **Build context** → Include contact memory in LLM prompt
5. **Natural greeting** → Use name and prior context if available
6. **Call completes** → Update contact profile as above

### Do-Not-Call Request

1. **Caller says "stop calling"** or "unsubscribe"
2. **Intent detected** → Scenario handler flags opt-out
3. **Set flag** → `do_not_call = true` in contact profile
4. **Update outcome** → `last_outcome = "do_not_call"`
5. **Future calls** → Outbound: blocked, Inbound: respectful, no selling

## Testing

### Unit Tests

```typescript
// Test contact lookup/creation
const contact = await lookupOrCreateContact(userId, "+15551234567");
expect(contact.phone_number).toBe("+15551234567");

// Test do-not-call filtering
const { allowed, blocked } = await filterDoNotCallContacts(userId, phoneNumbers);
expect(blocked).toContain(doNotCallNumber);

// Test outcome determination
const outcome = determineCallOutcome(intent, "I want to unsubscribe");
expect(outcome).toBe("do_not_call");
```

### Integration Tests

```typescript
// Test full call flow with contact memory
const contact = await lookupOrCreateContact(userId, phoneNumber);
const result = await processCall(phoneNumber, transcript);
expect(result.contactProfile?.times_contacted).toBeGreaterThan(0);
```

## Future Enhancements

Potential improvements:

1. **Preferred call window** - Respect contact's preferred call times
2. **Caller name extraction** - Improve name extraction from transcripts
3. **Notes auto-generation** - Generate notes from call summaries
4. **Contact merging** - Merge duplicate contact profiles
5. **Bulk operations** - Import/export contact lists
6. **Analytics** - Contact engagement metrics

## Summary

The contact memory system provides:

✅ **Lightweight memory** per phone number  
✅ **Do-not-call enforcement** for outbound campaigns  
✅ **Natural greeting adjustments** based on prior interactions  
✅ **Privacy-conscious** - no sensitive data stored  
✅ **Automatic updates** after each call  
✅ **Respectful behavior** for opted-out contacts  

All functionality is integrated into existing Aloha call handling and respects data retention policies and privacy requirements.

