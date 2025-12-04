# Noise Reduction & Voice Activity Detection Guide

## Overview
This guide explains how to configure Google Gemini Live API's noise reduction and Voice Activity Detection (VAD) settings to optimize your interview experience.

## Current Configuration

### Location
`/src/pages/InterviewRoom.tsx` (lines 550-567)

### Settings Applied
```typescript
realtimeInputConfig: {
    automaticActivityDetection: {
        endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
        startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
        prefixPaddingMs: 300,
        silenceDurationMs: 1000
    }
}
```

## Configuration Parameters

### 1. **endOfSpeechSensitivity** (Noise Reduction)
Controls how quickly the API determines speech has ended.

**Options:**
- `END_SENSITIVITY_LOW` - Waits longer after pauses
  - ✅ Good for: Capturing longer phrases with natural pauses
  - ❌ Risk: Background noise might be interpreted as continued speech
  
- `END_SENSITIVITY_HIGH` ⭐ **RECOMMENDED FOR NOISY ENVIRONMENTS**
  - ✅ Good for: Preventing background noise from being interpreted as speech
  - ✅ Good for: Ensuring AI finishes speaking before listening again
  - ❌ Risk: Might cut off very long pauses mid-thought

**Current Setting:** `HIGH` - Optimized for noise reduction

---

### 2. **startOfSpeechSensitivity** (Speech Detection)
Controls how readily the API detects the beginning of speech.

**Options:**
- `START_SENSITIVITY_LOW` ⭐ **RECOMMENDED FOR INTERVIEWS**
  - ✅ Good for: Reducing false positives from background noise
  - ✅ Good for: Requiring clearer speech before activation
  - ❌ Risk: Might miss very soft-spoken candidates
  
- `START_SENSITIVITY_HIGH`
  - ✅ Good for: Picking up subtle speech and whispers
  - ❌ Risk: More likely to trigger on background noise

**Current Setting:** `LOW` - Balanced for clear interview speech

---

### 3. **prefixPaddingMs** (Audio Capture Buffer)
Milliseconds of audio to capture BEFORE speech is detected.

**Recommended Range:** 200-500ms

**Current Setting:** `300ms`
- Captures the beginning of words that might be spoken before detection triggers
- Prevents cutting off the first syllable

**Tuning Guide:**
- **Too Low (< 200ms):** First words might be cut off
- **Too High (> 500ms):** Might capture unwanted pre-speech noise
- **Optimal:** 300ms for natural speech capture

---

### 4. **silenceDurationMs** (Turn-Taking Control)
Milliseconds of silence before the API considers speech ended.

**Recommended Range:** 700-1500ms

**Current Setting:** `1000ms` (1 second)
- Allows for natural pauses and thinking time
- Prevents premature cutoff during candidate responses
- Ensures AI finishes speaking before listening again

**Tuning Guide:**
- **Too Low (< 700ms):** 
  - Interrupts natural pauses
  - AI might start listening while still speaking
  - Candidate gets cut off mid-thought
  
- **Too High (> 1500ms):**
  - Long awkward pauses before AI responds
  - Slower conversation flow
  
- **Optimal:** 1000ms for interview conversations

---

## Problem-Specific Solutions

### Problem 1: Background Noise Triggering AI
**Symptoms:**
- AI starts responding to background conversations
- TV or music triggers AI responses
- Environmental sounds interrupt the interview

**Solution:**
```typescript
endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',  // ✅ Already applied
startOfSpeechSensitivity: 'START_SENSITIVITY_LOW', // ✅ Already applied
```

**Additional Options:**
- Increase `silenceDurationMs` to 1200-1500ms
- Use client-side noise gate (see Advanced section)

---

### Problem 2: AI Interrupting Itself
**Symptoms:**
- AI stops mid-sentence
- AI starts listening before finishing response
- Overlapping AI speech and user detection

**Solution:**
```typescript
endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',  // ✅ Already applied
silenceDurationMs: 1000,  // ✅ Already applied (increase to 1200 if still happening)
```

**How it works:**
- HIGH sensitivity quickly identifies when AI stops speaking
- 1000ms buffer ensures complete silence before user turn starts

---

### Problem 3: Candidate Getting Cut Off
**Symptoms:**
- Candidate's long answers are interrupted
- Natural pauses trigger AI response
- Thinking time is not respected

**Solution:**
```typescript
silenceDurationMs: 1200,  // Increase from current 1000ms
endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',  // Change from HIGH if needed
```

**Trade-off:** This might make AI more sensitive to background noise

---

### Problem 4: Barge-In / Interruption Detection
**Symptoms:**
- Candidate can't interrupt AI when needed
- No way to stop AI mid-response

**Current Behavior:**
The API automatically handles interruptions when it detects user speech during AI output.

**Optimization:**
```typescript
startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',  // Make interruptions easier
prefixPaddingMs: 200,  // Reduce latency for interruptions
```

**Implementation Note:**
The API sends `interrupted: true` in the `serverContent` message when barge-in occurs. You can handle this in your `onmessage` handler.

---

## Advanced Configuration

### Option 1: Manual Activity Detection
Disable automatic detection and control it yourself:

```typescript
realtimeInputConfig: {
    automaticActivityDetection: {
        disabled: true  // You send activityStart/activityEnd manually
    }
}
```

**Use Case:**
- Custom push-to-talk implementation
- Client-side noise gate
- Advanced audio preprocessing

### Option 2: Environment-Specific Profiles

**Quiet Environment (Office/Home):**
```typescript
{
    endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
    startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
    prefixPaddingMs: 200,
    silenceDurationMs: 800
}
```

**Noisy Environment (Current Default):**
```typescript
{
    endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
    startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
    prefixPaddingMs: 300,
    silenceDurationMs: 1000
}
```

**Very Noisy Environment:**
```typescript
{
    endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
    startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
    prefixPaddingMs: 400,
    silenceDurationMs: 1500
}
```

---

## Testing Your Configuration

### 1. Background Noise Test
- Play background music or TV
- Verify AI doesn't respond to it
- Check if legitimate speech is still detected

### 2. Turn-Taking Test
- Let AI speak a full response
- Verify it doesn't start listening mid-sentence
- Check for smooth transitions

### 3. Interruption Test
- Try interrupting AI mid-response
- Verify barge-in works smoothly
- Check if AI stops appropriately

### 4. Natural Pause Test
- Give answers with thinking pauses
- Verify you're not cut off during pauses
- Check if pauses feel natural

---

## Monitoring & Debugging

### Console Logs to Watch
```typescript
// In use-live-api.ts, check for:
console.log('Interrupted:', msg.serverContent.interrupted);
console.log('Turn complete:', msg.serverContent.turnComplete);
```

### Key Metrics
- **False Positives:** Background noise triggering speech detection
- **False Negatives:** Real speech not being detected
- **Interruption Latency:** Time from user speech to AI stopping
- **Turn-Taking Smoothness:** Natural conversation flow

---

## Recommended Next Steps

1. **Test Current Configuration**
   - Run an interview in your typical environment
   - Note any issues with noise or turn-taking

2. **Fine-Tune If Needed**
   - Adjust `silenceDurationMs` ±200ms based on conversation flow
   - Change sensitivity settings if noise issues persist

3. **Consider Environment Detection**
   - Implement automatic profile switching based on detected noise levels
   - Let users choose their environment type (quiet/normal/noisy)

4. **Monitor User Feedback**
   - Track complaints about interruptions
   - Measure interview completion rates
   - Analyze transcript quality

---

## API References

- [Gemini Live API Documentation](https://ai.google.dev/api/multimodal-live)
- [Voice Activity Detection Guide](https://ai.google.dev/gemini-api/docs/voice)
- [Audio Configuration](https://ai.google.dev/gemini-api/docs/audio)

---

## Support

If you continue experiencing issues:
1. Check API console for error messages
2. Verify audio input quality (16kHz, 16-bit PCM)
3. Test with different microphones
4. Consider implementing client-side noise gate
5. Review browser's microphone permissions

---

**Last Updated:** 2025-12-04  
**Configuration Version:** v2.0 (Optimized for Noise Reduction)
