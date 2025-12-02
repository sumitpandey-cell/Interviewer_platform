import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCacheStore } from '@/stores/use-cache-store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CompanyTemplate } from '@/types/company-types';
import { PerformanceHistory, PerformanceMetrics } from '@/types/performance-types';

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
      // Only count duration from completed interviews to avoid inflating practice time
      const timePracticed = completedSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const rank = totalInterviews > 0 ? Math.max(100 - totalInterviews * 5, 1) : 0;

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

  // Fetch all company templates
  const fetchCompanyTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching company templates:', error);
        toast.error('Failed to load company templates');
        return [];
      }

      return (data || []) as CompanyTemplate[];
    } catch (error) {
      console.error('Error in fetchCompanyTemplates:', error);
      return [];
    }
  }, []);

  // Fetch company template by slug
  const fetchCompanyTemplateBySlug = useCallback(async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('company_templates')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching company template:', error);
        return null;
      }

      return data as CompanyTemplate;
    } catch (error) {
      console.error('Error in fetchCompanyTemplateBySlug:', error);
      return null;
    }
  }, []);

  // Create interview session with cache invalidation
  const createInterviewSession = useCallback(async (sessionData: {
    position: string;
    interview_type: string;
    duration_minutes?: number;
    config?: any;
  }) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          position: sessionData.position,
          interview_type: sessionData.interview_type,
          duration_minutes: sessionData.duration_minutes || 0, // Default to 0 for in-progress
          status: 'in_progress',
          config: sessionData.config || {},
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

  // Fetch recent performance metrics from last 3 interviews
  const fetchRecentPerformanceMetrics = useCallback(async (): Promise<PerformanceHistory> => {
    if (!user?.id) {
      return {
        recentInterviews: [],
        averageScores: {
          technicalKnowledge: 0,
          communication: 0,
          problemSolving: 0,
          adaptability: 0,
          overall: 0,
        },
        trend: 'insufficient_data',
      };
    }

    try {
      console.log('🔍 Fetching recent performance metrics for user:', user.id);

      // Fetch last 3 completed interviews with feedback
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('id, position, interview_type, completed_at, score, feedback')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('feedback', 'is', null)
        .not('score', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching performance metrics:', error);
        return {
          recentInterviews: [],
          averageScores: {
            technicalKnowledge: 0,
            communication: 0,
            problemSolving: 0,
            adaptability: 0,
            overall: 0,
          },
          trend: 'insufficient_data',
        };
      }

      if (!data || data.length === 0) {
        console.log('📊 No previous interview data found');
        return {
          recentInterviews: [],
          averageScores: {
            technicalKnowledge: 0,
            communication: 0,
            problemSolving: 0,
            adaptability: 0,
            overall: 0,
          },
          trend: 'insufficient_data',
        };
      }

      console.log(`📊 Found ${data.length} previous interviews with feedback`);

      // Extract performance metrics from each session
      const recentInterviews: PerformanceMetrics[] = data.map((session) => {
        const feedback = session.feedback as any;
        const skills = feedback?.skills || [];

        return {
          sessionId: session.id,
          position: session.position,
          interviewType: session.interview_type,
          completedAt: session.completed_at || '',
          skills: skills.map((skill: any) => ({
            name: skill.name,
            score: skill.score || 0,
            feedback: skill.feedback || '',
          })),
          overallScore: session.score || 0,
        };
      });

      // Calculate average scores across all interviews
      const totalInterviews = recentInterviews.length;
      let techSum = 0, commSum = 0, probSum = 0, adaptSum = 0, overallSum = 0;

      recentInterviews.forEach((interview) => {
        interview.skills.forEach((skill) => {
          const skillName = skill.name.toLowerCase();
          if (skillName.includes('technical')) techSum += skill.score;
          else if (skillName.includes('communication')) commSum += skill.score;
          else if (skillName.includes('problem')) probSum += skill.score;
          else if (skillName.includes('adaptability')) adaptSum += skill.score;
        });
        overallSum += interview.overallScore;
      });

      const averageScores = {
        technicalKnowledge: Math.round(techSum / totalInterviews),
        communication: Math.round(commSum / totalInterviews),
        problemSolving: Math.round(probSum / totalInterviews),
        adaptability: Math.round(adaptSum / totalInterviews),
        overall: Math.round(overallSum / totalInterviews),
      };

      // Determine trend (comparing most recent to oldest in the set)
      let trend: PerformanceHistory['trend'] = 'insufficient_data';
      if (totalInterviews >= 2) {
        const recentScore = recentInterviews[0].overallScore;
        const oldestScore = recentInterviews[totalInterviews - 1].overallScore;
        const difference = recentScore - oldestScore;

        if (difference > 5) trend = 'improving';
        else if (difference < -5) trend = 'declining';
        else trend = 'consistent';
      }

      console.log('📈 Performance metrics calculated:', {
        totalInterviews,
        averageScores,
        trend,
      });

      return {
        recentInterviews,
        averageScores,
        trend,
      };
    } catch (error) {
      console.error('Error in fetchRecentPerformanceMetrics:', error);
      return {
        recentInterviews: [],
        averageScores: {
          technicalKnowledge: 0,
          communication: 0,
          problemSolving: 0,
          adaptability: 0,
          overall: 0,
        },
        trend: 'insufficient_data',
      };
    }
  }, [user?.id]);

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
    fetchCompanyTemplates,
    fetchCompanyTemplateBySlug,
    fetchRecentPerformanceMetrics,

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