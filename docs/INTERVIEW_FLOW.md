# Interview Flow - Complete Guide

## Overview

This document explains how an interview works from start to finish, including all the technical details behind each step.

---

## Interview Lifecycle

```
┌──────────────┐
│ 1. Setup     │ User configures interview
└──────┬───────┘
       │
┌──────▼───────┐
│ 2. Start     │ Initialize AI connection
└──────┬───────┘
       │
┌──────▼───────┐
│ 3. Question  │ AI asks question
└──────┬───────┘
       │
┌──────▼───────┐
│ 4. Response  │ User answers
└──────┬───────┘
       │
┌──────▼───────┐
│ 5. Evaluate  │ AI scores answer
└──────┬───────┘
       │
┌──────▼───────┐
│ 6. Adjust    │ Update difficulty
└──────┬───────┘
       │
       ├─── Repeat steps 3-6 ───┐
       │                         │
┌──────▼───────┐                │
│ 7. End       │ ◄──────────────┘
└──────┬───────┘
       │
┌──────▼───────┐
│ 8. Feedback  │ Generate report
└──────────────┘
```

---

## Step 1: Interview Setup

### What Happens
User selects interview parameters on the dashboard.

### User Actions
1. Choose interview type (Technical, Behavioral, Coding, Company-specific)
2. Select position (Frontend, Backend, Full Stack, etc.)
3. Click "Start Interview" button

### Technical Implementation

**File**: `src/pages/Dashboard.tsx`

```typescript
const handleStartInterview = async (type: string, position: string) => {
  // 1. Create interview session in database
  const { data: session } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      interview_type: type,
      position: position,
      status: 'in_progress',
      config: { /* interview settings */ }
    })
    .select()
    .single();

  // 2. Navigate to interview room
  navigate(`/interview/${session.id}/active`);
};
```

**Database Table**: `interview_sessions`
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  interview_type TEXT,
  position TEXT,
  status TEXT,
  config JSONB,
  created_at TIMESTAMP
);
```

---

## Step 2: Interview Start

### What Happens
- Interview room loads
- AI connection established
- System prompt loaded
- Recording starts

### Technical Implementation

**File**: `src/pages/InterviewRoom.tsx`

```typescript
useEffect(() => {
  // 1. Load system prompt based on interview type
  const systemPrompt = loadSystemPrompt(interviewType, position);
  
  // 2. Initialize Live API connection
  connect({
    systemInstruction: systemPrompt,
    voice: 'Puck', // AI voice
    generationConfig: {
      temperature: 0.8,
      responseModalities: 'audio'
    }
  });
  
  // 3. Start recording
  startRecording();
  
  // 4. Initialize performance tracking
  resetPerformance();
}, []);
```

**Hook**: `src/hooks/use-live-api.ts`

```typescript
export function useLiveAPI() {
  const connect = async (config) => {
    // Create WebSocket connection to Gemini Live API
    const ws = new WebSocket(GEMINI_LIVE_URL);
    
    // Set up audio streaming
    setupAudioStream(ws);
    
    // Handle incoming messages
    ws.onmessage = handleMessage;
  };
  
  return { connect, disconnect, sendMessage };
}
```

---

## Step 3: AI Asks Question

### What Happens
- AI generates contextual question
- Question spoken via text-to-speech
- Displayed in transcript
- Timer starts

### Technical Flow

```
AI Brain (Gemini)
    ↓
Generate question based on:
  - Interview type
  - Position requirements
  - Previous responses
  - Current difficulty level
    ↓
Send to Live API
    ↓
Convert to speech
    ↓
Play audio + Show text
```

### Code Implementation

**File**: `src/pages/InterviewRoom.tsx`

```typescript
const handleTranscriptFragment = (sender: 'ai' | 'user', text: string) => {
  // Track AI questions
  if (sender === 'ai' && text.includes('?')) {
    // New question detected
    currentQuestionTextRef.current = text;
    questionStartTimeRef.current = Date.now();
    
    console.log('📝 AI Question:', text);
    
    // Reset user response accumulator
    currentUserResponseRef.current = '';
  }
  
  // Add to transcript
  addMessage({ sender, text });
};
```

**System Prompt** (controls AI behavior):

```text
You are a professional technical interviewer for a {position} role.

INTERVIEW STYLE:
- Ask one question at a time
- Wait for complete answers
- Ask follow-up questions for clarity
- Adapt difficulty based on responses

QUESTION TYPES:
- Technical concepts
- Problem-solving scenarios
- Past experience
- Code challenges

DIFFICULTY LEVELS:
- Easy: Basic concepts
- Medium: Practical application
- Hard: Complex scenarios
- Expert: Advanced optimization
```

---

## Step 4: User Response

### What Happens
- User speaks answer
- Speech converted to text
- Text accumulated until complete
- Displayed in transcript

### Technical Flow

```
User speaks
    ↓
Microphone captures audio
    ↓
Live API (Speech-to-Text)
    ↓
Text fragments received
    ↓
Accumulate fragments
    ↓
Display in real-time
```

### Code Implementation

```typescript
const handleTranscriptFragment = (sender: 'ai' | 'user', text: string) => {
  if (sender === 'user') {
    // First fragment - start timer
    if (!currentUserResponseRef.current) {
      lastUserMessageTimeRef.current = Date.now();
    }
    
    // Accumulate response
    currentUserResponseRef.current += (currentUserResponseRef.current ? ' ' : '') + text;
    
    console.log('👤 User response:', currentUserResponseRef.current);
  }
};
```

**Why Accumulation?**
- Live API sends speech in fragments (word by word)
- We need the complete response for evaluation
- Accumulation ensures we analyze the full answer

---

## Step 5: Response Evaluation

### What Happens
- AI evaluates answer quality
- Performance metrics calculated
- Score assigned (0-100)
- Struggle indicators detected

### Evaluation Process

```
Complete Response
    ↓
AI Evaluator (evaluateResponseQuality)
    ↓
Analyzes:
  ✓ Technical Accuracy (50%)
  ✓ Clarity (25%)
  ✓ Completeness (25%)
    ↓
Returns:
  - Overall Score: 78/100
  - Key Points Covered: [...]
  - Missing Points: [...]
  - Reasoning: "..."
```

### Code Implementation

**File**: `src/lib/ai-response-evaluator.ts`

```typescript
export async function evaluateResponseQuality(
  question: string,
  response: string,
  questionType: string
): Promise<ResponseEvaluation> {
  // Send to Gemini for evaluation
  const prompt = `
    Evaluate this interview response:
    
    QUESTION: ${question}
    RESPONSE: ${response}
    
    Rate on:
    1. Technical Accuracy (0-100)
    2. Clarity (0-100)
    3. Completeness (0-100)
    
    Return JSON with scores and reasoning.
  `;
  
  const evaluation = await callGeminiAPI(prompt);
  
  // Calculate weighted score
  const score = Math.round(
    evaluation.technicalAccuracy * 0.5 +
    evaluation.clarity * 0.25 +
    evaluation.completeness * 0.25
  );
  
  return { score, ...evaluation };
}
```

**Fallback** (if AI fails):

```typescript
function fallbackEvaluation(response: string): number {
  let score = 50;
  
  // Length check
  const wordCount = response.split(/\s+/).length;
  if (wordCount > 100) score += 15;
  else if (wordCount < 10) score -= 20;
  
  // Technical keywords
  const keywords = ['algorithm', 'complexity', 'optimization'];
  const matches = keywords.filter(k => response.includes(k)).length;
  score += matches * 5;
  
  // Uncertainty phrases (negative)
  if (response.includes("I'm not sure")) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
```

---

## Step 6: Difficulty Adjustment

### What Happens
- Performance analyzed
- Difficulty level adjusted
- Next question complexity updated

### Adjustment Logic

```
Current Score > 75?
  ├─ Yes → Increase difficulty
  │         (Easy → Medium → Hard → Expert)
  │
  └─ No → Current Score < 50?
          ├─ Yes → Decrease difficulty
          │
          └─ No → Maintain current level
```

### Code Implementation

**File**: `src/lib/difficulty-adjuster.ts`

```typescript
export function shouldAdjustDifficulty(
  performance: PerformanceAnalysis,
  currentDifficulty: DifficultyLevel,
  questionsAtLevel: number
): AdjustmentDecision {
  const { currentScore, trend } = performance;
  
  // Need at least 2-3 questions before adjusting
  if (questionsAtLevel < 2) {
    return { shouldAdjust: false };
  }
  
  // High performance - increase difficulty
  if (currentScore > 75) {
    const newDifficulty = increaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: 'Strong performance - increasing challenge'
    };
  }
  
  // Low performance - decrease difficulty
  if (currentScore < 50) {
    const newDifficulty = decreaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: 'Struggling - reducing difficulty'
    };
  }
  
  // Stable performance
  return { shouldAdjust: false };
}
```

**Difficulty Levels**:
- **Easy**: Basic concepts, definitions
- **Medium**: Practical application, common scenarios
- **Hard**: Complex problems, edge cases
- **Expert**: System design, optimization, trade-offs

---

## Step 7: Interview End

### What Happens
- User clicks "End Interview"
- Final question recorded
- Data saved to database
- Navigate to results

### Code Implementation

```typescript
const handleEndCall = async () => {
  // 1. Record final question (if exists)
  if (currentUserResponseRef.current && currentQuestionTextRef.current) {
    const responseTime = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    
    await recordResponse(
      currentQuestionIndex,
      currentQuestionTextRef.current,
      currentUserResponseRef.current,
      responseTime,
      'General'
    );
  }
  
  // 2. Stop recording and disconnect
  await stopRecording();
  disconnect();
  
  // 3. Calculate duration
  const durationMinutes = Math.floor(elapsedTime / 60);
  
  // 4. Save to database
  await saveInterviewData(sessionId, {
    status: 'completed',
    duration_minutes: durationMinutes,
    performance_metrics: performanceHistory,
    transcript: messages
  });
  
  // 5. Navigate to report
  navigate(`/interview/${sessionId}/report`);
};
```

---

## Step 8: Feedback Generation

### What Happens
- Transcript analyzed by AI
- Performance metrics processed
- Detailed feedback generated
- Report displayed

### Feedback Generation Process

```
Input:
  - Full transcript
  - Performance metrics (scores, times, difficulty)
  - Struggle indicators
    ↓
AI Analysis (Gemini)
    ↓
Generates:
  - Executive Summary
  - Strengths (3-5 points)
  - Improvements (3-5 points)
  - Skill Scores (Technical, Communication, etc.)
  - Action Plan (3-5 steps)
    ↓
Validation (Zod schema)
    ↓
Save to Database
    ↓
Display Report
```

### Code Implementation

**File**: `src/lib/gemini-feedback.ts`

```typescript
export async function generateFeedback(
  transcript: Message[],
  position: string,
  interviewType: string,
  performanceData?: PerformanceData
): Promise<FeedbackData> {
  // Build context
  const performanceContext = `
    PERFORMANCE METRICS:
    - Overall Score: ${performanceData.currentScore}/100
    - Trend: ${performanceData.trend}
    - Difficulty: ${performanceData.difficultyProgression.join(' → ')}
    
    QUESTION-BY-QUESTION:
    ${performanceData.detailedMetrics.map((m, i) => `
      Q${i + 1}: ${m.questionText}
      Score: ${m.responseQualityScore}/100
      Time: ${m.responseTimeSeconds}s
      Struggles: ${JSON.stringify(m.struggleIndicators)}
    `).join('\n')}
  `;
  
  // Generate feedback
  const prompt = `
    Analyze this ${position} interview.
    
    TRANSCRIPT:
    ${transcript.map(m => `${m.sender}: ${m.text}`).join('\n')}
    
    ${performanceContext}
    
    Provide detailed feedback in JSON format:
    {
      "executiveSummary": "...",
      "strengths": ["...", "..."],
      "improvements": ["...", "..."],
      "skills": [
        { "name": "Technical Knowledge", "score": 0-100, "feedback": "..." }
      ],
      "actionPlan": ["...", "..."]
    }
  `;
  
  const feedback = await callGeminiAPI(prompt);
  
  // Validate
  const validated = validateFeedback(feedback);
  
  return validated;
}
```

---

## Performance Tracking Details

### Metrics Collected Per Question

```typescript
interface PerformanceMetrics {
  questionIndex: number;
  questionText: string;
  responseQualityScore: number;  // 0-100
  responseTimeSeconds: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  hintsUsed: number;
  struggleIndicators: {
    longPauses: number;          // Pauses > 5 seconds
    clarificationRequests: number;
    incompleteAnswers: number;
    uncertaintyPhrases: number;  // "I'm not sure", etc.
  };
  timestamp: string;
}
```

### Overall Performance Analysis

```typescript
interface PerformanceAnalysis {
  currentScore: number;          // Weighted average
  trend: 'improving' | 'stable' | 'declining';
  recommendedDifficulty: DifficultyLevel;
  shouldProvideHint: boolean;
}
```

---

## State Management During Interview

### Zustand Stores

**Interview Store** (`use-interview-store.ts`):
```typescript
{
  messages: Message[];           // Transcript
  feedback: FeedbackData | null;
  isSaving: boolean;
  saveError: string | null;
}
```

**Performance Store** (`use-performance-store.ts`):
```typescript
{
  performanceHistory: PerformanceMetrics[];
  currentDifficulty: DifficultyLevel;
  questionsAtCurrentDifficulty: number;
  totalHintsUsed: number;
  currentAnalysis: PerformanceAnalysis | null;
}
```

---

## Error Handling

### Connection Errors
```typescript
try {
  await connect();
} catch (error) {
  toast.error('Failed to connect to AI. Please check your internet.');
  navigate('/dashboard');
}
```

### Evaluation Errors
```typescript
try {
  const score = await evaluateResponseQuality(...);
} catch (error) {
  // Fallback to heuristic scoring
  const score = fallbackEvaluation(response);
}
```

### Database Errors
```typescript
try {
  await saveToDatabase(data);
} catch (error) {
  // Retry with exponential backoff
  await retryWithBackoff(() => saveToDatabase(data), 3);
}
```

---

## Next Steps

- Read [PERFORMANCE_TRACKING.md](./PERFORMANCE_TRACKING.md) for detailed scoring
- Read [FEEDBACK_SYSTEM.md](./FEEDBACK_SYSTEM.md) for AI feedback details
- Read [CODING_CHALLENGES.md](./CODING_CHALLENGES.md) for code editor flow
