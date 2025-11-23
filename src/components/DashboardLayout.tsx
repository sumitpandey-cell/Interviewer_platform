import { ReactNode } from "react";
import { Brain, LayoutDashboard, Briefcase, FileText, BarChart3, Bell, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Recommended Jobs", href: "/jobs", icon: Briefcase },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-lg font-bold text-foreground">AI Interview Agents</span>
        </div>

        <nav className="space-y-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-4 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Brain className="h-4 w-4" />
              <span>30 min FREE daily</span>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              0 used of 30 total
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0 bg-primary transition-all" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">30 minutes left</p>
          </div>
          <Button
            variant="default"
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            <Brain className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}