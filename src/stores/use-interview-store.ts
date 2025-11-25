import { create } from 'zustand';
import { FeedbackData } from '@/lib/gemini-feedback';

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    timestamp?: string;
}

interface InterviewState {
    feedback: FeedbackData | null;
    transcript: Message[];
    isLoading: boolean;
    error: string | null;
    // Persistence state
    isSaving: boolean;
    saveError: string | null;
    setFeedback: (feedback: FeedbackData) => void;
    setTranscript: (transcript: Message[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setSaving: (isSaving: boolean) => void;
    setSaveError: (error: string | null) => void;
    clearFeedback: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
    feedback: null,
    transcript: [],
    isLoading: false,
    error: null,
    isSaving: false,
    saveError: null,
    setFeedback: (feedback) => set({ feedback, isLoading: false, error: null }),
    setTranscript: (transcript) => set({ transcript }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error, isLoading: false }),
    setSaving: (isSaving) => set({ isSaving }),
    setSaveError: (error) => set({ saveError: error, isSaving: false }),
    clearFeedback: () => set({ feedback: null, transcript: [], isLoading: false, error: null }),
}));
