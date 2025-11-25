# Aloha Voice Agent Upgrade Summary

This document summarizes the upgrades made to the Aloha voice agent, including user-configurable agent names, voice selection, more human-like conversational behavior, and natural filler speech.

## Overview

The Aloha agent has been upgraded with:
1. **User-configurable agent name** - Users can customize how Aloha introduces itself
2. **Four selectable voices** - Distinct voice options with different styles and personalities
3. **More human-like conversational behavior** - Natural backchannels, pauses, and streaming support
4. **Natural filler speech** - "Thinking" phrases during LLM generation delays (300-700ms threshold)

All existing constraints are preserved:
- Aloha only answers forwarded/missed calls or runs campaigns when explicitly enabled
- Aloha never changes Business Info
- All outbound campaigns require user creation & start, and obey time windows
- All actions are attributable to Aloha and logged

---

## 1. Database Schema

### Migration: `20241201000000_aloha_profiles.sql`

Created `aloha_profiles` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users, unique)
- `display_name` (TEXT, default: "Aloha")
- `voice_id` (TEXT, default: "aloha_voice_1")
- `voice_options` (JSONB, optional cache)
- `created_at`, `updated_at` (timestamps)

**RLS Policies:**
- Users can only view/insert/update their own Aloha profile
- Automatic `updated_at` trigger

**Usage:**
- Each user has one Aloha profile (created automatically on first access)
- Profile is fetched/created via `getAlohaProfile(userId)`

---

## 2. Voice Registry

### File: `lib/aloha/voices.ts`

Defines **4 distinct voices**:

1. **Warm & Friendly (F)** - `aloha_voice_1`
   - Female voice, warm and approachable
   - OpenAI TTS: `nova`
   - Perfect for customer service

2. **Calm & Professional (M)** - `aloha_voice_2`
   - Male voice, calm and professional
   - OpenAI TTS: `onyx`
   - Ideal for business communications

3. **Energetic (F)** - `aloha_voice_3`
   - Female voice, energetic and upbeat
   - OpenAI TTS: `shimmer`
   - Great for sales and marketing

4. **Relaxed & Casual (M)** - `aloha_voice_4`
   - Male voice, relaxed and casual
   - OpenAI TTS: `echo`
   - Perfect for friendly conversations

**Voice Interface:**
```typescript
interface AlohaVoice {
  id: string;
  label: string;
  description: string;
  gender: "female" | "male";
  style: string;
  ttsSettings: {
    provider?: string;
    voiceName?: string;
    pitch?: number;
    speakingRate?: number;
    // ... other TTS parameters
  };
}
```

**Helper Functions:**
- `getVoiceById(voiceId)` - Get voice by ID
- `getDefaultVoice()` - Get default voice
- `isValidVoiceId(voiceId)` - Validate voice ID
- `getAllVoices()` - Get all available voices

---

## 3. Aloha Profile Management

### File: `lib/aloha/profile.ts`

**Functions:**
- `getAlohaProfile(userId)` - Get or create Aloha profile
- `updateAlohaProfile(userId, updates)` - Update profile
- `getAlohaDisplayName(userId)` - Get display name (with fallback)
- `getAlohaVoice(userId)` - Get voice settings (with fallback)

**Behavior:**
- Auto-creates default profile if none exists
- Validates `voice_id` and falls back to default if invalid
- Ensures one profile per user

---

## 4. API Routes

### GET/PATCH `/api/aloha/profile`

**GET:** Returns current user's Aloha profile
**PATCH:** Updates display_name and/or voice_id

**Request Body (PATCH):**
```json
{
  "display_name": "Sarah",
  "voice_id": "aloha_voice_1"
}
```

**Response:**
```json
{
  "ok": true,
  "profile": {
    "id": "...",
    "user_id": "...",
    "display_name": "Sarah",
    "voice_id": "aloha_voice_1",
    ...
  }
}
```

### POST/GET `/api/aloha/voice-preview`

**POST:** Generate voice preview (TTS integration pending)
**GET:** Get list of available voices

---

## 5. Brain API Integration

### File: `app/api/brain/route.ts`

**Changes:**
- Imports `getAlohaDisplayName` from `lib/aloha/profile`
- For Aloha agent, injects user-configured display name into system prompt
- Replaces "ALOHA" references with configured name
- Adds instruction to use display name in introductions

**Example System Prompt Update:**
```
Original: "You are ALOHA, the CommanderX call assistant..."
Updated: "You are Sarah, the CommanderX call assistant..."
+ "IMPORTANT: When introducing yourself, use your configured name 'Sarah'..."
```

**Introduction Examples:**
- Inbound: "Hi, this is {display_name} from {BusinessName}. How can I help you today?"
- Outbound: "Hi, this is {display_name} calling from {BusinessName}. Is now a good time to talk?"

---

## 6. Conversational Middleware

### File: `lib/aloha/conversation.ts`

**Features:**
- **Natural Backchannels:** Adds "Mm-hmm", "Got it", "Okay" when appropriate
- **Micro-pauses:** Adds small breaks between sentences in longer responses
- **Response Chunking:** Splits long responses for streaming
- **Check-in Questions:** Adds "Does that answer your question?" for longer explanations

**Functions:**
- `enhanceConversation(text, options)` - Process response for human-like behavior
- `getStreamingChunks(text, maxLength)` - Split text for streaming TTS
- `shouldAddCheckIn(text)` - Determine if check-in is needed
- `addCheckIn(text)` - Add check-in question

**Usage:**
```typescript
import { enhanceConversation } from "@/lib/aloha/conversation";

const enhanced = enhanceConversation(llmResponse, {
  addBackchannels: true,
  addPauses: true,
  splitLongResponses: false, // Handled separately for streaming
});
```

---

## 7. TTS Service Abstraction

### File: `lib/aloha/tts.ts`

**Purpose:** Abstract TTS provider integration (OpenAI, ElevenLabs, Google Cloud, etc.)

**Functions:**
- `generateSpeech(options)` - Generate speech (placeholder, needs TTS integration)
- `streamSpeech(text, voice, onChunk)` - Stream speech in real-time (placeholder)
- `getTTSVoiceName(voice)` - Get provider-specific voice name
- `getTTSSettings(voice)` - Get TTS provider settings

**Current Status:**
- Structure is in place for TTS integration
- Placeholder implementations log what would be generated
- Ready for actual TTS provider integration (OpenAI TTS, ElevenLabs, etc.)

**Future Integration Example:**
```typescript
// In generateSpeech():
const response = await openai.audio.speech.create({
  model: "tts-1",
  voice: voiceName as "nova" | "onyx" | ...,
  input: text,
  speed: speakingRate,
});
```

---

## 8. Frontend: Aloha Settings Page

### File: `app/aloha/settings/page.tsx`

**Features:**
- **Agent Name Input:** Text field for customizing display name
- **Voice Selection:** Grid of 4 voice cards with:
  - Voice label and description
  - Gender/style indicators
  - "Play Sample" button (preview functionality)
  - Selected state indicator
- **Save/Cancel Buttons:** Persist changes to database

**UI Components:**
- Responsive grid layout (2 columns on desktop)
- Visual feedback for selected voice
- Error/success messages
- Loading states

**Navigation:**
- Accessible from Aloha main page via "Settings" button
- Back button to return to previous page

---

## 9. Database Types

### File: `types/database.ts`

**Added Types:**
- `AlohaProfile` interface
- `AlohaProfileInsert` type
- `AlohaProfileUpdate` type

---

## 10. Real-Time & Streaming Support

### Architecture for Low Latency

**Streaming TTS:**
- `lib/aloha/tts.ts` includes `streamSpeech()` function
- Text can be split into chunks via `getStreamingChunks()`
- Ready for real-time audio streaming

**Conversational Improvements:**
- Responses are enhanced with natural pauses and backchannels
- Long responses are chunked for streaming
- Check-in questions added for better engagement

**Future Implementation:**
1. Integrate streaming TTS provider (OpenAI TTS streaming, ElevenLabs, etc.)
2. Implement VAD (Voice Activity Detection) for barge-in
3. Add interruption handling (stop TTS when caller speaks)
4. Optimize end-to-end latency (aim for sub-second delay)

---

## How It Works

### 1. Storing & Loading Aloha Name & Voice

**Storage:**
- User configures name/voice via `/aloha/settings` page
- Settings saved to `aloha_profiles` table via `/api/aloha/profile` PATCH endpoint

**Loading:**
- On call, `/api/brain` calls `getAlohaDisplayName(userId)` and `getAlohaVoice(userId)`
- Display name injected into system prompt
- Voice ID stored in call context for TTS

**Fallbacks:**
- If no profile exists, default profile created automatically
- If invalid voice_id, falls back to default voice
- If display_name empty, uses "Aloha"

### 2. Using Selected Voice in TTS

**Current Flow:**
1. User selects voice in settings → saved to `aloha_profiles.voice_id`
2. On call, `getAlohaVoice(userId)` returns voice configuration
3. `getTTSSettings(voice)` extracts provider-specific settings
4. TTS service uses voice settings to generate speech

**TTS Integration (Pending):**
- `lib/aloha/tts.ts` has placeholder for actual TTS API calls
- When integrated, will map `voice_id` → provider voice name/ID
- Will use pitch, speaking rate, and other parameters from voice config

### 3. Real-Time / Streaming Behavior

**Conversational Enhancement:**
- `enhanceConversation()` processes LLM responses:
  - Adds backchannels ("Mm-hmm", "Got it")
  - Adds micro-pauses between sentences
  - Varies sentence structure

**Streaming Support:**
- `getStreamingChunks()` splits long responses into chunks
- `streamSpeech()` ready for streaming TTS (needs provider integration)
- Architecture supports:
  - Starting TTS before full response generated
  - Streaming audio chunks to caller in real-time
  - Low-latency turn-taking

**Future Enhancements:**
- Barge-in detection (VAD)
- Interruption handling (stop TTS when caller speaks)
- Sub-second response latency

---

## Testing Checklist

- [ ] Create Aloha profile via settings page
- [ ] Update display name and verify it's used in system prompt
- [ ] Select different voices and verify selection persists
- [ ] Verify voice preview functionality (when TTS integrated)
- [ ] Test fallback to default voice/profile
- [ ] Verify RLS policies (users can only access their own profile)
- [ ] Test conversational enhancements (backchannels, pauses)
- [ ] Verify display name appears in call introductions (via /api/brain)

---

## Next Steps (Future Enhancements)

1. **TTS Integration:**
   - Integrate OpenAI TTS API (or chosen provider)
   - Implement actual voice preview generation
   - Add streaming TTS support

2. **Real-Time Improvements:**
   - Implement VAD (Voice Activity Detection)
   - Add barge-in / interruption handling
   - Optimize latency (sub-second target)

3. **Advanced Conversational Features:**
   - Context-aware backchannel selection
   - Dynamic pause insertion based on content
   - Turn-taking optimization

4. **Voice Customization:**
   - Allow users to adjust pitch/speed per voice
   - Add more voice options
   - Support custom voice uploads (if provider supports)

---

## Files Created/Modified

### Created:
- `supabase/migrations/20241201000000_aloha_profiles.sql`
- `lib/aloha/voices.ts`
- `lib/aloha/profile.ts`
- `lib/aloha/conversation.ts`
- `lib/aloha/tts.ts`
- `lib/aloha/filler-speech.ts` - Filler speech system
- `lib/aloha/call-handler.ts` - Main call handler with filler support
- `app/api/aloha/profile/route.ts`
- `app/api/aloha/voice-preview/route.ts`
- `app/api/aloha/call/route.ts` - Call handling API with filler speech
- `app/aloha/settings/page.tsx`
- `ALOHA_FILLER_SPEECH_IMPLEMENTATION.md` - Filler speech documentation

### Modified:
- `types/database.ts` - Added AlohaProfile types
- `app/api/brain/route.ts` - Integrated Aloha display name
- `app/aloha/page.tsx` - Added Settings link
- `lib/aloha/tts.ts` - Added cancellation support for streaming

---

## Summary

The Aloha voice agent has been successfully upgraded with:
✅ User-configurable agent names
✅ Four selectable voices with distinct personalities
✅ Conversational middleware for more human-like responses
✅ Natural filler speech for delays (300-700ms threshold)
✅ TTS service abstraction ready for provider integration
✅ Settings UI for easy customization
✅ Call handler with filler speech support
✅ All existing constraints preserved

The system is ready for TTS provider integration and can be extended with real-time streaming and advanced conversational features as needed.

### Filler Speech Feature

The filler speech system provides natural "thinking" phrases when the LLM needs extra time to generate a response. It:
- Detects delays (300ms threshold)
- Generates natural filler phrases (12+ rotating options)
- Streams filler immediately (non-blocking)
- Cuts off when real response is ready
- Handles interruptions
- Respects voice and display name settings
- Works for both inbound and outbound calls

See `ALOHA_FILLER_SPEECH_IMPLEMENTATION.md` for detailed documentation.

