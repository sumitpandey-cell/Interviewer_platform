# Quick VAD Tuning Reference

## Current Settings (Optimized for Noise Reduction)
```typescript
// Location: /src/pages/InterviewRoom.tsx (line 551)
realtimeInputConfig: {
    automaticActivityDetection: {
        endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',    // Noise reduction ⭐
        startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',  // Clear speech required
        prefixPaddingMs: 300,                               // Audio buffer before speech
        silenceDurationMs: 1000                             // 1 sec pause = turn end
    }
}
```

---

## Quick Fixes

### 🔊 Too Much Background Noise Triggering AI?
```typescript
endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',    // ✅ Already set
startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',  // ✅ Already set
silenceDurationMs: 1200,                            // 👈 Increase this
```

### 🗣️ AI Interrupting Itself?
```typescript
silenceDurationMs: 1200,                            // 👈 Increase this
endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',    // ✅ Keep HIGH
```

### ✂️ Candidate Getting Cut Off?
```typescript
silenceDurationMs: 1200,                            // 👈 Increase this
endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',     // 👈 Change to LOW
```

### ⚡ Want Faster Interruptions (Barge-In)?
```typescript
startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH', // 👈 Change to HIGH
prefixPaddingMs: 200,                               // 👈 Reduce this
silenceDurationMs: 700,                             // 👈 Reduce this
```

### 🎯 First Words Getting Cut Off?
```typescript
prefixPaddingMs: 400,                               // 👈 Increase this
```

---

## Parameter Ranges

| Parameter | Min | Recommended | Max | Current |
|-----------|-----|-------------|-----|---------|
| `prefixPaddingMs` | 100 | 200-400 | 500 | **300** ✅ |
| `silenceDurationMs` | 500 | 800-1200 | 2000 | **1000** ✅ |

---

## Sensitivity Cheat Sheet

### endOfSpeechSensitivity
- **HIGH** ⭐ = Ends quickly, ignores background noise (CURRENT)
- **LOW** = Waits longer, captures all pauses

### startOfSpeechSensitivity  
- **LOW** ⭐ = Requires clear speech, reduces false positives (CURRENT)
- **HIGH** = Picks up subtle speech, more interruptions

---

## Common Scenarios

| Scenario | endOfSpeech | startOfSpeech | silenceDuration |
|----------|-------------|---------------|-----------------|
| **Noisy Environment** ⭐ | HIGH | LOW | 1000-1200 |
| **Quiet Office** | LOW | HIGH | 800-1000 |
| **Long Answers** | LOW | LOW | 1200-1500 |
| **Quick Back-and-Forth** | HIGH | HIGH | 700-900 |

⭐ = Current configuration

---

## Testing Checklist

- [ ] AI doesn't respond to background TV/music
- [ ] AI finishes speaking before listening
- [ ] Candidate can pause naturally without being cut off
- [ ] Candidate can interrupt AI when needed
- [ ] First words of sentences are captured
- [ ] No awkward long silences between turns

---

## Where to Edit

**File:** `/src/pages/InterviewRoom.tsx`  
**Line:** ~551  
**Function:** `initConnection()` inside `useEffect`

Look for:
```typescript
realtimeInputConfig: {
    automaticActivityDetection: {
        // Edit values here
    }
}
```

---

## Rollback to Defaults

If you want to revert to Google's defaults:
```typescript
realtimeInputConfig: {
    automaticActivityDetection: {
        // Remove all custom settings, API will use defaults
    }
}
```

Or minimal config:
```typescript
realtimeInputConfig: {
    automaticActivityDetection: {
        prefixPaddingMs: 200,
        silenceDurationMs: 700
    }
}
```
