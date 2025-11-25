# Aloha Filler Speech Implementation

This document describes the implementation of natural "thinking" or "processing" filler speech for Aloha voice calls.

## Overview

When Aloha detects a delay in the STT → LLM → TTS pipeline (300-700ms), it immediately speaks a short, natural phrase instead of leaving silence. This creates a more human-like conversation experience.

## Key Features

- **Delay Detection**: Monitors LLM generation time and triggers filler at 300ms threshold
- **Natural Phrases**: Rotates through 12+ context-appropriate filler phrases
- **Immediate Cut-off**: Stops filler speech as soon as real response is ready
- **Non-blocking**: Filler streams while LLM generates response
- **Voice-Aware**: Uses user's selected Aloha voice and display name
- **Interruption Handling**: Stops filler if caller interrupts

## Architecture

### Components

1. **`lib/aloha/filler-speech.ts`**
   - Filler phrase registry
   - Delay detection logic
   - `FillerSpeechManager` class
   - `CallResponseHandler` class

2. **`lib/aloha/call-handler.ts`**
   - Main `AlohaCallHandler` class
   - Integrates filler speech with call processing
   - Handles STT → LLM → TTS pipeline

3. **`app/api/aloha/call/route.ts`**
   - API endpoint for call handling
   - Integration point for telephony providers

## Filler Phrases

The system uses a rotating list of 12+ natural phrases:

- "Let me check that for you…"
- "Just a moment…"
- "Got it, give me one second…"
- "Okay, let me see…"
- "One sec…"
- "Alright, hold on…"
- "Hmm, checking…"
- "Let me look that up…"
- "Give me just a moment…"
- "Okay, one second…"
- "Right, let me find that…"
- "Sure, checking on that…"

Phrases are:
- Very short (0.5-1.5 seconds)
- Natural and unscripted
- Context-appropriate
- Never contradict final response

## Delay Thresholds

```typescript
MIN_DELAY: 300ms      // Start filler if delay exceeds 300ms
MAX_DELAY: 700ms      // Filler should definitely be playing by 700ms
FILLER_START_TARGET: 250ms  // Target time to start filler TTS
FILLER_START_MAX: 400ms     // Maximum acceptable time to start filler
```

## How It Works

### 1. Call Turn Flow

```
Caller speaks → STT completes → Start LLM generation (async)
                                    ↓
                            Start delay timer
                                    ↓
                    [Delay > 300ms?] → Yes → Generate & stream filler speech
                                    ↓
                            LLM response ready
                                    ↓
                            Stop filler immediately
                                    ↓
                    Generate TTS for real response
                                    ↓
                            Stream response audio
```

### 2. Filler Speech Lifecycle

```typescript
// 1. Detect delay
const elapsed = Date.now() - responseStartTime;
if (elapsed >= 300) {
  // 2. Generate filler
  const { audioStream, fillerText } = await generateFillerSpeech(context);
  
  // 3. Stream filler (non-blocking)
  streamToCaller(audioStream);
  
  // 4. When LLM ready, stop filler
  stopFillerAudio();
  
  // 5. Stream real response
  streamToCaller(realResponseAudio);
}
```

### 3. Integration Example

```typescript
import { createAlohaCallHandler } from "@/lib/aloha/call-handler";

// Create handler for a call
const handler = await createAlohaCallHandler(
  userId,
  callId,
  "inbound", // or "outbound"
  {
    enableFillerSpeech: true,
    enableConversationEnhancement: true,
    streaming: true,
  }
);

// Process a call turn
const result = await handler.processCallTurn(
  sttText, // Transcribed caller speech
  async (text) => {
    // Call your LLM API (e.g., /api/brain)
    return await generateLLMResponse(text);
  }
);

// result contains:
// - enhancedResponse: Final response text
// - audioStream: TTS audio stream
// - usedFiller: Whether filler was used
// - fillerText: What filler phrase was spoken
```

## Telephony Integration

### For Inbound Calls

```typescript
// When caller finishes speaking (STT complete)
const handler = await createAlohaCallHandler(userId, callId, "inbound");

const result = await handler.processCallTurn(
  transcribedText,
  async (text) => {
    // Call /api/brain or your LLM service
    const response = await fetch("/api/brain", {
      method: "POST",
      body: JSON.stringify({ message: text, agent: "aloha" }),
    });
    return response.json().reply;
  }
);

// Stream audio to caller via your telephony provider
await streamAudioToCaller(result.audioStream);
```

### For Outbound Campaign Calls

```typescript
// Same flow, but callType is "outbound"
const handler = await createAlohaCallHandler(userId, callId, "outbound");

// Process call turn the same way
const result = await handler.processCallTurn(sttText, llmGenerator);
```

## Interruption Handling

When caller interrupts while filler is playing:

```typescript
// Detect interruption (via VAD or telephony events)
handler.handleInterruption();

// This will:
// 1. Stop filler audio immediately
// 2. Prepare for new caller input
// 3. Reset state for next turn
```

## Voice and Display Name

Filler speech respects user settings:

- **Voice**: Uses selected voice from `aloha_profiles.voice_id`
- **Display Name**: Can be personalized in filler phrases (future enhancement)

```typescript
// Voice is automatically loaded from user profile
const voice = await getAlohaVoice(userId);

// Display name is also loaded
const displayName = await getAlohaDisplayName(userId);

// Filler speech uses these settings
const fillerAudio = await generateFillerSpeech({
  userId,
  voice, // Uses selected voice
  displayName, // Can be used in personalized phrases
});
```

## Configuration

### Enable/Disable Filler Speech

```typescript
const handler = await createAlohaCallHandler(userId, callId, "inbound", {
  enableFillerSpeech: true, // Set to false to disable
  fillerDelayThreshold: 300, // Customize threshold (ms)
  enableConversationEnhancement: true,
  streaming: true,
});
```

### Customize Delay Threshold

```typescript
// In filler-speech.ts
export const DELAY_THRESHOLDS = {
  MIN_DELAY: 300, // Adjust this value
  MAX_DELAY: 700,
  FILLER_START_TARGET: 250,
  FILLER_START_MAX: 400,
};
```

## TTS Integration

The filler speech system uses the TTS abstraction layer (`lib/aloha/tts.ts`). To integrate with your TTS provider:

1. **Update `generateFillerSpeech()` in `filler-speech.ts`**:
   - Call your TTS provider's API
   - Generate audio for filler phrase
   - Return streaming audio

2. **Update `streamSpeech()` in `tts.ts`**:
   - Implement streaming TTS for your provider
   - Support cancellation (for cutting off filler)

Example with OpenAI TTS:

```typescript
// In tts.ts
export async function streamSpeech(
  text: string,
  voice: AlohaVoice
): Promise<ReadableStream> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice.ttsSettings.voiceName as "nova" | "onyx" | ...,
    input: text,
    response_format: "pcm", // For streaming
  });
  
  return response.body; // Returns ReadableStream
}
```

## Testing

### Test Filler Speech

```typescript
// Simulate delay
const handler = await createAlohaCallHandler(userId, callId, "inbound");

// Use a slow LLM generator to trigger filler
const result = await handler.processCallTurn(
  "What are your hours?",
  async (text) => {
    // Simulate 500ms delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return "We're open Monday through Friday, 9am to 5pm.";
  }
);

// Should have used filler
console.log(result.usedFiller); // true
console.log(result.fillerText); // "Let me check that for you…"
```

### Test Interruption

```typescript
// Start call turn
const turnPromise = handler.processCallTurn(sttText, llmGenerator);

// Simulate interruption after 200ms
setTimeout(() => {
  handler.handleInterruption();
}, 200);

await turnPromise;
```

## Logging

The system logs filler speech events:

```
[Aloha Filler] Started: "Let me check that for you…"
[Aloha Filler] Stopped
```

Enable detailed logging by checking `fillerManager.isActive()` and `fillerManager.getCurrentFiller()`.

## Performance Considerations

- **Filler Generation**: Should complete in < 250ms to meet target
- **TTS Latency**: Filler TTS should start streaming within 250-400ms
- **Cut-off Latency**: Filler should stop within < 50ms of LLM response ready
- **Memory**: Filler audio streams are lightweight and can be cancelled

## Future Enhancements

1. **Context-Aware Fillers**: Customize phrases based on conversation context
2. **Personalized Fillers**: Use display name in filler phrases
3. **Adaptive Thresholds**: Adjust delay threshold based on call history
4. **Multiple Fillers**: Chain multiple fillers for very long delays
5. **Voice Variation**: Vary filler voice characteristics slightly for naturalness

## Files Created/Modified

### Created:
- `lib/aloha/filler-speech.ts` - Core filler speech logic
- `lib/aloha/call-handler.ts` - Main call handler integration
- `app/api/aloha/call/route.ts` - API endpoint for call handling

### Modified:
- `lib/aloha/tts.ts` - Added cancellation support to streaming

## Summary

The filler speech system provides natural "thinking" phrases during LLM generation delays, creating a more human-like conversation experience. It:

✅ Detects delays (300ms threshold)
✅ Generates natural filler phrases
✅ Streams filler immediately
✅ Cuts off when response ready
✅ Handles interruptions
✅ Respects voice and display name settings
✅ Works for both inbound and outbound calls

The system is ready for integration with your telephony provider and TTS service.

