# Aloha Human Voice Rules & Fallback Phrases Implementation

This document describes the implementation of Human Voice Rules and Fallback Phrase Library for Aloha.

## Overview

Two new capabilities have been added to make Aloha sound more natural and handle edge cases gracefully:

1. **Human Voice Rules** - Voice shaping layer that applies natural, human-like behaviors to all responses
2. **Fallback Phrase Library** - Structured library of phrases for different conversation scenarios

Both are **additive** to existing features and do NOT replace previously implemented functionality.

## 1. Human Voice Rules

### Implementation: `lib/aloha/voice-shaping.ts`

The voice shaping layer applies the following rules to ALL Aloha responses before TTS:

#### Natural Pacing
- **Rushed callers**: Keep responses crisp and short
- **Complex content**: Add subtle slow-down markers
- **Emotional situations**: Add gentle pauses

#### Micro-Pauses
- Insert "..." or small breaks at natural sentence boundaries
- Applied to ~30% of sentence boundaries (random but consistent)
- Not applied for rushed callers

#### Light Disfluencies
- Use sparingly (~15% of responses)
- Examples: "okay," "right," "let me see," "sure," "alright," "got it"
- Only added when contextually appropriate

#### Softening Language
- Applied to ~20% of responses
- Examples: "No worries at all," "Happy to help," "Totally understand"
- Added at end of responses or beginning for issue handling

#### Tone & Prosody Adjustments
- **Warm/Calm**: Slightly more melodic
- **Professional/Rushed**: Steady and clear, remove unnecessary pauses
- **Empathetic/Emotional**: Softer, slower with gentle pauses

#### Grounding Cues
- Applied to ~25% of responses
- Examples: "mm-hmm," "I see," "okay," "understood," "right"
- Added after caller provides information

#### AI-Revealing Language Removal
- Never says "as an AI" or "I am a machine"
- Uses: "I'm Aloha, I assist the team here at {BusinessName}"

#### Clean Endings
- Ensures natural closing lines
- Avoids abrupt hang-ups
- Adds closing phrases when conversation is ending

### Usage

```typescript
import { shapeVoice, detectCallerTone, detectContentComplexity } from "@/lib/aloha/voice-shaping";

const shaped = shapeVoice(originalText, {
  callerTone: "emotional",
  contentComplexity: "complex",
  conversationState: "handling_issue",
  enableDisfluencies: true,
  enableSoftening: true,
  enableGrounding: true,
});
```

## 2. Fallback Phrase Library

### Implementation: `lib/aloha/fallback-phrases.ts`

Structured library of phrases for 23 different conversation scenarios:

- `clarification` - When caller needs to repeat
- `bad_connection` - Connection issues
- `caller_cant_hear` - Caller can't hear Aloha
- `aloha_cant_hear` - Aloha can't hear caller
- `angry` - Angry caller
- `upset` - Upset caller
- `confused` - Confused caller
- `busy` - Busy caller
- `human_request` - Request for human agent
- `unknown_info` - Knowledge gap scenarios
- `wrong_person` - Wrong person reached
- `off_topic` - Off-topic questions
- `exit_intent` - Caller wants to end call
- `emotional` - Emotional caller
- `personal_loss` - Personal loss/grief
- `emergency` - Emergency situations
- `silence` - Silence detection
- `voicemail` - Voicemail detection
- `unsubscribe` - Unsubscribe requests
- `callback` - Callback requests
- `repetitive_question` - Repeated questions
- `unexpected_behavior` - Unexpected caller behavior
- `graceful_closing` - Natural conversation endings

### Usage

```typescript
import { getFallbackPhrase } from "@/lib/aloha/fallback-phrases";

const phrase = getFallbackPhrase("angry", {
  agentName: "Sarah",
  businessName: "Acme Corp",
  campaignReason: "following up on your recent order",
  phone: "+1-555-123-4567",
});
```

## 3. Response Generation Layer

### Implementation: `lib/aloha/response-generator.ts`

Integrates intent analysis, fallback phrases, and voice shaping:

**Flow:**
1. Evaluate conversation intent
2. Detect fallback scenario (if needed)
3. Pull fallback phrase (if scenario detected)
4. Combine with base response
5. Apply voice shaping
6. Return final shaped response

### Scenario Detection

The system automatically detects scenarios based on:
- STT confidence
- Caller emotion
- Intent classification
- Conversation state
- Knowledge gaps
- Repetitive questions
- Off-topic detection

### Usage

```typescript
import { generateResponse } from "@/lib/aloha/response-generator";

const context: ConversationContext = {
  sttConfidence: 0.8,
  callerEmotion: "angry",
  intent: "complaint",
  conversationState: "handling_issue",
  agentName: "Sarah",
  businessName: "Acme Corp",
};

const finalResponse = generateResponse(baseLLMResponse, context, {
  useFallback: true,
  applyVoiceShaping: true,
});
```

## 4. Integration with Call Handler

### Updated: `lib/aloha/call-handler.ts`

The call handler now uses the response generation layer:

```typescript
// Before TTS, apply response generation
const enhancedResponse = generateResponse(response, context, {
  useFallback: true,
  applyVoiceShaping: true,
});
```

**Integration Points:**
- After LLM response generation
- Before TTS synthesis
- Respects existing filler speech
- Works with streaming TTS
- Supports barge-in

## 5. Fallback Activation Rules

Fallback phrases **DO NOT override**:
- Campaign-specific purpose
- User extra instructions
- BusinessContext

Fallback **only activates** when:
- STT confidence is low (< 0.6)
- User emotional tone requires soothing
- Caller is confused or upset
- Question is repetitive
- Aloha cannot answer with existing data
- Specific intents detected (emergency, unsubscribe, etc.)

## 6. Examples

### Example 1: Angry Caller

**Base Response:**
> "I understand your concern about the delayed delivery."

**After Fallback + Voice Shaping:**
> "I hear your frustration, and I'm really sorry about that. I understand your concern about the delayed delivery. Let's see what we can do to fix this."

### Example 2: Low STT Confidence

**Base Response:**
> "I'm not sure I understood that correctly."

**After Fallback + Voice Shaping:**
> "Sorry, I didn't catch that — could you repeat it? ... I'm not sure I understood that correctly. No worries at all."

### Example 3: Knowledge Gap

**Base Response:**
> "I don't have that information available."

**After Fallback + Voice Shaping:**
> "I'm not seeing that info right now, but I can have someone follow up. I don't have that information available, but I'll make sure someone gets back to you with it. Happy to help."

### Example 4: Emergency

**Base Response:**
> "This is an emergency situation."

**After Fallback (replaces response):**
> "I'm not equipped for emergencies — please contact local emergency services right away."

## 7. Files Created

### New Files:
- `lib/aloha/fallback-phrases.ts` - Fallback phrase library
- `lib/aloha/voice-shaping.ts` - Voice shaping layer
- `lib/aloha/response-generator.ts` - Response generation integration
- `lib/aloha/ALOHA_HUMAN_VOICE_IMPLEMENTATION.md` - This documentation

### Modified Files:
- `lib/aloha/call-handler.ts` - Integrated response generation layer

## 8. Testing

### Test Voice Shaping

```typescript
import { shapeVoice } from "@/lib/aloha/voice-shaping";

// Test with different caller tones
const rushed = shapeVoice("I'll keep this short.", { callerTone: "rushed" });
const emotional = shapeVoice("I'm sorry to hear that.", { callerTone: "emotional" });
const complex = shapeVoice("The process involves multiple steps...", { 
  contentComplexity: "complex" 
});
```

### Test Fallback Phrases

```typescript
import { getFallbackPhrase } from "@/lib/aloha/fallback-phrases";

const angry = getFallbackPhrase("angry");
const emergency = getFallbackPhrase("emergency");
const voicemail = getFallbackPhrase("voicemail", {
  agentName: "Sarah",
  businessName: "Acme Corp",
  campaignReason: "following up",
  phone: "+1-555-123-4567",
});
```

### Test Response Generation

```typescript
import { generateResponse } from "@/lib/aloha/response-generator";

const context = {
  callerEmotion: "angry",
  sttConfidence: 0.9,
  conversationState: "handling_issue",
  agentName: "Sarah",
  businessName: "Acme Corp",
};

const response = generateResponse("I understand your concern.", context);
```

## 9. Configuration

### Voice Shaping Options

```typescript
interface VoiceShapingOptions {
  callerTone?: "rushed" | "calm" | "emotional" | "confused" | "neutral";
  contentComplexity?: "simple" | "moderate" | "complex";
  conversationState?: "opening" | "middle" | "closing" | "handling_issue";
  enableDisfluencies?: boolean; // Default: true
  enableSoftening?: boolean; // Default: true
  enableGrounding?: boolean; // Default: true
}
```

### Response Generation Options

```typescript
interface ResponseGenerationOptions {
  useFallback?: boolean; // Default: true
  applyVoiceShaping?: boolean; // Default: true
  fallbackScenario?: FallbackScenario; // Override auto-detection
}
```

## 10. Summary

✅ **Human Voice Rules** applied to all responses
✅ **Fallback Phrase Library** with 23 scenarios
✅ **Response Generation Layer** integrates both
✅ **Automatic scenario detection** based on context
✅ **Voice shaping** respects caller tone and content complexity
✅ **Fallback phrases** only activate when needed
✅ **Does NOT override** campaign purpose or user instructions
✅ **Works with** existing filler speech, streaming TTS, and barge-in
✅ **Additive** - does not replace existing features

The system is ready and will make Aloha sound more natural and handle edge cases gracefully while maintaining all existing functionality.

