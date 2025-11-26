import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCacheStore } from '@/stores/use-cache-store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Add profile caching to the cache store interface
interface ProfileCache {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  profileLastFetch: number | null;
  profileCacheValid: boolean;
}

export function useOptimizedQueries() {
  const { user } = useAuth();
  const {
    sessions,
    stats,
    profile,
    sessionDetails,
    setSessions,
    setStats,
    setProfile,
    setSessionDetail,
    isSessionsCacheValid,
    isStatsCacheValid,
    isProfileCacheValid,
    isSessionDetailCacheValid,
    onInterviewCreated,
    onInterviewCompleted,
    onInterviewUpdated,
    onProfileUpdated,
  } = useCacheStore();

  // Optimized sessions fetch
  const fetchSessions = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return [];

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isSessionsCacheValid() && sessions.length > 0) {
      console.log('📦 Using cached sessions data');
      return sessions;
    }

    console.log('🔄 Fetching sessions from database');
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sessions:", error);
        toast.error("Failed to load sessions");
        return sessions; // Return cached data on error
      }

      if (data) {
        setSessions(data);
        return data;
      }

      return sessions;
    } catch (error) {
      console.error("Error in fetchSessions:", error);
      return sessions;
    }
  }, [user?.id, sessions, isSessionsCacheValid, setSessions]);

  // Optimized stats calculation
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return null;

    // Return cached stats if valid and not forcing refresh
    if (!forceRefresh && isStatsCacheValid() && stats) {
      console.log('📦 Using cached stats data');
      return stats;
    }

    console.log('🔄 Calculating stats from database');
    try {
      // Get fresh sessions data for stats calculation
      const sessionsData = await fetchSessions(forceRefresh);

      // Calculate stats
      const totalInterviews = sessionsData.length;
      const completedSessions = sessionsData.filter(s => s.status === 'completed' && s.score !== null);
      const averageScore = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
        : 0;
      const timePracticed = sessionsData.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

      // Calculate Rank (Real implementation)
      let rank = 0;
      try {
        // Fetch all completed sessions for leaderboard calculation
        const { data: allSessions, error: rankError } = await supabase
          .from("interview_sessions")
          .select("user_id, score")
          .not("score", "is", null)
          .eq("status", "completed");

        if (!rankError && allSessions) {
          // Aggregate scores
          const userStats: Record<string, { totalScore: number; count: number }> = {};
          allSessions.forEach((session) => {
            if (!userStats[session.user_id]) {
              userStats[session.user_id] = { totalScore: 0, count: 0 };
            }
            userStats[session.user_id].totalScore += session.score || 0;
            userStats[session.user_id].count += 1;
          });

          // Calculate Bayesian Score
          const PRIOR_MEAN = 70;
          const M = 20;
          const rankedUsers = Object.entries(userStats).map(([userId, stats]) => {
            const avgScore = stats.totalScore / stats.count;
            const bayesianScore = (avgScore * stats.count + PRIOR_MEAN * M) / (stats.count + M);
            return { userId, bayesianScore };
          });

          // Sort
          rankedUsers.sort((a, b) => b.bayesianScore - a.bayesianScore);

          // Find current user rank
          const userRankIndex = rankedUsers.findIndex(u => u.userId === user.id);
          rank = userRankIndex !== -1 ? userRankIndex + 1 : 0;
        }
      } catch (e) {
        console.error("Error calculating rank", e);
      }

      const calculatedStats = {
        totalInterviews,
        averageScore,
        timePracticed,
        rank
      };

      setStats(calculatedStats);
      return calculatedStats;
    } catch (error) {
      console.error("Error calculating stats:", error);
      return stats;
    }
  }, [user?.id, stats, isStatsCacheValid, setStats, fetchSessions]);

  // Optimized profile fetch
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return null;

    // Return cached profile if valid and not forcing refresh
    if (!forceRefresh && isProfileCacheValid() && profile) {
      console.log('📦 Using cached profile data');
      return profile;
    }

    console.log('🔄 Fetching profile from database');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Return cached data on error if available
        return profile;
      }

      if (data) {
        // If avatar_url is null, try to get it from user metadata (OAuth picture)
        const profileData = {
          full_name: data.full_name,
          avatar_url: data.avatar_url || user.user_metadata?.picture || null
        };
        setProfile(profileData);
        return profileData;
      }

      return profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return profile;
    }
  }, [user?.id, user?.user_metadata?.picture, profile, isProfileCacheValid, setProfile]);

  // Optimized single session fetch
  const fetchSessionDetail = useCallback(async (sessionId: string, forceRefresh = false) => {
    if (!sessionId) return null;

    // Return cached session if valid and not forcing refresh
    if (!forceRefresh && isSessionDetailCacheValid(sessionId) && sessionDetails[sessionId]) {
      console.log(`📦 Using cached session detail for ${sessionId}`);
      return sessionDetails[sessionId];
    }

    console.log(`🔄 Fetching session detail from database: ${sessionId}`);
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) {
        console.error("Error fetching session detail:", error);
        return sessionDetails[sessionId] || null;
      }

      if (data) {
        setSessionDetail(sessionId, data as any);
        return data;
      }

      return sessionDetails[sessionId] || null;
    } catch (error) {
      console.error("Error in fetchSessionDetail:", error);
      return sessionDetails[sessionId] || null;
    }
  }, [sessionDetails, isSessionDetailCacheValid, setSessionDetail]);

  // Create interview session with cache invalidation
  const createInterviewSession = useCallback(async (sessionData: {
    position: string;
    interview_type: string;
  }) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          position: sessionData.position,
          interview_type: sessionData.interview_type,
          status: 'in_progress',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache since we added a new interview
      onInterviewCreated();

      console.log('✅ Interview session created, cache invalidated');
      return data;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }, [user?.id, onInterviewCreated]);

  // Complete interview session with cache invalidation
  const completeInterviewSession = useCallback(async (
    sessionId: string,
    updateData: {
      status?: string;
      completed_at?: string;
      duration_minutes?: number;
      score?: number;
      transcript?: any;
      feedback?: any;
    }
  ) => {
    try {
      // Ensure we mark the session as completed when completing the interview unless explicitly overridden
      const payload = { ...updateData } as any;
      if (!payload.status) payload.status = 'completed';

      const { error } = await supabase
        .from('interview_sessions')
        .update(payload)
        .eq('id', sessionId);

      if (error) throw error;

      // Invalidate cache since we updated an interview
      onInterviewCompleted(sessionId);

      console.log(`✅ Interview ${sessionId} completed, cache invalidated`);
      return true;
    } catch (error) {
      console.error('Error completing interview session:', error);
      throw error;
    }
  }, [onInterviewCompleted]);

  // Update interview session with cache invalidation
  const updateInterviewSession = useCallback(async (
    sessionId: string,
    updateData: Partial<any>
  ) => {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      // Invalidate cache since we updated an interview
      onInterviewUpdated(sessionId);

      console.log(`✅ Interview ${sessionId} updated, cache invalidated`);
      return true;
    } catch (error) {
      console.error('Error updating interview session:', error);
      throw error;
    }
  }, [onInterviewUpdated]);

  // Delete interview session with cache invalidation
  const deleteInterviewSession = useCallback(async (sessionId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log(`🗑️ Attempting to delete session ${sessionId} for user ${user.id}`);

      // First, verify the session exists and belongs to the user
      const { data: existingSession, error: fetchError } = await supabase
        .from('interview_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching session for verification:', fetchError);
        throw new Error('Session not found or access denied');
      }

      if (!existingSession) {
        throw new Error('Session not found or you do not have permission to delete it');
      }

      console.log('Session verified, proceeding with delete...');

      const { error, count } = await supabase
        .from('interview_sessions')
        .delete({ count: 'exact' })
        .eq('id', sessionId)
        .eq('user_id', user.id); // Ensure user can only delete their own sessions

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log(`Delete result: ${count} rows affected`);

      if (count === 0) {
        throw new Error('Session not found or you do not have permission to delete it');
      }

      // Invalidate cache since we deleted an interview
      onInterviewUpdated(sessionId);

      console.log(`✅ Interview ${sessionId} deleted successfully, cache invalidated`);
      return true;
    } catch (error) {
      console.error('Error deleting interview session:', error);
      throw error;
    }
  }, [onInterviewUpdated, user?.id]);

  return {
    // Data
    sessions,
    stats,
    profile,
    sessionDetails,

    // Optimized fetch functions
    fetchSessions,
    fetchStats,
    fetchProfile,
    fetchSessionDetail,

    // CRUD operations with cache invalidation
    createInterviewSession,
    completeInterviewSession,
    updateInterviewSession,
    deleteInterviewSession,

    // Cache status
    isCached: {
      sessions: isSessionsCacheValid(),
      stats: isStatsCacheValid(),
      profile: isProfileCacheValid(),
      sessionDetail: (sessionId: string) => isSessionDetailCacheValid(sessionId),
    }
  };
}