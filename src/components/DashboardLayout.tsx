import { ReactNode, useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  User,
  Flame,
  Trophy,
  BellRing,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { remaining_minutes, plan_name } = useSubscription();
  const [streak, setStreak] = useState(0);

  // Use optimized queries for profile data
  const { profile, fetchProfile, isCached } = useOptimizedQueries();

  useEffect(() => {
    if (user) {
      if (!isCached.profile || !profile) {
        fetchProfile();
      }
    }
  }, [user, fetchProfile, isCached.profile, profile]);

  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("streak_count, last_activity_date")
        .eq("id", user.id)
        .single();

      if (data) {
        const lastActivity = data.last_activity_date
          ? new Date(data.last_activity_date)
          : null;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        if (lastActivity) {
          lastActivity.setHours(0, 0, 0, 0);
        }

        if (lastActivity && lastActivity < yesterday) {
          setStreak(0);
        } else {
          setStreak(data.streak_count || 0);
        }
      }
    };

    fetchStreak();
  }, [user]);

  // Initialize sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Check if user is admin
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email || '');

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Templates", href: "/templates", icon: FileText },
    ...(isAdmin ? [{ name: "Admin Notifications", href: "/admin/notifications", icon: BellRing }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-sidebar text-foreground font-sans">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen border-none
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-18" : "lg:w-60"}
        bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        flex flex-col
      `}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
              <img
                src="/logo.png"
                alt="Aura"
                className="relative h-8 w-8 object-contain"
              />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-white tracking-tight">
                Aura
              </span>
            )}
          </div>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden ml-auto p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex ml-auto p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive(item.href)
                  ? "bg-white/10 text-white shadow-lg shadow-black/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }
                ${sidebarCollapsed ? "justify-center px-2" : ""}
              `}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${isActive(item.href) ? "text-blue-400" : ""}`}
              />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Section: Streak & Upgrade */}
        <div className="p-4 space-y-4 mt-auto">
          {/* Streak Card */}
          {!sidebarCollapsed ? (
            <div className="bg-[#18181b] rounded-2xl p-4 border border-white/5 shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-transparent rounded-lg">
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Streak</p>
                  <p className="text-xs text-gray-400">{streak} Day Streak</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${streak} Day Streak`}>
              <div className="p-2 bg-[#18181b] rounded-lg border border-white/5">
                <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
              </div>
            </div>
          )}

          {/* Upgrade Card */}
          {!sidebarCollapsed ? (
            <div className="bg-[#18181b] rounded-2xl p-4 border border-white/5 shadow-lg text-center relative overflow-hidden">
              <Button
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl mb-3 h-10"
                onClick={() => navigate("/pricing")}
              >
                Upgrade
              </Button>
              <div className="text-xs text-gray-400 font-medium">
                Remaining Time:
                <div className="text-sm font-bold text-white mt-1 font-mono">
                  {Math.floor(remaining_minutes / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {Math.floor(remaining_minutes % 60)
                    .toString()
                    .padStart(2, "0")}
                  :59
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="icon"
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl shadow-lg"
                onClick={() => navigate("/pricing")}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Mobile Toggle */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-background/80 backdrop-blur-md border border-border/40 rounded-xl shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background lg:rounded-l-[2rem] rounded-none overflow-hidden ml-0">
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-background pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto ">{children}</div>
        </main>
      </div>
    </div>
  );
}
