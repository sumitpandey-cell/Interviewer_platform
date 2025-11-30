
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

export async function generateFeedback(transcript: Message[], position: string, interviewType: string): Promise<FeedbackData> {
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

    const prompt = `
    You are an expert technical interviewer and career coach. Analyze the following interview transcript for a ${position} position (${interviewType} interview).

    The transcript contains a conversation between an AI Interviewer and a User (Candidate).
    
    TRANSCRIPT:
    ${transcriptText}
    
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
    4. **Tone**: Be constructive. Even if the candidate failed or quit, offer encouraging advice on how to prepare for next time.

    ANALYSIS TASKS:
    1. Analyze the Candidate's responses for technical accuracy, depth of knowledge, and problem-solving approach.
    2. Analyze the Candidate's communication style, clarity, and confidence.
    3. Evaluate how well the Candidate answered the specific questions asked by the AI.
    
    Provide the output in the following JSON format:
    {
        "executiveSummary": "A professional executive summary. If short/aborted, state 'Insufficient data to provide a complete assessment.'",
        "strengths": ["List of 3-5 distinct key strengths (or 'N/A - Insufficient Data' if too short)"],
        "improvements": ["List of 3-5 specific areas for improvement (or 'N/A - Insufficient Data' if too short)"],
        "skills": [
            { "name": "Technical Knowledge", "score": 0-100, "feedback": "Specific feedback. If skipped/short, say 'Insufficient data'." },
            { "name": "Communication", "score": 0-100, "feedback": "Feedback on clarity. If short, assess what was heard or say 'Insufficient data'." },
            { "name": "Problem Solving", "score": 0-100, "feedback": "Feedback. If coding question skipped, say 'Skipped coding challenge'." },
            { "name": "Cultural Fit", "score": 0-100, "feedback": "Feedback on demeanor." }
        ],
        "actionPlan": ["List of 3-5 actionable steps (e.g., 'Practice coding problems', 'Review system design basics')"]
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

        return JSON.parse(jsonString);
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
