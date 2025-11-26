import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useUserProfile } from "@/hooks/use-user-profile";
import { toast } from "sonner";
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Search,
  Code2,
  Database,
  PenTool,
  Server,
  Layers,
  BrainCircuit,
  Bitcoin,
  Coffee,
  Megaphone,
  Feather,
  BarChart,
  Users,
  Loader2,
  Briefcase,
  Bell,
  Sun,
  Moon,
  Settings,
  LogOut,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const templates = [
  {
    id: "general-interview",
    title: "General Interview",
    icon: Briefcase,
    iconLabel: "General Interview",
    description: "Common questions for all roles",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
    interviewType: "Behavioral",
    duration: "30m",
    category: "Popular"
  },
  {
    id: "technical-interview",
    title: "Technical Interview",
    icon: Code2,
    iconLabel: "Technical Interview",
    description: "Programming and system design",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    interviewType: "Technical",
    duration: "60m",
    category: "Engineering"
  },
  {
    id: "sales-role",
    title: "Sales Role",
    icon: Megaphone,
    iconLabel: "General Interview",
    description: "Pitching and negotiation",
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    interviewType: "Behavioral",
    duration: "45m",
    category: "Marketing"
  },
  {
    id: "hr-screening",
    title: "HR Screening",
    icon: Users,
    iconLabel: "HR Soruntl Interview", // Typo in design image "Soruntl", keeping "Screening" or similar
    description: "Culture fit and basics",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    interviewType: "Behavioral",
    duration: "20m",
    category: "Popular"
  },
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    icon: Layers,
    iconLabel: "Frontend Interview",
    description: "React, CSS, and UI/UX",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    interviewType: "Technical",
    duration: "45m",
    category: "Engineering"
  },
  {
    id: "marketing-manager",
    title: "Marketing Manager",
    icon: BarChart,
    iconLabel: "Marketing Interview",
    description: "Strategy and analytics",
    bgColor: "bg-pink-100",
    iconColor: "text-pink-600",
    interviewType: "Behavioral",
    duration: "40m",
    category: "Marketing"
  }
];

const categories = ["All", "Popular", "Engineering", "Marketing"];

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { createInterviewSession } = useOptimizedQueries();
  const { profile: userProfile } = useUserProfile();

  // Filter templates based on active category
  const filteredTemplates = activeCategory === "All"
    ? templates
    : templates.filter(t => t.category === activeCategory);

  const startInterviewWithTemplate = async (template: typeof templates[0]) => {
    if (!user) {
      toast.error("Please log in to start an interview");
      return;
    }

    setLoadingTemplate(template.id);

    try {
      const session = await createInterviewSession({
        position: template.title,
        interview_type: template.interviewType,
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${template.title} interview...`);
      navigate(`/interview/${session.id}/setup`);

    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };

  return (
    <DashboardLayout showTopNav={false}>
      <div className="p-6 sm:p-8 h-full bg-[#f8f9fc]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Templates Library</h1>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto pl-2 pr-4 rounded-full border border-gray-200 hover:bg-gray-50 gap-3 bg-white">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(
                      userProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
                      user?.id || user?.email || 'user',
                      'avataaars',
                      user?.user_metadata?.picture
                    )} />
                    <AvatarFallback>
                      {getInitials(userProfile?.full_name || user?.user_metadata?.full_name) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile?.full_name || user?.user_metadata?.full_name || "User"}
                  </span>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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

            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              <div className="p-1.5 rounded-full bg-white shadow-sm">
                <Sun className="h-4 w-4 text-gray-700" />
              </div>
              <div className="p-1.5 rounded-full">
                <Moon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-6 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-sm font-medium transition-colors whitespace-nowrap px-4 py-2 rounded-full ${activeCategory === category
                ? "bg-black text-white"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {category}
            </button>
          ))}
          <button className="text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap px-4 py-2">
            Filters
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-[280px] hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${template.bgColor}`}>
                    <template.icon className={`h-6 w-6 ${template.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{template.title}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <span className="text-xs text-gray-400 w-10 shrink-0 mt-0.5">Icon</span>
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{template.iconLabel}</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-xs text-gray-400 w-10 shrink-0 mt-0.5">Desc</span>
                    <span className="text-sm font-medium text-gray-900 line-clamp-2">{template.description}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-3xl font-bold text-gray-900">{template.duration}</span>
                <Button
                  onClick={() => startInterviewWithTemplate(template)}
                  disabled={loadingTemplate === template.id}
                  className="bg-black hover:bg-gray-900 text-white rounded-xl px-8 h-11 text-sm font-medium"
                >
                  {loadingTemplate === template.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : (
                    "Use Template"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}