# VISUAL COMPARISON

## Current Flow (BROKEN) ❌

```
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT MOUNT SEQUENCE (Race Condition)                   │
└─────────────────────────────────────────────────────────────┘

TIME LINE:
─────────────────────────────────────────────────────────────→

T0:  Component mounts
     │
     ├─ Start: useLiveAPI hook
     │
     └─ Call: connect(config)
        │
        └─ WebSocket opens
           │
           └─ onopen handler: sends setup message

           
T1:  ⚡ FIRST MESSAGE ARRIVES FROM API!
     │
     ├─ ws.onmessage fires
     │  │
     │  └─ Tries to: window.dispatchEvent('ai-transcript-fragment')
     │     │
     │     └─ ❌ Event fired but NO LISTENERS YET!
     │        └─ Message is LOST 💀
     │
     └─ (Event listeners not attached yet)

     
T2:  useEffect finally runs
     │
     └─ Attaches: window.addEventListener('ai-transcript-fragment')
        │
        └─ ✅ Listener ready NOW
           │
           └─ But no more messages coming...
              (API already sent first batch)

RESULT: Message Queue = [ ] (EMPTY) 🚫
        Final Transcript = 0 messages ❌
```

---

## Previous Flow (WORKING) ✅

```
┌─────────────────────────────────────────────────────────────┐
│ WEBSOCKET HANDLER SEQUENCE (No Race Condition)             │
└─────────────────────────────────────────────────────────────┘

TIME LINE:
─────────────────────────────────────────────────────────────→

T0:  Component mounts
     │
     ├─ Start: useLiveAPI hook
     │
     └─ Call: connect(config, onMessageReceived)
        │
        └─ WebSocket opens
           │
           └─ onopen handler: sends setup message

           
T1:  ⚡ FIRST MESSAGE ARRIVES FROM API!
     │
     ├─ ws.onmessage fires IMMEDIATELY
     │  │
     │  └─ Handler ALWAYS EXISTS (it's the WebSocket handler)
     │     │
     │     ├─ Call: onMessageReceived({ type: 'ai', text: '...' })
     │     │  │
     │     │  ├─ ✅ setMessages(prev => [..., {sender:'ai', text}])
     │     │  │  └─ State updated for UI
     │     │  │
     │     │  └─ ✅ ref.current.push('AI: ...')
     │     │     └─ History updated for final output
     │     │
     │     └─ Message CAPTURED on first try! 🎯
     │
     └─ (No events needed, no race conditions)

T2:  ⚡ MORE MESSAGES ARRIVE
     │
     └─ Same handler processes them
        │
        └─ Both state and ref updated EVERY TIME ✅

RESULT: Messages captured = [ 'AI: ...', 'User: ...', 'AI: ...' ] ✅
        Final Transcript = 3+ messages ✅
```

---

## Event-Based vs Callback-Based Architecture

```
CURRENT ARCHITECTURE (Event-Based) - BROKEN
┌─────────────────────────────────┐
│      WebSocket onmessage        │
│  (Handler exists immediately)   │
└──────────────┬──────────────────┘
               │
               ├─→ Dispatch Event
               │   ❌ Event listeners not ready yet!
               │
               └─→ Queue Message
                   └─ ❌ Unnecessary workaround

                   ⏳ Later...
                   
┌─────────────────────────────────┐
│    Component useEffect          │
│  (Runs after mount)             │
└──────────────┬──────────────────┘
               │
               ├─→ Attach Event Listener
               │   ✅ But events already fired
               │
               └─→ Call flushMessageQueue
                   └─ ✅ Partially works (if queue exists)

PROBLEM: Race condition between dispatch and listener attachment


PREVIOUS ARCHITECTURE (Callback-Based) - WORKING
┌─────────────────────────────────┐
│      WebSocket onmessage        │
│  (Handler exists immediately)   │
└──────────────┬──────────────────┘
               │
               ├─→ Call onMessageReceived()
               │   ✅ Callback always exists!
               │
               ├─→ setMessages(prev => [...])
               │   ✅ State updated IMMEDIATELY
               │
               └─→ ref.current.push(...)
                   ✅ History updated IMMEDIATELY

NO race condition, NO events, NO queue, NO workarounds!
```

---

## Message Flow Diagram

```
BROKEN FLOW (Current):
Message arrives → Dispatch Event → [RACE CONDITION] → Listener not ready → Message lost ❌
                  (Event has no listeners)


WORKING FLOW (Previous):
Message arrives → Call Callback → Update State → Update Ref → Done ✅
                  (All in same handler)
```

---

## State of Transcript at End of Interview

```
CURRENT CODE (Event-Based):
┌──────────────────────────────┐
│  Interview ends after 5 min  │
│  ├─ Messages array: []       │ ← EMPTY! 😱
│  ├─ Store transcript: null   │ ← EMPTY!
│  └─ Feedback input: []       │ ← Can't generate!
└──────────────────────────────┘
→ Feedback generation FAILS with "insufficient data"


PREVIOUS CODE (Callback-Based):
┌──────────────────────────────┐
│  Interview ends after 5 min  │
│  ├─ Messages array: [20]     │ ← HAS DATA! ✅
│  ├─ Store transcript: full   │ ← HAS DATA! ✅
│  └─ Feedback input: [20]     │ ← CAN GENERATE!
└──────────────────────────────┘
→ Feedback generation WORKS perfectly
```

