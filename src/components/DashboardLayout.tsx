import { ReactNode, useState, useEffect } from "react";
import { Brain, LayoutDashboard, Briefcase, FileText, BarChart3, Settings, LogOut, Trophy, Menu, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { NotificationBell } from "@/components/NotificationBell";
import { useSubscription } from "@/hooks/use-subscription";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Recommended Jobs", href: "/jobs", icon: Briefcase },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: Settings }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-0
        border-r bg-card flex flex-col h-screen
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-20' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 flex-shrink-0 lg:r relative">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Aura Logo" className="h-8 w-8 rounded-full" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent lg:block">Meet Aura</span>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/logo.png" alt="Aura Logo" className="h-8 w-8" />
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
            className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="space-y-1 p-4 flex-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className={`p-4 mt-auto border-t ${sidebarCollapsed ? 'px-2' : ''}`}>
          {!sidebarCollapsed && (
            <>
              <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-600">{stats.label}</span>
                  {plan_name?.toLowerCase() !== 'business' && (
                    <span className="text-xs text-muted-foreground">{stats.usedStr}</span>
                  )}
                </div>
                {plan_name?.toLowerCase() !== 'business' ? (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all ${remaining_minutes < 5 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{stats.text}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 mt-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-medium">Unlimited Access</span>
                  </div>
                )}
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate('/pricing')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </>
          )}
          {sidebarCollapsed && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 px-2"
              title="Upgrade to Premium"
              onClick={() => navigate('/pricing')}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6 flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-accent rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 lg:gap-4 ml-auto">
            <NotificationBell />

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors">
                  <span>{streak}</span>
                  <span role="img" aria-label="fire">🔥</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Daily Streak</h4>
                    <p className="text-sm text-muted-foreground">
                      {streak > 0
                        ? "Keep up the great work! Consistency is key to success."
                        : "Start your streak today by completing an interview!"}
                    </p>
                    <div className="flex items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Last activity: {lastActivityDate ? lastActivityDate.toLocaleDateString() : "No activity yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
                      user?.id || user?.email || 'user',
                      'avataaars',
                      user?.user_metadata?.picture
                    )} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name) || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || user?.user_metadata?.full_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
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
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
