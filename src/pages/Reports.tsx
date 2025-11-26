import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Download, ExternalLink, Calendar, Clock, TrendingUp, Filter, Trash2, MoreHorizontal, Search, CheckCircle2, XCircle, BarChart3, MessageSquare, SortAsc, SortDesc, Play } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
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

        {/* Stats Overview */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Interviews</p>
                  <h3 className="text-2xl font-bold">{sessions.length}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold">{completedSessions.length}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <h3 className="text-2xl font-bold">{averageScore}%</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Practice Time</p>
                  <h3 className="text-2xl font-bold">
                    {Math.round(sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0))}m
                  </h3>
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
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-[300px]">Interview Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="hover:bg-muted/50 transition-colors group cursor-pointer"
                      onClick={() => window.location.href = `/reports/${session.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {session.position.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{session.position}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {session.interview_type.replace('_', ' ')} Interview
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(session.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {session.duration_minutes ? `${session.duration_minutes}m` : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(session.status, session.score)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={getScoreColor(session.score)}>
                          {session.score !== null ? `${session.score}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/reports/${session.id}`} className="flex items-center cursor-pointer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Report
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={session.status !== 'completed' || session.score === null}
                              className="flex items-center cursor-pointer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Interview Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this interview report? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(session.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}