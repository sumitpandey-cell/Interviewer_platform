import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { toast } from "sonner";
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
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
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
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";

const templates = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    icon: Code2,
    description: "Template for assessing frontend development skills, including UI design, interactivity, and integration with APIs.",
    color: "text-blue-500",
    interviewType: "Technical",
    skills: ["React", "JavaScript", "CSS", "HTML", "UI/UX"],
    difficulty: "Intermediate"
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    icon: Database,
    description: "Template for assessing backend development skills, including API design, database management, and application architecture.",
    color: "text-purple-500",
    interviewType: "Technical",
    skills: ["Node.js", "Database", "API Design", "System Design"],
    difficulty: "Intermediate"
  },
  {
    id: "content-creator",
    title: "Content Creator",
    icon: PenTool,
    description: "Template for evaluating content creation skills, including writing quality, creativity, audience engagement, and platform knowledge.",
    color: "text-pink-500",
    interviewType: "Creative",
    skills: ["Writing", "Creativity", "Social Media", "Analytics"],
    difficulty: "Beginner"
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    icon: Server,
    description: "Template for assessing DevOps skills, including CI/CD implementation, cloud infrastructure management, automation, and monitoring.",
    color: "text-orange-500",
    interviewType: "Technical",
    skills: ["Docker", "Kubernetes", "CI/CD", "Cloud", "Monitoring"],
    difficulty: "Advanced"
  },
  {
    id: "fullstack-developer",
    title: "Full Stack Developer",
    icon: Layers,
    description: "Template for assessing full stack development skills, including frontend, backend, APIs, and deployment.",
    color: "text-indigo-500",
    interviewType: "Technical",
    skills: ["Frontend", "Backend", "Database", "Deployment"],
    difficulty: "Advanced"
  },
  {
    id: "ai-ml-engineer",
    title: "AI/ML Engineer",
    icon: BrainCircuit,
    description: "Template for assessing artificial intelligence and machine learning skills, including model building, data processing, and evaluation.",
    color: "text-green-500",
    interviewType: "Technical",
    skills: ["Python", "TensorFlow", "Data Science", "Statistics"],
    difficulty: "Advanced"
  },
  {
    id: "blockchain-developer",
    title: "Blockchain Developer",
    icon: Bitcoin,
    description: "Template for assessing blockchain development skills, including smart contracts, decentralized applications, and cryptography.",
    color: "text-yellow-500",
    interviewType: "Technical",
    skills: ["Solidity", "Web3", "Smart Contracts", "Cryptography"],
    difficulty: "Advanced"
  },
  {
    id: "java-developer",
    title: "Java Developer",
    icon: Coffee,
    description: "Template for assessing Java programming skills, including OOP, frameworks, and backend development.",
    color: "text-red-500",
    interviewType: "Technical",
    skills: ["Java", "Spring Boot", "OOP", "Microservices"],
    difficulty: "Intermediate"
  },
  {
    id: "marketing-head",
    title: "Marketing Head",
    icon: Megaphone,
    description: "Template for assessing marketing leadership skills, including strategy, brand management, and market analysis.",
    color: "text-cyan-500",
    interviewType: "Behavioral",
    skills: ["Strategy", "Leadership", "Analytics", "Branding"],
    difficulty: "Advanced"
  },
  {
    id: "content-writer",
    title: "Content Writer",
    icon: Feather,
    description: "Template for assessing content writing skills, including research, creativity, and SEO.",
    color: "text-teal-500",
    interviewType: "Creative",
    skills: ["Writing", "SEO", "Research", "Grammar"],
    difficulty: "Beginner"
  },
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    icon: BarChart,
    description: "Template for assessing digital marketing skills, including SEO, SEM, social media, and analytics.",
    color: "text-violet-500",
    interviewType: "Technical",
    skills: ["SEO", "SEM", "Social Media", "Analytics"],
    difficulty: "Intermediate"
  },
  {
    id: "hr-specialist",
    title: "HR Specialist",
    icon: Users,
    description: "Template for assessing human resources skills, including recruitment, employee relations, and compliance.",
    color: "text-rose-500",
    interviewType: "Behavioral",
    skills: ["Recruitment", "Employee Relations", "Compliance"],
    difficulty: "Intermediate"
  },
];

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { createInterviewSession, profile } = useOptimizedQueries();

  // Categories for filtering
  const categories = ["All", "Popular", "Engineer", "Marketing"];

  // Popular templates (you can customize this list)
  const popularTemplateIds = ["frontend-developer", "backend-developer", "fullstack-developer", "ai-ml-engineer"];

  // Filter templates based on category
  const getCategoryTemplates = () => {
    switch (activeCategory) {
      case "Popular":
        return templates.filter(t => popularTemplateIds.includes(t.id));
      case "Engineer":
        return templates.filter(t =>
          t.title.toLowerCase().includes("developer") ||
          t.title.toLowerCase().includes("engineer") ||
          t.title.toLowerCase().includes("devops")
        );
      case "Marketing":
        return templates.filter(t =>
          t.title.toLowerCase().includes("marketing") ||
          t.title.toLowerCase().includes("content")
        );
      default:
        return templates;
    }
  };

  // Filter templates based on search term and category
  const filteredTemplates = getCategoryTemplates().filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Function to start interview with selected template
  const startInterviewWithTemplate = async (template: typeof templates[0]) => {
    if (!user) {
      toast.error("Please log in to start an interview");
      return;
    }

    setLoadingTemplate(template.id);

    try {
      // Create a new interview session using optimized method
      const session = await createInterviewSession({
        position: template.title,
        interview_type: template.interviewType,
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${template.title} interview...`);

      // Navigate to interview setup page with the session ID
      navigate(`/interview/${session.id}/setup`);

    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section with Controls */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-2 text-3xl font-bold text-foreground">Templates</h2>
            <p className="text-muted-foreground text-sm">
              Unlock Efficiency with Ready-Made Automation.
            </p>
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

        {/* Category Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeCategory === category
                  ? "bg-black text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, skills, or description..."
              className="pl-10 w-full md:w-80 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {searchTerm && (
          <p className="text-sm text-muted-foreground">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col h-full hover:shadow-lg transition-all bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <template.icon className={`h-6 w-6 ${template.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.title}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 whitespace-nowrap">
                        {template.interviewType}
                      </Badge>
                      <Badge className={`text-xs whitespace-nowrap ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Skill and Description Labels */}
                <div className="space-y-2 text-sm mb-4 flex-1">
                  <div className="flex gap-2">
                    <span className="text-gray-500 font-normal">Skill</span>
                    <span className="text-gray-900 font-medium">{template.skills[0]}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 font-normal">Desc</span>
                    <span className="text-gray-900 font-medium">
                      {template.description}
                    </span>
                  </div>
                </div>

                {/* Duration and Button */}
                <div className="flex items-center gap-3 pt-2 mt-auto">
                  <span className="text-2xl font-bold text-gray-900">30m</span>
                  <Button
                    className="flex-1 bg-black hover:bg-gray-900 text-white rounded-xl py-3 font-medium transition-all hover:scale-[1.02]"
                    onClick={() => startInterviewWithTemplate(template)}
                    disabled={loadingTemplate === template.id}
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
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search term or{" "}
              <button
                onClick={() => setSearchTerm("")}
                className="text-primary hover:underline"
              >
                clear the search
              </button>{" "}
              to see all templates.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}