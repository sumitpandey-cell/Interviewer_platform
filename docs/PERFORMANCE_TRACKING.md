# Performance Tracking System

## Overview

The performance tracking system monitors candidate responses in real-time, calculates quality scores, detects struggle indicators, and adjusts interview difficulty dynamically.

---

## Architecture

```
User Response
    ↓
┌─────────────────────────────────┐
│   Response Accumulation         │
│   (Collect complete answer)     │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   AI Evaluation                 │
│   (Score: 0-100)                │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Struggle Detection            │
│   (Pauses, uncertainty, etc.)   │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Performance Metrics           │
│   (Store in Zustand)            │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Performance Analysis          │
│   (Calculate trends, scores)    │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Difficulty Adjustment         │
│   (Update question complexity)  │
└─────────────────────────────────┘
```

---

## Components

### 1. Response Evaluation

**File**: `src/lib/ai-response-evaluator.ts`

#### AI-Based Evaluation (Primary)

```typescript
export async function evaluateResponseQuality(
  question: string,
  response: string,
  questionType: string
): Promise<ResponseEvaluation> {
  const prompt = `
    Evaluate this interview response:
    
    QUESTION: ${question}
    RESPONSE: ${response}
    
    Rate on:
    1. Technical Accuracy (0-100): Is the answer correct?
    2. Clarity (0-100): Is it well-explained?
    3. Completeness (0-100): Does it cover all aspects?
    
    Return JSON:
    {
      "technicalAccuracy": <score>,
      "clarity": <score>,
      "completeness": <score>,
      "keyPointsCovered": ["point1", "point2"],
      "missingPoints": ["missing1"],
      "reasoning": "Brief explanation"
    }
  `;
  
  const evaluation = await callGeminiAPI(prompt);
  
  // Calculate weighted overall score
  const score = Math.round(
    evaluation.technicalAccuracy * 0.5 +  // 50% weight
    evaluation.clarity * 0.25 +            // 25% weight
    evaluation.completeness * 0.25         // 25% weight
  );
  
  return {
    score,
    reasoning: evaluation.reasoning,
    keyPointsCovered: evaluation.keyPointsCovered,
    missingPoints: evaluation.missingPoints,
    technicalAccuracy: evaluation.technicalAccuracy,
    clarity: evaluation.clarity,
    completeness: evaluation.completeness
  };
}
```

**Why Weighted?**
- Technical accuracy is most important (50%)
- Clarity and completeness matter but less (25% each)
- Ensures correct answers score higher than verbose wrong answers

#### Fallback Heuristic Evaluation

```typescript
function fallbackEvaluation(response: string, questionType: string): ResponseEvaluation {
  let score = 50; // Base score
  
  // 1. Length Analysis
  const wordCount = response.trim().split(/\s+/).length;
  if (wordCount > 100) score += 15;
  else if (wordCount > 50) score += 10;
  else if (wordCount > 20) score += 5;
  else if (wordCount < 10) score -= 20;
  
  // 2. Technical Indicators (positive)
  const technicalTerms = [
    'algorithm', 'complexity', 'optimization', 'edge case',
    'time complexity', 'space complexity', 'trade-off', 'scalability'
  ];
  const matches = technicalTerms.filter(term => 
    response.toLowerCase().includes(term)
  ).length;
  score += Math.min(matches * 3, 15);
  
  // 3. Code Quality (for coding questions)
  if (questionType === 'Coding') {
    if (response.includes('```')) score += 10;
    if (/function|const|let|var|def|class/.test(response)) score += 5;
  }
  
  // 4. Uncertainty Indicators (negative)
  const uncertaintyPhrases = [
    "i'm not sure", "i don't know", "maybe", "probably", "i guess"
  ];
  const uncertaintyCount = uncertaintyPhrases.filter(phrase =>
    response.toLowerCase().includes(phrase)
  ).length;
  score -= uncertaintyCount * 5;
  
  // Ensure bounds
  return {
    score: Math.max(0, Math.min(100, score)),
    reasoning: 'Fallback heuristic evaluation',
    keyPointsCovered: [],
    missingPoints: [],
    technicalAccuracy: score,
    clarity: score,
    completeness: score
  };
}
```

---

### 2. Struggle Detection

**File**: `src/lib/performance-tracker.ts`

```typescript
export function detectStruggleIndicators(
  response: string,
  responseTime: number
): StruggleIndicators {
  const lowerResponse = response.toLowerCase();
  
  // 1. Count uncertainty phrases
  const uncertaintyPhrases = [
    "i'm not sure", "i don't know", "maybe", "i think",
    "probably", "i guess", "not certain", "i'm confused"
  ];
  const uncertaintyCount = uncertaintyPhrases.filter(phrase =>
    lowerResponse.includes(phrase)
  ).length;
  
  // 2. Count clarification requests
  const clarificationPhrases = [
    "can you repeat", "what do you mean", "could you clarify",
    "i don't understand", "can you explain"
  ];
  const clarificationCount = clarificationPhrases.filter(phrase =>
    lowerResponse.includes(phrase)
  ).length;
  
  // 3. Detect incomplete answers (very short)
  const wordCount = response.trim().split(/\s+/).length;
  const incompleteAnswers = wordCount < 15 ? 1 : 0;
  
  // 4. Detect long pauses (response time > 30 seconds)
  const longPauses = responseTime > 30 ? 1 : 0;
  
  return {
    longPauses,
    clarificationRequests: clarificationCount,
    incompleteAnswers,
    uncertaintyPhrases: uncertaintyCount
  };
}
```

**Struggle Indicators Explained**:

| Indicator | What It Means | Impact |
|-----------|---------------|--------|
| Long Pauses | Took >30s to respond | Suggests difficulty formulating answer |
| Clarification Requests | Asked for question to be repeated | Didn't understand question |
| Incomplete Answers | Response <15 words | Gave up or didn't know |
| Uncertainty Phrases | "I'm not sure", "maybe" | Lacks confidence/knowledge |

---

### 3. Performance Metrics Storage

**File**: `src/stores/use-performance-store.ts`

```typescript
interface PerformanceMetrics {
  questionIndex: number;
  questionText: string;
  responseQualityScore: number;  // 0-100
  responseTimeSeconds: number;
  difficultyLevel: DifficultyLevel;
  hintsUsed: number;
  struggleIndicators: StruggleIndicators;
  timestamp: string;
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  performanceHistory: [],
  currentDifficulty: 'medium',
  questionsAtCurrentDifficulty: 0,
  totalHintsUsed: 0,
  currentAnalysis: null,
  
  recordResponse: async (
    questionIndex,
    questionText,
    responseText,
    responseTimeSeconds,
    questionType
  ) => {
    // 1. Evaluate response quality using AI
    const responseQualityScore = await analyzeResponseQuality(
      responseText,
      questionText,
      questionType
    );
    
    // 2. Detect struggle indicators
    const struggleIndicators = detectStruggleIndicators(
      responseText,
      responseTimeSeconds
    );
    
    // 3. Create metric
    const metric: PerformanceMetrics = {
      questionIndex,
      questionText,
      responseQualityScore,
      responseTimeSeconds,
      difficultyLevel: get().currentDifficulty,
      hintsUsed: 0,
      struggleIndicators,
      timestamp: new Date().toISOString()
    };
    
    // 4. Update history
    const newHistory = [...get().performanceHistory, metric];
    
    // 5. Analyze overall performance
    const analysis = analyzePerformance(newHistory);
    
    // 6. Update store
    set({
      performanceHistory: newHistory,
      currentAnalysis: analysis
    });
  }
}));
```

---

### 4. Performance Analysis

**File**: `src/lib/performance-tracker.ts`

#### Calculate Overall Score

```typescript
export function calculatePerformanceScore(metrics: PerformanceMetrics[]): number {
  if (metrics.length === 0) return 50;
  
  // Use weighted average - recent questions weighted higher
  const weights = metrics.map((_, index) => {
    return 1 + (index / metrics.length); // Linear increase
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = metrics.reduce((sum, metric, index) => {
    return sum + (metric.responseQualityScore * weights[index]);
  }, 0);
  
  return Math.round(weightedSum / totalWeight);
}
```

**Example**:
```
Question 1: Score 60, Weight 1.0  → 60 * 1.0 = 60
Question 2: Score 70, Weight 1.33 → 70 * 1.33 = 93
Question 3: Score 80, Weight 1.67 → 80 * 1.67 = 133
Question 4: Score 90, Weight 2.0  → 90 * 2.0 = 180

Total Weight: 1.0 + 1.33 + 1.67 + 2.0 = 6.0
Weighted Sum: 60 + 93 + 133 + 180 = 466
Overall Score: 466 / 6.0 = 78
```

#### Determine Performance Trend

```typescript
export function determinePerformanceTrend(
  metrics: PerformanceMetrics[]
): 'improving' | 'stable' | 'declining' {
  if (metrics.length < 3) return 'stable';
  
  // Compare recent 3 vs previous 3
  const recentMetrics = metrics.slice(-3);
  const previousMetrics = metrics.slice(-6, -3);
  
  if (previousMetrics.length === 0) return 'stable';
  
  const recentAvg = recentMetrics.reduce((sum, m) => 
    sum + m.responseQualityScore, 0
  ) / recentMetrics.length;
  
  const previousAvg = previousMetrics.reduce((sum, m) => 
    sum + m.responseQualityScore, 0
  ) / previousMetrics.length;
  
  const difference = recentAvg - previousAvg;
  
  if (difference > 10) return 'improving';
  if (difference < -10) return 'declining';
  return 'stable';
}
```

---

### 5. Difficulty Adjustment

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
    return { 
      shouldAdjust: false,
      reason: 'Not enough questions at current level'
    };
  }
  
  // High performance - increase difficulty
  if (currentScore > 75) {
    if (currentDifficulty === 'expert') {
      return { shouldAdjust: false, reason: 'Already at max difficulty' };
    }
    
    const newDifficulty = increaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: `Strong performance (${currentScore}/100) - increasing challenge`,
      suggestions: [
        'Ask more complex scenarios',
        'Require deeper technical knowledge',
        'Introduce edge cases'
      ]
    };
  }
  
  // Low performance - decrease difficulty
  if (currentScore < 50) {
    if (currentDifficulty === 'easy') {
      return { shouldAdjust: false, reason: 'Already at min difficulty' };
    }
    
    const newDifficulty = decreaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: `Struggling (${currentScore}/100) - reducing difficulty`,
      suggestions: [
        'Focus on fundamentals',
        'Ask more guided questions',
        'Provide hints if needed'
      ]
    };
  }
  
  // Average performance - check trend
  if (trend === 'improving' && currentScore > 60) {
    const newDifficulty = increaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: 'Improving trend - gradually increasing difficulty'
    };
  }
  
  if (trend === 'declining' && currentScore < 60) {
    const newDifficulty = decreaseDifficulty(currentDifficulty);
    return {
      shouldAdjust: true,
      newDifficulty,
      reason: 'Declining trend - reducing difficulty'
    };
  }
  
  return { 
    shouldAdjust: false,
    reason: 'Performance stable at appropriate level'
  };
}
```

**Difficulty Thresholds**:
- **Increase**: Score > 75 OR (Score > 60 AND improving)
- **Decrease**: Score < 50 OR (Score < 60 AND declining)
- **Maintain**: 50 ≤ Score ≤ 75 AND stable

---

## Database Persistence

### Performance Metrics Table

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id),
  question_index INTEGER,
  question_text TEXT,
  response_quality_score INTEGER,
  response_time_seconds INTEGER,
  difficulty_level TEXT,
  hints_used INTEGER,
  struggle_indicators JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Saving to Database

**File**: `src/pages/InterviewRoom.tsx`

```typescript
const handleEndCall = async () => {
  // ... (record final question)
  
  // Save performance metrics
  const metricsToSave = performanceHistory.map(metric => ({
    session_id: sessionId,
    question_index: metric.questionIndex,
    question_text: metric.questionText,
    response_quality_score: metric.responseQualityScore,
    response_time_seconds: metric.responseTimeSeconds,
    difficulty_level: metric.difficultyLevel,
    hints_used: metric.hintsUsed,
    struggle_indicators: metric.struggleIndicators
  }));
  
  await supabase
    .from('performance_metrics')
    .insert(metricsToSave);
  
  // Update session with summary
  await supabase
    .from('interview_sessions')
    .update({
      performance_summary: {
        average_score: performanceAnalysis.currentScore,
        total_hints_used: totalHintsUsed,
        difficulty_progression: performanceHistory.map(m => m.difficultyLevel)
      }
    })
    .eq('id', sessionId);
};
```

---

## Performance Visualization

### Real-Time Indicator

**Component**: `src/components/PerformanceIndicator.tsx`

```tsx
export function PerformanceIndicator() {
  const { currentAnalysis } = usePerformanceStore();
  
  if (!currentAnalysis) return null;
  
  const { currentScore, trend } = currentAnalysis;
  
  return (
    <div className="performance-indicator">
      <div className="score">
        <CircularProgress value={currentScore} />
        <span>{currentScore}/100</span>
      </div>
      
      <div className="trend">
        {trend === 'improving' && <TrendingUp className="text-green-500" />}
        {trend === 'declining' && <TrendingDown className="text-red-500" />}
        {trend === 'stable' && <Minus className="text-yellow-500" />}
        <span>{trend}</span>
      </div>
    </div>
  );
}
```

---

## Analytics Queries

### Get Average Scores by Difficulty

```typescript
const { data } = await supabase
  .from('performance_metrics')
  .select('difficulty_level, response_quality_score')
  .eq('session_id', sessionId);

const avgByDifficulty = data.reduce((acc, metric) => {
  if (!acc[metric.difficulty_level]) {
    acc[metric.difficulty_level] = { sum: 0, count: 0 };
  }
  acc[metric.difficulty_level].sum += metric.response_quality_score;
  acc[metric.difficulty_level].count += 1;
  return acc;
}, {});

// Calculate averages
Object.keys(avgByDifficulty).forEach(level => {
  avgByDifficulty[level].average = 
    avgByDifficulty[level].sum / avgByDifficulty[level].count;
});
```

---

## Best Practices

1. **Always use AI evaluation** - More accurate than heuristics
2. **Have fallback** - Heuristics when AI fails
3. **Weight recent performance** - More relevant than old data
4. **Require multiple questions** - Before adjusting difficulty
5. **Track struggle indicators** - Provides context beyond scores
6. **Save to database** - For analytics and historical tracking

---

## Next Steps

- Read [FEEDBACK_SYSTEM.md](./FEEDBACK_SYSTEM.md) for how metrics are used in feedback
- Read [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema
- Read [API_INTEGRATION.md](./API_INTEGRATION.md) for Gemini API details
