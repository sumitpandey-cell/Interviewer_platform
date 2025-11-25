import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink, MessageSquare, Copy } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface InterviewSession {
    id: string;
    interview_type: string;
    position: string;
    score: number | null;
    status: string;
    created_at: string;
    duration_minutes: number | null;
    feedback: any;
    transcript: any;
}

export default function InterviewReport() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const { feedback: instantFeedback, transcript: instantTranscript, isSaving, saveError } = useInterviewStore();
    const { fetchSessionDetail, isCached } = useOptimizedQueries();
    const [session, setSession] = useState<InterviewSession | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const data = await fetchSessionDetail(sessionId!);
            setSession(data as InterviewSession);
        } catch (error) {
            console.error("Error fetching session:", error);
            // navigate("/dashboard"); // Optional: redirect on error
        } finally {
            setLoading(false);
        }
    };

    const copyTranscriptToClipboard = async () => {
        try {
            const transcriptText = reportData.transcript
                .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
                .join('\n\n');
            
            await navigator.clipboard.writeText(transcriptText);
            toast.success("Transcript copied to clipboard!");
        } catch (error) {
            toast.error("Failed to copy transcript");
            console.error("Copy error:", error);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!session) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-slate-900">Session not found</h2>
                    <Button onClick={() => navigate("/dashboard")} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // Merge DB feedback and in-memory (instant) feedback using generatedAt timestamps.
    // If instant feedback is newer, prefer its fields; otherwise use DB feedback.
    const mergeFeedback = (dbFeedback: any, instant: any) => {
        if (!dbFeedback && !instant) return {};
        if (!dbFeedback) return instant;
        if (!instant) return dbFeedback;

        const dbTs = dbFeedback.generatedAt ? Date.parse(dbFeedback.generatedAt) : 0;
        const instTs = instant.generatedAt ? Date.parse(instant.generatedAt) : 0;

        if (instTs >= dbTs) {
            // Instant is newer: shallow-merge, preferring instant fields when present
            return {
                ...dbFeedback,
                ...instant,
                // ensure generatedAt is set to the latest
                generatedAt: instant.generatedAt || dbFeedback.generatedAt,
            };
        }

        // DB is newer or same: return DB feedback
        return dbFeedback;
    };

    const feedbackData = mergeFeedback(session?.feedback, instantFeedback);
    
    // Use instant transcript if available (more up-to-date), fallback to DB transcript
    const transcriptData = instantTranscript.length > 0 ? instantTranscript : (session?.transcript || []);
    
    // Debug transcript data
    console.log('Instant transcript from Zustand:', instantTranscript);
    console.log('DB transcript from session:', session?.transcript);
    console.log('Final transcript data used:', transcriptData);

    const reportData = {
        candidateName: user?.user_metadata?.full_name || "Candidate",
        position: session.position,
    overallScore: session.score || (feedbackData && feedbackData.skills ? Math.round((feedbackData.skills.reduce((acc: any, s: any) => acc + (s.score || 0), 0) / (feedbackData.skills.length || 1))) : 0),
        date: new Date(session.created_at).toLocaleString(),
        executiveSummary: feedbackData.executiveSummary || "The interview session has been recorded. Detailed AI analysis is pending.",
        strengths: feedbackData.strengths || ["Pending analysis..."],
        improvements: feedbackData.improvements || ["Pending analysis..."],
        skills: feedbackData.skills || [
            { name: "Technical Expertise", score: 0, feedback: "Pending..." },
            { name: "Problem Solving", score: 0, feedback: "Pending..." },
            { name: "Communication", score: 0, feedback: "Pending..." },
            { name: "Cultural Fit", score: 0, feedback: "Pending..." }
        ],
        actionPlan: feedbackData.actionPlan || ["Wait for full AI report generation."],
        // Ensure transcript format is consistent
        transcript: transcriptData.length > 0 ? transcriptData.map((msg: any, index: number) => ({
            id: msg.id || index,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp || "Just now"
        })) : [
            { id: 1, sender: "ai", text: "No transcript available. The interview may not have contained any recorded conversation.", timestamp: "-" },
        ]
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">{reportData.candidateName}</h1>
                                <p className="text-slate-500 text-lg">{reportData.position}</p>
                            </div>
                            {sessionId && isCached.sessionDetail(sessionId) && (
                                <Badge variant="outline" className="text-xs px-1">📦 Cached</Badge>
                            )}
                        </div>

                        {/* Saving status badge (from zustand) */}
                        <div>
                            {isSaving ? (
                                <div className="text-sm px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 font-medium">Saving…</div>
                            ) : saveError ? (
                                <div className="text-sm px-3 py-1 rounded-full bg-red-50 text-red-800 font-medium">Save failed</div>
                            ) : (
                                <div className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-800 font-medium">Saved</div>
                            )}
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="relative h-20 w-20">
                                    {/* Simple Circular Progress Placeholder */}
                                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />
                                        <path
                                            className="text-orange-500"
                                            strokeDasharray={`${reportData.overallScore}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-bold text-slate-900">{reportData.overallScore}%</span>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-slate-500">Overall Match</div>
                            </div>

                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Download className="mr-2 h-4 w-4" />
                                Download Full Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Navigation */}
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="bg-transparent p-0 gap-2 mb-6">
                        <TabsTrigger
                            value="summary"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6"
                        >
                            Summary
                        </TabsTrigger>
                        <TabsTrigger
                            value="skills"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6"
                        >
                            Skills Analysis
                        </TabsTrigger>
                        <TabsTrigger
                            value="video"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6"
                        >
                            Video Playback
                        </TabsTrigger>
                        <TabsTrigger
                            value="transcript"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6"
                        >
                            Full Transcript
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column (Main Content) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Executive Summary */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Executive Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-600 leading-relaxed">
                                            {reportData.executiveSummary}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Strengths & Improvements Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="text-2xl">👍</span> Key Strengths
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {reportData.strengths.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="text-2xl">⚠️</span> Areas for Improvement
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                {reportData.improvements.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Skills Assessment & Action Plan Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900">Skills Assessment</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {reportData.skills.map((skill, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between text-sm font-semibold text-slate-900">
                                                        <span>{skill.name}</span>
                                                        <span className="text-orange-500">{skill.score}%</span>
                                                    </div>
                                                    <Progress value={skill.score} className="h-2 bg-slate-100" indicatorClassName="bg-orange-400" />
                                                    <p className="text-xs text-slate-500">{skill.feedback}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-slate-900">Recommended Action Plan</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-4">
                                                {reportData.actionPlan.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                                        <div className="h-5 w-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                                                            <ArrowRight className="h-3 w-3 text-slate-400" />
                                                        </div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Right Column (Sidebar) */}
                            <div className="space-y-6">
                                {/* Interview Details */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Interview Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.position}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI Recommendation */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">AI Recommendation</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className={`px-4 py-2 rounded-md text-sm font-bold ${reportData.overallScore >= 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Verdict: {reportData.overallScore >= 70 ? 'Proceed' : 'Do Not Proceed'}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the overall match score of {reportData.overallScore}%, this candidate is {reportData.overallScore >= 70 ? 'recommended' : 'not recommended'} for the {reportData.position} role at this time.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                        </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column (Main Content) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Skills Overview Card */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Skills Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col md:flex-row items-center gap-8">
                                        <div className="h-[300px] w-full md:w-1/2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={reportData.skills}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                                    <Radar
                                                        name="Skills"
                                                        dataKey="score"
                                                        stroke="#ef4444"
                                                        fill="#ef4444"
                                                        fillOpacity={0.2}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                                            <div>
                                                <div className="text-4xl font-bold text-slate-900 mb-1">{reportData.overallScore}%</div>
                                                <div className="text-sm text-slate-500">Overall Skill Score</div>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Detailed skill analysis is pending.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Detailed Skills Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {reportData.skills.map((skill, i) => (
                                        <Card key={i} className="border-none shadow-sm">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-base font-bold text-slate-900">{skill.name}</CardTitle>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${skill.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {skill.score}%
                                                </span>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-4">
                                                <p className="text-sm text-slate-600 leading-relaxed min-h-[60px]">
                                                    {skill.feedback}
                                                </p>
                                                <div className="pt-4 border-t border-slate-100">
                                                    <a href="#" className="flex items-center justify-between text-sm text-slate-500 hover:text-blue-600 transition-colors">
                                                        Recommended Resources
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column (Sidebar) - Duplicated for now as per design request to show same sidebar */}
                            <div className="space-y-6">
                                {/* Download Report Button (Sidebar version if needed, though header has one) */}
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                {/* Interview Details */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Interview Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.position}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI Recommendation */}
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">AI Recommendation</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className={`px-4 py-2 rounded-md text-sm font-bold flex items-center justify-between ${reportData.overallScore >= 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Verdict: {reportData.overallScore >= 70 ? 'Proceed' : 'Do Not Proceed'}
                                            {reportData.overallScore >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the overall match score of {reportData.overallScore}%, this candidate is {reportData.overallScore >= 70 ? 'recommended' : 'not recommended'} for the {reportData.position} role at this time.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="video">
                        <Card>
                            <CardContent className="p-6 text-center text-slate-500">
                                Video playback content would go here.
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="transcript" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column (Transcript) */}
                            <div className="lg:col-span-2">
                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                Interview Transcript
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                                                    {reportData.transcript.length} messages
                                                </span>
                                            </CardTitle>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={copyTranscriptToClipboard}
                                                className="flex items-center gap-2"
                                            >
                                                <Copy className="h-4 w-4" />
                                                Copy Transcript
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                                        {reportData.transcript.length === 1 && reportData.transcript[0].text.includes("No transcript available") ? (
                                            // Empty state
                                            <div className="text-center py-12 text-slate-500">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                                <p className="text-lg font-medium">No conversation recorded</p>
                                                <p className="text-sm">The interview transcript is not available or the session may have been too short.</p>
                                            </div>
                                        ) : (
                                            // Actual transcript messages
                                            reportData.transcript.map((msg) => (
                                                <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {msg.sender === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                    </div>
                                                    <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'ai'
                                                            ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                                            : 'bg-emerald-600 text-white rounded-tr-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                            {msg.timestamp}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column (Sidebar) - Duplicated for consistency */}
                            <div className="space-y-6">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Interview Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900">{reportData.position}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">AI Recommendation</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className={`px-4 py-2 rounded-md text-sm font-bold flex items-center justify-between ${reportData.overallScore >= 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            Verdict: {reportData.overallScore >= 70 ? 'Proceed' : 'Do Not Proceed'}
                                            {reportData.overallScore >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the overall match score of {reportData.overallScore}%, this candidate is {reportData.overallScore >= 70 ? 'recommended' : 'not recommended'} for the {reportData.position} role at this time.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
