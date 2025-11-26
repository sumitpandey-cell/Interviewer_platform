import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

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
    const { toast } = useToast();

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
                console.log(sessions)
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
                // Formula: (avg_score * total_interviews + 70 * 20) / (total_interviews + 20)
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

                // 4. Sort by Bayesian Score and take Top 10
                const top10 = rankedUsers
                    .sort((a, b) => b.bayesianScore - a.bayesianScore)
                    .slice(0, 10);

                // 5. Fetch profiles for the Top 10
                if (top10.length > 0) {
                    const userIds = top10.map((u) => u.userId);

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
                    const finalLeaderboard = top10.map((user) => {
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

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 1:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 2:
                return <Medal className="h-6 w-6 text-amber-600" />;
            default:
                return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
    };

    const getRowStyle = (index: number) => {
        switch (index) {
            case 0: return "bg-yellow-500/10 hover:bg-yellow-500/20";
            case 1: return "bg-gray-400/10 hover:bg-gray-400/20";
            case 2: return "bg-amber-600/10 hover:bg-amber-600/20";
            default: return "";
        }
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 sm:py-10 px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12 space-y-2">
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary uppercase">
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Compete with others to reach the top! Rankings updated in real-time.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <Card className="border-none shadow-xl">
                        <CardContent className="py-20 text-center">
                            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-lg text-muted-foreground">
                                No data available yet. Start interviewing to appear here!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {users.length >= 3 && (
                            <div className="mb-12">
                                <div className="flex items-end justify-center gap-4 sm:gap-8 mb-8">
                                    {/* 2nd Place */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-3">
                                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-400 shadow-lg">
                                                <AvatarImage src={getAvatarUrl(
                                                    users[1]?.avatarUrl,
                                                    users[1]?.userId || users[1]?.fullName || 'user2',
                                                    'avataaars',
                                                    users[1]?.oauthPicture
                                                )} />
                                                <AvatarFallback className="bg-slate-200 text-slate-700 text-xl font-bold">
                                                    {getInitials(users[1]?.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md">
                                                2
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-sm sm:text-base truncate max-w-[120px]">
                                                {users[1]?.fullName}
                                            </p>
                                            <p className="text-primary font-bold text-lg sm:text-xl">
                                                {users[1]?.bayesianScore.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {users[1]?.interviewCount} interviews
                                            </p>
                                        </div>
                                    </div>

                                    {/* 1st Place */}
                                    <div className="flex flex-col items-center -mt-8">
                                        <div className="relative mb-3">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                                <Trophy className="h-8 w-8 text-yellow-500 animate-pulse" />
                                            </div>
                                            <Avatar className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-yellow-500 shadow-2xl ring-4 ring-yellow-500/20">
                                                <AvatarImage src={getAvatarUrl(
                                                    users[0]?.avatarUrl,
                                                    users[0]?.userId || users[0]?.fullName || 'user1',
                                                    'avataaars',
                                                    users[0]?.oauthPicture
                                                )} />
                                                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-2xl font-bold">
                                                    {getInitials(users[0]?.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                                                1
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-base sm:text-lg truncate max-w-[140px]">
                                                {users[0]?.fullName}
                                            </p>
                                            <p className="text-primary font-bold text-2xl sm:text-3xl">
                                                {users[0]?.bayesianScore.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {users[0]?.interviewCount} interviews
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3rd Place */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-3">
                                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-amber-700 shadow-lg">
                                                <AvatarImage src={getAvatarUrl(
                                                    users[2]?.avatarUrl,
                                                    users[2]?.userId || users[2]?.fullName || 'user3',
                                                    'avataaars',
                                                    users[2]?.oauthPicture
                                                )} />
                                                <AvatarFallback className="bg-amber-200 text-amber-900 text-xl font-bold">
                                                    {getInitials(users[2]?.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md">
                                                3
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-sm sm:text-base truncate max-w-[120px]">
                                                {users[2]?.fullName}
                                            </p>
                                            <p className="text-primary font-bold text-lg sm:text-xl">
                                                {users[2]?.bayesianScore.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {users[2]?.interviewCount} interviews
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Full Rankings Table */}
                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl">All Rankings</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 sm:pt-0">
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-[60px] sm:w-[80px] text-center font-semibold">Rank</TableHead>
                                                <TableHead className="font-semibold">Player</TableHead>
                                                <TableHead className="text-right font-semibold">Score</TableHead>
                                                <TableHead className="text-right font-semibold hidden sm:table-cell">Interviews</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user, index) => (
                                                <TableRow
                                                    key={user.userId}
                                                    className={`${getRowStyle(index)} hover:bg-accent/50 transition-colors`}
                                                >
                                                    <TableCell className="font-bold text-center">
                                                        {index < 3 ? (
                                                            <div className="flex justify-center">
                                                                {getRankIcon(index)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">#{index + 1}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                                                                <AvatarImage src={getAvatarUrl(
                                                                    user.avatarUrl,
                                                                    user.userId || user.fullName || 'user',
                                                                    'avataaars',
                                                                    user.oauthPicture
                                                                )} />
                                                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium text-sm sm:text-base truncate">
                                                                {user.fullName}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-base sm:text-lg text-primary">
                                                        {user.bayesianScore.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                                                        {user.interviewCount}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>

    );
};

export default Leaderboard;
