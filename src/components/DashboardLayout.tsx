import { ReactNode, useState, useEffect } from "react";
import { Brain, LayoutDashboard, Briefcase, FileText, BarChart3, Settings, LogOut, Trophy, Menu, X, ChevronLeft, ChevronRight, Sparkles, Flame, Clock, User } from "lucide-react";
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
    { name: "Profile", href: "/settings", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: Settings }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-black">
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
        border-r border-gray-800 bg-black text-white flex flex-col h-screen
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-20' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex h-20 items-center px-6 flex-shrink-0 relative">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="font-bold text-white text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">Aura</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
              <span className="font-bold text-white text-lg">A</span>
            </div>
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

        <nav className="space-y-2 p-4 flex-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive(item.href)
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
                } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.href) ? "text-white" : "text-gray-400"}`} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}

          {/* Streak Widget */}
          {!sidebarCollapsed && (
            <div className="mt-6 mx-2 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <div className="text-white font-bold">Streak</div>
                  <div className="text-xs text-gray-400">{streak} Day Streak</div>
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className={`p-4 mt-auto ${sidebarCollapsed ? 'px-2' : ''}`}>
          {!sidebarCollapsed && (
            <div className="rounded-2xl bg-[#1a1a1a] p-4 border border-gray-800">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 mb-3" onClick={() => navigate('/pricing')}>
                Upgrade
              </Button>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Remaining Time:</div>
                <div className="text-lg font-mono text-white font-bold">
                  {Math.floor(remaining_minutes / 60)}h {remaining_minutes % 60}m
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 px-2 rounded-xl"
              title="Upgrade"
              onClick={() => navigate('/pricing')}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-l-[30px] overflow-hidden my-2 mr-2">
        {/* Header */}
        {showTopNav && (
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
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
