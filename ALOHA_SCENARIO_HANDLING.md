# Aloha Real-World Caller Behavior Handling System

## Overview

Aloha now includes comprehensive handling for all real-world caller scenarios, ensuring safe, professional, and intelligent call management across all situations.

## Architecture

### 1. Scenario Detection (`lib/aloha/scenario-detection.ts`)

The scenario detection module analyzes call context and transcripts to identify which scenario category is active:

- **Audio & Technical Issues**: Bad connection, static, low STT confidence, background noise, echo, lag, voicemail, conference calls
- **Caller Behavior Variations**: Interruptions, talking over, silence, fast/slow talkers, topic switches, AI testing, accents, unrelated questions
- **Emotional & Social Scenarios**: Angry, rude, upset, crying, emergencies, grief
- **Caller Identity Issues**: Wrong number, refuses identity, pretending identity, child caller
- **Business Logic Scenarios**: Unavailable services, outside hours, conflicting info, opt-outs, legal concerns, missing pricing

**Key Functions:**
- `detectScenario(context, transcript)` - Main detection function
- `requiresGracefulExit(scenario)` - Determines if call should end
- `getRetryCount(scenario)` - Returns retry count for audio issues

### 2. Fallback Response Library (`lib/aloha/fallback-responses.ts`)

Provides contextually appropriate fallback responses for each scenario type:

- **Primary response** + **alternatives** for variety
- **Tone guidance** (calm, empathetic, professional, polite, neutral)
- **Behavioral flags**: shouldLogKnowledgeGap, shouldOfferCallback, shouldExit

**Key Functions:**
- `getFallbackResponse(scenario, context)` - Get structured response
- `getRandomFallbackResponse(scenario, context)` - Get random alternative

### 3. Scenario Handler (`lib/aloha/scenario-handler.ts`)

Integrates scenario detection with call handling:

- Detects scenarios from call metrics and transcript
- Determines if fallback response should be used
- Provides outcome overrides for specific scenarios
- Enhances LLM prompts with scenario context

**Key Functions:**
- `handleScenario(context)` - Main handler function
- `shouldStopTTS(scenario)` - Determines if TTS should stop (barge-in)
- `enhancePromptWithScenario(basePrompt, scenario)` - Adds scenario context to prompt

## Integration Points

### 1. LLM System Prompt (`app/api/brain/route.ts`)

The Aloha system prompt includes comprehensive scenario handling instructions:

- **Audio & Technical Issues**: Guidelines for handling poor audio quality, asking for repetition, offering callbacks
- **Caller Behavior**: Instructions for interruptions, fast/slow talkers, topic switches, AI testing
- **Emotional Scenarios**: Empathetic responses for angry, upset, or distressed callers
- **Identity Issues**: Handling wrong numbers, unverified identities, child callers
- **Business Logic**: Opt-out compliance, legal concerns, unavailable services
- **Safety & Compliance**: Never pretend to be human, never give medical/legal/financial advice

### 2. Campaign Scripts (`lib/aloha/campaign-scripts.ts`)

Campaign system prompts include scenario handling instructions that work alongside:
- Campaign purpose and message
- User-provided extra instructions
- Business context

Scenario handling is integrated into campaign prompts to ensure consistent behavior across all call types.

### 3. Call Handler (`lib/aloha/call-handler.ts`)

The call handler already supports:
- **Barge-in interruption handling** via `handleInterruption()`
- **Filler speech** for delays
- **TTS streaming** with immediate stop capability

Scenario detection can be integrated here to:
- Stop TTS immediately when interruption detected
- Use fallback responses for high-severity scenarios
- Adjust behavior based on detected scenario

## Usage Example

```typescript
import { handleScenario, type ScenarioHandlerContext } from "@/lib/aloha/scenario-handler";

// During a call turn
const scenarioContext: ScenarioHandlerContext = {
  userId: "user-123",
  transcript: "I can't hear you, there's too much static!",
  audioMetrics: {
    sttConfidence: 0.4, // Low confidence
    audioQuality: 0.3,   // Poor quality
    hasBackgroundNoise: true,
  },
};

const result = await handleScenario(scenarioContext);

if (result.shouldUseFallback && result.fallbackResponse) {
  // Use fallback response instead of LLM
  return result.fallbackResponse;
} else {
  // Enhance LLM prompt with scenario context
  const enhancedPrompt = enhancePromptWithScenario(basePrompt, result.scenario);
  // Continue with normal LLM flow
}

if (result.shouldExit) {
  // Exit call gracefully
}
```

## Scenario Categories & Responses

### Audio & Technical Issues

**Detection:**
- STT confidence < 0.5 → "aloha_cannot_hear"
- Audio quality < 0.6 → "bad_connection" or "distorted_audio"
- Background noise detected → "background_noise"
- Echo detected → "echo_feedback"
- Call latency > 1000ms → "call_lag"
- Voicemail detected → "voicemail"

**Response Strategy:**
- Ask caller to repeat more clearly
- Offer callback if quality remains poor
- Retry 1-2 times before offering callback
- Log as "audio_issue" outcome

### Caller Behavior Variations

**Detection:**
- Interruption count > 2 → "interruption"
- Silence > 5 seconds → "silence_pause"
- Speech rate > 180 WPM → "fast_talker"
- Speech rate < 100 WPM → "slow_talker"
- Topic switches > 2 → "topic_switch"

**Response Strategy:**
- Stop TTS immediately on interruption
- Be patient with pauses and slow talkers
- Politely ask fast talkers to slow down
- Acknowledge topic switches and refocus

### Emotional & Social Scenarios

**Detection:**
- Emergency keywords → "emergency" (HIGH PRIORITY)
- Angry keywords → "angry"
- Rude keywords → "rude"
- Upset keywords → "upset_frustrated"
- Crying indicators → "crying"
- Grief keywords → "grief_loss"

**Response Strategy:**
- Use empathetic, calm tone
- Never escalate
- For emergencies: Redirect to 911 immediately and exit
- Acknowledge emotions: "I understand you're frustrated..."
- Offer callback for distressed callers

### Identity Issues

**Detection:**
- "Wrong number" → "not_intended_customer"
- Refuses identity → "refuses_identity"
- Child indicators → "child" (HIGH PRIORITY)

**Response Strategy:**
- Keep responses general
- Don't reveal sensitive information
- For children: Request parent/guardian, exit if unavailable
- Apologize for wrong numbers

### Business Logic Scenarios

**Detection:**
- Unsubscribe/DNC keywords → "unsubscribe_dnc" (HIGH PRIORITY)
- Legal keywords → "legal_concern"
- Outside business hours → "outside_hours"
- Unavailable service requests → "unavailable_service"

**Response Strategy:**
- For opt-outs: Comply immediately, log, exit gracefully
- For legal: Redirect to professionals, don't provide advice
- For outside hours: Inform of hours, offer callback
- For unavailable services: Offer alternatives or follow-up

## Safety & Compliance

Aloha **NEVER**:
- Pretends to be human
- Gives medical, legal, or financial advice
- Makes promises outside BusinessContext
- Shares personal data
- Escalates emotional situations

Aloha **ALWAYS**:
- Remains polite, calm, and neutral
- Allows caller to end call immediately
- Complies with opt-out requests immediately
- Redirects emergencies to 911
- Logs knowledge gaps for missing information

## Integration with Existing Features

### 1. Campaign Scripts & Extra Instructions

Scenario handling works alongside:
- **Campaign purpose** and message
- **User-provided extra instructions**
- **Internal script** (hidden from user)

Scenario detection runs independently and enhances responses based on detected situations.

### 2. Barge-in Interruption

The existing barge-in system (`call-handler.ts`) already handles interruptions. Scenario detection enhances this by:
- Detecting interruption patterns
- Providing appropriate responses
- Ensuring TTS stops immediately

### 3. Knowledge Gap Logging

Scenario detection integrates with knowledge gap logging:
- Business logic scenarios trigger knowledge gap logging
- Missing information is automatically logged
- Follow-up is offered to callers

### 4. Time Windows

Scenario handling respects campaign time windows:
- Outside-hours scenarios are detected
- Appropriate responses are provided
- Callbacks are offered during business hours

### 5. Test Calls

Scenario handling works during test calls:
- All scenarios can be tested
- Responses are consistent with production
- Test call context is preserved

## Outcome Types

The system now supports additional outcome types:
- `audio_issue` - Audio/technical problems encountered
- `emergency_redirect` - Emergency redirected to 911
- `opt_out` - Caller requested do-not-call
- `resolved` - Normal resolution
- `needs_followup` - Requires follow-up
- `scheduled` - Appointment scheduled

## Testing

To test scenario handling:

1. **Audio Issues**: Simulate low STT confidence or poor audio quality
2. **Interruptions**: Test barge-in detection and TTS stopping
3. **Emotional Scenarios**: Test with angry, upset, or emergency keywords
4. **Opt-outs**: Test unsubscribe/DNC compliance
5. **Identity Issues**: Test wrong number and child detection

## Future Enhancements

Potential improvements:
1. **Voice analysis** for emotional detection (beyond keywords)
2. **Real-time audio quality monitoring** during calls
3. **Adaptive retry strategies** based on scenario type
4. **Scenario-specific voice tone adjustments**
5. **Machine learning** for improved scenario detection accuracy
