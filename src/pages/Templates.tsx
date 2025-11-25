import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Loader2
} from "lucide-react";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createInterviewSession } = useOptimizedQueries();

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
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
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">Templates</h2>
          <p className="text-muted-foreground">
            Unlock Efficiency with Ready-Made Automation.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, skills, or description..."
            className="pl-10 max-w-md bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm && (
          <p className="text-sm text-muted-foreground">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {template.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {template.interviewType}
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
                <template.icon className={`h-5 w-5 ${template.color}`} />
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {template.description}
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-700">Key Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">
                        {skill}
                      </Badge>
                    ))}
                    {template.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        +{template.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-0">
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Ready to use
                </div>
                <Button 
                  size="sm" 
                  className="bg-primary/90 hover:bg-primary"
                  onClick={() => startInterviewWithTemplate(template)}
                  disabled={loadingTemplate === template.id}
                >
                  {loadingTemplate === template.id ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Starting...
                    </>
                  ) : (
                    "Start →"
                  )}
                </Button>
              </CardFooter>
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