import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Download, ExternalLink, Calendar, Clock, TrendingUp, Filter, Trash2, MoreHorizontal, Search, CheckCircle2, XCircle, BarChart3, MessageSquare, SortAsc, SortDesc, Play, Star, Bell, Sun, Moon, Settings, LogOut } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { NotificationBell } from "@/components/NotificationBell";

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
  const { user, signOut } = useAuth();
  const { sessions: cachedSessions, fetchSessions, fetchStats, isCached, deleteInterviewSession, stats } = useOptimizedQueries();
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

        // Always fetch stats to ensure rank is up to date
        if (!isCached.stats || !stats) {
          await fetchStats();
        }

        setSessions(sessionsData);
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
      month: '2-digit',
      day: '2-digit',
    });
  };

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

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.score !== null);
  const averageScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.score || 0), 0) / completedSessions.length)
    : 0;
  const averageStars = (averageScore / 100) * 5;

  return (
    <DashboardLayout showTopNav={false}>
      <div className="p-6 sm:p-8 h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports Overview</h1>
            <p className="text-gray-500 mt-1">Aura: Your AI Voice Interviewer.</p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto pl-2 pr-4 rounded-full border border-gray-200 hover:bg-gray-50 gap-3">
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
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.full_name || user?.user_metadata?.full_name || "User"}
                  </span>
                  <span className="sr-only">Toggle user menu</span>
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Total Interviews:</p>
            <h3 className="text-3xl font-bold text-gray-900">{sessions.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Total Time:</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {Math.floor((stats?.timePracticed || 0) / 60)}h {(stats?.timePracticed || 0) % 60}m
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Leaderboard Rank:</p>
            <h3 className="text-3xl font-bold text-gray-900">#{stats?.rank || 0}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Average Feedback:</p>
            <h3 className="text-3xl font-bold text-gray-900">{averageStars.toFixed(1)} Stars</h3>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#eff6ff] p-4 rounded-[20px] mb-8 flex flex-col sm:flex-row flex-wrap gap-4 items-center">
          <span className="font-bold text-gray-900 text-lg mr-2">Filter Reports</span>

          <div className="flex flex-wrap gap-3 flex-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto min-w-[140px] bg-white border-none shadow-sm rounded-xl h-10 px-3 gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Date Range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-auto min-w-[160px] bg-white border-none shadow-sm rounded-xl h-10 px-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Interviewer</span>
                  <span className="font-medium text-gray-900"><SelectValue placeholder="All" /></span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {uniquePositions.map(position => (
                  <SelectItem key={position} value={position}>{position}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[140px] bg-white border-none shadow-sm rounded-xl h-10 px-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900"><SelectValue placeholder="All" /></span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

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
          <div className="flex flex-col gap-3">
            {filteredAndSortedSessions.map((session) => (
              <Card key={session.id} className="overflow-hidden hover:shadow-md transition-all group border-l-4" style={{ borderLeftColor: session.score && session.score >= 80 ? '#22c55e' : session.score && session.score >= 60 ? '#eab308' : session.score ? '#ef4444' : '#3b82f6' }}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                  {/* Left: Avatar & Main Info */}
                  <div className="flex items-center gap-4 w-full sm:w-1/3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={getAvatarUrl(
                        profile?.avatar_url,
                        user?.id || user?.email || 'user',
                        'avataaars',
                        user?.user_metadata?.picture
                      )} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(profile?.full_name) || user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
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
                  <div className="flex items-center gap-4 w-full sm:w-auto sm:flex-1 justify-between sm:justify-center border-t sm:border-t-0 sm:border-l sm:border-r border-border/50 py-3 sm:py-0 sm:px-6 my-2 sm:my-0 bg-muted/20 sm:bg-transparent rounded-lg sm:rounded-none">
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
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end min-w-[140px]">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}