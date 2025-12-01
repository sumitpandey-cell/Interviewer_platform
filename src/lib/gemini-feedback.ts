
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

// Interview length thresholds
const INTERVIEW_THRESHOLDS = {
    MINIMUM_TURNS: 4, // Minimum meaningful exchanges
    SHORT_INTERVIEW: 8, // Less than this = short interview
    MEDIUM_INTERVIEW: 15, // Good length for assessment
    LONG_INTERVIEW: 25, // Comprehensive interview
} as const;

export interface InterviewLengthAnalysis {
    totalTurns: number;
    userTurns: number;
    aiTurns: number;
    avgUserResponseLength: number;
    totalWordCount: number;
    category: 'too-short' | 'short' | 'medium' | 'long';
}



/**
 * Analyzes the interview transcript to determine length and quality metrics
 */
function analyzeInterviewLength(transcript: Message[]): InterviewLengthAnalysis {
    const userMessages = transcript.filter(msg => msg.sender === 'user');
    const aiMessages = transcript.filter(msg => msg.sender === 'ai');
    
    const totalWordCount = transcript.reduce((count, msg) => {
        return count + msg.text.trim().split(/\s+/).length;
    }, 0);
    
    const avgUserResponseLength = userMessages.length > 0 
        ? userMessages.reduce((sum, msg) => sum + msg.text.length, 0) / userMessages.length 
        : 0;
    
    const totalTurns = transcript.length;
    
    let category: InterviewLengthAnalysis['category'];
    if (totalTurns < INTERVIEW_THRESHOLDS.MINIMUM_TURNS) {
        category = 'too-short';
    } else if (totalTurns < INTERVIEW_THRESHOLDS.SHORT_INTERVIEW) {
        category = 'short';
    } else if (totalTurns < INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW) {
        category = 'medium';
    } else {
        category = 'long';
    }
    
    return {
        totalTurns,
        userTurns: userMessages.length,
        aiTurns: aiMessages.length,
        avgUserResponseLength,
        totalWordCount,
        category
    };
}

/**
 * Returns appropriate feedback for interviews that are too short to assess
 */
function getTooShortInterviewFeedback(position: string, analysis: InterviewLengthAnalysis): FeedbackData {
    return {
        executiveSummary: `This interview session was too brief (${analysis.totalTurns} exchanges) to provide a comprehensive assessment for the ${position} position. A meaningful technical interview typically requires at least ${INTERVIEW_THRESHOLDS.MINIMUM_TURNS} substantial exchanges to evaluate candidate capabilities effectively. We recommend scheduling a longer session to get valuable insights into your technical skills and problem-solving approach.`,
        strengths: [
            "Showed up and engaged with the interview process",
            "Demonstrated willingness to participate in technical assessment"
        ],
        improvements: [
            "Complete a full-length interview session for comprehensive evaluation",
            "Prepare for longer technical discussions to showcase your abilities",
            "Consider practicing with mock interviews to build confidence"
        ],
        skills: [
            { 
                name: "Technical Knowledge", 
                score: 0, 
                feedback: "Insufficient interview duration to assess technical capabilities. Please complete a longer session for evaluation." 
            },
            { 
                name: "Communication", 
                score: 0, 
                feedback: "Limited interaction time prevents meaningful assessment of communication skills." 
            },
            { 
                name: "Problem Solving", 
                score: 0, 
                feedback: "No significant problem-solving scenarios were completed during this brief session." 
            },
            { 
                name: "Adaptability", 
                score: 0, 
                feedback: "Unable to evaluate adaptability due to insufficient interview content." 
            }
        ],
        actionPlan: [
            "Schedule a complete interview session lasting at least 15-20 minutes",
            "Prepare to engage with multiple technical questions and scenarios",
            "Practice explaining your thought process clearly during problem-solving",
            "Review common interview questions for your target position"
        ]
    };
}

/**
 * Generates length-specific instructions for the AI prompt
 */
function getLengthBasedInstructions(category: InterviewLengthAnalysis['category']): string {
    switch (category) {
        case 'short':
            return `
    SPECIAL INSTRUCTIONS FOR SHORT INTERVIEW:
    - Acknowledge the limited data available for assessment
    - Provide more general, encouraging feedback
    - Be more lenient with scoring (avoid very low scores unless clearly warranted)
    - Focus on what was observed rather than making extensive inferences
    - Suggest areas for further exploration in future interviews`;
        
        case 'medium':
            return `
    SPECIAL INSTRUCTIONS FOR MEDIUM-LENGTH INTERVIEW:
    - Provide balanced assessment with moderate detail
    - Include specific examples where available
    - Offer constructive suggestions for improvement
    - Balance strengths and areas for growth`;
        
        case 'long':
            return `
    SPECIAL INSTRUCTIONS FOR COMPREHENSIVE INTERVIEW:
    - Provide detailed, specific feedback with granular analysis
    - Include multiple examples from different parts of the interview
    - Offer nuanced scoring that reflects the depth of assessment possible
    - Provide detailed action plan based on thorough evaluation`;
        
        default:
            return '';
    }
}

// Export the analysis function for use in other parts of the application
export { analyzeInterviewLength, INTERVIEW_THRESHOLDS };

export async function generateFeedback(
    transcript: Message[],
    position: string,
    interviewType: string
): Promise<FeedbackData> {
    console.log("Analyzing interview transcript:", transcript.length, "messages");
    
    // Analyze interview length before processing
    const lengthAnalysis = analyzeInterviewLength(transcript);
    console.log("Interview analysis:", lengthAnalysis);
    
    // Return early if interview is too short
    if (lengthAnalysis.category === 'too-short') {
        console.log("Interview too short - returning minimal feedback");
        return getTooShortInterviewFeedback(position, lengthAnalysis);
    }
    
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

    // Adjust prompt based on interview length
    const lengthSpecificInstructions = getLengthBasedInstructions(lengthAnalysis.category);

    const prompt = `
    You are an expert technical interviewer and career coach. Analyze the following interview transcript for a ${position} position (${interviewType} interview).

    INTERVIEW LENGTH CONTEXT:
    - Total exchanges: ${lengthAnalysis.totalTurns}
    - Category: ${lengthAnalysis.category.toUpperCase()} interview
    - Total words: ${lengthAnalysis.totalWordCount}
    ${lengthSpecificInstructions}

    The transcript contains a conversation between an AI Interviewer and a User (Candidate).
    
    TRANSCRIPT:
    ${transcriptText}
    
    Based on the transcript, provide a comprehensive feedback report.

    CRITICAL INSTRUCTIONS FOR ACCURACY:
    1. **Internal Thoughts**: Ignore any text that looks like system logs or internal AI thoughts (e.g., "*Anticipating...*"). Focus ONLY on the spoken conversation.
    2. **Interview Length Adaptation**: 
       - For SHORT interviews (${INTERVIEW_THRESHOLDS.SHORT_INTERVIEW} turns): Provide general feedback with acknowledgment of limited data. Be more lenient with scores.
       - For MEDIUM interviews (${INTERVIEW_THRESHOLDS.MEDIUM_INTERVIEW} turns): Balanced assessment with moderate detail.
       - For LONG interviews (${INTERVIEW_THRESHOLDS.LONG_INTERVIEW}+ turns): Detailed, specific feedback with granular scoring.
    3. **Skipped Questions**: If a candidate skips a question (e.g., "I'd like to skip this"), do NOT penalize them heavily. 
       - Mark that specific skill as "Not Assessed" or give a neutral score (e.g. 50).
       - Calculate the overall score based primarily on the questions they DID answer.
       - Do NOT give a failing grade (e.g. < 40) solely because of one skipped question if other answers were good.
    4. **Tone**: Be constructive. Even if the candidate failed or quit, offer encouraging advice on how to prepare for next time.

    ANALYSIS TASKS:
    1. Analyze the Candidate's responses for technical accuracy, depth of knowledge, and problem-solving approach.
    2. Analyze the Candidate's communication style, clarity, and confidence.
    3. Evaluate how well the Candidate answered the specific questions asked by the AI.
    4. Make your feedback SPECIFIC based on the transcript, not generic.
    5. Adjust depth of analysis based on interview length - be more forgiving for shorter interviews.
    
    Provide the output in the following JSON format:
    {
        "executiveSummary": "A comprehensive summary of the interview, adjusted for interview length.",
        "strengths": ["List 2-5 specific strengths with examples from the interview."],
        "improvements": ["List 2-5 specific areas for improvement with concrete examples."],
        "skills": [
            { "name": "Technical Knowledge", "score": 0-100, "feedback": "Detailed feedback" },
            { "name": "Communication", "score": 0-100, "feedback": "Feedback on clarity" },
            { "name": "Problem Solving", "score": 0-100, "feedback": "Feedback on approach" },
            { "name": "Adaptability", "score": 0-100, "feedback": "How well they adapted" }
        ],
        "actionPlan": ["List 2-5 actionable steps that are SPECIFIC to their performance."]
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
        const validation = validateFeedbackSafe(parsedFeedback, lengthAnalysis.category);

        if (!validation.success) {
            console.error('❌ Feedback validation failed:', validation.error);
            throw new Error(`Invalid feedback structure: ${validation.error}`);
        }

        const qualityScore = calculateFeedbackQuality(validation.data!, lengthAnalysis.category);
        console.log(`✅ Feedback validated successfully (quality: ${qualityScore}/100, length: ${lengthAnalysis.category})`);

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
