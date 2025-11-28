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
    Bug
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Mock Data
// Mock Data
const QUESTIONS = [
    {
        id: 1,
        title: "Two Sum",
        difficulty: "Easy",
        company: ["Google", "Meta", "Amazon"],
        topics: ["Arrays", "Hash Table", "Two Pointers"],
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would be **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
            { input: "nums = [3,3], target = 6", output: "[0,1]" }
        ],
        hints: [
            "A really brute force way would be to search for all possible pairs of numbers but that would be slow. Again, it's best to try out brute force solutions for completeness. It is from these brute force solutions that you can come up with optimizations.",
            "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
            "The second train of thought is, without changing the array, can we use additional space to somehow speed up the search?"
        ]
    },
    {
        id: 2,
        title: "Valid Palindrome",
        difficulty: "Easy",
        company: ["Facebook", "Microsoft", "Uber"],
        topics: ["Two Pointers", "String"],
        description: "A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, return `true` *if it is a palindrome, or* `false` *otherwise*.",
        constraints: [
            "1 <= s.length <= 2 * 10^5",
            "s consists only of printable ASCII characters."
        ],
        examples: [
            { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
            { input: 's = "race a car"', output: "false", explanation: '"raceacar" is not a palindrome.' },
            { input: 's = " "', output: "true", explanation: 's is an empty string "" after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.' }
        ],
        hints: [
            "Read about Two Pointers",
            "Consider using regex to clean the string first, or skip non-alphanumeric characters during iteration."
        ]
    },
    {
        id: 3,
        title: "Reverse Linked List",
        difficulty: "Medium",
        company: ["Amazon", "Google", "Apple"],
        topics: ["Linked List", "Recursion"],
        description: "Given the `head` of a singly linked list, reverse the list, and return the reversed list.",
        constraints: [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000"
        ],
        examples: [
            { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
            { input: "head = [1,2]", output: "[2,1]" },
            { input: "head = []", output: "[]" }
        ],
        hints: [
            "Iterative approach is O(1) space",
            "Recursive approach is O(n) space"
        ]
    }
];

const LANGUAGES = [
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
];

const DEFAULT_CODE = {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Write your code here
    
};`,
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        return {};
    }
};`
};

const SUBJECTS = [
    { id: 'dsa', name: 'Data Structures & Algorithms', icon: Code2, description: 'Arrays, Trees, Graphs, DP', companies: ['Google', 'Meta', 'Amazon'] },
    { id: 'web', name: 'Web Development', icon: Globe, description: 'React, Node.js, API Design', companies: ['Netflix', 'Airbnb', 'Uber'] },
    { id: 'sql', name: 'Database / SQL', icon: Database, description: 'Queries, Normalization, Indexing', companies: ['Oracle', 'Stripe', 'Square'] },
    { id: 'os', name: 'Operating Systems', icon: Cpu, description: 'Threads, Processes, Memory', companies: ['Microsoft', 'Intel', 'Apple'] },
    { id: 'system', name: 'System Design', icon: Server, description: 'Scalability, Load Balancing', companies: ['Twitter', 'LinkedIn', 'Zoom'] },
    { id: 'ml', name: 'Machine Learning', icon: BrainCircuit, description: 'Models, Neural Networks', companies: ['OpenAI', 'DeepMind', 'Tesla'] },
    { id: 'cp', name: 'Competitive Programming', icon: Binary, description: 'Advanced Algorithms, Math', companies: ['CodeForces', 'AtCoder'] },
    { id: 'mobile', name: 'Mobile Development', icon: Smartphone, description: 'iOS, Android, React Native', companies: ['Uber', 'Snapchat'] },
    { id: 'cloud', name: 'Cloud Computing', icon: Cloud, description: 'AWS, Azure, Docker, K8s', companies: ['Amazon', 'Microsoft'] },
    { id: 'devops', name: 'DevOps', icon: Terminal, description: 'CI/CD, Infrastructure as Code', companies: ['GitLab', 'Datadog'] },
    { id: 'blockchain', name: 'Blockchain', icon: Link, description: 'Smart Contracts, Solidity', companies: ['Coinbase', 'Binance'] },
    { id: 'security', name: 'Cyber Security', icon: Shield, description: 'Pen Testing, Cryptography', companies: ['CrowdStrike', 'Palo Alto'] },
];

const MOCK_AI_ANALYSIS = {
    complexity: {
        time: "O(n)",
        space: "O(n)",
        explanation: "The algorithm uses a hash map to store visited values which leads to linear space usage."
    },
    quality: {
        good: ["Good variable naming (nums, target)", "Function structure is clean", "Comments improve clarity"],
        improvements: ["Reduce nesting levels", "Avoid mutating input array", "Prefer const/let over var in JavaScript"]
    },
    logic: {
        handled: ["Typical cases", "Duplicate values", "Early exit"],
        missing: ["Negative numbers", "Very large inputs", "Single-element arrays (should return empty)"]
    },
    explanation: [
        "You iterate through each number.",
        "For every number, you check if (target - current) exists in the map.",
        "If yes, you return the indices.",
        "Otherwise, you store it in memory for lookup."
    ],
    alternative: {
        name: "Two-pointer approach (O(n log n))",
        condition: "Works when array is sorted.",
        tradeoffs: ["Sorting changes original indices", "Needs extra memory to track original index"]
    },
    security: [
        "No security risks detected.",
        "Input handling is safe.",
        "No infinite loops detected."
    ],
    score: 82,
    recommendation: ["Handle negative inputs", "Add guard clauses at start of function"]
};

type GameState = 'setup-subject' | 'setup-difficulty' | 'setup-questions' | 'overview' | 'active' | 'completed';

export default function CodingRound() {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameState>('setup-subject');
    const [code, setCode] = useState(DEFAULT_CODE.javascript);
    const [language, setLanguage] = useState("javascript");
    const [activeTab, setActiveTab] = useState("problem");
    const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState("");
    const [showHints, setShowHints] = useState(false);
    const [activeHintIndex, setActiveHintIndex] = useState(0);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [showResultModal, setShowResultModal] = useState(false);

    const currentProblem = QUESTIONS[(currentQuestion - 1) % QUESTIONS.length];

    const handleNext = () => {
        if (currentQuestion < (questionCount || 3)) {
            setCurrentQuestion(prev => prev + 1);
            // Reset code or load saved code for next question here
            setConsoleOutput("");
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 1) {
            setCurrentQuestion(prev => prev - 1);
            // Reset code or load saved code for prev question here
            setConsoleOutput("");
        }
    };

    // Setup State
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState<number | null>(null);
    const [customQuestionCount, setCustomQuestionCount] = useState("");
    const [mode, setMode] = useState<'practice' | 'interview'>('interview');

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

    // Auto-save logic
    useEffect(() => {
        if (!isDirty) return;

        const timeout = setTimeout(() => {
            setLastSaved(new Date());
            setIsDirty(false);
        }, 10000);

        return () => clearTimeout(timeout);
    }, [code, isDirty]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + Enter -> Submit
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                if (!isSubmitting && !isRunning) handleSubmit();
            }
            // Esc -> Exit Fullscreen
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, isSubmitting, isRunning]);

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

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        setCode(DEFAULT_CODE[value as keyof typeof DEFAULT_CODE]);
    };

    const handleCodeChange = (value: string | undefined) => {
        setCode(value || "");
        setIsDirty(true);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setActiveTab("console");
        setConsoleOutput("Running tests...\n");

        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setConsoleOutput("Running sample tests...\nTest Case 1: Passed (2ms)\nTest Case 2: Passed (1ms)\nTest Case 3: Passed (1ms)\n\nAll sample tests passed!");
        setIsRunning(false);
    };

    const handleSubmit = async (shouldFinish: boolean = false) => {
        setIsSubmitting(true);
        if (!shouldFinish) setActiveTab("ai");
        setConsoleOutput("Submitting code for full evaluation...\n");
        setSubmissionStatus('idle');
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2500));
        clearInterval(interval);
        setProgress(100);

        const passed = Math.random() > 0.3; // Random success/fail for demo
        const score = passed ? 100 : Math.floor(Math.random() * 80);
        setFinalScore(score);

        if (passed) {
            setSubmissionStatus('success');
            setConsoleOutput("Accepted\nRuntime: 56 ms, faster than 85.32% of submissions.\nMemory Usage: 42.1 MB, less than 45.12% of submissions.");
            toast.success("Solution Accepted!");
        } else {
            setSubmissionStatus('error');
            // Mock Diff Output
            setConsoleOutput(""); // Clear text output to show custom UI
            toast.error("Solution Failed on Hidden Test Cases");
        }

        setIsSubmitting(false);

        // Only transition to completed state if explicitly requested
        if (shouldFinish) {
            setTimeout(() => {
                setGameState('completed');
            }, 2000);
        } else {
            setShowResultModal(true);
        }
    };

    const handleSubjectSelect = (id: string) => {
        setSelectedSubject(id);
        setGameState('setup-difficulty');
    };

    const handleDifficultySelect = (diff: string) => {
        setSelectedDifficulty(diff);
        setGameState('setup-questions');
    };

    const handleQuestionCountSelect = (count: number) => {
        setQuestionCount(count);
        // Calculate time based on question count (15 mins per question)
        setTimeLeft(count * 15 * 60);
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

    const handleRecommendedSetup = () => {
        setSelectedSubject('dsa');
        setSelectedDifficulty('Medium');
        setQuestionCount(3);
        setTimeLeft(45 * 60);
        setMode('interview');
        setGameState('overview');
    };

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
                        {SUBJECTS.map((subject) => (
                            <Card
                                key={subject.id}
                                className="group relative hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm"
                                onClick={() => handleSubjectSelect(subject.id)}
                            >
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                            <subject.icon className="h-6 w-6" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{subject.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{subject.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {subject.companies.slice(0, 3).map(company => (
                                            <Badge key={company} variant="secondary" className="text-[10px] bg-secondary/50 text-muted-foreground border border-border/50">
                                                {company}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-center pt-4">
                        <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base shadow-sm hover:shadow-md transition-all bg-background" onClick={handleRecommendedSetup}>
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            I'm feeling lucky (Recommended Setup)
                        </Button>
                    </div>
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
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-subject')}>
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
        const subject = SUBJECTS.find(s => s.id === selectedSubject);

        return (
            <DashboardLayout fullWidth>
                <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen flex items-center justify-center bg-background p-4 lg:p-8">
                    <Card className="w-full max-w-3xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300 my-auto">
                        <CardHeader className="text-center space-y-4 pb-8 pt-8">
                            <Button variant="ghost" size="sm" className="absolute left-6 top-6" onClick={() => setGameState('setup-questions')}>
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                            </Button>
                            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-inner">
                                {subject ? <subject.icon className="h-10 w-10 text-primary" /> : <Code2 className="h-10 w-10 text-primary" />}
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
                                            {subject?.name || 'DSA'}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Difficulty</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {selectedDifficulty || 'Mixed'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Questions</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {questionCount || 3} Questions
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="text-sm text-muted-foreground mb-2">Total Time</div>
                                        <div className="font-bold text-lg flex items-center gap-2">
                                            {Math.floor(timeLeft / 60)} Minutes
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

                            {/* Question Pool Preview */}
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topics Included</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200 px-3 py-1 text-sm"><Check className="h-3.5 w-3.5 mr-1.5" /> Arrays</Badge>
                                    <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-200 px-3 py-1 text-sm"><Check className="h-3.5 w-3.5 mr-1.5" /> Hash Maps</Badge>
                                    <Badge variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-200 px-3 py-1 text-sm"><Check className="h-3.5 w-3.5 mr-1.5" /> Two Pointers</Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center pb-12 pt-4">
                            <Button
                                size="lg"
                                className="w-full max-w-sm text-lg h-14 gap-2 shadow-xl hover:shadow-primary/25 transition-all rounded-xl"
                                onClick={() => setGameState('active')}
                            >
                                Start Coding Round
                                <ArrowRight className="h-6 w-6" />
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
                            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${finalScore === 100 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {finalScore === 100 ? <Trophy className="h-10 w-10" /> : <CheckCircle className="h-10 w-10" />}
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
                                <Badge variant={finalScore === 100 ? "default" : "secondary"} className="mt-2">
                                    {finalScore === 100 ? "Perfect Score" : "Completed"}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                                    <div className={`font-semibold flex items-center gap-2 ${finalScore === 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {finalScore === 100 ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {finalScore === 100 ? "Passed" : "Partial Success"}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                                    <div className="text-sm text-muted-foreground mb-1">Time Taken</div>
                                    <div className="font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        {formatTime((questionCount || 3) * 15 * 60 - timeLeft)}
                                    </div>
                                </div>
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
                                disabled={currentQuestion === 1}
                                className="h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm font-medium">Question {currentQuestion} of {questionCount || 3}</span>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                disabled={currentQuestion === (questionCount || 3)}
                                className="h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <div className="flex gap-1 ml-2">
                                {[...Array(questionCount || 3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 w-2 rounded-full transition-all duration-300 ${i + 1 === currentQuestion ? 'bg-primary w-4' : 'bg-secondary'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {mode === 'interview' && (
                            <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-md bg-secondary/50 transition-colors duration-300 ${getTimerColor()}`}>
                                <Clock className="h-4 w-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                        {mode === 'practice' && (
                            <Badge variant="secondary" className="gap-1">
                                <GraduationCap className="h-3 w-3" /> Practice Mode
                            </Badge>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden relative">
                    <ResizablePanelGroup direction="horizontal">
                        {/* Left Panel: Problem Description */}
                        {!isFullscreen && (
                            <>
                                <ResizablePanel defaultSize={40} minSize={30} maxSize={60} className="transition-all duration-300">
                                    <div className="h-full flex flex-col bg-card/30">
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                                            <div className="border-b border-border px-4">
                                                <TabsList className="bg-transparent h-12 p-0 gap-6">
                                                    <TabsTrigger value="problem" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                                        Description
                                                    </TabsTrigger>
                                                    <TabsTrigger value="hints" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                                        Hints
                                                    </TabsTrigger>
                                                    <TabsTrigger value="submissions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                                        Submissions
                                                    </TabsTrigger>
                                                    <TabsTrigger value="ai" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                                        AI Feedback
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            <ScrollArea className="flex-1 min-h-0">
                                                <div className="p-6 space-y-6">
                                                    <TabsContent value="problem" className="mt-0 space-y-6">
                                                        <div>
                                                            <div className="flex flex-col gap-3 mb-4">
                                                                <h1 className="text-2xl font-bold">{currentProblem.title}</h1>

                                                                {/* Context Tags */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    <Badge variant={currentProblem.difficulty === "Easy" ? "default" : currentProblem.difficulty === "Medium" ? "secondary" : "destructive"} className={currentProblem.difficulty === "Easy" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" : ""}>
                                                                        {currentProblem.difficulty}
                                                                    </Badge>
                                                                    {currentProblem.company.map(c => (
                                                                        <Badge key={c} variant="outline" className="gap-1 bg-blue-500/5 text-blue-500 border-blue-500/20">
                                                                            <Building2 className="h-3 w-3" /> {c}
                                                                        </Badge>
                                                                    ))}
                                                                    {currentProblem.topics.map(t => (
                                                                        <Badge key={t} variant="outline" className="gap-1 text-muted-foreground">
                                                                            <Tags className="h-3 w-3" /> {t}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="prose prose-invert max-w-none text-sm text-muted-foreground">
                                                                <p className="whitespace-pre-line">{currentProblem.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <h3 className="font-semibold text-foreground">Examples</h3>
                                                            {currentProblem.examples.map((ex, i) => (
                                                                <Card key={i} className="p-4 bg-secondary/20 border-border/50">
                                                                    <div className="space-y-2 text-sm font-mono">
                                                                        <div>
                                                                            <span className="text-muted-foreground">Input:</span> <span className="text-foreground">{ex.input}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-muted-foreground">Output:</span> <span className="text-foreground">{ex.output}</span>
                                                                        </div>
                                                                        {ex.explanation && (
                                                                            <div className="font-sans text-muted-foreground mt-2">
                                                                                Explanation: {ex.explanation}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <h3 className="font-semibold text-foreground">Constraints</h3>
                                                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                                                {currentProblem.constraints.map((c, i) => (
                                                                    <li key={i}>{c}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="hints" className="mt-0">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-semibold">Hints</h3>
                                                                <Button variant="ghost" size="sm" onClick={() => setShowHints(!showHints)}>
                                                                    {showHints ? "Hide All" : "Show All"}
                                                                </Button>
                                                            </div>
                                                            {currentProblem.hints.map((hint, i) => (
                                                                <Card key={i} className="overflow-hidden border-border/50">
                                                                    <div
                                                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
                                                                        onClick={() => setActiveHintIndex(activeHintIndex === i ? -1 : i)}
                                                                    >
                                                                        <span className="font-medium text-sm">Hint {i + 1}</span>
                                                                        {activeHintIndex === i ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                    </div>
                                                                    {(showHints || activeHintIndex === i) && (
                                                                        <div className="p-4 pt-0 text-sm text-muted-foreground bg-secondary/10 border-t border-border/50">
                                                                            {hint}
                                                                        </div>
                                                                    )}
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="submissions" className="mt-0">
                                                        <div className="text-center py-12 text-muted-foreground">
                                                            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                            <p>No submissions yet</p>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="ai" className="mt-0">
                                                        {submissionStatus === 'idle' ? (
                                                            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                                                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                                                    <Bot className="h-8 w-8 text-primary" />
                                                                </div>
                                                                <h3 className="text-lg font-bold text-foreground mb-6">AI Code Analysis</h3>

                                                                <div className="bg-card/50 rounded-xl p-6 border border-border/50 max-w-sm w-full text-left space-y-4 shadow-sm backdrop-blur-sm">
                                                                    <p className="font-medium text-sm text-foreground">
                                                                        Submit your solution to receive:
                                                                    </p>
                                                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                                                        {[
                                                                            "Time & Space Complexity evaluation",
                                                                            "Code readability and structure review",
                                                                            "Edge case and bug detection",
                                                                            "Better alternative approaches",
                                                                            "Line-by-line explanation",
                                                                            "Score and improvement tips"
                                                                        ].map((item, i) => (
                                                                            <li key={i} className="flex items-start gap-2.5">
                                                                                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                                                                                <span>{item}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-6 pb-6 animate-in slide-in-from-bottom-4 duration-500">
                                                                {/* 8. Final Score & Recommendation (Top for visibility) */}
                                                                <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                                                                    <div className="p-6 flex items-center justify-between">
                                                                        <div>
                                                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                                                <Sparkles className="h-5 w-5 text-primary" />
                                                                                AI Review Score
                                                                            </h3>
                                                                            <p className="text-muted-foreground text-sm mt-1">Your solution is correct, efficient, and clean.</p>
                                                                        </div>
                                                                        <div className="text-4xl font-bold text-primary">{MOCK_AI_ANALYSIS.score}<span className="text-lg text-muted-foreground font-normal">/100</span></div>
                                                                    </div>
                                                                    <div className="bg-background/50 p-4 border-t border-primary/10">
                                                                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                                            Recommended Improvements:
                                                                        </div>
                                                                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                                                            {MOCK_AI_ANALYSIS.recommendation.map((rec, i) => (
                                                                                <li key={i}>{rec}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </Card>

                                                                {/* 1. Time & Space Complexity */}
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <Card className="p-4 bg-secondary/20 border-border/50">
                                                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                                            <Clock className="h-3.5 w-3.5" /> Time Complexity
                                                                        </div>
                                                                        <div className="text-xl font-mono font-bold text-foreground">{MOCK_AI_ANALYSIS.complexity.time}</div>
                                                                    </Card>
                                                                    <Card className="p-4 bg-secondary/20 border-border/50">
                                                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                                            <Database className="h-3.5 w-3.5" /> Space Complexity
                                                                        </div>
                                                                        <div className="text-xl font-mono font-bold text-foreground">{MOCK_AI_ANALYSIS.complexity.space}</div>
                                                                    </Card>
                                                                    <div className="col-span-2 text-xs text-muted-foreground px-1">
                                                                        {MOCK_AI_ANALYSIS.complexity.explanation}
                                                                    </div>
                                                                </div>

                                                                {/* 2. Code Quality Review */}
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold flex items-center gap-2">
                                                                        <Code2 className="h-4 w-4 text-blue-500" /> Code Quality
                                                                    </h3>
                                                                    <div className="grid grid-cols-1 gap-3">
                                                                        <Card className="p-4 border-green-500/20 bg-green-500/5">
                                                                            <h4 className="text-sm font-bold text-green-600 mb-2 flex items-center gap-2"><Check className="h-4 w-4" /> Highlights</h4>
                                                                            <ul className="space-y-1.5">
                                                                                {MOCK_AI_ANALYSIS.quality.good.map((item, i) => (
                                                                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500/60 mt-1.5 shrink-0" />
                                                                                        {item}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </Card>
                                                                        <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                                                                            <h4 className="text-sm font-bold text-yellow-600 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Areas to Improve</h4>
                                                                            <ul className="space-y-1.5">
                                                                                {MOCK_AI_ANALYSIS.quality.improvements.map((item, i) => (
                                                                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/60 mt-1.5 shrink-0" />
                                                                                        {item}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </Card>
                                                                    </div>
                                                                </div>

                                                                {/* 3. Logical Accuracy */}
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold flex items-center gap-2">
                                                                        <BrainCircuit className="h-4 w-4 text-purple-500" /> Logical Accuracy
                                                                    </h3>
                                                                    <Card className="p-4 border-border/50">
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Handled Correctly</div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {MOCK_AI_ANALYSIS.logic.handled.map((item, i) => (
                                                                                        <Badge key={i} variant="outline" className="bg-green-500/5 text-green-600 border-green-200">
                                                                                            <Check className="h-3 w-3 mr-1" /> {item}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Missing Edge Cases</div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {MOCK_AI_ANALYSIS.logic.missing.map((item, i) => (
                                                                                        <Badge key={i} variant="outline" className="bg-red-500/5 text-red-600 border-red-200">
                                                                                            <X className="h-3 w-3 mr-1" /> {item}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </Card>
                                                                </div>

                                                                {/* 4. Step-by-step Explanation */}
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold flex items-center gap-2">
                                                                        <ListOrdered className="h-4 w-4 text-primary" /> Code Logic
                                                                    </h3>
                                                                    <Card className="p-4 border-border/50 bg-secondary/10">
                                                                        <div className="space-y-3">
                                                                            {MOCK_AI_ANALYSIS.explanation.map((step, i) => (
                                                                                <div key={i} className="flex gap-3 text-sm">
                                                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono text-xs font-bold">
                                                                                        {i + 1}
                                                                                    </div>
                                                                                    <p className="text-muted-foreground pt-0.5">{step}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </Card>
                                                                </div>

                                                                {/* 5. Alternative Approaches */}
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold flex items-center gap-2">
                                                                        <GitGraph className="h-4 w-4 text-orange-500" /> Alternative Approach
                                                                    </h3>
                                                                    <Card className="p-4 border-border/50">
                                                                        <div className="font-medium text-foreground mb-1">{MOCK_AI_ANALYSIS.alternative.name}</div>
                                                                        <div className="text-xs text-muted-foreground mb-3 italic">{MOCK_AI_ANALYSIS.alternative.condition}</div>

                                                                        <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Trade-offs</div>
                                                                        <ul className="space-y-1">
                                                                            {MOCK_AI_ANALYSIS.alternative.tradeoffs.map((item, i) => (
                                                                                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                                                                    <div className="h-1 w-1 rounded-full bg-orange-500" />
                                                                                    {item}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </Card>
                                                                </div>

                                                                {/* 6. Diff (Only on Error) */}
                                                                {submissionStatus === 'error' && (
                                                                    <div className="space-y-3">
                                                                        <h3 className="font-semibold flex items-center gap-2 text-red-500">
                                                                            <Bug className="h-4 w-4" /> Debugging
                                                                        </h3>
                                                                        <div className="bg-red-500/5 rounded-lg border border-red-500/20 overflow-hidden">
                                                                            <div className="p-2 bg-red-500/10 border-b border-red-500/20 text-xs font-medium text-red-500">
                                                                                Test Case Failed
                                                                            </div>
                                                                            <div className="p-3 space-y-3">
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs text-muted-foreground">Expected Output:</div>
                                                                                    <div className="font-mono text-sm bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 w-fit">
                                                                                        [0, 1]
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs text-muted-foreground">Received Output:</div>
                                                                                    <div className="font-mono text-sm bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 w-fit">
                                                                                        [1, 0]
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-xs text-red-400 mt-2">
                                                                                    Reason: You returned indices in reverse order.
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 7. Security */}
                                                                <div className="space-y-3">
                                                                    <h3 className="font-semibold flex items-center gap-2">
                                                                        <Shield className="h-4 w-4 text-blue-500" /> Security Check
                                                                    </h3>
                                                                    <Card className="p-4 border-border/50 bg-blue-500/5">
                                                                        <ul className="space-y-2">
                                                                            {MOCK_AI_ANALYSIS.security.map((item, i) => (
                                                                                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                                    <Check className="h-4 w-4 text-blue-500" />
                                                                                    {item}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </Card>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TabsContent>
                                                </div>
                                            </ScrollArea>
                                        </Tabs>
                                    </div>
                                </ResizablePanel>
                                <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors w-1.5" />
                            </>
                        )}

                        {/* Right Panel: Editor & Output */}
                        <ResizablePanel defaultSize={60}>
                            <ResizablePanelGroup direction="vertical">
                                {/* Editor Area */}
                                <ResizablePanel defaultSize={70} minSize={30}>
                                    <div className="h-full flex flex-col">
                                        <div className="h-12 border-b border-border bg-card/30 flex items-center justify-between px-4">
                                            <div className="flex items-center gap-3">
                                                <Select value={language} onValueChange={handleLanguageChange}>
                                                    <SelectTrigger className="w-[140px] h-8 bg-transparent border-border/50">
                                                        <SelectValue placeholder="Language" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LANGUAGES.map(lang => (
                                                            <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                                    title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
                                                >
                                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                                    <span className="hidden sm:inline text-xs">{isFullscreen ? "Exit" : "Fullscreen"}</span>
                                                </Button>
                                                <div className="w-px h-4 bg-border/50 mx-1" />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Reset Code">
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Settings">
                                                    <Code2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative group">
                                            <Editor
                                                height="100%"
                                                language={language}
                                                value={code}
                                                onChange={handleCodeChange}
                                                theme="vs-dark"
                                                onMount={(editor, monaco) => {
                                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                                                        handleRun();
                                                    });
                                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
                                                        handleSubmit();
                                                    });
                                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                                                        setIsDirty(false);
                                                        setLastSaved(new Date());
                                                        toast.success("Code saved successfully");
                                                    });
                                                }}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: "on",
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    padding: { top: 16, bottom: 16 },
                                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                    smoothScrolling: true,
                                                    cursorBlinking: "smooth",
                                                    cursorSmoothCaretAnimation: "on",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </ResizablePanel>

                                <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors h-1.5" />

                                {/* Output Area */}
                                <ResizablePanel defaultSize={30} minSize={10}>
                                    <div className="h-full flex flex-col bg-card/30">
                                        <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-secondary/10">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    className={`text-xs font-medium h-full border-b-2 px-2 transition-colors flex items-center gap-1.5 ${activeTab === 'console' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                                    onClick={() => setActiveTab('console')}
                                                >
                                                    <Terminal className="h-3.5 w-3.5" />
                                                    Console
                                                </button>
                                                <button
                                                    className={`text-xs font-medium h-full border-b-2 px-2 transition-colors flex items-center gap-1.5 ${activeTab === 'testcases' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                                    onClick={() => setActiveTab('testcases')}
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Test Cases
                                                </button>

                                            </div>
                                            <div className="flex items-center gap-2 py-1">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className={`h-7 text-xs gap-1.5 transition-all duration-300 ${isRunning ? 'opacity-80' : ''}`}
                                                    onClick={handleRun}
                                                    disabled={isRunning || isSubmitting}
                                                >
                                                    {isRunning ? (
                                                        <div className="h-3 w-3 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                                                    ) : (
                                                        <Play className="h-3 w-3" />
                                                    )}
                                                    Run
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className={`h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 ${isSubmitting ? 'opacity-80' : ''}`}
                                                    onClick={() => handleSubmit(false)}
                                                    disabled={isRunning || isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                                    ) : (
                                                        <Send className="h-3 w-3" />
                                                    )}
                                                    Submit
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-hidden relative">
                                            {isSubmitting && (
                                                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                                                    <div className="w-64 space-y-2">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Running Tests...</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                </div>
                                            )}

                                            <ScrollArea className="h-full p-4">
                                                {activeTab === 'console' ? (
                                                    <div className="font-mono text-sm">
                                                        {consoleOutput || submissionStatus === 'error' ? (
                                                            <div className="whitespace-pre-wrap">
                                                                {submissionStatus === 'success' && (
                                                                    <div className="flex items-center gap-2 text-green-500 font-bold mb-3 animate-in slide-in-from-bottom-2">
                                                                        <CheckCircle className="h-5 w-5" />
                                                                        Accepted
                                                                    </div>
                                                                )}
                                                                {submissionStatus === 'error' && (
                                                                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                                                        <div className="flex items-center gap-2 text-red-500 font-bold">
                                                                            <XCircle className="h-5 w-5" />
                                                                            Wrong Answer
                                                                        </div>

                                                                        {/* Diff UI */}
                                                                        <div className="bg-red-500/5 rounded-lg border border-red-500/20 overflow-hidden">
                                                                            <div className="p-2 bg-red-500/10 border-b border-red-500/20 text-xs font-medium text-red-500">
                                                                                Input: nums = [3,3], target = 6
                                                                            </div>
                                                                            <div className="p-3 space-y-3">
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs text-muted-foreground">Expected Output:</div>
                                                                                    <div className="font-mono text-sm bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 w-fit">
                                                                                        [0, 1]
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <div className="text-xs text-muted-foreground">Received Output:</div>
                                                                                    <div className="font-mono text-sm bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 w-fit">
                                                                                        [0, 0]
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <span className="text-muted-foreground">{consoleOutput}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-muted-foreground italic flex flex-col items-center justify-center h-32 gap-2 opacity-50">
                                                                <Terminal className="h-8 w-8" />
                                                                <span>Run your code to see output...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {currentProblem.examples.map((ex, i) => (
                                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/10">
                                                                <div className="mt-0.5">
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                </div>
                                                                <div className="space-y-1 text-sm font-mono flex-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">Case {i + 1}</span>
                                                                        <span className="text-xs text-green-500">Passed</span>
                                                                    </div>
                                                                    <div className="text-muted-foreground text-xs">Input: {ex.input}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* Footer Status Bar */}
                <footer className="h-14 border-t border-border bg-card/50 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${isDirty ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <span>{isDirty ? 'Unsaved changes' : 'Saved'}</span>
                        </div>
                        <span className="hidden sm:inline">Last saved: {lastSaved.toLocaleTimeString()}</span>
                        <div className="hidden md:flex items-center gap-4 border-l border-border pl-4">
                            <span className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Shortcuts:</span>
                            <span className="bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50 font-mono text-[10px]">Ctrl+Enter Run</span>
                            <span className="bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50 font-mono text-[10px]">Ctrl+Shift+Enter Submit</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/dashboard')}>
                            Skip / Give Up
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit & Finish"}
                        </Button>
                    </div>
                </footer>
            </div>

            <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {submissionStatus === 'success' ? (
                                <>
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                    <span>Solution Accepted</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-6 w-6 text-red-500" />
                                    <span>Solution Failed</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {submissionStatus === 'success'
                                ? "Great job! Your solution passed all test cases."
                                : "Your solution failed on some hidden test cases. Check the console for details."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                        {submissionStatus === 'success' ? (
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold text-green-500">100%</div>
                                <div className="text-sm text-muted-foreground">Test Cases Passed</div>
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold text-red-500">0%</div>
                                <div className="text-sm text-muted-foreground">Test Cases Passed</div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="secondary" onClick={() => setShowResultModal(false)}>
                            Close
                        </Button>
                        {submissionStatus === 'success' && (
                            <Button onClick={() => {
                                setShowResultModal(false);
                                handleNext();
                            }}>
                                Next Question <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
