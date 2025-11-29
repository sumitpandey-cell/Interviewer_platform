import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from "@/components/DashboardLayout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Play,
    Send,
    RotateCcw,
    CheckCircle,
    XCircle,
    Code2,
    ChevronRight,
    ChevronDown,
    Clock,
    Trophy,
    ArrowRight,
    FileText,
    Check,
    X,
    AlertCircle,
    Maximize2,
    Minimize2,
    Terminal,
    Bot,
    Building2,
    Tags,
    Keyboard,
    Database,
    Layout,
    Server,
    Cpu,
    BrainCircuit,
    Globe,
    Layers,
    Sparkles,
    Zap,
    GraduationCap,
    Smartphone,
    Cloud,
    Shield,
    Link,
    Binary,
    ChevronLeft,
    ListOrdered,
    GitGraph,
    AlertTriangle,
    Search,
    Lightbulb,
    Bug,
    Loader2,
    Hash,
    Share2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCodingRound, Domain, Question, Topic } from '@/hooks/use-coding-round';
import { generateCodeAnalysis, generateHint, CodeAnalysis } from '@/lib/gemini-code-analysis';
import { executeCode, ExecutionResult } from '@/lib/code-executor';

// Icon Mapping
const ICON_MAP: Record<string, any> = {
    'Code2': Code2,
    'Globe': Globe,
    'Database': Database,
    'Cpu': Cpu,
    'Server': Server,
    'BrainCircuit': BrainCircuit,
    'Binary': Binary,
    'Smartphone': Smartphone,
    'Cloud': Cloud,
    'Terminal': Terminal,
    'Link': Link,
    'Shield': Shield
};

const LANGUAGES = [
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
];

const DEFAULT_CODE_TEMPLATES = {
    javascript: `// Write your code here\n`,
    python: `# Write your code here\n`,
    java: `// Write your code here\n`,
    cpp: `// Write your code here\n`
};

type GameState = 'setup-subject' | 'setup-topic' | 'setup-difficulty' | 'setup-questions' | 'overview' | 'active' | 'completed';

export default function CodingRound() {
    const navigate = useNavigate();
    const { domains, topics, questions, loading: dataLoading, fetchQuestions, fetchTopics } = useCodingRound();

    // Game State
    const [gameState, setGameState] = useState<GameState>('setup-subject');
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [activeTab, setActiveTab] = useState("problem");
    const [timeLeft, setTimeLeft] = useState(45 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState("testcases");
    const [testResults, setTestResults] = useState<any[]>([]);
    const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
    const [submissionResult, setSubmissionResult] = useState<{
        status: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
        passedCount: number;
        totalCount: number;
        runtime: number;
        memory: number;
    } | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<CodeAnalysis | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [isGeneratingHint, setIsGeneratingHint] = useState(false);
    const [activeLeftTab, setActiveLeftTab] = useState("description");

    // Setup State
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState<number | null>(null);
    const [customQuestionCount, setCustomQuestionCount] = useState("");
    const [mode, setMode] = useState<'practice' | 'interview'>('interview');

    const currentQuestion = questions[currentQuestionIndex];

    // Topic Icon Mapping
    const TOPIC_ICON_MAP: Record<string, any> = {
        'Arrays': ListOrdered,
        'Linked Lists': Link,
        'Trees': GitGraph,
        'Graphs': Share2,
        'Dynamic Programming': Layers,
        'Strings': FileText,
        'React': Code2,
        'Node.js': Server,
        'API Design': Globe,
        'CSS': Layout,
        'System Design': Building2,
        'Machine Learning': BrainCircuit
    };

    // Initialize code when question changes
    useEffect(() => {
        if (currentQuestion) {
            const defaultCode = currentQuestion.default_code?.[language] || DEFAULT_CODE_TEMPLATES[language as keyof typeof DEFAULT_CODE_TEMPLATES];
            setCode(defaultCode);
            setTestResults([]);
            setSelectedTestCaseIndex(0);
            setActiveRightTab("testcases");
            setAiAnalysis(null);
            setHint(null);
            setSubmissionStatus('idle');
        }
    }, [currentQuestionIndex, questions, language]);

    // Timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'active' && timeLeft > 0 && mode === 'interview') {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, mode]);

    const handleTimeUp = () => {
        toast.info("Time's up! Submitting your code...");
        handleSubmit(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (mode === 'practice') return "text-foreground";
        if (timeLeft < 60) return "text-red-500 animate-pulse font-bold";
        if (timeLeft < 300) return "text-yellow-500 font-semibold";
        return "text-foreground";
    };


    const handleRun = async () => {
        if (!currentQuestion) return;

        setIsRunning(true);
        setActiveRightTab("testresults");

        try {
            const testCases = currentQuestion.test_cases?.length
                ? currentQuestion.test_cases
                : currentQuestion.examples.map(ex => ({ input: ex.input, output: ex.output }));

            const result = await executeCode(code, language, testCases);

            setTestResults(result.testResults || []);

            if (result.passed) {
                toast.success(`All test cases passed! (${result.executionTime?.toFixed(2)}ms)`);
            } else if (result.testResults?.some(r => r.error)) {
                toast.error("Runtime error in code");
            } else {
                toast.error("Some test cases failed");
            }
        } catch (error: any) {
            toast.error("Execution failed");
            setTestResults([{
                input: "System Error",
                expected: "-",
                actual: "",
                passed: false,
                error: error.message || "Unknown error occurred"
            }]);
        } finally {
            setIsRunning(false);
        }
    };


    const handleSubmit = async (shouldFinish: boolean = false) => {
        if (!currentQuestion) return;

        setIsSubmitting(true);

        try {
            const testCases = currentQuestion.test_cases?.length
                ? currentQuestion.test_cases
                : currentQuestion.examples.map(ex => ({ input: ex.input, output: ex.output }));

            const executionResult = await executeCode(code, language, testCases);

            setSubmissionResult({
                status: executionResult.passed ? 'Accepted' : 'Wrong Answer',
                passedCount: executionResult.testResults?.filter(r => r.passed).length || 0,
                totalCount: testCases.length,
                runtime: Math.round(executionResult.executionTime || Math.random() * 100), // Mock if 0
                memory: Math.round(Math.random() * 50 + 10) // Mock memory
            });

            setShowResultModal(true);

            if (executionResult.passed) {
                setSubmissionStatus('success');
                toast.success("Solution Accepted!");
                if (shouldFinish) {
                    setTimeout(() => {
                        setGameState('completed');
                    }, 2000);
                }
            } else {
                setSubmissionStatus('error');
                toast.error("Solution Rejected");
            }

        } catch (error) {
            console.error("Submission failed", error);
            setSubmissionStatus('error');
            toast.error("Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateHint = async () => {
        if (!currentQuestion) return;

        setIsGeneratingHint(true);
        try {
            const newHint = await generateHint(code, language, currentQuestion.description);
            setHint(newHint);
        } catch (error) {
            toast.error("Failed to generate hint");
        } finally {
            setIsGeneratingHint(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setGameState('completed');
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubjectSelect = (id: string) => {
        setSelectedSubject(id);
        fetchTopics(id);
        setGameState('setup-topic');
    };

    const handleTopicSelect = (id: string) => {
        setSelectedTopic(id);
        setGameState('setup-difficulty');
    };

    const handleDifficultySelect = (diff: string) => {
        setSelectedDifficulty(diff);
        setGameState('setup-questions');
    };

    const handleQuestionCountSelect = (count: number) => {
        setQuestionCount(count);
        setTimeLeft(count * 15 * 60);

        // Fetch questions based on selection
        if (selectedSubject) {
            console.log('Fetching questions with:', { selectedSubject, selectedTopic, selectedDifficulty });
            fetchQuestions(selectedSubject, selectedTopic || undefined, selectedDifficulty || undefined);
        }

        setGameState('overview');
    };

    const handleCustomQuestionSubmit = () => {
        const count = parseInt(customQuestionCount);
        if (count > 0 && count <= 20) {
            handleQuestionCountSelect(count);
        } else {
            toast.error("Please enter a valid number between 1 and 20");
        }
    };

    // Render Logic
    if (dataLoading && gameState === 'setup-subject') {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // Step 1: Subject Selection
    if (gameState === 'setup-subject') {
        return (
            <DashboardLayout>
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-8">
                    <div className="text-center space-y-2 pt-4">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Select a Subject</h1>
                        <p className="text-muted-foreground text-lg">Choose the domain you want to practice</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 lg:px-0">
                        {domains.map((subject) => {
                            const Icon = ICON_MAP[subject.icon] || Code2;
                            return (
                                <Card
                                    key={subject.id}
                                    className="group relative hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm"
                                    onClick={() => handleSubjectSelect(subject.id)}
                                >
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{subject.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{subject.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {subject.companies?.slice(0, 3).map(company => (
                                                <Badge key={company} variant="secondary" className="text-[10px] bg-secondary/50 text-muted-foreground border border-border/50">
                                                    {company}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Step 1.5: Topic Selection
    if (gameState === 'setup-topic') {
        return (
            <DashboardLayout fullWidth>
                <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center bg-background p-4 lg:p-8">
                    <Card className="w-full max-w-5xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300 my-auto">
                        <CardHeader className="text-center space-y-4 pb-8 pt-8 relative">
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-subject')}>
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                            </Button>
                            <div className="space-y-2">
                                <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    Select a Topic
                                </CardTitle>
                                <CardDescription className="text-xl text-muted-foreground/80">
                                    Focus your practice on a specific area
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-12 lg:px-16">
                            {dataLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground animate-pulse">Loading topics...</p>
                                </div>
                            ) : topics.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {topics.map((topic, index) => {
                                        const TopicIcon = TOPIC_ICON_MAP[topic.name] || Hash;
                                        return (
                                            <button
                                                key={topic.id}
                                                className="group relative p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 flex flex-col items-start gap-4 hover:shadow-xl hover:-translate-y-1 text-left overflow-hidden"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                                onClick={() => handleTopicSelect(topic.id)}
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <ArrowRight className="h-5 w-5 text-primary -translate-x-4 group-hover:translate-x-0 transition-transform duration-300" />
                                                </div>

                                                <div className="p-3 rounded-xl bg-background shadow-sm border border-border/50 group-hover:border-primary/50 group-hover:text-primary transition-colors duration-300">
                                                    <TopicIcon className="h-6 w-6" />
                                                </div>

                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
                                                        {topic.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {topic.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    <button
                                        className="group p-6 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-transparent hover:bg-secondary/10 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleTopicSelect('all')}
                                    >
                                        <div className="p-3 rounded-full bg-secondary/20 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                                            <Layers className="h-6 w-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="font-bold text-lg block">All Topics</span>
                                            <span className="text-xs opacity-70">Practice everything</span>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-16 space-y-4">
                                    <div className="p-4 rounded-full bg-secondary/20 w-fit mx-auto">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">No topics found</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto">
                                            We couldn't find any specific topics for this subject yet.
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={() => handleTopicSelect('all')} className="mt-4">
                                        Continue with all questions
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Step 2: Difficulty Selection
    if (gameState === 'setup-difficulty') {
        return (
            <DashboardLayout fullWidth>
                <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center bg-background p-4 lg:p-8">
                    <Card className="w-full max-w-3xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300 my-auto">
                        <CardHeader className="text-center space-y-4 pb-8 pt-8">
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-topic')}>
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                            </Button>
                            <CardTitle className="text-4xl font-bold tracking-tight">Choose Difficulty</CardTitle>
                            <CardDescription className="text-xl">Select the challenge level</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-12 lg:px-16">
                            <div className="grid grid-cols-2 gap-6">
                                {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                                    <button
                                        key={diff}
                                        className={`
                                            p-8 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-all duration-300 flex flex-col items-center gap-4 group hover:shadow-lg hover:-translate-y-1
                                            ${diff === 'Easy' ? 'hover:border-green-500/50 hover:text-green-500' : ''}
                                            ${diff === 'Medium' ? 'hover:border-yellow-500/50 hover:text-yellow-500' : ''}
                                            ${diff === 'Hard' ? 'hover:border-red-500/50 hover:text-red-500' : ''}
                                            ${diff === 'Mixed' ? 'hover:border-purple-500/50 hover:text-purple-500' : ''}
                                        `}
                                        onClick={() => handleDifficultySelect(diff)}
                                    >
                                        <div className={`
                                            w-6 h-6 rounded-full border-4 
                                            ${diff === 'Easy' ? 'border-green-500 bg-green-500/20' : ''}
                                            ${diff === 'Medium' ? 'border-yellow-500 bg-yellow-500/20' : ''}
                                            ${diff === 'Hard' ? 'border-red-500 bg-red-500/20' : ''}
                                            ${diff === 'Mixed' ? 'border-purple-500 bg-purple-500/20' : ''}
                                        `} />
                                        <span className="font-bold text-2xl">{diff}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Step 3: Question Count Selection
    if (gameState === 'setup-questions') {
        return (
            <DashboardLayout fullWidth>
                <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center bg-background p-4 lg:p-8">
                    <Card className="w-full max-w-3xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-right-8 duration-300 my-auto">
                        <CardHeader className="text-center space-y-4 pb-8 pt-8">
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-difficulty')}>
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                            </Button>
                            <CardTitle className="text-4xl font-bold tracking-tight">How many questions?</CardTitle>
                            <CardDescription className="text-xl">Customize your session length</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 pb-12 lg:px-16 space-y-10">
                            <div className="flex flex-wrap justify-center gap-6">
                                {[1, 2, 3, 5, 10].map((count) => (
                                    <button
                                        key={count}
                                        className="w-20 h-20 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-bold text-2xl shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        onClick={() => handleQuestionCountSelect(count)}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 max-w-sm mx-auto">
                                <div className="h-px bg-border flex-1" />
                                <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Or Custom</span>
                                <div className="h-px bg-border flex-1" />
                            </div>

                            <div className="flex gap-3 max-w-xs mx-auto">
                                <Input
                                    type="number"
                                    placeholder="Enter number..."
                                    min={1}
                                    max={20}
                                    value={customQuestionCount}
                                    onChange={(e) => setCustomQuestionCount(e.target.value)}
                                    className="text-center h-12 text-lg"
                                />
                                <Button onClick={handleCustomQuestionSubmit} className="h-12 px-6">Go</Button>
                            </div>

                            <div className="bg-secondary/20 rounded-xl p-6 text-center border border-border/50">
                                <p className="text-base text-muted-foreground">
                                    <Clock className="h-5 w-5 inline mr-2 text-blue-500" />
                                    Estimated Time: <span className="font-semibold text-foreground">~15 mins per question</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Step 4: Overview Screen
    if (gameState === 'overview') {
        const subject = domains.find(s => s.id === selectedSubject);
        const topic = topics.find(t => t.id === selectedTopic);
        const Icon = subject ? (ICON_MAP[subject.icon] || Code2) : Code2;

        return (
            <DashboardLayout fullWidth>
                <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center bg-background p-4 lg:p-8">
                    <Card className="w-full max-w-3xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300 my-auto">
                        <CardHeader className="text-center space-y-4 pb-8 pt-8">
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-questions')}>
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                            </Button>
                            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-inner">
                                <Icon className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-4xl font-bold tracking-tight">Coding Round Overview</CardTitle>
                            <CardDescription className="text-xl">
                                Ready to start your session?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 px-8 lg:px-16 pb-12">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Subject</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {subject?.name || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Topic</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {topic?.name || 'All Topics'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Difficulty</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {selectedDifficulty || 'Mixed'}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Questions</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {questionCount || 0} Questions
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="flex bg-secondary/20 p-1.5 rounded-2xl">
                                <button
                                    className={`flex-1 py-3 px-4 rounded-xl text-base font-medium transition-all duration-200 ${mode === 'practice' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setMode('practice')}
                                >
                                    <GraduationCap className="h-5 w-5 inline mr-2" />
                                    Practice Mode
                                </button>
                                <button
                                    className={`flex-1 py-3 px-4 rounded-xl text-base font-medium transition-all duration-200 ${mode === 'interview' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setMode('interview')}
                                >
                                    <Zap className="h-5 w-5 inline mr-2" />
                                    Interview Mode
                                </button>
                            </div>

                            <div className="text-sm text-center text-muted-foreground font-medium">
                                {mode === 'practice' ? 'Unlimited time • Hints allowed • Relaxed environment' : 'Timed session • No hints initially • Realistic pressure'}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center pb-12 pt-4">
                            <Button
                                size="lg"
                                className="w-full max-w-sm text-lg h-14 gap-2 shadow-xl hover:shadow-primary/25 transition-all rounded-xl"
                                onClick={() => setGameState('active')}
                                disabled={dataLoading || questions.length === 0}
                            >
                                {dataLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <>
                                        Start Coding Round
                                        <ArrowRight className="h-6 w-6" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Completed View
    if (gameState === 'completed') {
        return (
            <DashboardLayout fullWidth>
                <div className="h-[calc(100vh-4rem)] lg:h-screen flex items-center justify-center bg-background p-4">
                    <Card className="w-full max-w-xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <CardHeader className="text-center space-y-2 pb-8 pt-10">
                            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${finalScore >= 70 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {finalScore >= 70 ? <Trophy className="h-10 w-10" /> : <CheckCircle className="h-10 w-10" />}
                            </div>
                            <CardTitle className="text-3xl font-bold">Round Completed</CardTitle>
                            <CardDescription className="text-lg">
                                Here is how you performed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 px-8">
                            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 border border-border/50">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Score</span>
                                <div className="text-5xl font-bold mt-2 mb-1">{finalScore}/100</div>
                                <Badge variant={finalScore >= 70 ? "default" : "secondary"} className="mt-2">
                                    {finalScore >= 70 ? "Passed" : "Completed"}
                                </Badge>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-8 pt-4">
                            <Button
                                size="lg"
                                className="w-full h-12 gap-2"
                                onClick={() => navigate('/reports')}
                            >
                                View Detailed Report
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground hover:text-foreground"
                                onClick={() => navigate('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Active View (Editor)
    return (
        <DashboardLayout fullWidth>
            <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col bg-background text-foreground overflow-hidden border-none shadow-none animate-in fade-in duration-500">
                {/* Header */}
                <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">Coding Round</span>
                        </div>
                        <div className="h-4 w-px bg-border" />

                        {/* Problem Navigation */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {mode === 'interview' && (
                            <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-md bg-secondary/50 transition-colors duration-300 ${getTimerColor()}`}>
                                <Clock className="h-4 w-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Run
                        </Button>
                        <Button
                            variant={submissionStatus === 'success' ? "default" : "secondary"}
                            size="sm"
                            className="gap-2"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Submit
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    {/* Left Panel: Problem Description */}
                    <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
                        <Tabs value={activeLeftTab} onValueChange={setActiveLeftTab} className="h-full flex flex-col">
                            <div className="px-6 pt-4 border-b border-border/50">
                                <TabsList className="bg-transparent p-0 gap-6">
                                    <TabsTrigger
                                        value="description"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 font-semibold"
                                    >
                                        Description
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="hints"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 font-semibold"
                                    >
                                        AI Hint
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="description" className="flex-1 p-0 m-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-6">
                                        {currentQuestion ? (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-2xl font-bold">{currentQuestion.title}</h2>
                                                        <Badge variant={currentQuestion.difficulty === 'Easy' ? 'default' : currentQuestion.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                                                            {currentQuestion.difficulty}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {currentQuestion.topics?.map(topic => (
                                                            <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <p className="whitespace-pre-wrap">{currentQuestion.description}</p>
                                                </div>

                                                {currentQuestion.examples?.map((example, index) => (
                                                    <Card key={index} className="bg-secondary/20 border-border/50">
                                                        <CardHeader className="py-3">
                                                            <CardTitle className="text-sm font-medium">Example {index + 1}</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="py-3 space-y-2 text-sm font-mono">
                                                            <div><span className="text-muted-foreground">Input:</span> {example.input}</div>
                                                            <div><span className="text-muted-foreground">Output:</span> {example.output}</div>
                                                            {example.explanation && (
                                                                <div className="text-muted-foreground font-sans mt-2">{example.explanation}</div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                <div className="space-y-2">
                                                    <h3 className="font-semibold">Constraints:</h3>
                                                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                                        {currentQuestion.constraints?.map((constraint, i) => (
                                                            <li key={i}>{constraint}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                No question selected
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="hints" className="flex-1 p-0 m-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                                <h3 className="font-bold text-lg">Need a hint?</h3>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Stuck on the problem? You can view static hints if available, or ask our AI assistant for a personalized hint based on your current code.
                                            </p>
                                        </div>

                                        {/* Static Hints */}
                                        {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Problem Hints</h4>
                                                {currentQuestion.hints.map((hintText, index) => (
                                                    <Card key={index} className="bg-secondary/10 border-border/50">
                                                        <CardContent className="p-4">
                                                            <p className="text-sm">{hintText}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        {/* AI Hint Generation */}
                                        <div className="space-y-4 pt-4 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <Bot className="h-4 w-4 text-primary" />
                                                    AI Assistant
                                                </h4>
                                                {!hint && (
                                                    <Button
                                                        onClick={handleGenerateHint}
                                                        disabled={isGeneratingHint}
                                                        size="sm"
                                                    >
                                                        {isGeneratingHint ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Thinking...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-4 w-4 mr-2" />
                                                                Get AI Hint
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>

                                            {hint && (
                                                <Card className="bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                                                            <Sparkles className="h-4 w-4" />
                                                            AI Suggestion
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="text-sm leading-relaxed">
                                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                                            <p className="whitespace-pre-wrap">{hint}</p>
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="pt-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                                                            onClick={() => setHint(null)}
                                                        >
                                                            Ask for another hint
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel: Editor & Console */}
                    <ResizablePanel defaultSize={60}>
                        <ResizablePanelGroup direction="vertical">
                            {/* Editor */}
                            <ResizablePanel defaultSize={70}>
                                <div className="h-full flex flex-col">
                                    <div className="h-10 border-b border-border bg-secondary/10 flex items-center justify-between px-4">
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-none focus:ring-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGES.map(lang => (
                                                    <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCode(currentQuestion?.default_code?.[language] || "")}>
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Editor
                                        height="100%"
                                        language={language}
                                        theme="vs-dark"
                                        value={code}
                                        onChange={(value) => setCode(value || "")}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                        }}
                                    />
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            {/* Console / AI Feedback */}
                            <ResizablePanel defaultSize={30}>
                                <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="h-full flex flex-col">
                                    <div className="h-10 border-b border-border bg-secondary/10 px-2">
                                        <TabsList className="h-full bg-transparent p-0">
                                            <TabsTrigger value="testcases" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Test Cases
                                                </div>
                                            </TabsTrigger>
                                            <TabsTrigger value="testresults" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4">
                                                <div className="flex items-center gap-2">
                                                    <Terminal className="h-4 w-4" />
                                                    Test Results
                                                </div>
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {/* Test Cases Tab */}
                                    <TabsContent value="testcases" className="flex-1 p-0 m-0 overflow-hidden">
                                        <ScrollArea className="h-full p-4">
                                            {currentQuestion ? (
                                                <div className="space-y-4">
                                                    <div className="flex gap-2">
                                                        {(currentQuestion.test_cases?.length
                                                            ? currentQuestion.test_cases
                                                            : currentQuestion.examples
                                                        ).map((_, index) => (
                                                            <Button
                                                                key={index}
                                                                variant={selectedTestCaseIndex === index ? "secondary" : "ghost"}
                                                                size="sm"
                                                                onClick={() => setSelectedTestCaseIndex(index)}
                                                                className="h-8"
                                                            >
                                                                Case {index + 1}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Input</label>
                                                        <div className="p-3 rounded-md bg-secondary/20 border border-border/50 font-mono text-sm">
                                                            {(currentQuestion.test_cases?.length
                                                                ? currentQuestion.test_cases
                                                                : currentQuestion.examples
                                                            )[selectedTestCaseIndex]?.input}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground text-center mt-10">No question selected</div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>

                                    {/* Test Results Tab */}
                                    <TabsContent value="testresults" className="flex-1 p-0 m-0 overflow-hidden">
                                        <ScrollArea className="h-full p-4">
                                            {testResults.length > 0 ? (
                                                <div className="space-y-6">
                                                    {/* Overall Status */}
                                                    <div className="space-y-3">
                                                        <div className={`text-lg font-bold flex items-center gap-2 ${testResults.every(r => r.passed) ? 'text-green-500' : testResults.some(r => r.error) ? 'text-red-500' : 'text-yellow-500'}`}>
                                                            {testResults.every(r => r.passed) ? (
                                                                <>
                                                                    <CheckCircle className="h-5 w-5" />
                                                                    Accepted
                                                                </>
                                                            ) : testResults.some(r => r.error) ? (
                                                                <>
                                                                    <XCircle className="h-5 w-5" />
                                                                    Runtime Error
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-5 w-5" />
                                                                    Wrong Answer
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="flex gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground">Test Cases:</span>
                                                                <span className="font-mono font-semibold">
                                                                    {testResults.filter(r => r.passed).length}/{testResults.length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Test Case Tabs */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        {testResults.map((result, index) => (
                                                            <Button
                                                                key={index}
                                                                variant={selectedTestCaseIndex === index ? "secondary" : "ghost"}
                                                                size="sm"
                                                                onClick={() => setSelectedTestCaseIndex(index)}
                                                                className="h-8 gap-2"
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${result.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                                                                Case {index + 1}
                                                            </Button>
                                                        ))}
                                                    </div>

                                                    {/* Selected Test Case Details */}
                                                    {testResults[selectedTestCaseIndex] && (
                                                        <div className="space-y-4 animate-in fade-in duration-300">
                                                            {/* Status Banner */}
                                                            {testResults[selectedTestCaseIndex].passed ? (
                                                                <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
                                                                    <Check className="h-4 w-4" />
                                                                    <span className="font-bold">Test case passed</span>
                                                                </div>
                                                            ) : testResults[selectedTestCaseIndex].error ? (
                                                                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        <span className="font-bold">Runtime Error</span>
                                                                    </div>
                                                                    <div className="font-mono text-xs bg-red-500/5 p-2 rounded border border-red-500/10 mt-2">
                                                                        {testResults[selectedTestCaseIndex].error}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                                                                    <X className="h-4 w-4" />
                                                                    <span className="font-bold">Wrong Answer</span>
                                                                </div>
                                                            )}

                                                            {/* Input */}
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-medium text-muted-foreground uppercase">Input</label>
                                                                <div className="p-3 rounded-md bg-secondary/20 border border-border/50 font-mono text-sm">
                                                                    {testResults[selectedTestCaseIndex].input}
                                                                </div>
                                                            </div>

                                                            {/* Output (only if no error) */}
                                                            {!testResults[selectedTestCaseIndex].error && (
                                                                <>
                                                                    <div className="space-y-1">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Your Output</label>
                                                                        <div className={`p-3 rounded-md border font-mono text-sm ${testResults[selectedTestCaseIndex].passed ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                                                                            {testResults[selectedTestCaseIndex].actual || 'undefined'}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Expected Output</label>
                                                                        <div className="p-3 rounded-md bg-secondary/20 border border-border/50 font-mono text-sm">
                                                                            {testResults[selectedTestCaseIndex].expected}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-50">
                                                    <Play className="h-8 w-8" />
                                                    <p>Run code to see results</p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>


            {/* Submission Result Modal */}
            <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={`text-2xl font-bold flex items-center gap-2 ${submissionResult?.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                            {submissionResult?.status === 'Accepted' ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                            {submissionResult?.status}
                        </DialogTitle>
                        <DialogDescription>
                            Submission details for your solution
                        </DialogDescription>
                    </DialogHeader>

                    {submissionResult && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-semibold">Runtime</div>
                                <div className="text-2xl font-bold font-mono">{submissionResult.runtime} ms</div>
                                <div className="text-xs text-green-500">Beats {Math.round(Math.random() * 40 + 50)}%</div>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 space-y-1">
                                <div className="text-xs text-muted-foreground uppercase font-semibold">Memory</div>
                                <div className="text-2xl font-bold font-mono">{submissionResult.memory} MB</div>
                                <div className="text-xs text-green-500">Beats {Math.round(Math.random() * 40 + 50)}%</div>
                            </div>
                            <div className="col-span-2 p-4 rounded-xl bg-secondary/20 border border-border/50 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">Test Cases</div>
                                    <div className="text-lg font-bold">
                                        {submissionResult.passedCount} / {submissionResult.totalCount} passed
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-full border-4 border-secondary flex items-center justify-center font-bold text-xs">
                                    {Math.round((submissionResult.passedCount / submissionResult.totalCount) * 100)}%
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-between gap-2">
                        <Button variant="outline" onClick={() => setShowResultModal(false)}>
                            Close
                        </Button>
                        {submissionResult?.status === 'Accepted' && (
                            <Button onClick={() => setGameState('completed')}>
                                Finish Round
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
