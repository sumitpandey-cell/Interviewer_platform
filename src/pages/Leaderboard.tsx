import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2, Search, TrendingUp, Users, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
    userId: string;
    fullName: string | null;
    avatarUrl: string | null;
    interviewCount: number;
    averageScore: number;
    bayesianScore: number;
}

const Leaderboard = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
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
                    const { data: profiles, error: profilesError } = await supabase
                        .from("profiles")
                        .select("id, full_name, avatar_url")
                        .in("id", userIds);

                    if (profilesError) throw profilesError;

                    // Merge profile data
                    const finalLeaderboard = sortedUsers.map((user) => {
                        const profile = profiles?.find((p) => p.id === user.userId);
                        return {
                            ...user,
                            fullName: profile?.full_name || "Anonymous",
                            avatarUrl: profile?.avatar_url,
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
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                isFirst ? "h-[320px] w-full md:w-[300px] z-10 scale-105 border-2" : "h-[280px] w-full md:w-[280px] mt-0 md:mt-8 border",
                borderColor,
                glowColor
            )}>
                <div className={cn(
                    "absolute inset-0 opacity-10 bg-gradient-to-b",
                    isFirst ? "from-yellow-500 to-transparent" :
                        isSecond ? "from-slate-400 to-transparent" :
                            "from-amber-700 to-transparent"
                )} />

                <CardContent className="flex flex-col items-center justify-center h-full p-6 space-y-4">
                    <div className="relative">
                        <Avatar className={cn(
                            "border-4",
                            isFirst ? "h-24 w-24 border-yellow-500" : "h-20 w-20 border-muted",
                            borderColor
                        )}>
                            <AvatarImage src={user.avatarUrl || ""} />
                            <AvatarFallback className="text-xl font-bold">
                                {user.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full font-bold text-white shadow-md",
                            isFirst ? "bg-yellow-500" : isSecond ? "bg-slate-400" : "bg-amber-700"
                        )}>
                            {rank}
                        </div>
                    </div>

                    <div className="text-center space-y-1">
                        <h3 className="font-bold text-lg truncate max-w-[200px] mx-auto">
                            {user.fullName}
                        </h3>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            {icon}
                            <span>Rank {rank}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Score</p>
                            <p className="text-lg font-bold text-primary">{user.bayesianScore.toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Interviews</p>
                            <p className="text-lg font-bold">{user.interviewCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                        <p className="text-muted-foreground">Top performers based on interview scores</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-8">
                                {users[1] && <TopPlayerCard user={users[1]} rank={2} />}
                                <TopPlayerCard user={users[0]} rank={1} />
                                {users[2] && <TopPlayerCard user={users[2]} rank={3} />}
                            </div>
                        )}

                        {/* Full Rankings Table */}
                        <Card className="border-none shadow-md bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-medium">
                                    {searchQuery ? "Search Results" : "All Rankings"}
                                </CardTitle>
                                <div className="flex gap-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Score</span>
                                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Interviews</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[80px] text-center">Rank</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                            <TableHead className="text-right">Interviews</TableHead>
                                            <TableHead className="text-right">Badge</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user, index) => {
                                            // Calculate actual rank based on original list
                                            const actualRank = users.findIndex(u => u.userId === user.userId) + 1;

                                            return (
                                                <TableRow
                                                    key={user.userId}
                                                    className="hover:bg-muted/50 transition-colors"
                                                >
                                                    <TableCell className="text-center font-medium text-muted-foreground">
                                                        #{actualRank}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 border border-border">
                                                                <AvatarImage src={user.avatarUrl || ""} />
                                                                <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm">{user.fullName}</span>
                                                                <span className="text-xs text-muted-foreground">ID: {user.userId.slice(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">
                                                        {user.bayesianScore.toFixed(1)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {user.interviewCount}
                                                    </TableCell>
                                                    <TableCell className="text-right">
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
                                                            <Badge variant="outline" className="ml-auto w-fit text-muted-foreground font-normal">
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
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Leaderboard;
