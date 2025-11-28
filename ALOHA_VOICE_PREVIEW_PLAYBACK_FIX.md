# Aloha Voice Preview Playback Fix

## Summary

Fixed playback issues with Aloha voice preview selection. The issues were twofold:
1. **Client-side**: Audio not loading properly before playback
2. **Server-side**: JSON parsing errors when requests were aborted

Both issues have been resolved.

## Root Causes

### 1. **Audio Not Loaded Before Play**
- **Issue**: The code was creating a new `Audio` element and immediately calling `play()` without ensuring the audio was loaded first.
- **Impact**: Browser couldn't play audio that wasn't ready, causing silent failures or errors.

### 2. **No Readiness Check**
- **Issue**: No wait for the `canplaythrough` event before attempting playback.
- **Impact**: Race condition where `play()` was called before audio data was available.

### 3. **Insufficient Error Handling**
- **Issue**: Autoplay restrictions and loading errors weren't properly handled or communicated to users.
- **Impact**: Users saw generic errors without understanding what went wrong or how to fix it.

### 4. **Missing Load Call**
- **Issue**: The `audio.load()` method wasn't being called explicitly.
- **Impact**: Browser might not start loading the audio resource immediately.

### 5. **Server-Side JSON Parsing Errors**
- **Issue**: When requests were aborted (via `AbortController`), the server still tried to parse incomplete JSON, causing `SyntaxError: Unexpected end of JSON input`.
- **Impact**: Server errors logged even for legitimate request cancellations, and potential race conditions.

## Fixes Applied

### 1. **Proper Audio Loading Sequence**
```typescript
// Before: Immediate play()
await audio.play();

// After: Load → Wait for readiness → Play
audio.load();
await new Promise<void>((resolve, reject) => {
  // Wait for canplaythrough event
  if (audio.readyState >= 3) {
    resolve();
  } else {
    audio.addEventListener("canplaythrough", handleCanPlay, { once: true });
    // ... timeout handling
  }
});
await audio.play();
```

### 2. **Readiness Check with Timeout**
- Added explicit wait for `canplaythrough` event
- Added 5-second timeout to prevent indefinite waiting
- Check `readyState >= 3` (HAVE_FUTURE_DATA) for immediate readiness

### 3. **Better Error Handling**
- Specific error messages for different failure types:
  - `NotAllowedError`: Browser autoplay restriction
  - `NotSupportedError`: Format/browser compatibility
  - Network/decoding errors: Clear user guidance
- Preserves previewing state on autoplay errors so users can retry

### 4. **CORS Configuration**
- Added `audio.crossOrigin = "anonymous"` to handle cross-origin audio resources properly

### 5. **Server-Side Request Handling**
- **Better JSON Parsing**: Use `request.text()` first, then parse JSON with error handling
- **Aborted Request Detection**: Check for `AbortError` and `ECONNRESET` errors
- **Graceful Abort Handling**: Return status 499 (Client Closed Request) for aborted requests
- **Empty Body Validation**: Check if request body exists before parsing

### 6. **Client-Side Abort Handling**
- **Silent Abort Handling**: Ignore `AbortError` and `ECONNRESET` errors silently
- **Status Code Checks**: Handle status 499 (aborted) and empty responses gracefully
- **No Error Toast on Abort**: Don't show error messages for intentionally aborted requests

## Technical Details

### Audio Element Lifecycle
1. **Creation**: `new Audio(playbackUrl)` - Creates element with source
2. **Loading**: `audio.load()` - Explicitly starts loading
3. **Readiness**: Wait for `canplaythrough` event (or check `readyState`)
4. **Playback**: `audio.play()` - Only called when ready

### Browser Autoplay Policies
- Modern browsers require user interaction before autoplay
- The preview button click provides the required user gesture
- If autoplay is blocked, error message guides user to click again

### Object URL Management
- Object URLs are created from Blobs when preview is generated
- URLs are revoked in cleanup to prevent memory leaks
- Version parameter (`?v=timestamp`) ensures fresh URLs

## Testing Recommendations

1. **Test in different browsers** (Chrome, Firefox, Safari, Edge)
2. **Test with slow network** (throttle in DevTools)
3. **Test autoplay restrictions** (check browser settings)
4. **Test multiple rapid clicks** (should handle gracefully)
5. **Test with missing preview assets** (fallback behavior)

## Files Modified

- `app/aloha/settings/page.tsx`
  - Updated `playAudioElement()` function with proper loading sequence
  - Improved `handlePreviewVoice()` error handling
  - Added CORS configuration
  - Enhanced `queueVoicePreviewRegeneration()` to handle aborted requests silently

- `app/api/voice-preview/route.ts`
  - Added robust JSON parsing with `request.text()` first
  - Added validation for empty request bodies
  - Added graceful handling of aborted requests (status 499)
  - Improved error messages for invalid JSON

## Related Files

- `app/api/voice-preview/route.ts` - API endpoint that generates audio
- `lib/aloha/voice-profiles.ts` - Voice profile definitions
- `public/previews/*.mp3` - Fallback audio assets

