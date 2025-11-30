# Transcript Fix Implementation Plan

## CHANGES TO BE MADE

### 1. **Remove Event-Based System** ❌→✅
   - Remove: `window.dispatchEvent()` calls
   - Remove: `window.addEventListener()` listeners
   - Remove: Global message queue
   - Remove: `flushMessageQueue()` function
   
   **Reason:** Events are unreliable and cause race conditions

---

### 2. **Replace with Direct State Updates** 📝
   - In `use-live-api.ts`: Instead of dispatching events, call a callback
   - In `InterviewRoom.tsx`: Provide callback to handle messages directly
   - Update Zustand store IMMEDIATELY in WebSocket handler
   
   **Reason:** Synchronous, guaranteed to work, no race conditions

---

### 3. **Implement Dual Transcript Tracking** 📋
   - Keep state for UI display (setTranscriptLines/setMessages)
   - Keep ref for final output (fullTranscriptHistory)
   - Both updated synchronously
   
   **Reason:** Ensures no data loss, redundancy for verification

---

### 4. **Add Message Fragment Accumulation Logic** 🧩
   - Handle `modelTurn.parts[0].text` for AI
   - Handle `inputTranscription.text` for User
   - Append to existing message if same speaker
   - Create new message if different speaker
   
   **Reason:** Properly handles streamed/fragmented messages

---

### 5. **Track Turn Completion State** ⏱️
   - Monitor `turnComplete` flag
   - Use to synchronize with AI speaking state
   - Helps with timeout/silence detection
   
   **Reason:** Clear state transitions = reliable timing

---

## FILES TO MODIFY

### File 1: `src/hooks/use-live-api.ts`
**Changes:**
- Remove message queue logic
- Remove event dispatch
- Remove `flushMessageQueue()` export
- Add callback parameter to `connect()` for message handling
- Call callback directly in `ws.onmessage`

**Before:** 150+ lines of event/queue code
**After:** 50 lines of callback code

---

### File 2: `src/pages/InterviewRoom.tsx`
**Changes:**
- Remove `flushMessageQueue()` call
- Remove event listeners (ai-transcript-fragment, user-transcript-fragment)
- Remove `handleTranscriptFragment()` function
- Add `messageAccumulationRef` (like fullTranscriptHistory in previous code)
- Pass callback to `connect()` that directly updates state + ref
- Simplify entire transcript handling

**Before:** 150+ lines of event handling
**After:** 40 lines of state updates

---

### File 3: `src/stores/use-interview-store.ts`
**Changes:**
- Ensure `setTranscript()` can be called from WebSocket handler
- Or add new method like `addTranscriptMessage()` for incremental updates
- Support both immediate updates and batch updates

---

## PSEUDO-CODE FOR NEW IMPLEMENTATION

```typescript
// use-live-api.ts
export function useLiveAPI(apiKey: string) {
    // ...existing code...
    
    const connect = useCallback(async (
        config: LiveConfig,
        onMessageReceived?: (message: { type: 'ai' | 'user', text: string }) => void
    ) => {
        // ...setup code...
        
        ws.onmessage = async (event) => {
            let data: LiveIncomingMessage;
            // ...parse message...
            
            if ('serverContent' in data) {
                // AI response
                if (data.serverContent?.modelTurn?.parts?.[0]?.text) {
                    const text = data.serverContent.modelTurn.parts[0].text;
                    if (text && onMessageReceived) {
                        onMessageReceived({ type: 'ai', text });
                    }
                }
                
                // User transcription
                if (data.serverContent?.inputTranscription?.text) {
                    const text = data.serverContent.inputTranscription.text;
                    if (text && onMessageReceived) {
                        onMessageReceived({ type: 'user', text });
                    }
                }
            }
        };
    }, [apiKey]);
    
    return { connect, ...rest };
}

// InterviewRoom.tsx
const handleMessageReceived = useCallback((message: { type: 'ai' | 'user', text: string }) => {
    const { type, text } = message;
    
    // Update state for UI
    setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.sender === type) {
            // Append to existing message
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
        }
        // Create new message
        messageIdRef.current += 1;
        return [...prev, {
            id: messageIdRef.current,
            sender: type,
            text,
            timestamp: new Date().toISOString()
        }];
    });
    
    // Update ref for final transcript (synchronous)
    const prefix = type === 'ai' ? 'AI' : 'User';
    if (fullTranscriptHistoryRef.current.length > 0 && 
        fullTranscriptHistoryRef.current[fullTranscriptHistoryRef.current.length - 1].startsWith(prefix)) {
        fullTranscriptHistoryRef.current[fullTranscriptHistoryRef.current.length - 1] += ' ' + text;
    } else {
        fullTranscriptHistoryRef.current.push(`${prefix}: ${text}`);
    }
}, []);

// When connecting
await connect(config, handleMessageReceived);
```

---

## VALIDATION CHECKLIST

After implementation, verify:

- [ ] No event dispatch calls in code
- [ ] No event listeners for transcript
- [ ] No message queue
- [ ] Callback parameter added to `connect()`
- [ ] Messages update state directly
- [ ] Messages update ref directly
- [ ] Run test interview > 30 seconds
- [ ] Check console for: `✅ Created new message` logs
- [ ] Final transcript > 0 messages
- [ ] Report page shows transcript
- [ ] Feedback generation works

