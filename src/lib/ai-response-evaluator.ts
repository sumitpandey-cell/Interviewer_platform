/**
 * AI Response Evaluator
 * 
 * Uses AI to evaluate response quality instead of simple heuristics
 * Provides more accurate scoring based on semantic understanding
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface ResponseEvaluation {
    score: number; // 0-100
    reasoning: string;
    keyPointsCovered: string[];
    missingPoints: string[];
    technicalAccuracy: number; // 0-100
    clarity: number; // 0-100
    completeness: number; // 0-100
}

/**
 * Evaluates response quality using AI
 */
export async function evaluateResponseQuality(
    question: string,
    response: string,
    questionType: string = 'General',
    expectedAnswer?: string
): Promise<ResponseEvaluation> {
    const prompt = `You are an expert technical interviewer. Evaluate this candidate's response.

QUESTION: ${question}
QUESTION TYPE: ${questionType}
CANDIDATE RESPONSE: ${response}
${expectedAnswer ? `EXPECTED ANSWER GUIDANCE: ${expectedAnswer}` : ''}

Evaluate the response on:
1. Technical Accuracy (0-100): Is the answer correct?
2. Clarity (0-100): Is it well-explained?
3. Completeness (0-100): Does it cover all aspects?

Return JSON:
{
  "technicalAccuracy": <score>,
  "clarity": <score>,
  "completeness": <score>,
  "keyPointsCovered": ["point1", "point2"],
  "missingPoints": ["missing1", "missing2"],
  "reasoning": "Brief explanation of the scores"
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting.`;

    try {
        const cleanApiKey = API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${cleanApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.3, // Lower temperature for more consistent scoring
                    maxOutputTokens: 500
                }
            })
        });

        if (!response.ok) {
            throw new Error(`AI evaluation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').replace(/^```\n|\n```$/g, '').trim();
        const evaluation = JSON.parse(jsonString);

        // Calculate overall score (weighted average)
        const score = Math.round(
            evaluation.technicalAccuracy * 0.5 +
            evaluation.clarity * 0.25 +
            evaluation.completeness * 0.25
        );

        return {
            score,
            reasoning: evaluation.reasoning,
            keyPointsCovered: evaluation.keyPointsCovered || [],
            missingPoints: evaluation.missingPoints || [],
            technicalAccuracy: evaluation.technicalAccuracy,
            clarity: evaluation.clarity,
            completeness: evaluation.completeness
        };
    } catch (error) {
        console.error('AI evaluation error:', error);
        // Fallback to heuristic scoring
        return fallbackEvaluation(response, questionType);
    }
}

/**
 * Fallback heuristic evaluation (used when AI fails)
 */
function fallbackEvaluation(response: string, questionType: string): ResponseEvaluation {
    let score = 50; // Base score

    // Length analysis
    const wordCount = response.trim().split(/\s+/).length;
    if (wordCount > 100) score += 15;
    else if (wordCount > 50) score += 10;
    else if (wordCount > 20) score += 5;
    else if (wordCount < 10) score -= 20;

    // Technical indicators
    const technicalIndicators = [
        'algorithm', 'complexity', 'optimization', 'edge case',
        'time complexity', 'space complexity', 'trade-off', 'scalability'
    ];
    const technicalMatches = technicalIndicators.filter(indicator =>
        response.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(technicalMatches * 3, 15);

    // Code quality (for coding questions)
    if (questionType === 'Coding') {
        if (response.includes('```')) score += 10;
        if (/function|const|let|var|def|class/.test(response)) score += 5;
    }

    // Uncertainty indicators (negative)
    const uncertaintyPhrases = [
        "i'm not sure", "i don't know", "maybe", "probably", "i guess"
    ];
    const uncertaintyCount = uncertaintyPhrases.filter(phrase =>
        response.toLowerCase().includes(phrase)
    ).length;
    score -= uncertaintyCount * 5;

    score = Math.max(0, Math.min(100, score));

    return {
        score,
        reasoning: 'Fallback heuristic evaluation (AI unavailable)',
        keyPointsCovered: [],
        missingPoints: [],
        technicalAccuracy: score,
        clarity: score,
        completeness: score
    };
}

/**
 * Batch evaluate multiple responses (more efficient)
 */
export async function evaluateResponsesBatch(
    evaluations: Array<{
        question: string;
        response: string;
        questionType?: string;
    }>
): Promise<ResponseEvaluation[]> {
    // For now, evaluate sequentially
    // TODO: Implement true batch processing with Gemini batch API
    const results: ResponseEvaluation[] = [];

    for (const item of evaluations) {
        const result = await evaluateResponseQuality(
            item.question,
            item.response,
            item.questionType
        );
        results.push(result);
    }

    return results;
}
