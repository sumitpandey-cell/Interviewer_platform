import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  duration_minutes: number | null;
  completed_at: string | null;
  user_id: string;
  feedback?: any;
  transcript?: any;
}

interface CacheState {
  // Sessions cache
  sessions: InterviewSession[];
  sessionsLastFetch: number | null;
  sessionsCacheValid: boolean;
  
  // Stats cache
  stats: {
    totalInterviews: number;
    averageScore: number;
    timePracticed: number;
    rank: number;
  } | null;
  statsLastFetch: number | null;
  statsCacheValid: boolean;
  
  // Individual session cache
  sessionDetails: Record<string, InterviewSession>;
  sessionDetailsLastFetch: Record<string, number>;
  sessionDetailsCacheValid: Record<string, boolean>;
  
  // Cache actions
  setSessions: (sessions: InterviewSession[]) => void;
  invalidateSessions: () => void;
  setStats: (stats: any) => void;
  invalidateStats: () => void;
  setSessionDetail: (sessionId: string, session: InterviewSession) => void;
  invalidateSessionDetail: (sessionId: string) => void;
  invalidateAllCache: () => void;
  
  // Cache validation
  isSessionsCacheValid: () => boolean;
  isStatsCacheValid: () => boolean;
  isSessionDetailCacheValid: (sessionId: string) => boolean;
  
  // Event tracking for cache invalidation
  onInterviewCreated: () => void;
  onInterviewCompleted: (sessionId: string) => void;
  onInterviewUpdated: (sessionId: string) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      sessionsLastFetch: null,
      sessionsCacheValid: false,
      
      stats: null,
      statsLastFetch: null,
      statsCacheValid: false,
      
      sessionDetails: {},
      sessionDetailsLastFetch: {},
      sessionDetailsCacheValid: {},
      
      // Cache setters
      setSessions: (sessions) => set({
        sessions,
        sessionsLastFetch: Date.now(),
        sessionsCacheValid: true
      }),
      
      invalidateSessions: () => set({
        sessionsCacheValid: false,
        sessions: []
      }),
      
      setStats: (stats) => set({
        stats,
        statsLastFetch: Date.now(),
        statsCacheValid: true
      }),
      
      invalidateStats: () => set({
        statsCacheValid: false,
        stats: null
      }),
      
      setSessionDetail: (sessionId, session) => set((state) => ({
        sessionDetails: { ...state.sessionDetails, [sessionId]: session },
        sessionDetailsLastFetch: { ...state.sessionDetailsLastFetch, [sessionId]: Date.now() },
        sessionDetailsCacheValid: { ...state.sessionDetailsCacheValid, [sessionId]: true }
      })),
      
      invalidateSessionDetail: (sessionId) => set((state) => {
        const newDetails = { ...state.sessionDetails };
        const newLastFetch = { ...state.sessionDetailsLastFetch };
        const newValid = { ...state.sessionDetailsCacheValid };
        
        delete newDetails[sessionId];
        delete newLastFetch[sessionId];
        delete newValid[sessionId];
        
        return {
          sessionDetails: newDetails,
          sessionDetailsLastFetch: newLastFetch,
          sessionDetailsCacheValid: newValid
        };
      }),
      
      invalidateAllCache: () => set({
        sessionsCacheValid: false,
        statsCacheValid: false,
        sessionDetailsCacheValid: {},
        sessions: [],
        stats: null,
        sessionDetails: {},
        sessionDetailsLastFetch: {},
      }),
      
      // Cache validation
      isSessionsCacheValid: () => {
        const state = get();
        if (!state.sessionsCacheValid || !state.sessionsLastFetch) return false;
        return Date.now() - state.sessionsLastFetch < CACHE_DURATION;
      },
      
      isStatsCacheValid: () => {
        const state = get();
        if (!state.statsCacheValid || !state.statsLastFetch) return false;
        return Date.now() - state.statsLastFetch < CACHE_DURATION;
      },
      
      isSessionDetailCacheValid: (sessionId) => {
        const state = get();
        if (!state.sessionDetailsCacheValid[sessionId] || !state.sessionDetailsLastFetch[sessionId]) {
          return false;
        }
        return Date.now() - state.sessionDetailsLastFetch[sessionId] < CACHE_DURATION;
      },
      
      // Event handlers for cache invalidation
      onInterviewCreated: () => {
        const state = get();
        // Invalidate sessions and stats when new interview is created
        set({
          sessionsCacheValid: false,
          statsCacheValid: false
        });
      },
      
      onInterviewCompleted: (sessionId) => {
        const state = get();
        // Invalidate all related caches when interview is completed
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          sessionDetailsCacheValid: {
            ...state.sessionDetailsCacheValid,
            [sessionId]: false
          }
        });
      },
      
      onInterviewUpdated: (sessionId) => {
        const state = get();
        // Invalidate specific session and general caches
        set({
          sessionsCacheValid: false,
          statsCacheValid: false,
          sessionDetailsCacheValid: {
            ...state.sessionDetailsCacheValid,
            [sessionId]: false
          }
        });
      },
    }),
    {
      name: 'cache-storage',
      // Only persist cache flags and timestamps, not the actual data
      partialize: (state) => ({
        sessionsLastFetch: state.sessionsLastFetch,
        sessionsCacheValid: false, // Always invalidate on app restart
        statsLastFetch: state.statsLastFetch,
        statsCacheValid: false, // Always invalidate on app restart
        sessionDetailsLastFetch: state.sessionDetailsLastFetch,
        sessionDetailsCacheValid: {}, // Always invalidate on app restart
      }),
    }
  )
);