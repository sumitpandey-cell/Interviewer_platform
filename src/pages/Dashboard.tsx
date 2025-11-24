import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MessageSquare,
  X,
  Gift,
  Play,
  FileText,
  ExternalLink,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 2,
    averageScore: 19,
    timePracticed: 9,
    rank: 38
  });

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setSessions(data);
      // In a real app, we'd calculate stats here. 
      // For now, using the hardcoded values from the image for the "perfect clone" look, 
      // but keeping the logic ready for real data.
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-indigo-600">
              Welcome {user?.user_metadata?.full_name?.split(' ')[0] || "ujjawal"}!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Practice, earn streaks & boost your rank!
            </p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600 text-white font-medium px-6">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Start Interview
          </Button>
        </div>

        {/* Daily Free Offer Banner */}
        {showBanner && (
          <div className="relative overflow-hidden rounded-xl bg-[#10B981] p-6 text-white shadow-lg">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute right-4 top-4 text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="rounded-full bg-white/20 p-3">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                    ✨ Daily Free Offer
                  </span>
                </div>
                <h3 className="text-xl font-bold">
                  Get 30 Minutes FREE Interview Practice Daily!
                </h3>
                <p className="text-sm text-white/90">
                  Perfect your skills with our AI-powered mock interviews - completely free, every single day
                </p>
              </div>
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  30 min daily
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="text-2xl font-bold text-foreground">{stats.totalInterviews} <span className="text-lg font-normal text-blue-600">Interviews</span></h3>
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
                <h3 className="text-2xl font-bold text-foreground">{stats.averageScore} <span className="text-lg font-normal text-yellow-600">Rising Star</span></h3>
                <p className="text-xs text-muted-foreground">Consistently scoring above 60</p>
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
                <h3 className="text-2xl font-bold text-foreground">{stats.timePracticed} <span className="text-lg font-normal text-green-600">(mins) Keep Going</span></h3>
                <p className="text-xs text-muted-foreground">Start practicing to earn your first badge!</p>
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
                  #55
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-foreground">{stats.rank} <span className="text-lg font-normal text-purple-600">Beginner Mode</span></h3>
                <p className="text-xs text-muted-foreground">Just started — room to grow and explore!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Type Section */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-foreground">Interview Type</h3>
          <div className="grid gap-6 lg:grid-cols-3">
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
                  <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm" onClick={() => navigate('/start-interview')}>
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
                  <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm">
                    Start <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Last Interview Summary */}
            <Card className="border-none shadow-sm bg-green-50/30">
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-lg bg-green-100 p-2">
                    <Code className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-foreground">Last Interview Summary</h4>
                  <div className="space-y-1 text-sm mt-4">
                    <p className="text-muted-foreground">
                      Interview Type: <span className="font-semibold text-foreground">Technical</span>
                    </p>
                    <p className="text-muted-foreground">
                      Position: <span className="font-semibold text-foreground">Frontend Intern</span>
                    </p>
                    <p className="text-muted-foreground">
                      Overall Score: <span className="font-semibold text-foreground">20%</span>
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" className="bg-white hover:bg-gray-50 text-foreground shadow-sm" onClick={() => navigate('/interview/mock-session-id/report')}>
                    Report <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Practice Sessions */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Recent Practice Sessions
          </h3>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  <tr className="bg-white hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">
                      Technical
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      2025-11-20
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Frontend Intern
                    </td>
                    <td className="p-4 text-sm text-foreground font-medium">
                      20%
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Completed
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => navigate('/interview/mock-session-id/report')}>
                          Report <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Add more rows if needed, or map from sessions */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}