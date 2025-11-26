import { ReactNode, useState, useEffect } from "react";
import { Brain, LayoutDashboard, Briefcase, FileText, BarChart3, Settings, LogOut, Trophy, Menu, X, ChevronLeft, ChevronRight, Sparkles, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { NotificationBell } from "@/components/NotificationBell";
import { useSubscription } from "@/hooks/use-subscription";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { ThemeToggle } from "@/components/ThemeToggle";

import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
  showTopNav?: boolean;
}

export function DashboardLayout({ children, showTopNav = true }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { remaining_minutes, type: subscriptionType, plan_name } = useSubscription();
  const [streak, setStreak] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<Date | null>(null);

  // Use optimized queries for profile data
  const { profile, fetchProfile, isCached } = useOptimizedQueries();

  useEffect(() => {
    if (user) {
      // Fetch profile if not cached or if we want to ensure freshness
      if (!isCached.profile || !profile) {
        fetchProfile();
      }
    }
  }, [user, fetchProfile, isCached.profile, profile]);

  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('streak_count, last_activity_date')
        .eq('id', user.id)
        .single();

      if (data) {
        // Calculate if streak is active
        const lastActivity = data.last_activity_date ? new Date(data.last_activity_date) : null;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset hours to compare dates only
        yesterday.setHours(0, 0, 0, 0);
        if (lastActivity) {
          lastActivity.setHours(0, 0, 0, 0);
        }

        // If last activity was before yesterday, streak is broken (visually)
        // The DB trigger will handle the actual reset on next activity
        if (lastActivity && lastActivity < yesterday) {
          setStreak(0);
        } else {
          setStreak(data.streak_count || 0);
        }
        setLastActivityDate(data.last_activity_date ? new Date(data.last_activity_date) : null);
      }
    };

    fetchStreak();
  }, [user]);

  // Calculate usage stats
  const getUsageStats = () => {
    let total = 30;
    let label = "30 min FREE daily";

    // Normalize plan name
    const name = plan_name?.toLowerCase() || 'free';

    if (name === 'basic') {
      total = 300;
      label = "Basic Plan";
    } else if (name === 'pro') {
      total = 1000;
      label = "Pro Plan";
    } else if (name === 'business') {
      return { label: "Business Plan", percent: 0, text: "Unlimited access" };
    }

    const used = Math.max(0, total - remaining_minutes);
    const percent = Math.min(100, (used / total) * 100);

    return {
      label,
      percent,
      text: `${remaining_minutes} min left`,
      usedStr: `${used}/${total}`
    };
  };

  const stats = getUsageStats();

  // Initialize sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Check if user is admin
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email || '');

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Recommended Jobs", href: "/jobs", icon: Briefcase },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: Bell }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Floating Glass Panel */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-24' : 'lg:w-80'}
        p-4
      `}>
        <div className={`
          h-full rounded-3xl bg-card/80 backdrop-blur-xl border border-white/20 shadow-glass
          flex flex-col overflow-hidden transition-all duration-300
          ${sidebarCollapsed ? 'px-2' : 'px-4'}
        `}>
          {/* Header */}
          <div className={`flex h-20 items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-2'} flex-shrink-0 relative`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full"></div>
                  <img src="/logo.png" alt="Aura Logo" className="relative h-10 w-10 rounded-xl shadow-lg" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Aura</span>
              </div>
            ) : (
              <img src="/logo.png" alt="Aura Logo" className="h-10 w-10 rounded-xl shadow-lg" />
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center bg-background border border-border rounded-full shadow-md hover:scale-110 transition-transform z-10"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 py-4 flex-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200
                  ${isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                  } 
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isActive(item.href) ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Usage Stats & Upgrade */}
          <div className={`py-4 border-t border-border/50 space-y-4 ${sidebarCollapsed ? 'px-0' : 'px-2'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="rounded-2xl bg-secondary/50 p-4 backdrop-blur-sm border border-white/5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">{stats.label}</span>
                    {plan_name?.toLowerCase() !== 'business' && (
                      <span className="text-xs text-muted-foreground">{stats.usedStr}</span>
                    )}
                  </div>
                  {plan_name?.toLowerCase() !== 'business' ? (
                    <>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-background/50">
                        <div
                          className={`h-full transition-all duration-500 ease-out ${remaining_minutes < 5 ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-purple-500'}`}
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{stats.text}</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-primary mt-1">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-medium">Unlimited Access</span>
                    </div>
                  )}
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 rounded-xl" onClick={() => navigate('/pricing')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 rounded-xl px-0"
                title="Upgrade to Premium"
                onClick={() => navigate('/pricing')}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-20 items-center justify-between px-8 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center gap-4">
            {/* Streak */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-all">
                  <span role="img" aria-label="fire" className="animate-pulse text-base">🔥</span>
                  <span className="font-semibold">Streak</span>
                  <span className="font-bold">{streak}</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 border-none shadow-xl bg-card/95 backdrop-blur-xl" side="bottom">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    Daily Streak <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full dark:bg-orange-900/30 dark:text-orange-400">Active</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {streak > 0 ? "Keep it up! Consistency is key." : "Start your streak today!"}
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>

            {/* Theme Toggle & Notifications */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />
            </div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary/50 transition-colors">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
                      user?.id || user?.email || 'user',
                      'avataaars',
                      user?.user_metadata?.picture
                    )} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name) || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium truncate w-full text-left">{profile?.full_name || user?.user_metadata?.full_name || "User"}</span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left">{user?.email}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-white/10 shadow-xl bg-card/95 backdrop-blur-xl" align="end" side="bottom">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || user?.user_metadata?.full_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer focus:bg-primary/10 focus:text-primary">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between px-4 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Aura Logo" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg">Aura</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-accent rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 flex-1 overflow-auto bg-gradient-to-br from-background to-secondary/30">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
