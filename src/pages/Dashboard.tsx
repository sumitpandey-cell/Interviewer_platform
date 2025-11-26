import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  TrendingUp,
  Clock,
  Trophy,
  Code,
  Users,
  ArrowUpRight,
  X,
  Gift,
  Play,
  ExternalLink,
  Sparkles,
  Zap,
  Calendar,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  duration_minutes: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showReportProgress, setShowReportProgress] = useState(false);

  // Use optimized queries hook
  const {
    sessions,
    stats,
    fetchSessions,
    fetchStats,
    fetchSessionDetail,
    deleteInterviewSession,
    isCached
  } = useOptimizedQueries();

  const { remaining_minutes, allowed, type: subscriptionType, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const pollingRef = useRef<string | null>(null);

  // Handle progress message from interview completion
  useEffect(() => {
    const state = location.state as any;
    if (state?.showReportProgress) {
      // Prevent duplicate execution for the same session
      if (state.sessionId && pollingRef.current === state.sessionId) {
        return;
      }

      if (state.sessionId) {
        pollingRef.current = state.sessionId;
      }

      setShowReportProgress(true);
      const loadingToastId = toast.info(state.message || "Your interview report is being generated. This may take a few moments.", {
        duration: 10000
      });

      // Check for report completion periodically
      if (state.sessionId) {
        let checkCount = 0;
        const maxChecks = 20; // Check for up to ~1 minute (20 * 3 seconds)

        const checkReportStatus = async () => {
          try {
            checkCount++;
            const sessionData = await fetchSessionDetail(state.sessionId, true); // Force refresh

            if (!sessionData) {
              console.error('Session not found');
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);
              return;
            }

            // If feedback exists or status is completed, report is ready
            if ((sessionData as any).feedback || sessionData.status === 'completed') {
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);

              // Refresh the sessions list to show the completed interview
              await loadDashboardData();

              toast.success("Your interview report is ready!", {
                duration: 8000,
                action: {
                  label: "View Report",
                  onClick: () => navigate(`/interview/${state.sessionId}/report`)
                }
              });
              return;
            }

            // Continue checking if still processing and haven't exceeded max checks
            if (checkCount < maxChecks) {
              setTimeout(checkReportStatus, 3000);
            } else {
              // Max checks reached, show message to check back later
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);
              toast.info("Report generation is taking longer than expected. Please check back in a few minutes.", {
                duration: 10000,
                action: {
                  label: "View Reports",
                  onClick: () => navigate('/reports')
                }
              });
            }
          } catch (error) {
            console.error('Error checking report status:', error);
            setShowReportProgress(false);
            toast.dismiss(loadingToastId);
            toast.error("Unable to check report status. Please refresh the page.");
          }
        };

        // Start checking after 3 seconds (give time for initial processing)
        setTimeout(checkReportStatus, 3000);
      }

      // Clear the state to prevent showing progress on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigate, fetchSessionDetail]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Load dashboard data using optimized queries
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Loading dashboard data...');

      // Fetch both sessions and stats - will use cache if available
      const [sessionsData, statsData] = await Promise.all([
        fetchSessions(),
        fetchStats()
      ]);

      console.log('📊 Dashboard data loaded:', {
        sessionsCount: sessionsData?.length || 0,
        statsCalculated: statsData ? 'yes' : 'no',
        fromCache: {
          sessions: isCached.sessions,
          stats: isCached.stats
        }
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    navigate('/start-interview');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || "User"}!
            </h2>
            <p className="mt-2 text-muted-foreground text-lg">
              Ready to ace your next interview? Let's get practicing.
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-6 rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40"
            onClick={() => startInterview()}
            disabled={loading || subscriptionLoading || !allowed}
          >
            <Play className="mr-2 h-5 w-5 fill-current" />
            <span className="text-lg">{loading || subscriptionLoading ? "Loading..." : !allowed ? "Daily Limit Reached" : "Start Interview"}</span>
          </Button>
        </div>

        {/* Report Generation Progress Banner */}
        {showReportProgress && (
          <Card className="border-primary/20 bg-primary/5 animate-in fade-in zoom-in-95 duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary">Report Generation in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Your interview report is being generated. You'll be notified when it's ready to view.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10"
                  onClick={() => setShowReportProgress(false)}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Stats Cards - Moved Up for Better Visibility */}
        <div>
          <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Your Performance
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Interviews */}
            <Card className="group border-2 border-border/50 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Interviews</span>
                  <div className="rounded-xl bg-blue-500/15 p-2.5 group-hover:bg-blue-500/25 transition-colors shadow-lg">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <h3 className="text-4xl font-black text-foreground tracking-tight">{stats?.totalInterviews || 0}</h3>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">Completed sessions</p>
                </div>
              </CardContent>
            </Card>

            {/* Average Score */}
            <Card className="group border-2 border-border/50 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Average Score</span>
                  <div className="rounded-xl bg-yellow-500/15 p-2.5 group-hover:bg-yellow-500/25 transition-colors shadow-lg">
                    <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <h3 className="text-4xl font-black text-foreground tracking-tight">{stats?.averageScore || 0}%</h3>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">
                    {(stats?.averageScore || 0) > 80 ? "Excellent performance!" : "Keep practicing to improve"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Time Practiced */}
            <Card className="group border-2 border-border/50 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Time Practiced</span>
                  <div className="rounded-xl bg-green-500/15 p-2.5 group-hover:bg-green-500/25 transition-colors shadow-lg">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <h3 className="text-4xl font-black text-foreground tracking-tight">{stats?.timePracticed || 0} <span className="text-xl font-semibold text-muted-foreground">min</span></h3>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">Total practice time</p>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="group border-2 border-border/50 shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden cursor-pointer" onClick={() => navigate('/leaderboard')}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    Global Rank <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </span>
                  <div className="rounded-xl bg-purple-500/15 p-2.5 group-hover:bg-purple-500/25 transition-colors shadow-lg">
                    <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  {loading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <h3 className="text-4xl font-black text-foreground tracking-tight">#{stats?.rank || '-'}</h3>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">
                    {(stats?.rank || 0) > 0 ? `Top ${Math.min(stats?.rank || 0, 100)}% of users` : 'Start practicing to rank up'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interview Type Section */}
        <div>
          <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Start New Interview
          </h3>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Test Yourself */}
            <Card className="group border-none shadow-lg bg-gradient-to-br from-blue-500/5 to-blue-600/5 hover:from-blue-500/10 hover:to-blue-600/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer relative overflow-hidden" onClick={() => startInterview()}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Code className="h-32 w-32" />
              </div>
              <CardContent className="p-8 flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="mb-6 inline-flex rounded-2xl bg-blue-500/10 p-3 group-hover:bg-blue-500/20 transition-colors">
                    <Code className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="mb-3 text-2xl font-bold text-foreground">Test Yourself</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Realistic interview simulation. Get scored on your performance with no hints during the session.
                  </p>
                </div>
                <div className="mt-8 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Start Session <ArrowUpRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Practice with Help */}
            <Card className="group border-none shadow-lg bg-gradient-to-br from-purple-500/5 to-purple-600/5 hover:from-purple-500/10 hover:to-purple-600/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer relative overflow-hidden" onClick={() => startInterview()}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Users className="h-32 w-32" />
              </div>
              <CardContent className="p-8 flex flex-col h-full justify-between relative z-10">
                <div>
                  <div className="mb-6 inline-flex rounded-2xl bg-purple-500/10 p-3 group-hover:bg-purple-500/20 transition-colors">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="mb-3 text-2xl font-bold text-foreground">Practice with Help</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Guided practice session. AI provides real-time feedback and corrections to help you improve.
                  </p>
                </div>
                <div className="mt-8 flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Start Practice <ArrowUpRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Last Interview Summary */}
            {sessions && sessions.length > 0 && (
              <Card className="group border-none shadow-lg bg-gradient-to-br from-green-500/5 to-green-600/5 hover:from-green-500/10 hover:to-green-600/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                <CardContent className="p-8 flex flex-col h-full justify-between relative z-10">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="inline-flex rounded-2xl bg-green-500/10 p-3">
                        <Calendar className="h-8 w-8 text-green-600" />
                      </div>
                      <Badge variant="secondary" className={`${sessions[0]?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sessions[0]?.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <h4 className="mb-4 text-xl font-bold text-foreground">Last Session</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-border/50 pb-2">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <span className="font-medium">{sessions[0]?.interview_type}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border/50 pb-2">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <span className="font-medium truncate max-w-[120px]">{sessions[0]?.position}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Score</span>
                        <span className="font-bold text-lg text-primary">{sessions[0]?.score !== null ? `${sessions[0]?.score}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    {sessions[0]?.status === 'completed' && sessions[0]?.score !== null ? (
                      <Button className="w-full bg-white text-foreground hover:bg-gray-50 shadow-sm border border-border/50" onClick={() => navigate(`/interview/${sessions[0]?.id}/report`)}>
                        View Report <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={() => navigate(`/interview/${sessions[0]?.id}/active`)}>
                        <Play className="mr-2 h-4 w-4" />
                        Continue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Practice Sessions */}
        <div>
          <h3 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent History
          </h3>
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Interview Type
                    </th>
                    <th className="p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Position
                    </th>
                    <th className="p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                    <th className="p-6 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-6 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="p-6"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-6"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-6"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-6"><Skeleton className="h-4 w-12" /></td>
                        <td className="p-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="p-6"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : sessions?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-lg font-medium">No interviews yet</p>
                          <p className="text-sm">Start your first interview to see your history here.</p>
                          <Button variant="outline" className="mt-2" onClick={() => startInterview()}>Start Interview</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions?.slice(0, 5).map((session) => (
                      <tr key={session.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="p-6 text-sm font-semibold text-foreground">
                          {session.interview_type}
                        </td>
                        <td className="p-6 text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-6 text-sm text-muted-foreground">
                          {session.position}
                        </td>
                        <td className="p-6">
                          {session.score !== null ? (
                            <span className={`font-bold ${session.score >= 80 ? 'text-green-600' : session.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {session.score}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-6">
                          <Badge variant="secondary" className={`
                            ${session.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                          `}>
                            {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </Badge>
                        </td>
                        <td className="p-6 text-right">
                          {session.status === 'completed' && session.score !== null ? (
                            <Button variant="ghost" size="sm" className="h-8 hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/interview/${session.id}/report`)}>
                              Report <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10" onClick={() => navigate(`/interview/${session.id}/active`)}>
                              <Play className="mr-2 h-3 w-3" />
                              Continue
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}