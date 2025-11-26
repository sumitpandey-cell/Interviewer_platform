import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Download, MessageSquare, ExternalLink, Calendar, Clock, TrendingUp, Filter, SortAsc, SortDesc, Play, BarChart3, CheckCircle2, Target, Timer } from "lucide-react";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";

import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface InterviewSession {
  id: string;
  position: string;
  interview_type: string;
  score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions: cachedSessions, fetchSessions, isCached, deleteInterviewSession } = useOptimizedQueries();
  const { profile: userProfile, loading: profileLoading } = useUserProfile();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtering and sorting state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || hasLoaded) return;

      try {
        setLoading(true);
        setError(null);

        // Use cached sessions if available, otherwise fetch
        let sessionsData = cachedSessions;
        if (!isCached.sessions || cachedSessions.length === 0) {
          console.log('🔄 Fetching sessions data...');
          sessionsData = await fetchSessions();
        } else {
          console.log('📦 Using cached sessions data');
        }

        setSessions(sessionsData);
        setHasLoaded(true);
        setHasLoaded(true);
      } catch (err) {
        console.error('Error loading reports data:', err);
        setError('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, hasLoaded, cachedSessions, isCached.sessions]);

  // Sync cached data with local state
  useEffect(() => {
    if (cachedSessions.length > 0 && sessions.length === 0) {
      setSessions(cachedSessions);
    }
  }, [cachedSessions, sessions.length]);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);


  // Filtered and sorted sessions - optimized to reduce re-calculations
  const filteredAndSortedSessions = useMemo(() => {
    if (!sessions.length) return [];

    let filtered = sessions;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        if (statusFilter === 'completed') return session.status === 'completed' && session.score !== null;
        if (statusFilter === 'in-progress') return session.status === 'in_progress' || (session.status === 'completed' && session.score === null);
        return session.status === statusFilter;
      });
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(session =>
        session.position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(session =>
        session.position.toLowerCase().includes(query) ||
        session.interview_type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'score-asc':
          return (a.score || 0) - (b.score || 0);
        case 'score-desc':
          return (b.score || 0) - (a.score || 0);
        case 'duration-asc':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        case 'duration-desc':
          return (b.duration_minutes || 0) - (a.duration_minutes || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [sessions, statusFilter, positionFilter, sortBy, searchQuery]);

  // Get unique positions for filter dropdown - memoized
  const uniquePositions = useMemo(() => {
    if (!sessions.length) return [];
    const positions = [...new Set(sessions.map(s => s.position))];
    return positions.sort();
  }, [sessions]);

  const handleDelete = async (sessionId: string) => {
    try {
      setDeletingId(sessionId);
      await deleteInterviewSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string, score: number | null) => {
    switch (status) {
      case 'completed':
        return score !== null ? (
          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Processing
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Error Loading Reports</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.score !== null);
  const averageScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Track your interview performance and progress</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Link to="/start-interview">
              Start New Interview
            </Link>
          </Button>
        </div>

          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/start-interview">Start New Interview</Link>
          </Button>
        </div>

        {/* Statistics Card */}
        {completedSessions.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <Tabs defaultValue="overall" className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Statistics
                  </h3>
                  <TabsList className="grid w-[280px] grid-cols-2">
                    <TabsTrigger value="overall">Overall</TabsTrigger>
                    <TabsTrigger value="filtered">Filtered</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overall" className="mt-0">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Interviews</p>
                            <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-green-500/10 to-green-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                            <p className="text-3xl font-bold text-green-600">{completedSessions.length}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                            <p className="text-3xl font-bold text-purple-600">{averageScore}%</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Practice Time</p>
                            <p className="text-3xl font-bold text-orange-600">
                              {sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">minutes</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <Timer className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="filtered" className="mt-0">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-md bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Showing</p>
                            <p className="text-3xl font-bold text-cyan-600">{filteredAndSortedSessions.length}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-cyan-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                            <p className="text-3xl font-bold text-emerald-600">{filteredCompletedSessions.length}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-violet-500/10 to-violet-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                            <p className="text-3xl font-bold text-violet-600">{filteredAverageScore}%</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-violet-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Practice Time</p>
                            <p className="text-3xl font-bold text-amber-600">
                              {filteredAndSortedSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">minutes</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Timer className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Interview Reports Yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete your first interview to see detailed reports and analytics here.
              </p>
              <Button asChild>
                <Link to="/start-interview">Start Your First Interview</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            {/* Filters Section */}
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        <Card className="border-none shadow-md bg-card">
          <CardHeader className="p-6 border-b border-border/50">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-border"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] bg-background/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-[150px] bg-background/50">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] bg-background/50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="score-desc">Highest Score</SelectItem>
                    <SelectItem value="score-asc">Lowest Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground mb-6">
                  Start your first interview to generate reports and analytics.
                </p>
                <Button asChild>
                  <Link to="/start-interview">Start Interview</Link>
                </Button>
              </div>
            ) : filteredAndSortedSessions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No reports match your current filters.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setStatusFilter('all');
                    setPositionFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              </div>

              {filteredAndSortedSessions.length !== sessions.length && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {filteredAndSortedSessions.length} of {sessions.length} interviews
                </div>
              )}
            </CardContent>

            {/* Separator Line */}
            <div className="border-t border-border" />

            {/* Reports List Section */}
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {filteredAndSortedSessions.map((session) => (
                  <div key={session.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 border border-border rounded-lg hover:shadow-md hover:border-primary/50 transition-all bg-card">
                    {/* Left: Avatar & Main Info */}
                    <div className="flex items-center gap-4 w-full sm:flex-1">
                      <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full font-medium bg-primary/10 text-primary items-center justify-center">
                        {session.position.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base truncate text-foreground">
                          {session.position}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize font-medium text-foreground/80">{session.interview_type.replace('_', ' ')}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Status & Metrics */}
                    <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l sm:border-r border-border/50 py-3 sm:py-0 sm:px-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status, session.score)}
                      </div>

                      {session.duration_minutes && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                          <Clock className="h-4 w-4 text-muted-foreground/70" />
                          <span>{session.duration_minutes}m</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Score & Action */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {session.score !== null && (
                        <div className="flex flex-col items-end mr-2">
                          <span className={`text-lg font-bold leading-none ${session.score >= 80 ? 'text-green-600' :
                            session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {session.score}%
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Score</span>
                        </div>
                      )}

                      {session.status === 'completed' && session.score !== null ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Link to={`/interview/${session.id}/report`}>
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        >
                          <Link to={`/interview/${session.id}/active`}>
                            <Play className="h-3.5 w-3.5" />
                            Resume
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}