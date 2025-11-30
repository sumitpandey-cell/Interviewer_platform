/**
 * Difficulty Adjuster
 * 
 * Manages dynamic difficulty adjustment and generates adaptive content
 * based on candidate performance.
 */

import { DifficultyLevel, PerformanceAnalysis } from './performance-tracker';
import { CompanyQuestion } from '@/types/company-types';

export interface DifficultyAdjustment {
    shouldAdjust: boolean;
    newDifficulty: DifficultyLevel;
    reason: string;
    suggestions: string[];
}

export interface AdaptiveHint {
    level: 'gentle' | 'conceptual' | 'structural';
    content: string;
}

/**
 * Determines if difficulty should be adjusted
 */
export function shouldAdjustDifficulty(
    performanceAnalysis: PerformanceAnalysis,
    currentDifficulty: DifficultyLevel,
    questionsAtCurrentDifficulty: number
): DifficultyAdjustment {
    const { currentScore, trend, recommendedDifficulty } = performanceAnalysis;

    // Need at least 2 questions at current difficulty before adjusting
    if (questionsAtCurrentDifficulty < 2) {
        return {
            shouldAdjust: false,
            newDifficulty: currentDifficulty,
            reason: 'Not enough questions at current difficulty level',
            suggestions: []
        };
    }

    // Check if recommended difficulty is different
    if (recommendedDifficulty === currentDifficulty) {
        return {
            shouldAdjust: false,
            newDifficulty: currentDifficulty,
            reason: 'Performance is appropriate for current difficulty',
            suggestions: []
        };
    }

    // Determine reason and suggestions
    let reason = '';
    const suggestions: string[] = [];

    if (currentScore > 75) {
        reason = 'Candidate is performing exceptionally well';
        suggestions.push('Increase question complexity');
        suggestions.push('Ask deeper follow-up questions');
        suggestions.push('Introduce edge cases and optimizations');
        suggestions.push('Explore advanced topics');
    } else if (currentScore < 50) {
        reason = 'Candidate is struggling with current difficulty';
        suggestions.push('Simplify questions');
        suggestions.push('Provide more guidance');
        suggestions.push('Offer hints proactively');
        suggestions.push('Break down complex problems');
    } else if (trend === 'improving') {
        reason = 'Candidate is showing improvement';
        suggestions.push('Gradually increase difficulty');
        suggestions.push('Challenge with slightly harder questions');
    } else if (trend === 'declining') {
        reason = 'Candidate performance is declining';
        suggestions.push('Reduce difficulty slightly');
        suggestions.push('Provide more support');
    }

    return {
        shouldAdjust: true,
        newDifficulty: recommendedDifficulty,
        reason,
        suggestions
    };
}

/**
 * Selects next question based on difficulty and performance
 */
export function selectNextQuestion(
    availableQuestions: CompanyQuestion[],
    targetDifficulty: DifficultyLevel,
    askedQuestionIds: string[]
): CompanyQuestion | null {
    // Filter out already asked questions
    const unaskedQuestions = availableQuestions.filter(
        q => !askedQuestionIds.includes(q.id)
    );

    if (unaskedQuestions.length === 0) return null;

    // Map difficulty level to difficulty range
    const difficultyRanges = {
        easy: { min: 0, max: 35 },
        medium: { min: 30, max: 60 },
        hard: { min: 55, max: 85 },
        expert: { min: 80, max: 100 }
    };

    const range = difficultyRanges[targetDifficulty];

    // Find questions matching the difficulty range
    const matchingQuestions = unaskedQuestions.filter(q => {
        // If question has difficulty property, use it
        if (q.difficulty) {
            const diffMap = { Easy: 'easy', Medium: 'medium', Hard: 'hard', Expert: 'expert' };
            return diffMap[q.difficulty as keyof typeof diffMap] === targetDifficulty;
        }
        return true; // Include if no difficulty specified
    });

    // Return random question from matching set, or fallback to any unasked question
    if (matchingQuestions.length > 0) {
        return matchingQuestions[Math.floor(Math.random() * matchingQuestions.length)];
    }

    return unaskedQuestions[0];
}

/**
 * Generates a contextual hint based on question and struggle type
 */
export function generateHint(
    question: CompanyQuestion,
    hintLevel: 'gentle' | 'conceptual' | 'structural',
    previousHints: string[]
): AdaptiveHint {
    // If question has predefined hints, use them
    if (question.metadata?.hints && Array.isArray(question.metadata.hints)) {
        const availableHints = question.metadata.hints.filter(
            (h: string) => !previousHints.includes(h)
        );
        if (availableHints.length > 0) {
            return {
                level: hintLevel,
                content: availableHints[0]
            };
        }
    }

    // Generate generic hints based on question type and level
    const questionType = question.question_type;

    if (questionType === 'Coding') {
        return generateCodingHint(question, hintLevel);
    } else if (questionType === 'Technical') {
        return generateTechnicalHint(question, hintLevel);
    } else {
        return generateGeneralHint(question, hintLevel);
    }
}

function generateCodingHint(
    question: CompanyQuestion,
    level: 'gentle' | 'conceptual' | 'structural'
): AdaptiveHint {
    const questionText = question.question_text.toLowerCase();

    if (level === 'gentle') {
        if (questionText.includes('array') || questionText.includes('list')) {
            return {
                level: 'gentle',
                content: 'Consider the edge cases: what if the array is empty? What if it has only one element?'
            };
        }
        if (questionText.includes('string')) {
            return {
                level: 'gentle',
                content: 'Think about edge cases like empty strings, single characters, or special characters.'
            };
        }
        return {
            level: 'gentle',
            content: 'Start by thinking about the simplest case first, then build up to more complex scenarios.'
        };
    }

    if (level === 'conceptual') {
        if (questionText.includes('sort') || questionText.includes('search')) {
            return {
                level: 'conceptual',
                content: 'This problem can be approached using common algorithms. Consider the time complexity requirements.'
            };
        }
        if (questionText.includes('tree') || questionText.includes('graph')) {
            return {
                level: 'conceptual',
                content: 'Think about traversal strategies - depth-first or breadth-first might be helpful here.'
            };
        }
        return {
            level: 'conceptual',
            content: 'Consider which data structure would be most efficient for this problem.'
        };
    }

    // Structural hint
    return {
        level: 'structural',
        content: 'Try breaking this down into steps: 1) Validate inputs, 2) Process the main logic, 3) Handle edge cases, 4) Return the result.'
    };
}

function generateTechnicalHint(
    question: CompanyQuestion,
    level: 'gentle' | 'conceptual' | 'structural'
): AdaptiveHint {
    if (level === 'gentle') {
        return {
            level: 'gentle',
            content: 'Take a moment to think about the core concepts involved in this question.'
        };
    }

    if (level === 'conceptual') {
        return {
            level: 'conceptual',
            content: 'Consider the fundamental principles and how they apply to real-world scenarios.'
        };
    }

    return {
        level: 'structural',
        content: 'Try organizing your answer around: 1) Definition, 2) Use cases, 3) Trade-offs, 4) Best practices.'
    };
}

function generateGeneralHint(
    question: CompanyQuestion,
    level: 'gentle' | 'conceptual' | 'structural'
): AdaptiveHint {
    if (level === 'gentle') {
        return {
            level: 'gentle',
            content: 'Take your time and think through your experience with similar situations.'
        };
    }

    if (level === 'conceptual') {
        return {
            level: 'conceptual',
            content: 'Consider using the STAR method: Situation, Task, Action, Result.'
        };
    }

    return {
        level: 'structural',
        content: 'Structure your answer with: 1) Context, 2) Your approach, 3) The outcome, 4) What you learned.'
    };
}

/**
 * Generates adaptive follow-up questions based on performance
 */
export function generateFollowUpSuggestion(
    originalQuestion: string,
    candidateResponse: string,
    performanceScore: number,
    difficulty: DifficultyLevel
): string {
    if (performanceScore > 75) {
        // High performance - ask deeper questions
        return `The candidate answered well. Consider asking: "Can you discuss the time and space complexity?" or "How would you optimize this further?" or "What edge cases should we consider?"`;
    } else if (performanceScore < 50) {
        // Low performance - ask simpler clarifying questions
        return `The candidate is struggling. Consider asking: "Can you walk me through your thought process?" or "Let's start with a simpler version of this problem" or "What part would you like me to clarify?"`;
    } else {
        // Average performance - standard follow-ups
        return `Consider asking: "Can you explain your reasoning?" or "Are there alternative approaches?" or "How would this scale?"`;
    }
}

/**
 * Creates performance context for system prompt
 */
export function createPerformanceContext(
    performanceAnalysis: PerformanceAnalysis,
    currentDifficulty: DifficultyLevel
): string {
    const { currentScore, trend, recommendedDifficulty, shouldProvideHint } = performanceAnalysis;

    let context = `\n\n## CURRENT PERFORMANCE CONTEXT\n\n`;
    context += `- Candidate Performance Score: ${currentScore}/100\n`;
    context += `- Performance Trend: ${trend}\n`;
    context += `- Current Difficulty Level: ${currentDifficulty}\n`;
    context += `- Recommended Difficulty Level: ${recommendedDifficulty}\n\n`;

    if (currentScore > 75) {
        context += `**The candidate is performing exceptionally well.** Increase the difficulty:\n`;
        context += `- Ask more complex, in-depth questions\n`;
        context += `- Explore edge cases and optimizations\n`;
        context += `- Challenge them with advanced topics\n`;
        context += `- Ask deeper follow-up questions\n\n`;
    } else if (currentScore < 50) {
        context += `**The candidate is struggling.** Provide more support:\n`;
        context += `- Simplify your questions\n`;
        context += `- Break down complex problems into smaller parts\n`;
        context += `- Provide more guidance and examples\n`;
        if (shouldProvideHint) {
            context += `- Offer hints when appropriate (the candidate may need help)\n`;
        }
        context += `- Be encouraging and supportive\n\n`;
    } else {
        context += `**The candidate is performing at an average level.** Maintain current approach:\n`;
        context += `- Continue with questions at the current difficulty\n`;
        context += `- Provide moderate guidance\n`;
        context += `- Adjust based on their responses\n\n`;
    }

    if (trend === 'improving') {
        context += `**Note:** The candidate is showing improvement. Gradually increase difficulty as they demonstrate mastery.\n\n`;
    } else if (trend === 'declining') {
        context += `**Note:** The candidate's performance is declining. Consider providing more support or simplifying questions.\n\n`;
    }

    return context;
}
