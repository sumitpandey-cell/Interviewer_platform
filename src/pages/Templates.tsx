import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyTemplateCard } from "@/components/CompanyTemplateCard";
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { CompanyTemplate } from "@/types/company-types";
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code,
  Clock,
  Briefcase,
  CheckCircle2,
  ArrowRight
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
  const [activeTab, setActiveTab] = useState("general");
  const [companyTemplates, setCompanyTemplates] = useState<CompanyTemplate[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyTemplate | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { createInterviewSession, profile, fetchCompanyTemplates } = useOptimizedQueries();

  // Fetch company templates on mount
  useEffect(() => {
    const loadCompanyTemplates = async () => {
      setLoadingCompanies(true);
      try {
        const templates = await fetchCompanyTemplates();
        setCompanyTemplates(templates);
      } catch (error) {
        console.error('Error loading company templates:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanyTemplates();
  }, [fetchCompanyTemplates]);

  // Reset selected company when switching tabs
  useEffect(() => {
    if (activeTab === 'general') {
      setSelectedCompany(null);
    }
  }, [activeTab]);

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
        config: {
          skills: template.skills,
          difficulty: template.difficulty,
        }
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

  // Function to start interview with company and role
  const startCompanyRoleInterview = async (company: CompanyTemplate, role: string) => {
    if (!user) {
      toast.error("Please log in to start an interview");
      return;
    }

    const templateKey = `${company.id}-${role}`;
    setLoadingTemplate(templateKey);

    try {
      // Create interview session directly with 30-minute duration
      const session = await createInterviewSession({
        position: role,
        interview_type: "Technical",
        config: {
          companyInterviewConfig: {
            companyTemplateId: company.id,
            companyName: company.name,
            role: role,
            experienceLevel: 'Mid'
          }
        }
      });

      if (!session) {
        throw new Error('Failed to create interview session');
      }

      toast.success(`Starting ${role} interview at ${company.name}...`);
      navigate(`/interview/${session.id}/setup`);

    } catch (error: any) {
      console.error('Error starting company interview:', error);
      toast.error(error.message || "Failed to start interview");
    } finally {
      setLoadingTemplate(null);
    }
  };

  // Filter company templates based on search
  const filteredCompanyTemplates = companyTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.common_roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  return (
    <DashboardLayout>
      <div className="space-y-8">
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
                <button className="flex bg-card items-center gap-2 hover:bg-accent border border-border rounded-full px-2 py-1.5 transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={getAvatarUrl(
                      profile?.avatar_url || user?.user_metadata?.avatar_url,
                      user?.id || 'user',
                      'avataaars',
                      null,
                      user?.user_metadata?.gender
                    )} />
                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground hidden sm:block">
                    {profile?.full_name?.split(' ')[0] || "User"}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="general">General Templates</TabsTrigger>
            <TabsTrigger value="company">Company Templates</TabsTrigger>
          </TabsList>

          {/* Category Tabs and Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            {/* Category Tabs */}
            <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${activeCategory === category
                    ? "bg-black dark:bg-primary text-white dark:text-primary-foreground shadow-md"
                    : "bg-white dark:bg-card text-gray-700 dark:text-foreground border border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-muted-foreground hover:bg-gray-50 dark:hover:bg-accent"
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

          <TabsContent value="general" className="mt-0 space-y-6">
            {searchTerm && (
              <p className="text-sm text-muted-foreground mb-4">
                Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </p>
            )}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group relative flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  {/* Decorative gradient background at top */}
                  <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/50 dark:to-transparent opacity-50 pointer-events-none`} />

                  <CardContent className="p-6 flex flex-col h-full relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <template.icon className={`h-7 w-7 ${template.color} dark:opacity-90`} />
                        </div>

                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1 group-hover:text-primary transition-colors">
                            {template.title}
                          </h3>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            {template.interviewType}
                          </Badge>
                        </div>
                      </div>

                      <Badge className={`text-[10px] px-2 py-0.5 border ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Skills */}
                    <div className="mt-auto">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                        Key Skills
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {template.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 font-normal"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {template.skills.length > 3 && (
                          <span className="text-xs px-1.5 py-0.5 text-slate-400 dark:text-slate-500 font-medium">
                            +{template.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer / Button */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium">Verified Template</span>
                      </div>

                      <Button
                        size="sm"
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90 shadow-sm hover:shadow transition-all rounded-lg px-4"
                        onClick={() => startInterviewWithTemplate(template)}
                        disabled={loadingTemplate === template.id}
                      >
                        {loadingTemplate === template.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                            Starting...
                          </>
                        ) : (
                          <>
                            Use Template
                            <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-70" />
                          </>
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
          </TabsContent>

          {/* Company Templates Tab */}
          <TabsContent value="company" className="mt-0">
            {!selectedCompany ? (
              <>
                {/* Step 1: Select Company */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a Company</h3>
                  <p className="text-muted-foreground text-sm">Choose a company to see role-specific interview templates</p>
                </div>

                {searchTerm && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {filteredCompanyTemplates.length} company{filteredCompanyTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
                  </p>
                )}

                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading companies...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCompanyTemplates.map((template) => (
                        <CompanyTemplateCard
                          key={template.id}
                          template={template}
                          onSelect={(company) => setSelectedCompany(company)}
                          isLoading={false}
                        />
                      ))}
                    </div>

                    {filteredCompanyTemplates.length === 0 && !loadingCompanies && (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No companies found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm ? (
                            <>
                              Try adjusting your search term or{" "}
                              <button
                                onClick={() => setSearchTerm("")}
                                className="text-primary hover:underline"
                              >
                                clear the search
                              </button>{" "}
                              to see all companies.
                            </>
                          ) : (
                            "No companies available at this time."
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Step 2: Select Role for Selected Company */}
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to companies
                  </button>
                  <div className="flex items-center gap-4 mb-2">
                    {selectedCompany.logo_url && (
                      <img
                        src={selectedCompany.logo_url}
                        alt={`${selectedCompany.name} logo`}
                        className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{selectedCompany.name}</h3>
                      <p className="text-muted-foreground">{selectedCompany.industry}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Select a role to start your interview</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {selectedCompany.common_roles.map((role, index) => (
                    <Card key={index} className="flex flex-col h-full hover:shadow-lg transition-all bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden cursor-pointer group">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center border border-orange-200 dark:border-orange-700">
                            <Briefcase className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {role}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              at {selectedCompany.name}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4 flex-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Code className="h-4 w-4" />
                            <span>Real interview questions</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Code className="h-4 w-4" />
                            <span>Real interview questions</span>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white rounded-xl py-3 font-medium transition-all group-hover:scale-[1.02]"
                          onClick={() => startCompanyRoleInterview(selectedCompany, role)}
                          disabled={loadingTemplate === `${selectedCompany.id}-${role}`}
                        >
                          {loadingTemplate === `${selectedCompany.id}-${role}` ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Starting...
                            </>
                          ) : (
                            <>
                              Start Interview
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div >
    </DashboardLayout >
  );
}