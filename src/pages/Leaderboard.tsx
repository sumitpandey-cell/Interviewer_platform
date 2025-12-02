import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Loader2, Search, TrendingUp, Users, Award, Settings as SettingsIcon, LogOut, Share2, Download, Copy, Check } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
    const [selectedRank, setSelectedRank] = useState<number>(0);
    const [copied, setCopied] = useState(false);
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

    const handleShare = (user: LeaderboardUser, rank: number) => {
        setSelectedUser(user);
        setSelectedRank(rank);
        setShareModalOpen(true);
    };

    const handleDownloadCard = async () => {
        const cardElement = document.getElementById('share-card');
        if (!cardElement) return;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const scale = 2;
            const width = 700;
            const height = 700; // Reduced from 900
            canvas.width = width * scale;
            canvas.height = height * scale;
            ctx.scale(scale, scale);

            // Background
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(0, 0, width, height);

            // Header - Aura Logo and Branding
            ctx.fillStyle = '#6366f1';
            ctx.font = 'bold 24px Inter, system-ui, sans-serif';
            ctx.fillText('Aura', 50, 40);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.fillText('Elevate Your Hiring', 50, 60);

            // Verified Badge
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('✓ Aura Verified', width - 50, 50);

            // White Card Background
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 4;
            ctx.roundRect(30, 90, width - 60, height - 160, 16);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // User Name
            ctx.fillStyle = '#111827';
            ctx.font = 'bold 28px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(selectedUser?.fullName || 'Anonymous', 180, 160);

            // Subtitle
            ctx.fillStyle = '#6b7280';
            ctx.font = '14px Inter, system-ui, sans-serif';
            ctx.fillText('Interview Candidate', 180, 185);

            // Rank Badge
            const rankText = `🏆 Global Rank #${selectedRank}`;
            const rankBgColor = selectedRank === 1 ? '#fbbf24' :
                selectedRank === 2 ? '#d1d5db' :
                    selectedRank === 3 ? '#f59e0b' : '#6366f1';

            ctx.fillStyle = rankBgColor;
            ctx.roundRect(180, 200, 200, 32, 16);
            ctx.fill();

            ctx.fillStyle = selectedRank <= 3 ? '#1f2937' : '#ffffff';
            ctx.font = 'bold 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(rankText, 280, 222);

            // Stats Grid - Interview Score
            ctx.fillStyle = '#eef2ff';
            ctx.roundRect(50, 260, 180, 100, 12);
            ctx.fill();

            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(75, 285, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', 75, 290);

            ctx.fillStyle = '#6b7280';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Interview Score:', 98, 290);

            ctx.fillStyle = '#6366f1';
            ctx.font = 'bold 32px Inter, system-ui, sans-serif';
            ctx.fillText(`${selectedUser?.bayesianScore.toFixed(0)}%`, 60, 330);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.fillText('(Aura Verified)', 60, 350);

            // Stats Grid - Top Skills
            ctx.fillStyle = '#f3e8ff';
            ctx.roundRect(250, 260, 180, 100, 12);
            ctx.fill();

            ctx.fillStyle = '#9333ea';
            ctx.beginPath();
            ctx.arc(275, 285, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('★', 275, 290);

            ctx.fillStyle = '#6b7280';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Top Skills:', 298, 290);

            ctx.fillStyle = '#581c87';
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
            ctx.fillText('Problem Solving,', 260, 315);
            ctx.fillText('Communication,', 260, 335);
            ctx.fillText('Technical', 260, 355);

            // Stats Grid - Experience
            ctx.fillStyle = '#fce7f3';
            ctx.roundRect(450, 260, 180, 100, 12);
            ctx.fill();

            ctx.fillStyle = '#db2777';
            ctx.beginPath();
            ctx.arc(475, 285, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('↗', 475, 290);

            ctx.fillStyle = '#6b7280';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Experience:', 498, 290);

            ctx.fillStyle = '#db2777';
            ctx.font = 'bold 32px Inter, system-ui, sans-serif';
            ctx.fillText(`${selectedUser?.interviewCount}+`, 460, 330);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.fillText('Interviews', 460, 350);

            // Hire Recommendation
            ctx.fillStyle = '#d1fae5';
            ctx.roundRect(50, 380, 580, 65, 12);
            ctx.fill();

            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(75, 412, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆', 75, 418);

            ctx.fillStyle = '#6b7280';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Hire Recommendation:', 105, 405);

            const recommendation = selectedUser?.bayesianScore && selectedUser.bayesianScore >= 80
                ? "Highly Recommended"
                : selectedUser?.bayesianScore && selectedUser.bayesianScore >= 60
                    ? "Recommended"
                    : "Under Review";

            ctx.fillStyle = '#047857';
            ctx.font = 'bold 18px Inter, system-ui, sans-serif';
            ctx.fillText(recommendation, 105, 425);

            // CTA Button
            const gradient = ctx.createLinearGradient(50, 465, 650, 465);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#9333ea');
            ctx.fillStyle = gradient;
            ctx.roundRect(50, 465, 580, 45, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('View Full Profile on Aura', width / 2, 492);

            // Footer
            ctx.fillStyle = '#6b7280';
            ctx.font = '13px Inter, system-ui, sans-serif';
            ctx.fillText('AuraPlatform.com', width / 2, height - 40);

            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText('Intelligent Interview Solutions', width / 2, height - 20);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `aura-interview-${selectedUser?.fullName?.replace(/\s+/g, '-').toLowerCase()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast({
                    title: "Success",
                    description: "Card downloaded successfully!",
                });
            });
        } catch (error) {
            console.error('Error downloading card:', error);
            toast({
                title: "Error",
                description: "Failed to download card.",
                variant: "destructive",
            });
        }
    };

    const handleNativeShare = async () => {
        try {
            const shareData = {
                title: `${selectedUser?.fullName || 'Candidate'} - Aura Interview Profile`,
                text: `Check out this interview profile on Aura! Global Rank #${selectedRank} with a score of ${selectedUser?.bayesianScore.toFixed(0)}%`,
                url: `${window.location.origin}/leaderboard?user=${selectedUser?.userId}`,
            };

            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast({
                    title: "Success",
                    description: "Shared successfully!",
                });
            } else {
                // Fallback to copy link
                await navigator.clipboard.writeText(shareData.url);
                toast({
                    title: "Link Copied",
                    description: "Share link copied to clipboard!",
                });
            }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing:', error);
                toast({
                    title: "Error",
                    description: "Failed to share.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleCopyLink = () => {
        const shareUrl = `${window.location.origin}/leaderboard?user=${selectedUser?.userId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            toast({
                title: "Success",
                description: "Link copied to clipboard!",
            });
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            toast({
                title: "Error",
                description: "Failed to copy link.",
                variant: "destructive",
            });
        });
    };



    const TopPlayerCard = ({ user, rank }: { user: LeaderboardUser; rank: number }) => {
        // Define gradient colors for each rank
        const gradientColors = {
            1: "from-emerald-400 via-cyan-400 to-blue-400",
            2: "from-rose-400 via-orange-400 to-yellow-400",
            3: "from-purple-500 via-indigo-500 to-blue-600"
        };

        const rankSuffix = {
            1: "st",
            2: "nd",
            3: "rd"
        };

        return (
            <div className="relative flex flex-col items-center w-full max-w-[280px]">
                <Card className="w-full bg-[#1a1a1a] border-none shadow-2xl rounded-2xl overflow-hidden">
                    {/* Gradient Header with Rank Badge */}
                    <div className={cn(
                        "relative h-20 bg-gradient-to-r",
                        gradientColors[rank as keyof typeof gradientColors]
                    )}>
                        <div className="absolute top-4 right-4 flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white/90 leading-none">
                                {rank}
                            </span>
                            <span className="text-xl font-bold text-white/70 leading-none">
                                {rankSuffix[rank as keyof typeof rankSuffix]}
                            </span>
                        </div>
                    </div>

                    <CardContent className="flex flex-col items-center pt-0 pb-6 px-6 -mt-10 relative z-10">
                        {/* Hexagonal Avatar */}
                        <div className="relative mb-4">
                            <div className="w-20 h-20 bg-white rounded-lg rotate-45 overflow-hidden shadow-xl">
                                <div className="-rotate-45 scale-[1.4] w-full h-full flex items-center justify-center">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage
                                            src={getAvatarUrl(
                                                user.avatarUrl,
                                                user.userId || user.fullName || 'user',
                                                'avataaars',
                                                user.oauthPicture
                                            )}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-gray-200 to-gray-300">
                                            {user.fullName?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        </div>

                        {/* User Name with Fire Emoji */}
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-white font-semibold text-base truncate max-w-[180px]">
                                {user.fullName || "Anonymous"}
                            </h3>
                            <span className="text-lg">🔥</span>
                        </div>

                        {/* Stats Grid - Using Original Data */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-5">
                            <div className="text-center">
                                <p className="text-white font-bold text-lg">
                                    {user.interviewCount}
                                </p>
                                <p className="text-gray-400 text-[10px] font-medium">
                                    Interviews
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold text-lg">
                                    {user.bayesianScore.toFixed(1)}
                                </p>
                                <p className="text-gray-400 text-[10px] font-medium">
                                    Score
                                </p>
                            </div>
                        </div>

                        {/* Profile Button */}
                        <button className="w-full bg-[#2a2a2a] hover:bg-[#333333] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
                            Profile
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex flex-col items-start justify-start text-left space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                            Global Standings
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl">
                            Compete, grow, and see where you rank among the best.
                        </p>
                    </div>
                    {user && users.find(u => u.userId === user.id) && (
                        <div className="hidden sm:flex items-center gap-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl px-6 py-4 shadow-lg">
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Score</p>
                                <p className="text-3xl font-black text-foreground">
                                    {users.find(u => u.userId === user.id)?.bayesianScore.toFixed(1)}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    )}
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
                        {/* Podium Section */}
                        <div className="w-full overflow-x-visible mt-8">
                            <div className="flex flex-row items-end justify-center gap-2 sm:gap-8 h-full pb-4 px-2">
                                {users[1] && <TopPlayerCard user={users[1]} rank={2} />}
                                <TopPlayerCard user={users[0]} rank={1} />
                                {users[2] && <TopPlayerCard user={users[2]} rank={3} />}
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-2 rounded-xl shadow-sm border border-border">
                            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar px-2">
                                <Select>
                                    <SelectTrigger className="w-[160px] bg-muted border-none text-foreground font-medium h-9">
                                        <SelectValue placeholder="Filter by Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="frontend">Frontend Dev</SelectItem>
                                        <SelectItem value="backend">Backend Dev</SelectItem>
                                        <SelectItem value="fullstack">Full Stack</SelectItem>
                                    </SelectContent>
                                </Select>
                                <button className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 whitespace-nowrap">
                                    Timeframe (Monthly)
                                </button>
                            </div>

                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Sort by (Score-High to Low)"
                                    className="pl-10 bg-muted border-none text-foreground placeholder:text-muted-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Full Rankings List */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-foreground px-2">All Rankings</h3>

                            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                            <TableHead className="w-[80px] text-center font-semibold text-muted-foreground">Rank</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground">User</TableHead>
                                            <TableHead className="text-center font-semibold text-muted-foreground">Score</TableHead>
                                            <TableHead className="text-center font-semibold text-muted-foreground">Interviews</TableHead>
                                            <TableHead className="text-center font-semibold text-muted-foreground">Badge</TableHead>
                                            <TableHead className="text-right font-semibold text-muted-foreground pr-6">Action</TableHead>
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
                                                        "hover:bg-muted/50 transition-colors border-b border-border last:border-none",
                                                        isCurrentUser && "bg-indigo-50/60 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500"
                                                    )}
                                                >
                                                    <TableCell className="text-center py-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm",
                                                            actualRank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                                actualRank === 2 ? "bg-slate-100 text-slate-700" :
                                                                    actualRank === 3 ? "bg-amber-100 text-amber-700" :
                                                                        "bg-muted text-muted-foreground"
                                                        )}>
                                                            {actualRank}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                                <AvatarImage src={getAvatarUrl(
                                                                    leaderboardUser.avatarUrl,
                                                                    leaderboardUser.userId || leaderboardUser.fullName || 'user',
                                                                    'avataaars',
                                                                    leaderboardUser.oauthPicture
                                                                )} />
                                                                <AvatarFallback>{getInitials(leaderboardUser.fullName)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground">{leaderboardUser.fullName}</span>
                                                                <span className="text-xs text-muted-foreground">ID: {leaderboardUser.userId.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-foreground py-4 text-lg">
                                                        {leaderboardUser.bayesianScore.toFixed(0)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-muted-foreground py-4">
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
                                                            <Badge variant="outline" className="mx-auto text-muted-foreground border-border">
                                                                Mentor
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 pr-6">
                                                        <button
                                                            onClick={() => handleShare(leaderboardUser, actualRank)}
                                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 ml-auto"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                            Share
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

                {/* Share Modal */}
                <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-4">
                            <DialogTitle>Share Interview Profile</DialogTitle>
                            <DialogDescription>
                                Download or share this professional card showcasing interview achievements.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Share Card Preview */}
                        <div id="share-card" className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
                            {/* Aura Logo Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/aura-icon.png"
                                        alt="Aura"
                                        className="h-12 w-12"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div>
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            Aura
                                        </h1>
                                        <p className="text-xs text-muted-foreground">Elevate Your Hiring</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Verified Profile</p>
                                    <div className="flex items-center gap-1 text-green-600">
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm font-semibold">Aura Verified</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                                {/* Profile Section */}
                                <div className="flex items-start gap-6 mb-8">
                                    {/* Avatar with gradient border */}
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-sm"></div>
                                        <div className="relative w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden shadow-lg bg-white">
                                            <Avatar className="h-full w-full">
                                                <AvatarImage
                                                    src={getAvatarUrl(
                                                        selectedUser?.avatarUrl || null,
                                                        selectedUser?.userId || selectedUser?.fullName || 'user',
                                                        'avataaars',
                                                        selectedUser?.oauthPicture
                                                    )}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700">
                                                    {selectedUser?.fullName?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-foreground mb-1">
                                            {selectedUser?.fullName || "Anonymous"}
                                        </h2>
                                        <p className="text-muted-foreground mb-4">
                                            Interview Candidate
                                        </p>

                                        {/* Rank Badge */}
                                        <div className="inline-flex items-center gap-2">
                                            <div className={cn(
                                                "px-4 py-1.5 rounded-full font-bold text-sm shadow-md",
                                                selectedRank === 1 ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900" :
                                                    selectedRank === 2 ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800" :
                                                        selectedRank === 3 ? "bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100" :
                                                            "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                            )}>
                                                {selectedRank === 1 && "🏆 "}
                                                {selectedRank === 2 && "🥈 "}
                                                {selectedRank === 3 && "🥉 "}
                                                Global Rank #{selectedRank}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {/* Interview Score */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <Check className="h-5 w-5 text-white" />
                                            </div>
                                            <p className="text-xs font-medium text-muted-foreground">Interview Score:</p>
                                        </div>
                                        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                            {selectedUser?.bayesianScore.toFixed(0)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">(Aura Verified)</p>
                                    </div>

                                    {/* Top Skills */}
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                                <Award className="h-5 w-5 text-white" />
                                            </div>
                                            <p className="text-xs font-medium text-muted-foreground">Top Skills:</p>
                                        </div>
                                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 leading-tight">
                                            Problem Solving, Communication, Technical
                                        </p>
                                    </div>

                                    {/* Experience */}
                                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center">
                                                <TrendingUp className="h-5 w-5 text-white" />
                                            </div>
                                            <p className="text-xs font-medium text-muted-foreground">Experience:</p>
                                        </div>
                                        <p className="text-3xl font-black text-pink-600 dark:text-pink-400">
                                            {selectedUser?.interviewCount}+
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Interviews</p>
                                    </div>
                                </div>

                                {/* Hire Recommendation */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-4 border-2 border-green-200 dark:border-green-800 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                            <Trophy className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Hire Recommendation:</p>
                                            <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                                {selectedUser?.bayesianScore && selectedUser.bayesianScore >= 80
                                                    ? "Highly Recommended"
                                                    : selectedUser?.bayesianScore && selectedUser.bayesianScore >= 60
                                                        ? "Recommended"
                                                        : "Under Review"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <div className="text-center">
                                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl">
                                        View Full Profile on Aura
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                    AuraPlatform.com
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Intelligent Interview Solutions
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 p-6 pt-0">
                            <Button
                                onClick={handleDownloadCard}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Card
                            </Button>
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="flex-1 border-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Link
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default Leaderboard;
