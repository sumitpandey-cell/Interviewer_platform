import { CompanyQuestion } from '@/types/company-types';
import generalInterviewTemplate from '@/prompts/general-interview.txt?raw';
import companyInterviewTemplate from '@/prompts/company-interview.txt?raw';

interface PromptVariables {
    interviewType: string;
    position: string;
    companyName?: string;
    timeLeftMinutes?: number;
    questions?: CompanyQuestion[];
}

/**
 * Formats a list of company questions for injection into the system prompt
 */
function formatQuestionsForPrompt(questions: CompanyQuestion[]): string {
    return questions
        .map((q, index) => {
            const typeLabel = `[${q.question_type}]`;
            const difficultyLabel = q.difficulty ? ` (${q.difficulty})` : '';
            const roleLabel = q.role ? ` - Role: ${q.role}` : '';

            return `${index + 1}. ${typeLabel}${difficultyLabel}${roleLabel}
   ${q.question_text}`;
        })
        .join('\n\n');
}

/**
 * Generates time constraint text based on remaining minutes
 */
function generateTimeConstraint(timeLeftMinutes?: number): string {
    if (!timeLeftMinutes) {
        return 'Manage your time effectively throughout the interview.';
    }

    return `You have approximately ${timeLeftMinutes} minutes remaining for this interview. Manage your time accordingly.`;
}

/**
 * Loads and processes the general interview system prompt
 */
export function loadGeneralInterviewPrompt(variables: PromptVariables): string {
    let prompt = generalInterviewTemplate;

    // Replace placeholders
    prompt = prompt.replace(/\{\{INTERVIEW_TYPE\}\}/g, variables.interviewType);
    prompt = prompt.replace(/\{\{POSITION\}\}/g, variables.position);
    prompt = prompt.replace(/\{\{TIME_CONSTRAINT\}\}/g, generateTimeConstraint(variables.timeLeftMinutes));

    return prompt.trim();
}

/**
 * Loads and processes the company-specific interview system prompt
 */
export function loadCompanyInterviewPrompt(variables: PromptVariables): string {
    if (!variables.companyName || !variables.questions || variables.questions.length === 0) {
        console.warn('Company interview prompt requested but missing company name or questions. Falling back to general prompt.');
        return loadGeneralInterviewPrompt(variables);
    }

    let prompt = companyInterviewTemplate;

    // Replace placeholders
    prompt = prompt.replace(/\{\{COMPANY_NAME\}\}/g, variables.companyName);
    prompt = prompt.replace(/\{\{POSITION\}\}/g, variables.position);
    prompt = prompt.replace(/\{\{INTERVIEW_TYPE\}\}/g, variables.interviewType);
    prompt = prompt.replace(/\{\{TIME_CONSTRAINT\}\}/g, generateTimeConstraint(variables.timeLeftMinutes));
    prompt = prompt.replace(/\{\{QUESTIONS_LIST\}\}/g, formatQuestionsForPrompt(variables.questions));

    return prompt.trim();
}

/**
 * Main function to load the appropriate system prompt based on interview type
 */
export function loadSystemPrompt(variables: PromptVariables): string {
    // Determine if this is a company-specific interview
    const isCompanyInterview = variables.companyName && variables.questions && variables.questions.length > 0;

    if (isCompanyInterview) {
        console.log(`Loading company interview prompt for ${variables.companyName} with ${variables.questions?.length} questions`);
        return loadCompanyInterviewPrompt(variables);
    } else {
        console.log('Loading general interview prompt');
        return loadGeneralInterviewPrompt(variables);
    }
}

/**
 * Detects if a question is a coding question
 */
export function isCodingQuestion(question: CompanyQuestion): boolean {
    return question.question_type === 'Coding';
}

/**
 * Detects coding keywords in text (for fallback detection)
 */
export function containsCodingKeywords(text: string): boolean {
    const codingKeywords = [
        'write a function',
        'implement',
        'write code',
        'code this',
        'solve this problem',
        'algorithm',
        'write a program',
        'create a function',
        'coding challenge',
        'programming problem',
        'leetcode',
        'hackerrank'
    ];

    const lowerText = text.toLowerCase();
    return codingKeywords.some(keyword => lowerText.includes(keyword));
}
