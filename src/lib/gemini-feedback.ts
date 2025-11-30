
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

export interface FeedbackData {
    executiveSummary: string;
    strengths: string[];
    improvements: string[];
    skills: {
        name: string;
        score: number;
        feedback: string;
    }[];
    actionPlan: string[];
}

export interface PerformanceData {
    currentScore: number;
    trend: 'improving' | 'stable' | 'declining';
    difficultyProgression: string[];
    totalHintsUsed: number;
    detailedMetrics: Array<{
        questionIndex: number;
        questionText: string;
        responseQualityScore: number;
        responseTimeSeconds: number;
        difficultyLevel: string;
        hintsUsed: number;
        struggleIndicators: {
            longPauses: number;
            clarificationRequests: number;
            incompleteAnswers: number;
            uncertaintyPhrases: number;
        };
    }>;
}

export async function generateFeedback(
    transcript: Message[],
    position: string,
    interviewType: string,
    performanceData?: PerformanceData
): Promise<FeedbackData> {
    console.log("*(*(*(*(*(*(**((", transcript);
    // Filter out internal thoughts and empty lines
    const transcriptText = transcript
        .map(msg => {
            // Remove internal thoughts (lines starting with * or () and bold headers)
            let cleanText = msg.text.replace(/\*\*[^*]+\*\*\s*/g, ''); // Remove bold headers like **Title**

            cleanText = cleanText
                .split('\n')
                .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('('))
                .join('\n');
            return { ...msg, text: cleanText };
        })
        .filter(msg => msg.text.trim().length > 0)
        .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
        .join('\n');

    // Add performance context if available
    let performanceContext = '';
    if (performanceData) {
        performanceContext = `\n\nPERFORMANCE METRICS ANALYSIS:\n\n`;
        performanceContext += `OVERALL SUMMARY:\n`;
        performanceContext += `- Overall Performance Score: ${performanceData.currentScore}/100\n`;
        performanceContext += `- Performance Trend: ${performanceData.trend}\n`;
        performanceContext += `- Difficulty Progression: ${performanceData.difficultyProgression.join(' → ')}\n`;
        performanceContext += `- Total Hints Used: ${performanceData.totalHintsUsed}\n\n`;

        // Add detailed question-by-question breakdown
        if (performanceData.detailedMetrics && performanceData.detailedMetrics.length > 0) {
            performanceContext += `QUESTION-BY-QUESTION BREAKDOWN:\n\n`;

            performanceData.detailedMetrics.forEach((metric, index) => {
                performanceContext += `Question ${index + 1} [${metric.difficultyLevel.toUpperCase()}]:\n`;
                performanceContext += `  Question: "${metric.questionText.substring(0, 100)}${metric.questionText.length > 100 ? '...' : ''}"\n`;
                performanceContext += `  Response Quality Score: ${metric.responseQualityScore}/100\n`;
                performanceContext += `  Response Time: ${metric.responseTimeSeconds} seconds\n`;
                performanceContext += `  Hints Used: ${metric.hintsUsed}\n`;

                // Add struggle indicators if any
                const struggles = [];
                if (metric.struggleIndicators.longPauses > 0) struggles.push(`${metric.struggleIndicators.longPauses} long pauses`);
                if (metric.struggleIndicators.clarificationRequests > 0) struggles.push(`${metric.struggleIndicators.clarificationRequests} clarification requests`);
                if (metric.struggleIndicators.incompleteAnswers > 0) struggles.push(`incomplete answer`);
                if (metric.struggleIndicators.uncertaintyPhrases > 0) struggles.push(`${metric.struggleIndicators.uncertaintyPhrases} uncertainty phrases`);

                if (struggles.length > 0) {
                    performanceContext += `  Struggle Indicators: ${struggles.join(', ')}\n`;
                }
                performanceContext += `\n`;
            });
        }

        performanceContext += `IMPORTANT CONTEXT:\n`;
        performanceContext += `- This interview used dynamic difficulty adjustment\n`;
        performanceContext += `- The AI adapted question complexity based on the candidate's real-time performance\n`;
        performanceContext += `- Use the detailed metrics above to provide specific, actionable feedback for each question area\n`;
        performanceContext += `- Highlight patterns in performance (e.g., struggled with harder questions, improved over time)\n`;
    }

    const prompt = `
    You are an expert technical interviewer and career coach. Analyze the following interview transcript for a ${position} position (${interviewType} interview).

    The transcript contains a conversation between an AI Interviewer and a User (Candidate).
    
    TRANSCRIPT:
    ${transcriptText}
    ${performanceContext}
    
    Based on the transcript, provide a comprehensive feedback report.

    CRITICAL INSTRUCTIONS FOR ACCURACY:
    1. **Internal Thoughts**: Ignore any text that looks like system logs or internal AI thoughts (e.g., "*Anticipating...*"). Focus ONLY on the spoken conversation.
    2. **Short/Aborted Interviews**: If the interview is very short (< 5 turns) or the candidate aborts early, DO NOT hallucinate skills. 
       - Set the "Executive Summary" to clearly state that the interview was too short to fully assess the candidate.
       - Give neutral scores (e.g., 0 or 50) with feedback explicitly stating "Insufficient data".
    3. **Skipped Questions**: If a candidate skips a question (e.g., "I'd like to skip this"), do NOT penalize them heavily. 
       - Mark that specific skill as "Not Assessed" or give a neutral score (e.g. 50).
       - Calculate the overall score based primarily on the questions they DID answer.
       - Do NOT give a failing grade (e.g. < 40) solely because of one skipped question if other answers were good.
    4. **Performance Progression**: If performance metrics are provided, acknowledge the candidate's improvement or decline throughout the interview.
    5. **Difficulty Adjustment**: If difficulty progression is shown, note how the candidate handled increasing or decreasing complexity.
    6. **Tone**: Be constructive. Even if the candidate failed or quit, offer encouraging advice on how to prepare for next time.

    ANALYSIS TASKS:
    1. Analyze the Candidate's responses for technical accuracy, depth of knowledge, and problem-solving approach.
    2. Analyze the Candidate's communication style, clarity, and confidence.
    3. Evaluate how well the Candidate answered the specific questions asked by the AI.
    4. **CRITICAL - If detailed performance metrics are provided**:
       - Reference specific questions by number when providing feedback
       - Identify patterns (e.g., "struggled with harder questions", "improved as interview progressed", "quick responses but lower quality")
       - Note which questions had high/low scores and explain why based on the transcript
       - Mention specific struggle indicators (long pauses, uncertainty phrases, clarification requests)
       - Acknowledge when hints were used and whether they helped
       - Comment on how the candidate adapted to difficulty changes
       - Provide specific, actionable advice based on the question-level data
    5. Make your feedback SPECIFIC and DATA-DRIVEN using the performance metrics, not generic.
    
    Provide the output in the following JSON format:
    {
        "executiveSummary": "A comprehensive summary that references specific performance data. Mention overall score, trend, and key patterns. If performance metrics available, cite specific question numbers and scores.",
        "strengths": ["List 3-5 specific strengths with examples from the interview. Reference question numbers if metrics available (e.g., 'Strong performance on Question 2 (score: 85/100)')"],
        "improvements": ["List 3-5 specific areas for improvement with concrete examples. Reference question numbers and metrics (e.g., 'Question 4 showed struggles with X (score: 45/100, 3 uncertainty phrases)')"],
        "skills": [
            { "name": "Technical Knowledge", "score": 0-100, "feedback": "Detailed feedback referencing specific questions and scores from metrics" },
            { "name": "Communication", "score": 0-100, "feedback": "Feedback on clarity, mentioning response times and struggle indicators" },
            { "name": "Problem Solving", "score": 0-100, "feedback": "Feedback on approach, citing specific questions and difficulty levels handled" },
            { "name": "Adaptability", "score": 0-100, "feedback": "How well they adapted to difficulty changes (use difficulty progression data)" }
        ],
        "actionPlan": ["List 3-5 actionable steps that are SPECIFIC to their performance. Reference weak areas from metrics (e.g., 'Practice medium-difficulty system design questions - you scored 40/100 on Question 3')"]
    }
    
    IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting (like \`\`\`json) or any other text.
    `;

    const cleanApiKey = API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').replace(/^```\n|\n```$/g, '').trim();

        const parsedFeedback = JSON.parse(jsonString);

        // Validate feedback before returning
        const { validateFeedbackSafe, calculateFeedbackQuality } = await import('./feedback-validator');
        const validation = validateFeedbackSafe(parsedFeedback);

        if (!validation.success) {
            console.error('❌ Feedback validation failed:', validation.error);
            throw new Error(`Invalid feedback structure: ${validation.error}`);
        }

        const qualityScore = calculateFeedbackQuality(validation.data!);
        console.log(`✅ Feedback validated successfully (quality: ${qualityScore}/100)`);

        return validation.data! as FeedbackData;
    } catch (error) {
        console.error("Error generating feedback:", error);
        // Return fallback data in case of error
        return {
            executiveSummary: "Feedback generation failed due to a technical issue. Please review the transcript manually.",
            strengths: ["Unable to analyze strengths"],
            improvements: ["Unable to analyze improvements"],
            skills: [
                { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                { name: "Communication", score: 0, feedback: "Analysis failed" },
                { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
            ],
            actionPlan: ["Please try again later"]
        };
    }
}
