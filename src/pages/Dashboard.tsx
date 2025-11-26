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
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Star,
  MoreHorizontal
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

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
    profile,
    fetchProfile
  } = useOptimizedQueries();

  const { remaining_minutes, allowed, type: subscriptionType, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (user) {
      loadDashboardData();
      fetchProfile();
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
      const loadingToastId = toast.info(state.message || "Your interview report is being generated. This may take a few moments.", {
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
        setTimeout(checkReportStatus, 3000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigate, fetchSessionDetail]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSessions(),
        fetchStats()
      ]);
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

  // Helper to render stars based on score
  const renderStars = (score: number | null) => {
    if (score === null) return <div className="flex gap-1"><Star className="h-4 w-4 text-gray-300" /></div>;
    const stars = Math.round((score / 100) * 5);
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout showTopNav={false}>
      <div className="p-6 sm:p-8 h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Good morning, {user?.user_metadata?.full_name?.split(' ')[0] || "User"}!
            </h1>
            <p className="text-gray-500 mt-1">
              Aura: Your AI Voice Interviewer.
            </p>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto pl-2 pr-4 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
                      user?.id || user?.email || 'user',
                      'avataaars',
                      user?.user_metadata?.picture
                    )} />
                    <AvatarFallback>
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {profile?.full_name || user?.user_metadata?.full_name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <div className="p-1.5 rounded-full bg-white shadow-sm">
                <Sun className="h-4 w-4 text-gray-700" />
              </div>
              <div className="p-1.5 rounded-full">
                <Moon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Action & Stats Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 mb-8">
          <Button
            className="w-full lg:w-[200px] h-[56px] bg-black hover:bg-gray-900 text-white text-base font-medium rounded-xl shadow-none transition-transform hover:scale-[1.01] active:scale-[0.99]"
            onClick={startInterview}
            disabled={loading || subscriptionLoading || !allowed}
          >
            {loading || subscriptionLoading ? "Loading..." : !allowed ? "Limit Reached" : "Start Interview"}
          </Button>

          <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex flex-col items-center sm:items-start">
              <div className="text-sm font-medium text-gray-500 mb-1">Number of Interviews:</div>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalInterviews || 0}</div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
            <div className="block sm:hidden w-full h-px bg-gray-200 my-4"></div>

            <div className="flex flex-col items-center sm:items-start">
              <div className="text-sm font-medium text-gray-500 mb-1">Average Score:</div>
              <div className="text-3xl font-bold text-gray-900">{stats?.averageScore || 0}%</div>
            </div>

            <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
            <div className="block sm:hidden w-full h-px bg-gray-200 my-4"></div>

            <div className="flex flex-col items-center sm:items-start">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Timing:</div>
              <div className="text-3xl font-bold text-gray-900">
                {Math.floor((stats?.timePracticed || 0) / 60)}h {(stats?.timePracticed || 0) % 60}m
              </div>
            </div>
          </div>
        </div>

        {/* Report Progress Banner */}
        {showReportProgress && (
          <Card className="border-blue-200 bg-blue-50 mb-8">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview List Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Interviews</h2>
            <Button variant="link" className="text-blue-600 font-medium" onClick={() => navigate('/reports')}>
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-4 text-base font-medium text-gray-500">Interviewee</th>
                  <th className="text-left py-4 px-4 text-base font-medium text-gray-500">Date</th>
                  <th className="text-left py-4 px-4 text-base font-medium text-gray-500">Status</th>
                  <th className="text-left py-4 px-4 text-base font-medium text-gray-500">Feedback</th>
                  <th className="text-right py-4 px-4 text-base font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-10 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-10 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : sessions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No interviews yet. Start one today!
                    </td>
                  </tr>
                ) : (
                  sessions?.slice(0, 7).map((session) => (
                    <tr key={session.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-gray-100">
                            <AvatarImage src={getAvatarUrl(
                              profile?.avatar_url || user?.user_metadata?.avatar_url,
                              user?.id || 'user',
                              'avataaars'
                            )} />
                            <AvatarFallback>
                              {getInitials(profile?.full_name || user?.user_metadata?.full_name) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 text-base">
                              {profile?.full_name || user?.user_metadata?.full_name || "User"}
                            </div>
                            <div className="text-sm text-gray-500">{session.interview_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-base text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${session.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : session.status === 'success'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-blue-50 text-blue-700'}
                        `}>
                          {session.status === 'completed' ? 'Completed' : session.status === 'success' ? 'Success' : 'In Progress'}
                        </span>
                      </td>
                      <td className="p-4">
                        {renderStars(session.score)}
                      </td>
                      <td className="p-4 text-right">
                        {session.status === 'completed' && session.score !== null ? (
                          <Button
                            variant="outline"
                            className="rounded-xl border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 hover:text-gray-900"
                            onClick={() => navigate(`/interview/${session.id}/report`)}
                          >
                            Report
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                            onClick={() => navigate(`/interview/${session.id}/active`)}
                          >
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
    </DashboardLayout>
  );
}