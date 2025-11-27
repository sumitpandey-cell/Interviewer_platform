import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2, Search, TrendingUp, Users, Award, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
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

interface LeaderboardUser {
    userId: string;
    fullName: string | null;
    avatarUrl: string | null;
    oauthPicture?: string | null;
    interviewCount: number;
    averageScore: number;
    bayesianScore: number;
}

const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { profile } = useOptimizedQueries();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // 1. Fetch all completed interview sessions with scores
                const { data: sessions, error: sessionsError } = await supabase
                    .from("interview_sessions")
                    .select("user_id, score")
                    .not("score", "is", null)
                    .eq("status", "completed");

                if (sessionsError) throw sessionsError;

                // 2. Aggregate scores by user
                const userStats: Record<string, { totalScore: number; count: number }> = {};

                sessions?.forEach((session) => {
                    if (!userStats[session.user_id]) {
                        userStats[session.user_id] = { totalScore: 0, count: 0 };
                    }
                    userStats[session.user_id].totalScore += session.score || 0;
                    userStats[session.user_id].count += 1;
                });

                // 3. Calculate Bayesian Weighted Average
                const PRIOR_MEAN = 70;
                const M = 20;

                const rankedUsers = Object.entries(userStats).map(([userId, stats]) => {
                    const avgScore = stats.totalScore / stats.count;
                    const bayesianScore =
                        (avgScore * stats.count + PRIOR_MEAN * M) / (stats.count + M);

                    return {
                        userId,
                        interviewCount: stats.count,
                        averageScore: avgScore,
                        bayesianScore,
                    };
                });

                // 4. Sort by Bayesian Score
                const sortedUsers = rankedUsers.sort((a, b) => b.bayesianScore - a.bayesianScore);

                // 5. Fetch profiles for all ranked users
                if (sortedUsers.length > 0) {
                    const userIds = sortedUsers.map((u) => u.userId);

                    // Fetch from profiles table
                    const { data: profiles, error: profilesError } = await supabase
                        .from("profiles")
                        .select("id, full_name, avatar_url")
                        .in("id", userIds);

                    if (profilesError) throw profilesError;

                    // Get current user's OAuth picture if they're in the leaderboard
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    const currentUserOAuthPicture = currentUser?.user_metadata?.picture || currentUser?.user_metadata?.avatar_url;

                    // Merge profile data
                    const finalLeaderboard = sortedUsers.map((user) => {
                        const profile = profiles?.find((p) => p.id === user.userId);
                        // Use OAuth picture only for current user (we can't access other users' auth metadata from client)
                        const oauthPicture = user.userId === currentUser?.id ? currentUserOAuthPicture : null;

                        return {
                            ...user,
                            fullName: profile?.full_name || "Anonymous",
                            avatarUrl: profile?.avatar_url,
                            oauthPicture: oauthPicture,
                        };
                    });

                    setUsers(finalLeaderboard);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                toast({
                    title: "Error",
                    description: "Failed to load leaderboard data.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [toast]);

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const YourProgressCard = () => (
        <Card className="bg-[#1A1F2C] text-white border-none overflow-hidden relative h-full min-h-[320px] flex flex-col items-center justify-center p-6 shadow-xl">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Your Progress</h3>
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none px-3 py-1">
                        7 Day Streak
                    </Badge>
                </div>

                {/* Circular Progress */}
                {/* Circular Progress */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-white/10"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={439.82}
                            strokeDashoffset={439.82 * 0.25} // 75% progress
                            className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-bold">300</span>
                    </div>
                </div>

                <div className="text-sm text-gray-300">
                    Next Badge: <span className="text-white font-medium">Mentor</span>
                </div>
            </div>
        </Card>
    );

    const TopPlayerCard = ({ user, rank }: { user: LeaderboardUser; rank: number }) => {
        const isFirst = rank === 1;

        return (
            <div className={cn(
                "relative flex flex-col items-center transition-all duration-300",
                isFirst ? "-mt-8 sm:-mt-12 z-10" : "mt-0"
            )}>
                {isFirst && (
                    <div className="absolute -top-8 sm:-top-12 left-1/2 -translate-x-1/2 z-20">
                        <Trophy className="h-10 w-10 sm:h-14 sm:w-14 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-lg" />
                    </div>
                )}

                <Card className={cn(
                    "relative overflow-visible border-none shadow-xl transition-all flex flex-col items-center",
                    // Responsive width and height
                    isFirst
                        ? "w-[140px] h-[240px] sm:w-[260px] sm:h-[340px] ring-2 sm:ring-4 ring-yellow-100 dark:ring-yellow-900/30"
                        : "w-[110px] h-[200px] sm:w-[220px] sm:h-[280px]",
                    "bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[2rem]"
                )}>
                    <div className={cn(
                        "absolute top-2 right-2 sm:top-2 sm:right-4 font-black select-none opacity-20",
                        // Responsive font size for rank number
                        "text-3xl sm:text-5xl",
                        rank === 1 ? "text-yellow-500" :
                            rank === 2 ? "text-slate-400" :
                                "text-amber-700"
                    )}>
                        #{rank}
                    </div>

                    <CardContent className="flex flex-col items-center justify-center h-full p-3 sm:p-6 w-full z-10">
                        <div className="relative mb-3 sm:mb-6">
                            <div className={cn(
                                "rounded-full p-1",
                                isFirst ? "bg-gradient-to-b from-yellow-400 to-yellow-200" : "bg-gray-100 dark:bg-gray-700"
                            )}>
                                <Avatar className={cn(
                                    "border-2 sm:border-4 border-white dark:border-gray-800",
                                    // Responsive avatar size
                                    isFirst ? "h-16 w-16 sm:h-28 sm:w-28" : "h-12 w-12 sm:h-20 sm:w-20"
                                )}>
                                    <AvatarImage src={getAvatarUrl(
                                        user.avatarUrl,
                                        user.userId || user.fullName || 'user',
                                        'avataaars',
                                        user.oauthPicture
                                    )} />
                                    <AvatarFallback className="text-sm sm:text-xl font-bold">
                                        {user.fullName?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {isFirst && (
                                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md whitespace-nowrap border-2 border-white dark:border-gray-800">
                                    Top 1
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-0.5 sm:space-y-1 mb-4 sm:mb-8 w-full">
                            <h3 className={cn(
                                "font-bold text-gray-900 dark:text-white truncate w-full px-1",
                                // Responsive text size
                                isFirst ? "text-sm sm:text-xl" : "text-xs sm:text-lg"
                            )}>
                                {user.fullName?.split(' ')[0]}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                {user.interviewCount} Interviews
                            </p>
                        </div>

                        <div className="mt-auto text-center">
                            <p className={cn(
                                "font-black text-gray-900 dark:text-white tracking-tight",
                                // Responsive score size
                                isFirst ? "text-2xl sm:text-4xl" : "text-xl sm:text-3xl"
                            )}>
                                {user.bayesianScore.toFixed(1)}
                            </p>
                            <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">Score</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-8">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-start text-left space-y-2 mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        Global Standings
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-lg max-w-2xl">
                        Compete, grow, and see where you rank among the best.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-20 text-center">
                            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-lg text-muted-foreground">
                                No data available yet. Start interviewing to appear here!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Top Section Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
                            {/* Your Progress Card */}
                            <div className="col-span-1 h-full w-full">
                                <YourProgressCard />
                            </div>

                            {/* Podium Section */}
                            <div className="col-span-1 lg:col-span-3 w-full overflow-x-visible mt-16 lg:mt-0">
                                <div className="flex flex-row items-end justify-center gap-2 sm:gap-8 h-full pb-4 px-2">
                                    {users[1] && <TopPlayerCard user={users[1]} rank={2} />}
                                    <TopPlayerCard user={users[0]} rank={1} />
                                    {users[2] && <TopPlayerCard user={users[2]} rank={3} />}
                                </div>
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
                                <Select>
                                    <SelectTrigger className="w-[160px] bg-gray-100 border-none text-gray-700 font-medium h-9">
                                        <SelectValue placeholder="Filter by Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="frontend">Frontend Dev</SelectItem>
                                        <SelectItem value="backend">Backend Dev</SelectItem>
                                        <SelectItem value="fullstack">Full Stack</SelectItem>
                                    </SelectContent>
                                </Select>
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                                    Timeframe (Monthly)
                                </button>
                            </div>

                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Sort by (Score-High to Low)"
                                    className="pl-10 bg-gray-50 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Full Rankings List */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2">All Rankings</h3>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                            <TableHead className="w-[80px] text-center font-semibold text-gray-600">Rank</TableHead>
                                            <TableHead className="font-semibold text-gray-600">User</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-600">Score</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-600">Interviews</TableHead>
                                            <TableHead className="text-center font-semibold text-gray-600">Badge</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-600 pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((leaderboardUser, index) => {
                                            const actualRank = users.findIndex(u => u.userId === leaderboardUser.userId) + 1;
                                            const isTop3 = actualRank <= 3;
                                            const isCurrentUser = leaderboardUser.userId === user?.id;

                                            return (
                                                <TableRow
                                                    key={leaderboardUser.userId}
                                                    className={cn(
                                                        "hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none",
                                                        isCurrentUser && "bg-indigo-50/60 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                                                    )}
                                                >
                                                    <TableCell className="text-center py-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm",
                                                            actualRank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                                actualRank === 2 ? "bg-slate-100 text-slate-700" :
                                                                    actualRank === 3 ? "bg-amber-100 text-amber-700" :
                                                                        "bg-gray-100 text-gray-600"
                                                        )}>
                                                            {actualRank}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                                <AvatarImage src={getAvatarUrl(
                                                                    leaderboardUser.avatarUrl,
                                                                    leaderboardUser.userId || leaderboardUser.fullName || 'user',
                                                                    'avataaars',
                                                                    leaderboardUser.oauthPicture
                                                                )} />
                                                                <AvatarFallback>{getInitials(leaderboardUser.fullName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 dark:text-white">{leaderboardUser.fullName}</span>
                                                                <span className="text-xs text-gray-400">ID: {leaderboardUser.userId.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900 dark:text-white py-4 text-lg">
                                                        {leaderboardUser.bayesianScore.toFixed(0)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-500 py-4">
                                                        {leaderboardUser.interviewCount} Interviews
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        {isTop3 ? (
                                                            <Badge variant="secondary" className={cn(
                                                                "mx-auto",
                                                                actualRank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                                    actualRank === 2 ? "bg-slate-100 text-slate-700" :
                                                                        "bg-amber-100 text-amber-700"
                                                            )}>
                                                                Top {actualRank}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="mx-auto text-gray-500 border-gray-200">
                                                                Mentor
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 pr-6">
                                                        <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200">
                                                            Challenge
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No users found matching "{searchQuery}"
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Leaderboard;
