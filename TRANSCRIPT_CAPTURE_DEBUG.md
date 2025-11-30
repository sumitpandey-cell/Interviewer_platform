# Transcript Capture Debugging Guide

## Understanding ServerContent Messages

The Gemini Live API sends different types of `serverContent` messages:

### 1. **Keep-Alive / Status Message** (What You're Seeing)
```javascript
{
  hasModelTurn: false,
  hasInputTranscription: false,
  inputTranscriptionText: "none",
  interrupted: undefined,
  turnComplete: undefined
}
```
- **Meaning**: Empty status message from API (heartbeat)
- **Action**: Should be ignored
- **Why it happens**: API sends these to keep connection alive

### 2. **Valid User Speech Transcription**
```javascript
{
  hasInputTranscription: true,
  inputTranscription: { text: "Can you explain REST APIs?" },
  hasModelTurn: false,
  turnComplete: false
}
```
- **Meaning**: User spoke, API captured the speech
- **Action**: Add to transcript as USER message
- **When**: During user's speaking

### 3. **Valid AI Response**
```javascript
{
  hasModelTurn: true,
  modelTurn: { 
    parts: [
      { text: "REST APIs are..." },
      { inlineData: { mimeType: "audio/pcm;rate=16000", data: "..." } }
    ]
  },
  hasInputTranscription: false,
  turnComplete: false
}
```
- **Meaning**: AI generated response text and audio
- **Action**: Add text to transcript as AI message, play audio
- **When**: When AI responds

### 4. **Turn Complete**
```javascript
{
  turnComplete: true,
  hasModelTurn: false,
  hasInputTranscription: false
}
```
- **Meaning**: Current conversation turn is finished
- **Action**: Can prompt for next user input if needed

## Why Your Transcript is Empty (0 messages)

### Potential Causes:

#### 1. **Audio Input Not Flowing**
- User's microphone isn't being captured
- `AudioRecorder` isn't successfully recording
- **Check**: Look for audio chunk logs in console

#### 2. **Messages Arriving Before Listeners Are Ready**
- Fixed with our recent changes (message queue)
- **Check**: Look for `⚠️ Message queued (listeners not ready)` logs

#### 3. **API Connection Issues**
- WebSocket connection is open but not properly configured
- **Check**: Verify system instruction is sent in setup

#### 4. **Empty Interview (< 2 seconds)**
- Interview was ended before any real content was exchanged
- **Check**: Look at elapsed time in console

## Debugging Steps

### Step 1: Check Raw WebSocket Messages
Add this to `use-live-api.ts` `onmessage` handler:

```typescript
console.log('📩 RAW MESSAGE RECEIVED:');
console.log(JSON.stringify(data, null, 2));
```

### Step 2: Monitor Audio Flow
Check if audio chunks are being sent:
```
// Should see many logs like:
AudioRecorder: data chunk received
Sending audio chunk...
```

### Step 3: Verify Event Dispatch
Check console for:
```
=== DISPATCHING AI FRAGMENT ===
Fragment: "text here"

=== DISPATCHING USER FRAGMENT ===
Fragment: "text here"
```

### Step 4: Verify Event Listener Registration
Check for:
```
🎧 Setting up transcript fragment event listeners
Adding transcript fragment event listeners
Marking listeners as ready and flushing queue
```

### Step 5: Check Message Accumulation
When messages are received, should see:
```
✅ Created new AI message. Total messages: 1
✅ Appended to AI message. Total messages: 1
```

### Step 6: Verify Zustand Store Update
Should see:
```
🔄 Syncing messages to Zustand store:
   Total: X messages
   [0] AI: ...
   [1] USER: ...
```

## Expected Interview Flow

```
1. [WebSocket Connected]
2. [Setup Complete]
3. [AI Introduction sent]
4. [AI Response received] → Dispatch ai-transcript-fragment
5. [User speaks] → Dispatch user-transcript-fragment
6. [More exchanges...]
7. [Interview Ends]
8. [Messages saved to DB]
9. [Feedback generated from transcript]
```

## Quick Diagnostic Checklist

- [ ] Audio recorder is initialized and recording
- [ ] WebSocket connected to Gemini API
- [ ] Event listeners registered before messages arrive
- [ ] Interview lasts > 10 seconds
- [ ] Console shows `=== DISPATCHING ===` logs
- [ ] Messages array is building up
- [ ] Transcript synced to Zustand store
- [ ] Interview report shows transcript messages

## If Still No Messages:

1. Check browser console for JavaScript errors
2. Verify API key is valid (not expired)
3. Check network tab for WebSocket connection status
4. Ensure microphone permissions granted
5. Test with text message instead: `sendTextMessage("Hello")`
6. Check that listeners aren't being removed immediately

