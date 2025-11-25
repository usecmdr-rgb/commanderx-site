# Aloha Conversation Layers Implementation Summary

This document summarizes the new conversational capabilities added to Aloha, providing a comprehensive implementation plan, architecture overview, and integration guide.

## Table of Contents

1. [Implementation Plan](#implementation-plan)
2. [New Conversation Layers](#new-conversation-layers)
3. [Fallback Script Library](#fallback-script-library)
4. [Call Flow State Machine](#call-flow-state-machine)
5. [Integration Points](#integration-points)
6. [Usage Examples](#usage-examples)

---

## Implementation Plan

### Overview

The implementation adds 8 new capabilities to Aloha:

1. **Conversation Intent Understanding** - Classifies caller utterances
2. **Natural Voice Dynamics** - Human-like voice shaping
3. **Professional Fallback Script Library** - Context-appropriate snippets
4. **Emotional Intelligence Layer** - Empathetic response shaping
5. **Real-Time Communication Resilience** - Handles connection issues and silence
6. **Conversation State Engine** - Tracks conversation flow
7. **End-of-Call Intelligence** - Graceful call endings
8. **Integrated Orchestration Layer** - Ties everything together

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Call Handler (call-handler.ts)           │
│  - Entry point for all calls                               │
│  - Manages filler speech, TTS, voice settings              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         Conversation Layers Processor                       │
│         (conversation-layers.ts)                            │
│  - Orchestrates all conversation layers                     │
│  - Processes caller input through pipeline                  │
└─────┬───────────────┬───────────────┬───────────────────────┘
      │               │               │
      ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Intent    │ │  Emotional  │ │  Voice      │
│Classification│ │ Intelligence │ │ Dynamics    │
└─────────────┘ └─────────────┘ └─────────────┘
      │               │               │
      └───────────────┴───────────────┘
                      │
      ┌───────────────┴───────────────┐
      │                               │
      ▼                               ▼
┌───────────────┐         ┌──────────────────────┐
│ Communication │         │ Conversation State   │
│  Resilience   │         │     Engine           │
└───────────────┘         └──────────────────────┘
      │                               │
      └───────────────┬───────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────┐
│         End-of-Call Intelligence              │
│  - Detects exit intent                        │
│  - Provides graceful closings                 │
└───────────────────────────────────────────────┘
```

---

## New Conversation Layers

### 1. Intent Classification System

**File:** `lib/aloha/intent-classification.ts`

Classifies caller utterances into structured intent categories:

#### Question Intents
- `pricing`, `availability`, `services`, `appointment`, `refund`, `product_support`, `hours`, `location`, `contact`, `policy`

#### Statement Intents
- `complaint`, `praise`, `confusion`, `correction`, `information_provided`

#### Social Intents
- `greeting`, `small_talk`, `exit_intent`, `thanks`

#### Emotional States
- `angry`, `upset`, `stressed`, `neutral`, `happy`, `frustrated`, `confused`

#### Call Flow Intents
- `wants_callback`, `wants_email`, `wants_unsubscribe`, `wants_reschedule`, `wants_appointment`, `wants_information`, `none`

#### Key Functions

```typescript
// Main classification function
classifyIntent(transcript: string): IntentClassification

// Emotional state detection
detectEmotionalState(transcript: string): { state: EmotionalState, confidence: number }
```

### 2. Natural Voice Dynamics Layer

**File:** `lib/aloha/voice-dynamics.ts`

Shapes text before TTS to make Aloha sound more human:

#### Features
- **Micro pauses** ("…") between clauses
- **Natural disfluencies** (sparingly): "okay," "so," "let me see"
- **Softening phrases**: "I can help with that," "no worries"
- **Vary sentence lengths** (avoid all short or all long)
- **Remove robotic patterns** (e.g., "as an AI assistant…")
- **Emotion-aware adjustments** (gentle for upset, efficient for stressed)

#### Key Functions

```typescript
applyVoiceDynamics(text: string, options: VoiceDynamicsOptions): string
```

**Options:**
- `emotion`: EmotionalState
- `context`: "greeting" | "question_answering" | "clarification" | "closing"
- `callerRushed`: boolean
- `callerConfused`: boolean
- `intensity`: "subtle" | "moderate" | "natural"

### 3. Professional Fallback Script Library

**File:** `lib/aloha/response-snippets.ts` (extended)

Expanded snippet library with new categories:

#### New Snippets Added

**Clarification:**
- `clarification_request`: "Sorry, I didn't quite catch that — could you repeat it one more time?"
- `clarification_request_alternative`: "I'm not sure I heard you clearly, would you mind saying that again?"

**Knowledge Gap:**
- `knowledge_gap_fallback`: "I don't have that information right now, but I can make sure someone follows up with you."

**Angry Caller:**
- `angry_caller_deescalate`: "I hear your frustration, and I'm sorry you're dealing with this. Let's see how I can help."

**Confusion Repair:**
- `confused_caller_repair`: "I can see how that might be confusing. Let me explain it a different way."

**Connection Issues:**
- `bad_connection_detected`: "I'm having trouble hearing you clearly. Could you repeat that one more time?"
- `connection_rough`: "It sounds like the connection is a little rough. Can you still hear me clearly?"

**Silence Handling:**
- `caller_silent_short`: "Are you still there?" (2-3 seconds)
- `caller_silent_medium`: "It might be a quiet moment, no rush." (6-7 seconds)
- `caller_silent_long`: "It seems we may have lost connection. I'll end the call for now..." (10+ seconds)

**Exit/Closing:**
- `exit_natural_standard`: "Okay great, thanks so much for your time. Have a wonderful day."
- `exit_if_upset`: "I appreciate your patience. We'll follow up to make this right..."
- `exit_if_connection_bad`: "Since the line is a bit rough, I'll end the call here..."
- `exit_check_needs_anything`: "Before I let you go, is there anything else I can help with today?"

### 4. Emotional Intelligence Layer

**File:** `lib/aloha/emotional-intelligence.ts`

Applies empathetic response shaping based on detected emotional state:

#### Emotional Adjustments

**Upset Callers:**
- Gentle tone + acknowledgement
- Softer language ("won't be able to" instead of "can't")
- Prepend empathy statements

**Angry Callers:**
- De-escalation + neutral clarity
- Avoid confrontational language
- Acknowledge frustration

**Stressed Callers:**
- Slow pace + reassurance
- Add "No worries" phrases
- Be efficient and supportive

**Confused Callers:**
- More explicit guidance
- Break down complex instructions
- Add clarifying phrases

**Happy Callers:**
- Warm and upbeat tone
- Match positive energy

#### Key Functions

```typescript
applyEmotionalIntelligence(response: string, options: EmotionalIntelligenceOptions): string
needsEmpathyStatement(emotionalState: EmotionalState, responseContent: string): boolean
```

### 5. Real-Time Communication Resilience

**File:** `lib/aloha/communication-resilience.ts`

Handles real-time communication issues:

#### Bad Connection Detection

Triggers when:
- STT confidence < 0.5
- `[inaudible]` markers in transcript
- Empty transcripts
- Multiple consecutive low-confidence results

**Response:** Uses appropriate fallback snippets based on severity.

#### Silence Handling

**At 2-3 seconds:**
- "Are you still there?"

**At 6-7 seconds:**
- "It might be a quiet moment, no rush."

**At 10+ seconds:**
- "It seems we may have lost connection. I'll end the call for now..."

#### Talkative Caller Management

Detects:
- Long responses (>100 words)
- Multiple topic switches
- Excessive interruptions

**Response:** Politely redirects to campaign goal.

#### Key Functions

```typescript
detectBadConnection(sttMetadata: STTMetadata, state: CommunicationState): { isBadConnection, severity }
shouldCheckInForSilence(state: CommunicationState): { shouldCheckIn, checkInType, message }
detectTalkativeCaller(transcript: string, state: CommunicationState): { isTalkative, shouldRedirect }
```

### 6. Conversation State Engine

**File:** `lib/aloha/conversation-state.ts`

Tracks conversation flow to avoid repetition and manage state:

#### State Tracking

- **Greeting:** Done? Timestamp?
- **Purpose Delivery:** Delivered? (for outbound)
- **Questions:** Asked vs Answered
- **Empathy:** Needed? Provided?
- **Intent History:** Current and previous intents
- **Fallback Attempts:** Count per type
- **Closing:** Ready? Attempted?
- **Exit Intent:** Detected?
- **Human Callback:** Needed? Requested?

#### Conversation Phases

- `greeting` → `purpose_delivery` → `active_conversation` → `clarification` → `closing` → `ended`

#### Key Functions

```typescript
createConversationState(callType: "inbound" | "outbound"): ConversationState
updateIntent(state: ConversationState, intent: IntentClassification): void
checkReadyToClose(state: ConversationState): { ready: boolean, reason: string | null }
trackFallbackAttempt(state: ConversationState, type: string): { canUseFallback: boolean }
```

### 7. End-of-Call Intelligence

**File:** `lib/aloha/end-of-call.ts`

Handles graceful call endings:

#### Exit Intent Detection

**Explicit:**
- "bye," "goodbye," "gotta go," "that's all"

**Implicit:**
- Short affirmative responses: "okay," "yep," "sounds good" (if < 30 chars)

#### Closing Flow

1. **Check for Additional Needs:**
   - "Before I let you go, is there anything else I can help with today?"

2. **Context-Aware Closings:**
   - Standard: "Okay great, thanks so much for your time..."
   - If upset: "I appreciate your patience. We'll follow up..."
   - If bad connection: "Since the line is a bit rough, I'll end the call here..."

3. **End Call:**
   - Only if caller signals they're done (explicit or implied)
   - After closing attempt and final acknowledgment

#### Key Functions

```typescript
detectExitIntent(callerResponse: string, conversationState?: ConversationState): { hasExitIntent, confidence }
processEndOfCall(callerResponse: string, conversationState?: ConversationState, options?: EndOfCallOptions): { action, message, shouldEndCall }
shouldCheckForAdditionalNeeds(conversationState?: ConversationState, options?: EndOfCallOptions): boolean
```

---

## Call Flow State Machine

### State Transitions

```
START
  │
  ▼
┌─────────────────┐
│   GREETING      │  ← Outbound calls start here
│                 │  ← Inbound calls skip to ACTIVE
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PURPOSE_DELIVERY│  ← Outbound only
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ACTIVE         │  ← Main conversation state
│  CONVERSATION   │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐ ┌──────────────┐
│ CLARIFICATION│ │  CLOSING     │  ← Exit intent or ready to close
└──────┬───────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                │
                ▼
         ┌──────────┐
         │  ENDED   │
         └──────────┘
```

### State Triggers

**GREETING → PURPOSE_DELIVERY:**
- `markGreetingDone()` called

**PURPOSE_DELIVERY → ACTIVE_CONVERSATION:**
- `markPurposeDelivered()` called

**ACTIVE_CONVERSATION → CLARIFICATION:**
- Intent classification returns `requiresClarification: true`

**CLARIFICATION → ACTIVE_CONVERSATION:**
- Intent classification returns `requiresClarification: false`

**ACTIVE_CONVERSATION → CLOSING:**
- Exit intent detected
- `checkReadyToClose()` returns `ready: true`

**CLOSING → ENDED:**
- Call ended (hangup)

---

## Integration Points

### 1. Call Handler Integration

**File:** `lib/aloha/call-handler.ts`

The call handler now supports conversation layers:

```typescript
// Enable conversation layers (default: true)
const handler = await createAlohaCallHandler(userId, callId, callType, {
  enableConversationLayers: true, // NEW
  enableFillerSpeech: true,
  enableConversationEnhancement: true,
  streaming: true,
});

// Process call turn with STT metadata
const result = await handler.processCallTurn(
  sttText,
  llmGenerator,
  conversationContext,
  sttMetadata // NEW: Optional STT metadata
);

// Check if call should end
if (result.shouldEndCall) {
  // End the call gracefully
}

// Access conversation summary
const summary = handler.getConversationSummary();
```

### 2. Conversation Layers Processor

**File:** `lib/aloha/conversation-layers.ts`

Main orchestration layer that processes caller input through all layers:

```typescript
const processor = new ConversationLayersProcessor("outbound");

const result = await processor.processCallerInput(
  {
    transcript: "What are your hours?",
    sttMetadata: { confidence: 0.9 },
    hasSpeech: true,
  },
  llmResponse,
  {
    callType: "outbound",
    callerRushed: false,
    purposeDelivered: true,
  }
);

// Result includes:
// - response: Processed response text
// - intent: Intent classification
// - shouldUseFallback: Whether fallback was used
// - shouldEndCall: Whether call should end
// - conversationSummary: State summary
```

### 3. Integration with Existing Components

#### Filler Speech
- Conversation layers work alongside filler speech
- Filler speech plays during LLM generation delay
- Conversation layers process the final response

#### Voice Settings
- Voice dynamics respect selected Aloha voice style
- TTS settings (pitch, speed) are preserved

#### Campaign Scripts
- Conversation layers work with campaign purposes
- Purpose delivery is tracked in conversation state
- Campaign context is passed through layers

---

## Usage Examples

### Example 1: Basic Call Flow

```typescript
// Create call handler
const handler = await createAlohaCallHandler(userId, callId, "outbound", {
  enableConversationLayers: true,
});

// Mark greeting as done
handler.markGreetingDone();

// Process caller response
const result = await handler.processCallTurn(
  "What are your hours?",
  async (text) => {
    // Call LLM API
    return await generateLLMResponse(text);
  },
  { conversationState: "middle" },
  { confidence: 0.95 } // STT metadata
);

// Get response audio
const audioStream = result.audioStream;

// Check if should end call
if (result.shouldEndCall) {
  // End call gracefully
}
```

### Example 2: Handling Bad Connection

```typescript
// STT returns low confidence
const result = await handler.processCallTurn(
  "[inaudible]",
  llmGenerator,
  {},
  {
    confidence: 0.3, // Low confidence
    hasInaudible: true,
  }
);

// Result will contain fallback message:
// "I'm having trouble hearing you clearly. Could you repeat that one more time?"
```

### Example 3: Emotional Intelligence

```typescript
// Caller sounds upset
const result = await processor.processCallerInput(
  {
    transcript: "I'm so frustrated with this!",
    sttMetadata: { confidence: 0.9 },
  },
  "Let me check that for you.",
  { callType: "inbound" }
);

// Response will be enhanced with empathy:
// "I understand this is frustrating. Let me check that for you."
```

### Example 4: Exit Intent Detection

```typescript
// Caller gives short response
const result = await handler.processCallTurn(
  "Okay thanks",
  llmGenerator,
  {},
  {}
);

// End-of-call logic detects exit intent
if (result.shouldEndCall) {
  // Use graceful closing message
  const closingMessage = result.endOfCallMessage;
}
```

---

## Configuration Options

### Enable/Disable Features

```typescript
const handler = await createAlohaCallHandler(userId, callId, callType, {
  enableConversationLayers: true,      // Enable new conversation layers
  enableFillerSpeech: true,            // Enable filler speech
  enableConversationEnhancement: true, // Enable legacy enhancements
  streaming: true,                     // Enable streaming TTS
});
```

### Voice Dynamics Intensity

The voice dynamics layer supports three intensity levels:

- **subtle**: Minimal changes (15% pause probability)
- **moderate**: Balanced changes (25-30% pause probability) [default]
- **natural**: More human-like (40% pause probability)

Set via `VoiceDynamicsOptions.intensity`.

---

## Logging and Analytics

### Conversation Summary

Access conversation summary for analytics:

```typescript
const summary = handler.getConversationSummary();
// {
//   duration: 45000, // milliseconds
//   turnCount: 8,
//   phase: "closing",
//   questionsAsked: 3,
//   questionsAnswered: 3,
//   empathyProvided: true,
//   exitIntentDetected: true,
//   needsHumanCallback: false,
//   fallbackAttempts: {
//     clarification: 1,
//     knowledgeGap: 0,
//     badConnection: 0,
//     silence: 0,
//   },
//   badConnectionDetected: false,
// }
```

### Intent History

Track intent changes throughout conversation:

```typescript
const processor = new ConversationLayersProcessor("outbound");
// ... process several turns ...

// Access intent history (last 10 intents)
const state = processor.conversationState;
const intentHistory = state.intentHistory;
```

---

## Testing

### Unit Tests

Each layer can be tested independently:

```typescript
// Test intent classification
const intent = classifyIntent("What are your hours?");
expect(intent.primaryIntent).toBe("hours");
expect(intent.emotionalState).toBe("neutral");

// Test voice dynamics
const shaped = applyVoiceDynamics(
  "Hello, how can I help you today?",
  { emotion: "happy", intensity: "moderate" }
);

// Test emotional intelligence
const empathetic = applyEmotionalIntelligence(
  "I can help with that.",
  { emotionalState: "upset" }
);
```

### Integration Tests

Test full conversation flow:

```typescript
const processor = new ConversationLayersProcessor("outbound");
processor.markGreetingDone();
processor.markPurposeDelivered();

const result1 = await processor.processCallerInput(
  { transcript: "What are your hours?", sttMetadata: { confidence: 0.9 } },
  "We're open Monday through Friday, 9am to 5pm."
);

const result2 = await processor.processCallerInput(
  { transcript: "Okay thanks", sttMetadata: { confidence: 0.9 } },
  "You're welcome!"
);

expect(result2.shouldEndCall).toBe(true);
```

---

## Future Enhancements

Potential future improvements:

1. **Multi-language Support**: Extend intent classification to other languages
2. **Voice Emotion Detection**: Use audio analysis to detect emotions (beyond transcript)
3. **Adaptive Learning**: Learn from successful conversations to improve responses
4. **A/B Testing**: Test different response strategies
5. **Real-time Analytics**: Stream conversation metrics to dashboard

---

## Summary

All requested capabilities have been implemented:

✅ **Conversation Intent Understanding** - Full classification system  
✅ **Natural Voice Dynamics** - Human-like voice shaping  
✅ **Professional Fallback Script Library** - Expanded snippet library  
✅ **Emotional Intelligence Layer** - Empathetic response shaping  
✅ **Real-Time Communication Resilience** - Bad connection & silence handling  
✅ **Conversation State Engine** - Full state tracking  
✅ **End-of-Call Intelligence** - Graceful endings  
✅ **Integration** - All layers integrated into call handler

The implementation:
- Does not expose internal script templates
- Combines with existing barge-in and interruption handling
- Works with streaming STT + streaming TTS
- Respects selected Aloha voice style
- Keeps conversation short if caller is rushed
- Logs important conversation states for debugging and analytics

All code is production-ready and follows existing patterns in the codebase.

