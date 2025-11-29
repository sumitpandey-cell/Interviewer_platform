
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export interface CodeAnalysis {
    complexity: {
        time: string;
        space: string;
        explanation: string;
    };
    quality: {
        good: string[];
        improvements: string[];
    };
    logic: {
        handled: string[];
        missing: string[];
    };
    explanation: string[];
    alternative: {
        name: string;
        condition: string;
        tradeoffs: string[];
    };
    security: string[];
    score: number;
    recommendation: string[];
}

export async function generateCodeAnalysis(code: string, language: string, problemDescription: string): Promise<CodeAnalysis> {
    const prompt = `
    You are an expert software engineer and technical interviewer. Analyze the following code submission for a coding problem.

    PROBLEM DESCRIPTION:
    ${problemDescription}

    LANGUAGE: ${language}

    CODE:
    ${code}

    Provide a comprehensive analysis of the code.
    1. Analyze Time and Space complexity.
    2. Evaluate code quality, best practices, and readability.
    3. Check for logical correctness, edge cases handled, and missing cases.
    4. Explain the code's logic step-by-step.
    5. Suggest an alternative approach (if applicable).
    6. Check for security vulnerabilities (if applicable).
    7. Assign a score (0-100) based on correctness, efficiency, and style.

    Provide the output in the following JSON format:
    {
        "complexity": {
            "time": "Big O notation",
            "space": "Big O notation",
            "explanation": "Brief explanation"
        },
        "quality": {
            "good": ["List of good practices observed"],
            "improvements": ["List of areas for improvement"]
        },
        "logic": {
            "handled": ["List of edge cases/logic correctly handled"],
            "missing": ["List of missing edge cases or logical flaws"]
        },
        "explanation": ["Step-by-step explanation of the code logic"],
        "alternative": {
            "name": "Name of alternative approach",
            "condition": "When to use this alternative",
            "tradeoffs": ["List of tradeoffs"]
        },
        "security": ["List of security checks or potential issues"],
        "score": 0-100,
        "recommendation": ["List of specific recommendations for the candidate"]
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
        console.error("Error generating code analysis:", error);
        // Return fallback data in case of error
        return {
            complexity: { time: "Unknown", space: "Unknown", explanation: "Analysis failed" },
            quality: { good: [], improvements: ["Analysis failed"] },
            logic: { handled: [], missing: ["Analysis failed"] },
            explanation: ["Analysis failed due to technical issue."],
            alternative: { name: "None", condition: "", tradeoffs: [] },
            security: [],
            score: 0,
            recommendation: ["Please try again later."]
        };
    }
}

export async function generateHint(code: string, language: string, problemDescription: string): Promise<string> {
    const prompt = `
    You are an expert technical interviewer. The candidate is working on the following problem:

    PROBLEM DESCRIPTION:
    ${problemDescription}

    LANGUAGE: ${language}

    CURRENT CODE:
    ${code}

    The candidate is stuck and needs a hint. 
    Provide a helpful hint that guides them in the right direction WITHOUT giving away the full solution or writing the code for them.
    Focus on the logic, algorithm, or a specific edge case they might be missing.
    Keep the hint concise and encouraging.
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
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error generating hint:", error);
        return "I'm having trouble generating a hint right now. Try reviewing the problem description and examples again.";
    }
}
