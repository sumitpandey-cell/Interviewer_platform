/**
 * Performance Tracker
 * 
 * Analyzes candidate responses and tracks performance metrics in real-time
 * to enable dynamic difficulty adjustment during interviews.
 */

export interface PerformanceMetrics {
    questionIndex: number;
    questionText: string;
    responseQualityScore: number; // 0-100
    responseTimeSeconds: number;
    difficultyLevel: DifficultyLevel;
    hintsUsed: number;
    struggleIndicators: StruggleIndicators;
    timestamp: string;
}

export interface StruggleIndicators {
    longPauses: number; // Number of pauses > 5 seconds
    clarificationRequests: number;
    incompleteAnswers: number;
    uncertaintyPhrases: number; // "I'm not sure", "Maybe", etc.
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface PerformanceAnalysis {
    currentScore: number; // 0-100, rolling average
    trend: 'improving' | 'stable' | 'declining';
    recommendedDifficulty: DifficultyLevel;
    shouldProvideHint: boolean;
    performanceHistory: PerformanceMetrics[];
}

/**
 * Analyzes response quality using AI evaluation
 * Falls back to heuristics if AI is unavailable
 */
export async function analyzeResponseQuality(
    response: string,
    questionText: string,
    questionType: string,
    expectedKeywords?: string[]
): Promise<number> {
    try {
        // Use AI evaluator for accurate scoring
        const { evaluateResponseQuality } = await import('./ai-response-evaluator');
        const evaluation = await evaluateResponseQuality(
            questionText,
            response,
            questionType
        );

        console.log(`🤖 AI Evaluation: ${evaluation.score}/100 (Tech: ${evaluation.technicalAccuracy}, Clarity: ${evaluation.clarity}, Complete: ${evaluation.completeness})`);

        return evaluation.score;
    } catch (error) {
        console.warn('⚠️ AI evaluation failed, using fallback heuristics:', error);
        return analyzeResponseQualityHeuristic(response, questionType, expectedKeywords);
    }
}

/**
 * Fallback heuristic analysis (original implementation)
 */
function analyzeResponseQualityHeuristic(
    response: string,
    questionType: string,
    expectedKeywords?: string[]
): number {
    let score = 50; // Base score

    // Length analysis (reasonable responses are typically detailed)
    const wordCount = response.trim().split(/\s+/).length;
    if (wordCount > 100) score += 15;
    else if (wordCount > 50) score += 10;
    else if (wordCount > 20) score += 5;
    else if (wordCount < 10) score -= 20;

    // Keyword matching (if provided)
    if (expectedKeywords && expectedKeywords.length > 0) {
        const lowerResponse = response.toLowerCase();
        const matchedKeywords = expectedKeywords.filter(keyword =>
            lowerResponse.includes(keyword.toLowerCase())
        );
        const keywordScore = (matchedKeywords.length / expectedKeywords.length) * 20;
        score += keywordScore;
    }

    // Technical depth indicators
    const technicalIndicators = [
        'algorithm', 'complexity', 'optimization', 'edge case',
        'time complexity', 'space complexity', 'trade-off', 'scalability',
        'performance', 'efficient', 'data structure'
    ];
    const technicalMatches = technicalIndicators.filter(indicator =>
        response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(technicalMatches * 3, 15);

    // Code quality indicators (for coding questions)
    if (questionType === 'Coding') {
        if (response.includes('```')) score += 10; // Code blocks
        if (/function|const|let|var|def|class/.test(response)) score += 5;
    }

    // Uncertainty indicators (negative)
    const uncertaintyPhrases = [
        "i'm not sure", "i don't know", "maybe", "i think",
        "probably", "i guess", "not certain"
    ];
    const uncertaintyCount = uncertaintyPhrases.filter(phrase =>
        response.toLowerCase().includes(phrase)
    ).length;
    score -= uncertaintyCount * 5;

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
}

/**
 * Detects struggle indicators in candidate responses
 */
export function detectStruggleIndicators(
    response: string,
    responseTime: number
): StruggleIndicators {
    const lowerResponse = response.toLowerCase();

    // Count uncertainty phrases
    const uncertaintyPhrases = [
        "i'm not sure", "i don't know", "maybe", "i think",
        "probably", "i guess", "not certain", "i'm confused"
    ];
    const uncertaintyCount = uncertaintyPhrases.filter(phrase =>
        lowerResponse.includes(phrase)
    ).length;

    // Count clarification requests
    const clarificationPhrases = [
        "can you repeat", "what do you mean", "could you clarify",
        "i don't understand", "can you explain"
    ];
    const clarificationCount = clarificationPhrases.filter(phrase =>
        lowerResponse.includes(phrase)
    ).length;

    // Detect incomplete answers (very short responses)
    const wordCount = response.trim().split(/\s+/).length;
    const incompleteAnswers = wordCount < 15 ? 1 : 0;

    // Detect long pauses (response time > 30 seconds indicates thinking/struggling)
    const longPauses = responseTime > 30 ? 1 : 0;

    return {
        longPauses,
        clarificationRequests: clarificationCount,
        incompleteAnswers,
        uncertaintyPhrases: uncertaintyCount
    };
}

/**
 * Calculates overall performance score from metrics
 */
export function calculatePerformanceScore(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 50; // Default neutral score

    // Use weighted average with more weight on recent performance
    const weights = metrics.map((_, index) => {
        // More recent questions have higher weight
        return 1 + (index / metrics.length);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = metrics.reduce((sum, metric, index) => {
        return sum + (metric.responseQualityScore * weights[index]);
    }, 0);

    return Math.round(weightedSum / totalWeight);
}

/**
 * Determines performance trend
 */
export function determinePerformanceTrend(
    metrics: PerformanceMetrics[]
): 'improving' | 'stable' | 'declining' {
    if (metrics.length < 3) return 'stable';

    // Compare recent 3 questions with previous 3
    const recentMetrics = metrics.slice(-3);
    const previousMetrics = metrics.slice(-6, -3);

    if (previousMetrics.length === 0) return 'stable';

    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.responseQualityScore, 0) / recentMetrics.length;
    const previousAvg = previousMetrics.reduce((sum, m) => sum + m.responseQualityScore, 0) / previousMetrics.length;

    const difference = recentAvg - previousAvg;

    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
}

/**
 * Maps difficulty level to numeric score
 */
export function difficultyToScore(level: DifficultyLevel): number {
    const mapping = {
        easy: 25,
        medium: 50,
        hard: 75,
        expert: 90
    };
    return mapping[level];
}

/**
 * Maps numeric score to difficulty level
 */
export function scoreToDifficulty(score: number): DifficultyLevel {
    if (score >= 75) return 'expert';
    if (score >= 50) return 'hard';
    if (score >= 25) return 'medium';
    return 'easy';
}

/**
 * Recommends next difficulty level based on current performance
 */
export function recommendDifficulty(
    currentScore: number,
    currentDifficulty: DifficultyLevel,
    trend: 'improving' | 'stable' | 'declining'
): DifficultyLevel {
    const currentDiffScore = difficultyToScore(currentDifficulty);

    // High performance - increase difficulty
    if (currentScore > 75) {
        if (currentDifficulty === 'easy') return 'medium';
        if (currentDifficulty === 'medium') return 'hard';
        if (currentDifficulty === 'hard') return 'expert';
        return 'expert';
    }

    // Low performance - decrease difficulty
    if (currentScore < 50) {
        if (currentDifficulty === 'expert') return 'hard';
        if (currentDifficulty === 'hard') return 'medium';
        if (currentDifficulty === 'medium') return 'easy';
        return 'easy';
    }

    // Average performance - adjust based on trend
    if (trend === 'improving' && currentScore > 60) {
        // Gradually increase
        if (currentDifficulty === 'easy') return 'medium';
        if (currentDifficulty === 'medium') return 'hard';
    } else if (trend === 'declining' && currentScore < 60) {
        // Gradually decrease
        if (currentDifficulty === 'hard') return 'medium';
        if (currentDifficulty === 'medium') return 'easy';
    }

    // Maintain current difficulty
    return currentDifficulty;
}

/**
 * Determines if a hint should be provided
 */
export function shouldProvideHint(
    currentScore: number,
    struggleIndicators: StruggleIndicators,
    hintsUsedInQuestion: number,
    totalHintsUsed: number
): boolean {
    // Don't provide hints if already used too many
    if (hintsUsedInQuestion >= 3) return false;
    if (totalHintsUsed >= 10) return false;

    // Provide hint if struggling significantly
    const struggleScore =
        struggleIndicators.longPauses * 2 +
        struggleIndicators.clarificationRequests * 3 +
        struggleIndicators.incompleteAnswers * 2 +
        struggleIndicators.uncertaintyPhrases * 1;

    // High struggle score or low performance indicates need for hint
    return struggleScore >= 4 || currentScore < 40;
}

/**
 * Main performance analysis function
 */
export function analyzePerformance(
    performanceHistory: PerformanceMetrics[]
): PerformanceAnalysis {
    const currentScore = calculatePerformanceScore(performanceHistory);
    const trend = determinePerformanceTrend(performanceHistory);

    const currentDifficulty = performanceHistory.length > 0
        ? performanceHistory[performanceHistory.length - 1].difficultyLevel
        : 'medium';

    const recommendedDifficulty = recommendDifficulty(currentScore, currentDifficulty, trend);

    const latestMetrics = performanceHistory[performanceHistory.length - 1];
    const totalHintsUsed = performanceHistory.reduce((sum, m) => sum + m.hintsUsed, 0);

    const shouldHint = latestMetrics
        ? shouldProvideHint(
            currentScore,
            latestMetrics.struggleIndicators,
            latestMetrics.hintsUsed,
            totalHintsUsed
        )
        : false;

    return {
        currentScore,
        trend,
        recommendedDifficulty,
        shouldProvideHint: shouldHint,
        performanceHistory
    };
}
