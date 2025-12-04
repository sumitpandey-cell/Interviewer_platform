import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showReportProgress, setShowReportProgress] = useState(false);

  // Use optimized queries hook
  const {
    sessions,
    stats,
    fetchSessions,
    fetchStats,
    fetchSessionDetail,
    profile
  } = useOptimizedQueries();

  const { allowed, loading: subscriptionLoading } = useSubscription();

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
      if (state.sessionId && pollingRef.current === state.sessionId) {
        return;
      }

      if (state.sessionId) {
        pollingRef.current = state.sessionId;
      }

      setShowReportProgress(true);
      const loadingToastId = toast.info(state.message || "Your interview report is being generated.", {
        duration: 10000
      });

      if (state.sessionId) {
        let checkCount = 0;
        const maxChecks = 20;

        const checkReportStatus = async () => {
          try {
            checkCount++;
            const sessionData = await fetchSessionDetail(state.sessionId, true);

            if (!sessionData) {
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);
              return;
            }

            if ((sessionData as any).feedback || sessionData.status === 'completed') {
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);
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

            if (checkCount < maxChecks) {
              setTimeout(checkReportStatus, 3000);
            } else {
              setShowReportProgress(false);
              toast.dismiss(loadingToastId);
              toast.info("Report generation is taking longer than expected.", {
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
          }
        };
        setTimeout(checkReportStatus, 3000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigate, fetchSessionDetail]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSessions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    navigate('/start-interview');
  };

  // Helper to render stars based on score
  const renderStars = (score: number | null) => {
    if (score === null) return <span className="text-muted-foreground">-</span>;
    const stars = Math.round(score / 20); // 0-5 stars
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Helper to format time
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section with Controls */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Good morning, {profile?.full_name?.split(' ')[0] || "James"}!
            </h1>
            <p className="text-muted-foreground text-sm">Arjuna AI: Your AI Voice Interviewer.</p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 ">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex bg-card items-center gap-2 hover:bg-accent border border-border rounded-full px-2 py-1.5 transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url,
                      user?.id || 'user',
                      'avataaars',
                      null,
                      user?.user_metadata?.gender
                    )} />
                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {profile?.full_name?.split(' ')[0] || "User"}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
          </div>
        </div>

        {/* Top Actions Section */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6">
          <Button
            className="h-auto w-full xl:w-auto px-8 xl:px-16 py-4 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg transition-transform hover:scale-105 font-medium"
            onClick={startInterview}
            disabled={loading || subscriptionLoading || !allowed}
          >
            {loading ? "Loading..." : "Start Interview"}
          </Button>

          <div className="grid grid-cols-2 gap-6 md:gap-0 md:flex md:divide-x md:divide-border xl:ml-auto bg-card rounded-2xl p-6 md:px-8 md:py-5 shadow-sm border border-border">
            <div className="flex flex-col md:pr-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Number of Interviews:</span>
              {loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-2xl md:text-4xl font-bold text-foreground">{stats?.totalInterviews || 0}</span>
              )}
            </div>

            <div className="flex flex-col md:px-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Total Timing:</span>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <span className="text-2xl md:text-4xl font-bold text-foreground">{formatTime(stats?.timePracticed || 0)}</span>
              )}
            </div>

            <div className="flex flex-col md:px-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Leaderboard Rank:</span>
              {loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-2xl md:text-4xl font-bold text-foreground">#{stats?.rank || 0}</span>
              )}
            </div>

            <div className="flex flex-col md:pl-8">
              <span className="text-sm text-muted-foreground mb-1 font-normal">Average Score:</span>
              {loading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <span className="text-2xl md:text-4xl font-bold text-foreground">{stats?.averageScore || 0}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Interview List Section */}
        <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg font-bold text-foreground">Recent Interviews</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reports')}
              className="text-muted-foreground hover:text-foreground"
            >
              View All →
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm pl-2 sm:pl-4">Role</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Date</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Type</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Duration</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Score</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm">Feedback</th>
                  <th className="pb-3 sm:pb-4 font-medium text-muted-foreground text-sm text-right pr-2 sm:pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 sm:py-4 pl-2 sm:pl-4"><div className="flex items-center gap-2 sm:gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3 sm:py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-3 sm:py-4 pr-2 sm:pr-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : sessions?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <p>No interviews yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions
                    ?.filter(s => s.status === 'completed' && s.score !== null)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 7)
                    .map((session) => (
                      <tr key={session.id} className="group hover:bg-muted/50 transition-colors">
                        <td className="py-3 sm:py-4 pl-2 sm:pl-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full font-medium bg-primary/10 text-primary items-center justify-center">
                              {(session.position || 'General').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{session.position || 'General Interview'}</span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 text-muted-foreground text-sm">
                          {new Date(session.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 sm:py-4 text-foreground text-sm font-medium capitalize">
                          {session.interview_type?.replace('_', ' ') || 'General'}
                        </td>
                        <td className="py-3 sm:py-4 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.duration_minutes || 0}m</span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4">
                          <Badge
                            variant="secondary"
                            className="font-normal px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            Completed
                          </Badge>
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className={`text-lg font-bold ${(session.score || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                            (session.score || 0) >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            {session.score}%
                          </span>
                        </td>
                        <td className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {renderStars(session.score)}
                            <div className="flex gap-1 ml-2 border-l pl-3 border-border">
                              <ThumbsUp className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 text-right pr-2 sm:pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border hover:bg-accent hover:text-accent-foreground px-3 sm:px-6 text-xs sm:text-sm h-7 sm:h-9"
                            onClick={() => navigate(`/interview/${session.id}/report`)}
                          >
                            Report
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}