
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
    console.log("*(*(*(*(*(*(**((",transcript);
    const transcriptText = transcript.map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n');

    const prompt = `
    You are an expert technical interviewer and career coach. Analyze the following interview transcript for a ${position} position (${interviewType} interview).

    The transcript contains a conversation between an AI Interviewer and a User (Candidate).
    
    TRANSCRIPT:
    ${transcriptText}
    
    Based on the transcript, provide a comprehensive feedback report.
    
    1. Analyze the Candidate's responses for technical accuracy, depth of knowledge, and problem-solving approach.
    2. Analyze the Candidate's communication style, clarity, and confidence.
    3. Evaluate how well the Candidate answered the specific questions asked by the AI.
    
    Provide the output in the following JSON format:
    {
        "executiveSummary": "A professional executive summary of the candidate's performance, highlighting key takeaways.",
        "strengths": ["List of 3-5 distinct key strengths demonstrated by the candidate"],
        "improvements": ["List of 3-5 specific areas where the candidate needs improvement"],
        "skills": [
            { "name": "Technical Knowledge", "score": 0-100, "feedback": "Specific feedback on technical accuracy and depth" },
            { "name": "Communication", "score": 0-100, "feedback": "Feedback on clarity, conciseness, and articulation" },
            { "name": "Problem Solving", "score": 0-100, "feedback": "Feedback on approach to problems and logical thinking" },
            { "name": "Cultural Fit", "score": 0-100, "feedback": "Feedback on professional demeanor and attitude" }
        ],
        "actionPlan": ["List of 3-5 actionable, specific steps the candidate can take to improve"]
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
