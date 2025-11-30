/**
 * Performance Store
 * 
 * Zustand store for managing interview performance state
 */

import { create } from 'zustand';
import {
    PerformanceMetrics,
    PerformanceAnalysis,
    DifficultyLevel,
    analyzePerformance,
    analyzeResponseQuality,
    detectStruggleIndicators
} from '@/lib/performance-tracker';

interface PerformanceState {
    // Performance tracking
    performanceHistory: PerformanceMetrics[];
    currentDifficulty: DifficultyLevel;
    questionsAtCurrentDifficulty: number;
    totalHintsUsed: number;

    // Current analysis
    currentAnalysis: PerformanceAnalysis | null;

    // Actions
    recordResponse: (
        questionIndex: number,
        questionText: string,
        response: string,
        responseTime: number,
        questionType: string,
        hintsUsed?: number
    ) => void;

    updateDifficulty: (newDifficulty: DifficultyLevel) => void;
    incrementHints: () => void;
    getCurrentPerformance: () => PerformanceAnalysis | null;
    shouldProvideHint: () => boolean;
    resetPerformance: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
    performanceHistory: [],
    currentDifficulty: 'medium',
    questionsAtCurrentDifficulty: 0,
    totalHintsUsed: 0,
    currentAnalysis: null,

    recordResponse: async (
        questionIndex: number,
        questionText: string,
        responseText: string,
        responseTimeSeconds: number,
        questionType: string
    ) => {
        const state = get();

        // Analyze response quality using AI
        const responseQualityScore = await analyzeResponseQuality(
            responseText,
            questionText,
            questionType
        );

        // Detect struggle indicators
        const struggleIndicators = detectStruggleIndicators(responseText, responseTimeSeconds);

        const metric: PerformanceMetrics = {
            questionIndex,
            questionText,
            responseQualityScore,
            responseTimeSeconds,
            difficultyLevel: state.currentDifficulty,
            hintsUsed: 0, // Will be updated when hints are used
            struggleIndicators,
            timestamp: new Date().toISOString()
        };

        // Update history
        const newHistory = [...state.performanceHistory, metric];

        // Analyze overall performance
        const analysis = analyzePerformance(newHistory);

        set({
            performanceHistory: newHistory,
            currentAnalysis: analysis,
            // totalHintsUsed is not updated here, as hintsUsed is now 0 in the metric
            // and the totalHintsUsed is incremented separately by incrementHints
        });

        console.log('📊 Performance recorded:', {
            questionIndex,
            qualityScore: responseQualityScore,
            currentScore: analysis.currentScore,
            trend: analysis.trend,
            recommendedDifficulty: analysis.recommendedDifficulty
        });
    },

    updateDifficulty: (newDifficulty) => {
        const state = get();

        // If difficulty changed, reset counter
        const questionsAtCurrentDifficulty =
            newDifficulty === state.currentDifficulty
                ? state.questionsAtCurrentDifficulty + 1
                : 1;

        set({
            currentDifficulty: newDifficulty,
            questionsAtCurrentDifficulty
        });

        console.log('🎯 Difficulty updated:', {
            newDifficulty,
            questionsAtLevel: questionsAtCurrentDifficulty
        });
    },

    incrementHints: () => {
        set((state) => ({
            totalHintsUsed: state.totalHintsUsed + 1
        }));
    },

    getCurrentPerformance: () => {
        return get().currentAnalysis;
    },

    shouldProvideHint: () => {
        const analysis = get().currentAnalysis;
        return analysis?.shouldProvideHint || false;
    },

    resetPerformance: () => {
        set({
            performanceHistory: [],
            currentDifficulty: 'medium',
            questionsAtCurrentDifficulty: 0,
            totalHintsUsed: 0,
            currentAnalysis: null
        });
        console.log('🔄 Performance state reset');
    }
}));
