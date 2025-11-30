import { z } from 'zod';

/**
 * Feedback Validator
 * 
 * Validates AI-generated feedback to ensure quality and consistency
 */

// Define the schema for feedback data
const SkillSchema = z.object({
    name: z.string().min(1, "Skill name cannot be empty"),
    score: z.number().min(0, "Score cannot be negative").max(100, "Score cannot exceed 100"),
    feedback: z.string().min(10, "Feedback must be at least 10 characters")
});

export const FeedbackSchema = z.object({
    executiveSummary: z.string()
        .min(50, "Executive summary too short")
        .max(2000, "Executive summary too long"),
    strengths: z.array(z.string().min(5))
        .min(1, "At least one strength required")
        .max(10, "Too many strengths"),
    improvements: z.array(z.string().min(5))
        .min(1, "At least one improvement required")
        .max(10, "Too many improvements"),
    skills: z.array(SkillSchema)
        .min(3, "At least 3 skills required")
        .max(6, "Too many skills"),
    actionPlan: z.array(z.string().min(10))
        .min(1, "At least one action item required")
        .max(10, "Too many action items")
});

export type ValidatedFeedback = z.infer<typeof FeedbackSchema>;

/**
 * Validates feedback data and performs sanity checks
 */
export function validateFeedback(feedback: unknown): ValidatedFeedback {
    // Schema validation
    const validated = FeedbackSchema.parse(feedback);

    // Sanity checks
    const avgScore = validated.skills.reduce((sum, s) => sum + s.score, 0) / validated.skills.length;

    // Check for inconsistencies
    if (avgScore > 80 && validated.improvements.length < 2) {
        console.warn('⚠️ High score but few improvements - may be inconsistent');
    }

    if (avgScore < 40 && validated.strengths.length > 3) {
        console.warn('⚠️ Low score but many strengths - may be inconsistent');
    }

    // Check for duplicate skills
    const skillNames = validated.skills.map(s => s.name.toLowerCase());
    const uniqueSkills = new Set(skillNames);
    if (skillNames.length !== uniqueSkills.size) {
        throw new Error('Duplicate skills detected in feedback');
    }

    // Check for empty or placeholder content
    const placeholders = ['pending', 'n/a', 'tbd', 'todo', 'insufficient data'];
    const hasPlaceholders = [
        ...validated.strengths,
        ...validated.improvements,
        ...validated.actionPlan,
        validated.executiveSummary
    ].some(text =>
        placeholders.some(placeholder =>
            text.toLowerCase().includes(placeholder)
        )
    );

    if (hasPlaceholders) {
        console.warn('⚠️ Feedback contains placeholder text');
    }

    return validated;
}

/**
 * Validates feedback with error recovery
 * Returns validated feedback or throws with detailed error message
 */
export function validateFeedbackSafe(feedback: unknown): {
    success: boolean;
    data?: ValidatedFeedback;
    error?: string;
} {
    try {
        const validated = validateFeedback(feedback);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err =>
                `${err.path.join('.')}: ${err.message}`
            ).join(', ');
            return {
                success: false,
                error: `Validation failed: ${errorMessages}`
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown validation error'
        };
    }
}

/**
 * Calculates quality score for feedback (0-100)
 */
export function calculateFeedbackQuality(feedback: ValidatedFeedback): number {
    let score = 100;

    // Deduct for short content
    if (feedback.executiveSummary.length < 100) score -= 10;
    if (feedback.strengths.length < 3) score -= 10;
    if (feedback.improvements.length < 3) score -= 10;
    if (feedback.actionPlan.length < 3) score -= 10;

    // Deduct for generic feedback
    const genericPhrases = ['good', 'great', 'excellent', 'needs improvement', 'could be better'];
    const feedbackText = [
        feedback.executiveSummary,
        ...feedback.strengths,
        ...feedback.improvements,
        ...feedback.skills.map(s => s.feedback),
        ...feedback.actionPlan
    ].join(' ').toLowerCase();

    const genericCount = genericPhrases.filter(phrase =>
        feedbackText.includes(phrase)
    ).length;

    score -= Math.min(genericCount * 5, 20);

    // Bonus for specific, detailed feedback
    if (feedback.executiveSummary.length > 200) score += 5;
    if (feedback.skills.every(s => s.feedback.length > 50)) score += 10;

    return Math.max(0, Math.min(100, score));
}
