import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Code, 
  Users, 
  ArrowRight, 
  MessageSquare,
  X,
  Gift
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InterviewSession {
  id: string;
  interview_type: string;
  position: string;
  score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    timePracticed: 0,
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
      
      // Calculate stats
      const completed = data.filter(s => s.status === "completed");
      const totalScore = completed.reduce((sum, s) => sum + (s.score || 0), 0);
      const totalTime = completed.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      
      setStats({
        totalInterviews: completed.length,
        averageScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
        timePracticed: totalTime,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">
            Welcome {user?.user_metadata?.full_name || "back"}!
          </h2>
          <p className="text-muted-foreground">
            Practice, earn streaks & boost your rank!
          </p>
        </div>

        {/* Daily Free Offer Banner */}
        {showBanner && (
          <Alert className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
            <Gift className="h-5 w-5 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    ✨ DAILY FREE OFFER
                  </span>
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    30 min daily
                  </Badge>
                </div>
                <p className="text-sm text-foreground">
                  <strong>Get 30 Minutes FREE Interview Practice Daily!</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Perfect your skills with our AI-powered mock interviews - completely free, every single day
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBanner(false)}
                className="ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stats.totalInterviews}
                  </p>
                  <p className="mt-1 text-sm text-primary">
                    {stats.totalInterviews > 0 ? "Interviews" : "Keep Going"}
                  </p>
                </div>
                <Target className="h-12 w-12 text-muted" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stats.averageScore}
                  </p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    {stats.averageScore > 60 ? "Rising Star" : "Getting Started"}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Time Practiced</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stats.timePracticed}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">(mins) Keep Going</p>
                </div>
                <Clock className="h-12 w-12 text-muted" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leaderboard</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">#55</p>
                  <p className="mt-1 text-sm text-purple-600 dark:text-purple-400">
                    Beginner Mode
                  </p>
                </div>
                <Trophy className="h-12 w-12 text-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interview Type Section */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-foreground">Interview Type</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardContent className="p-6">
                <Code className="mb-4 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h4 className="mb-2 text-lg font-semibold text-foreground">Test Yourself</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Realistic interview, get scored, no hints during.
                </p>
                <Button className="w-full">
                  Start <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
              <CardContent className="p-6">
                <Users className="mb-4 h-8 w-8 text-purple-600 dark:text-purple-400" />
                <h4 className="mb-2 text-lg font-semibold text-foreground">Practice with Help</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  AI guides you through answers, corrects mistakes in real-time.
                </p>
                <Button variant="outline" className="w-full">
                  Start <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {sessions.length > 0 && (
              <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardContent className="p-6">
                  <MessageSquare className="mb-4 h-8 w-8 text-green-600 dark:text-green-400" />
                  <h4 className="mb-2 text-lg font-semibold text-foreground">
                    Last Interview Summary
                  </h4>
                  <div className="mb-2 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Interview Type:</span> {sessions[0].interview_type}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Position:</span> {sessions[0].position}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Overall Score:</span> {sessions[0].score || 0}%
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Practice Sessions */}
        {sessions.length > 0 && (
          <div>
            <h3 className="mb-4 text-xl font-semibold text-foreground">
              Recent Practice Sessions
            </h3>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Interview Type
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Position
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id} className="border-b last:border-0">
                          <td className="p-4 text-sm text-foreground">
                            {session.interview_type}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {session.position}
                          </td>
                          <td className="p-4 text-sm text-foreground">
                            {session.score || 0}%
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                session.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {session.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              Report
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Start Interview CTA */}
        <Card className="border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-8 text-center">
            <h3 className="mb-2 text-2xl font-bold text-foreground">
              Ready to Start an Interview?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Choose your interview type and begin practicing now
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Code className="mr-2 h-5 w-5" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}