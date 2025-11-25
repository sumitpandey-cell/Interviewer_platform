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
  Trash2
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

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    // Add confirmation dialog
    const confirmed = window.confirm("Are you sure you want to delete this interview session? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      console.log('Attempting to delete session:', id);
      await deleteInterviewSession(id);
      console.log('Session deleted successfully');
      toast.success("Session deleted");

      // The optimized hook will automatically invalidate cache
      // Refresh data to update UI
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error deleting session:", error);
      toast.error(error.message || "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  const startInterview = () => {
    navigate('/start-interview');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-indigo-600">
              Welcome {user?.user_metadata?.full_name?.split(' ')[0] || "User"}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice, earn streaks & boost your rank!
            </p>
          </div>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 w-full sm:w-auto"
            onClick={() => startInterview()}
            disabled={loading || subscriptionLoading || !allowed}
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            {loading || subscriptionLoading ? "Loading..." : !allowed ? "Daily Limit Reached" : "Start Interview"}
          </Button>
        </div>

        {/* Report Generation Progress Banner */}
        {showReportProgress && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Report Generation in Progress</h3>
                  <p className="text-sm text-blue-700">
                    Your interview report is being generated. You'll be notified when it's ready to view.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => setShowReportProgress(false)}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Remaining Banner */}
        <div className={`relative overflow-hidden rounded-xl p-4 sm:p-6 text-white shadow-lg mb-6 ${!allowed ? 'bg-red-500' : 'bg-indigo-600'
          }`}>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="rounded-full bg-white/20 p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                  {subscriptionType === 'free' ? 'Free Plan' : 'Premium Plan'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">
                {!allowed
                  ? "You've used your daily interview time!"
                  : `You have ${remaining_minutes} minutes remaining ${subscriptionType === 'free' ? 'today' : 'this month'}`
                }
              </h3>
              <p className="text-sm text-white/90">
                {subscriptionType === 'free'
                  ? "Free users get 30 minutes of interview practice every day. Resets at midnight IST."
                  : "Upgrade to Business for unlimited minutes!"
                }
              </p>
            </div>
            <div className="sm:absolute sm:right-12 sm:top-1/2 sm:-translate-y-1/2">
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Clock className="h-4 w-4" />
                {remaining_minutes} min left
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Interviews */}
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted-foreground">Total Interviews</span>
                <div className="rounded-full bg-white p-1">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground">{stats?.totalInterviews || 0} <span className="text-lg font-normal text-blue-600">Interviews</span></h3>
                )}
                <p className="text-xs text-muted-foreground">Total Interviews completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="border-none shadow-sm bg-yellow-50/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted-foreground">Average Score</span>
                <div className="rounded-full bg-white p-1">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground">{stats?.averageScore || 0}% <span className="text-lg font-normal text-yellow-600">Average</span></h3>
                )}
                <p className="text-xs text-muted-foreground">Consistently scoring above {(stats?.averageScore || 0) > 0 ? (stats?.averageScore || 0) - 5 : 0}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Time Practiced */}
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted-foreground">Time Practiced</span>
                <div className="rounded-full bg-white p-1">
                  <Clock className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground">{stats?.timePracticed || 0} <span className="text-lg font-normal text-green-600">mins</span></h3>
                )}
                <p className="text-xs text-muted-foreground">Keep practicing!</p>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="border-none shadow-sm bg-purple-50/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Leaderboard <ArrowUpRight className="h-3 w-3" />
                </span>
                <div className="flex items-center gap-1 text-sm font-bold text-purple-600">
                  <Trophy className="h-4 w-4 fill-current" />
                  #{stats?.rank || '-'}
                </div>
              </div>
              <div className="space-y-1">
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground">{(stats?.rank || 0) > 0 ? `Top ${Math.min(stats?.rank || 0, 100)}%` : 'NO'} <span className="text-lg font-normal text-purple-600">Global</span></h3>
                )}
                <p className="text-xs text-muted-foreground">Compete with others!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Type Section */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-foreground">Interview Type</h3>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Test Yourself */}
            <Card className="border-none shadow-sm bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-2">
                    <Code className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-foreground">Test Yourself</h4>
                  <p className="text-sm text-muted-foreground">
                    Realistic interview, get scored, no hints during.
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm" onClick={() => startInterview()}>
                    Start <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Practice with Help */}
            <Card className="border-none shadow-sm bg-purple-50/30 hover:bg-purple-50/50 transition-colors">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-foreground">Practice with Help</h4>
                  <p className="text-sm text-muted-foreground">
                    AI guides you through answers, corrects mistakes in real-time.
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm" onClick={() => startInterview()}>
                    Start <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Last Interview Summary */}
            {sessions && sessions.length > 0 && (
              <Card className="border-none shadow-sm bg-green-50/30">
                <CardContent className="p-6 flex flex-col h-full justify-between">
                  <div>
                    <div className="mb-4 inline-flex rounded-lg bg-green-100 p-2">
                      <Code className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="mb-2 text-lg font-bold text-foreground">Last Interview Summary</h4>
                    <div className="space-y-1 text-sm mt-4">
                      <p className="text-muted-foreground">
                        Interview Type: <span className="font-semibold text-foreground">{sessions[0]?.interview_type}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Position: <span className="font-semibold text-foreground">{sessions[0]?.position}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Overall Score: <span className="font-semibold text-foreground">{sessions[0]?.score !== null ? `${sessions[0]?.score}%` : 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm" onClick={() => navigate(`/interview/${sessions[0]?.id}/report`)}>
                      Report <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Practice Sessions */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Recent Practice Sessions
          </h3>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Interview Type
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Position
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="p-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : sessions?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No interviews yet. Start one today!
                      </td>
                    </tr>
                  ) : (
                    sessions?.slice(0, 5).map((session) => (
                      <tr key={session.id} className="bg-white hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-foreground">
                          {session.interview_type}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {session.position}
                        </td>
                        <td className="p-4 text-sm text-foreground font-medium">
                          {session.score !== null ? `${session.score}%` : '-'}
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={`
                            ${session.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}
                          `}>
                            {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8" onClick={() => navigate(`/interview/${session.id}/report`)}>
                              Report <ExternalLink className="ml-2 h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(session.id)}
                              disabled={deletingId === session.id}
                            >
                              {deletingId === session.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
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