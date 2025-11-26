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

    const TopPlayerCard = ({ user, rank }: { user: LeaderboardUser; rank: number }) => {
        const isFirst = rank === 1;
        const isSecond = rank === 2;
        const isThird = rank === 3;

        let borderColor = "border-border";
        let glowColor = "";
        let icon = null;

        if (isFirst) {
            borderColor = "border-yellow-500";
            glowColor = "shadow-yellow-500/20";
            icon = <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-500" />;
        } else if (isSecond) {
            borderColor = "border-slate-400";
            glowColor = "shadow-slate-400/20";
            icon = <Medal className="h-6 w-6 text-slate-400" />;
        } else if (isThird) {
            borderColor = "border-amber-700";
            glowColor = "shadow-amber-700/20";
            icon = <Medal className="h-6 w-6 text-amber-700" />;
        }

        return (
            <div className={cn(
                "relative flex flex-col items-center transition-all duration-300 overflow-visible",
                isFirst ? "z-20 sm:mb-8" : "mt-0"
            )}>
                {isFirst && (
                    <div className="absolute -top-10 sm:-top-14 left-1/2 -translate-x-1/2 z-30">
                        <Trophy className="h-10 w-10 sm:h-14 sm:w-14 text-yellow-500 fill-yellow-500 animate-bounce drop-shadow-md" />
                    </div>
                )}

                <Card className={cn(
                    "relative overflow-hidden hover:shadow-lg transition-all flex flex-col",
                    isFirst ? "w-[130px] sm:w-[300px] border-2" : "w-[110px] sm:w-[280px] border",
                    // Height handling: auto on mobile to fit stacked content, fixed/min on desktop
                    isFirst ? "min-h-[260px] sm:h-[340px]" : "min-h-[220px] sm:h-[300px]",
                    borderColor,
                    glowColor
                )}>
                    <div className={cn(
                        "absolute inset-0 opacity-10 bg-gradient-to-b",
                        isFirst ? "from-yellow-500 to-transparent" :
                            isSecond ? "from-slate-400 to-transparent" :
                                "from-amber-700 to-transparent"
                    )} />

                    <CardContent className="flex flex-col items-center justify-between h-full p-3 sm:p-6 space-y-2 sm:space-y-4">
                        <div className="relative mt-2 sm:mt-0">
                            <Avatar className={cn(
                                "border-4",
                                isFirst ? "h-16 w-16 sm:h-24 sm:w-24 border-yellow-500" : "h-12 w-12 sm:h-20 sm:w-20 border-muted",
                                borderColor
                            )}>
                                <AvatarImage src={getAvatarUrl(
                                    user.avatarUrl,
                                    user.userId || user.fullName || 'user',
                                    'avataaars',
                                    user.oauthPicture
                                )} />
                                <AvatarFallback className="text-xl font-bold">
                                    {user.fullName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold text-white shadow-md text-xs sm:text-base",
                                isFirst ? "bg-yellow-500" : isSecond ? "bg-slate-400" : "bg-amber-700"
                            )}>
                                {rank}
                            </div>
                        </div>

                        <div className="text-center space-y-1 w-full">
                            <h3 className="font-bold text-xs sm:text-lg truncate w-full px-1">
                                {user.fullName}
                            </h3>
                            <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-muted-foreground">
                                {icon}
                                <span>Rank {rank}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-4 w-full pt-2 sm:pt-4 border-t mt-auto">
                            <div className="text-center">
                                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">Score</p>
                                <p className="text-sm sm:text-lg font-bold text-primary">{user.bayesianScore.toFixed(1)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">Interviews</p>
                                <p className="text-sm sm:text-lg font-bold">{user.interviewCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section with Controls */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            Leaderboard
                        </h1>
                        <p className="text-gray-500 text-sm">Compete with others to reach the top!</p>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex bg-white items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 rounded-full px-2 py-1.5 transition-colors">
                                    <Avatar className="h-8 w-8 border border-gray-200">
                                        <AvatarImage src={getAvatarUrl(
                                            profile?.avatar_url || user?.user_metadata?.avatar_url,
                                            user?.id || 'user',
                                            'avataaars'
                                        )} />
                                        <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                                        {profile?.full_name?.split(' ')[0] || "User"}
                                    </span>
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut} className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <ThemeToggle />
                    </div>
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
                        {/* Top 3 Podium Section */}
                        {users.length > 0 && !searchQuery && (
                            <div className="flex flex-row items-end justify-center gap-2 sm:gap-6 py-4 mt-12 sm:mt-0 overflow-x-auto pb-8 no-scrollbar px-4">
                                {users[1] && <TopPlayerCard user={users[1]} rank={2} />}
                                <TopPlayerCard user={users[0]} rank={1} />
                                {users[2] && <TopPlayerCard user={users[2]} rank={3} />}
                            </div>
                        )}

                        {/* Full Rankings Table */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {searchQuery ? "Search Results" : "All Rankings"}
                                </h3>

                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search users..."
                                        className="pl-9 bg-gray-50 border-gray-200"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                            <TableHead className="w-[80px] text-center font-medium text-gray-500 text-sm">Rank</TableHead>
                                            <TableHead className="font-medium text-gray-500 text-sm">User</TableHead>
                                            <TableHead className="text-right font-medium text-gray-500 text-sm">Score</TableHead>
                                            <TableHead className="text-right font-medium text-gray-500 text-sm">Interviews</TableHead>
                                            <TableHead className="text-right font-medium text-gray-500 text-sm">Badge</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-50">
                                        {filteredUsers.map((user, index) => {
                                            // Calculate actual rank based on original list
                                            const actualRank = users.findIndex(u => u.userId === user.userId) + 1;

                                            return (
                                                <TableRow
                                                    key={user.userId}
                                                    className="group hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <TableCell className="text-center font-medium text-gray-500 py-4">
                                                        #{actualRank}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border border-gray-100">
                                                                <AvatarImage src={getAvatarUrl(
                                                                    user.avatarUrl,
                                                                    user.userId || user.fullName || 'user',
                                                                    'avataaars',
                                                                    user.oauthPicture
                                                                )} />
                                                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">{user.fullName}</span>
                                                                <span className="text-xs text-gray-400">ID: {user.userId.slice(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-900 py-4">
                                                        {user.bayesianScore.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-500 py-4">
                                                        {user.interviewCount}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        {actualRank <= 3 ? (
                                                            <Badge variant="secondary" className={cn(
                                                                "ml-auto w-fit",
                                                                actualRank === 1 ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                                                                    actualRank === 2 ? "bg-slate-100 text-slate-700 hover:bg-slate-100" :
                                                                        "bg-orange-100 text-orange-800 hover:bg-orange-100"
                                                            )}>
                                                                Top {actualRank}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="ml-auto w-fit text-gray-500 font-normal border-gray-200">
                                                                Member
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
