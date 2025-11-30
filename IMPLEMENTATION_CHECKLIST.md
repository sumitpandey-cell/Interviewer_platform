# EXACT CHANGES TO IMPLEMENT

## Summary Document

### What Was Wrong ❌

1. **Race Condition in Event Listeners**
   - WebSocket connects and immediately sends messages
   - But event listeners haven't attached yet
   - Custom events dispatched with no listeners = messages lost
   - Message queue was a workaround, not a solution

2. **Asynchronous Event System**
   - Events are async and unpredictable
   - No guarantee listener exists when event fires
   - Complex dependency on useEffect timing
   - Hard to debug (events are silent when unhandled)

3. **Fragmented Architecture**
   - Use-live-api.ts dispatches events
   - InterviewRoom.tsx listens for events
   - Two layers with potential disconnect
   - Global window object used for communication (anti-pattern)

### What's Right ✅

1. **Direct Callback Pattern**
   - WebSocket handler calls callback directly
   - No events, no listeners, no async
   - Handler always exists (it's the WebSocket handler itself)
   - Guaranteed message delivery

2. **Dual Transcript Tracking**
   - State for UI updates (setMessages)
   - Ref for final output (messageAccumulationRef)
   - Both updated synchronously
   - No data loss between updates

3. **Synchronous Processing**
   - Messages processed in same tick they arrive
   - No async operations blocking transcript
   - Simple and predictable flow
   - Easy to debug

---

## Files to Modify: 3 Files

### 1️⃣ FILE: `src/hooks/use-live-api.ts`

**Lines to DELETE:**
- Lines 9-28: Global queue and listener state setup
- Lines 265-284: `flushMessageQueue()` function
- Lines 289-294: `flushMessageQueue` export

**Lines to MODIFY:**
- Function signature of `connect()`: Add optional callback parameter
- Line 117-155: Replace event dispatch logic with callback calls
- Line 296-309: Update return object

**New Code Pattern:**
```typescript
// Add callback parameter
const connect = useCallback(async (
    config: LiveConfig,
    onMessageReceived?: (msg: { type: 'ai' | 'user', text: string }) => void
) => {
    // ...existing setup code...
    
    ws.onmessage = async (event) => {
        // ...existing parse code...
        
        if ('serverContent' in data) {
            // AI message - DIRECT CALLBACK instead of dispatch
            if (data.serverContent?.modelTurn?.parts?.[0]?.text) {
                const text = data.serverContent.modelTurn.parts[0].text;
                onMessageReceived?.({ type: 'ai', text });
            }
            
            // User message - DIRECT CALLBACK instead of dispatch
            if (data.serverContent?.inputTranscription?.text) {
                const text = data.serverContent.inputTranscription.text;
                onMessageReceived?.({ type: 'user', text });
            }
        }
    };
}, [apiKey]);
```

---

### 2️⃣ FILE: `src/pages/InterviewRoom.tsx`

**Lines to DELETE:**
- Entire `handleTranscriptFragment` function (~120 lines)
- `window.addEventListener()` calls for transcript fragments
- `window.removeEventListener()` calls
- `flushMessageQueue()` call in useEffect
- All event listener related code

**Lines to ADD:**
- `messageAccumulationRef` ref definition
- `handleMessageReceived` callback function
- Pass callback to `connect()` call

**New Code Pattern:**
```typescript
// Add new ref near top of component (after messageIdRef)
const messageAccumulationRef = useRef<string[]>([]);

// Add new callback function (replace the old handleTranscriptFragment)
const handleMessageReceived = useCallback((message: { type: 'ai' | 'user', text: string }) => {
    const { type: sender, text } = message;
    
    // Skip empty text
    if (!text || !text.trim()) return;
    
    console.log(`📝 Message received - ${sender.toUpperCase()}: ${text.substring(0, 50)}...`);
    
    // Update state for UI display
    setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage && lastMessage.sender === sender) {
            // Append to existing message from same sender
            const updated = [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + text }];
            console.log(`✅ Appended to ${sender} message. Total messages: ${updated.length}`);
            return updated;
        } else {
            // Create new message
            messageIdRef.current += 1;
            const newMessage = {
                id: messageIdRef.current,
                sender,
                text,
                timestamp: new Date().toISOString()
            };
            const updated = [...prev, newMessage];
            console.log(`✅ Created new ${sender} message. Total messages: ${updated.length}`);
            return updated;
        }
    });
    
    // Update ref for final transcript (synchronous backup)
    const prefix = sender === 'ai' ? 'AI' : 'User';
    if (messageAccumulationRef.current.length > 0 && 
        messageAccumulationRef.current[messageAccumulationRef.current.length - 1].startsWith(prefix)) {
        // Append to existing
        messageAccumulationRef.current[messageAccumulationRef.current.length - 1] += ' ' + text;
    } else {
        // Create new
        messageAccumulationRef.current.push(`${prefix}: ${text}`);
    }
    console.log(`📋 Transcript history updated. Total entries: ${messageAccumulationRef.current.length}`);
}, []);

// In the connect() call, pass the callback
await connect({
    model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
    generationConfig: { /* ... */ },
    systemInstruction: { /* ... */ }
}, handleMessageReceived);  // ← ADD THIS PARAMETER
```

**DELETE this entire useEffect:**
```typescript
// DELETE THIS ENTIRE useEffect (currently ~180 lines)
useEffect(() => {
    console.log('🎧 Setting up transcript fragment event listeners');
    const handleTranscriptFragment = (event: CustomEvent) => {
        // ... all this code deleted
    };
    window.addEventListener('ai-transcript-fragment', ...);
    window.addEventListener('user-transcript-fragment', ...);
    window.__transcriptListenersReady = true;
    flushMessageQueue();
    return () => { ... };
}, [...]);
```

**KEEP this useEffect (for syncing to Zustand):**
```typescript
// This one stays - it syncs local state to Zustand
useEffect(() => {
    if (messages.length > 0) {
        console.log('🔄 Syncing messages to Zustand store:', messages.length, 'messages');
        setTranscript(messages);
    }
}, [messages, setTranscript]);
```

---

### 3️⃣ FILE: `src/hooks/use-live-api.ts` (Return statement)

**Line to MODIFY:**
```typescript
// OLD:
return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    sendTextMessage,
    suspendAudioOutput,
    resumeAudioOutput,
    flushMessageQueue,  // ← DELETE THIS
    connected,
    isRecording,
    volume
};

// NEW:
return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    sendTextMessage,
    suspendAudioOutput,
    resumeAudioOutput,
    // flushMessageQueue removed
    connected,
    isRecording,
    volume
};
```

---

## Implementation Checklist

- [ ] Remove global message queue from use-live-api.ts
- [ ] Remove getListenersReady() function
- [ ] Remove flushMessageQueue() function
- [ ] Add onMessageReceived callback parameter to connect()
- [ ] Replace event dispatch with callback calls in ws.onmessage
- [ ] Add messageAccumulationRef to InterviewRoom
- [ ] Add handleMessageReceived callback
- [ ] Delete entire transcript fragment listener useEffect
- [ ] Pass handleMessageReceived to connect() call
- [ ] Remove flushMessageQueue from exports
- [ ] Test: Run interview, should see messages accumulating
- [ ] Test: Final transcript should have > 10 messages
- [ ] Test: Report page shows complete transcript

---

## Expected Results After Changes

```
BEFORE:
- Messages captured: 0
- Transcript: Empty
- Feedback: "Insufficient data"
- Console: Events dispatched with no listeners

AFTER:
- Messages captured: 20+
- Transcript: Complete conversation
- Feedback: Detailed and accurate
- Console: Messages received and accumulated in real-time
```

