import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink, MessageSquare, Copy, Trash2, Clock, Play } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    const { fetchSessionDetail, isCached, deleteInterviewSession } = useOptimizedQueries();
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

    const handleDelete = async () => {
        if (!sessionId) return;
        try {
            await deleteInterviewSession(sessionId);
            toast.success("Report deleted successfully");
            navigate("/reports");
        } catch (error) {
            console.error("Error deleting session:", error);
            toast.error("Failed to delete report");
        }
    };

    const downloadReport = () => {
        try {
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Report - ${reportData.candidateName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #f8fafc;
            padding: 40px 20px;
        }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 32px; color: #0f172a; margin-bottom: 8px; }
        .header .position { font-size: 20px; color: #64748b; margin-bottom: 12px; }
        .header .date { font-size: 14px; color: #94a3b8; }
        .score-section { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; }
        .score-section .score { font-size: 64px; font-weight: bold; margin-bottom: 8px; }
        .score-section .label { font-size: 18px; opacity: 0.9; }
        .section { margin: 30px 0; }
        .section h2 { font-size: 24px; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
        .section h3 { font-size: 18px; color: #334155; margin: 20px 0 12px; }
        .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .list { list-style: none; }
        .list li { padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: start; }
        .list li:last-child { border-bottom: none; }
        .list li::before { content: "•"; color: #3b82f6; font-weight: bold; font-size: 20px; margin-right: 12px; }
        .strength::before { content: "✓"; color: #10b981 !important; }
        .improvement::before { content: "⚠"; color: #f59e0b !important; }
        .skill-item { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .skill-header { display: flex; justify-between; align-items: center; margin-bottom: 8px; }
        .skill-name { font-weight: 600; color: #0f172a; }
        .skill-score { font-weight: bold; color: #3b82f6; font-size: 18px; }
        .skill-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .skill-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 4px; }
        .skill-feedback { font-size: 14px; color: #64748b; }
        .transcript { background: #f8fafc; padding: 20px; border-radius: 8px; max-height: 600px; overflow-y: auto; }
        .message { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
        .message.ai { background: #dbeafe; border-left: 3px solid #3b82f6; }
        .message.user { background: #d1fae5; border-left: 3px solid #10b981; }
        .message-sender { font-weight: 600; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .message-text { color: #1e293b; }
        .recommendation { background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .recommendation.negative { background: #fee2e2; border-color: #ef4444; }
        .recommendation h3 { color: #166534; margin-bottom: 8px; }
        .recommendation.negative h3 { color: #991b1b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 14px; }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.candidateName}</h1>
            <div class="position">${reportData.position}</div>
            <div class="date">Interview Date: ${reportData.date}</div>
        </div>

        <div class="score-section">
            <div class="score">${reportData.overallScore}%</div>
            <div class="label">Overall Match Score</div>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary">${reportData.executiveSummary}</div>
        </div>

        <div class="section">
            <h2>Key Strengths</h2>
            <ul class="list">
                ${reportData.strengths.map(item => `<li class="strength">${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Areas for Improvement</h2>
            <ul class="list">
                ${reportData.improvements.map(item => `<li class="improvement">${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Skills Assessment</h2>
            ${reportData.skills.map(skill => `
                <div class="skill-item">
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-score">${skill.score}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-bar-fill" style="width: ${skill.score}%"></div>
                    </div>
                    <div class="skill-feedback">${skill.feedback}</div>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Recommended Action Plan</h2>
            <ul class="list">
                ${reportData.actionPlan.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>Interview Transcript</h2>
            <div class="transcript">
                ${reportData.transcript.map(msg => `
                    <div class="message ${msg.sender}">
                        <div class="message-sender">${msg.sender === 'ai' ? 'AI Interviewer' : 'Candidate'}</div>
                        <div class="message-text">${msg.text}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="recommendation ${reportData.overallScore >= 70 ? '' : 'negative'}">
            <h3>AI Recommendation: ${reportData.overallScore >= 70 ? 'Proceed' : 'Do Not Proceed'}</h3>
            <p>Based on the overall match score of ${reportData.overallScore}%, this candidate is ${reportData.overallScore >= 70 ? 'recommended' : 'not recommended'} for the ${reportData.position} role at this time.</p>
        </div>

        <div class="footer">
            <p>Generated by Aura AI Interview Platform</p>
            <p>© ${new Date().getFullYear()} All rights reserved</p>
        </div>
    </div>
</body>
</html>
            `;

            // Create blob and download
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Interview_Report_${reportData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download report");
            console.error("Download error:", error);
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

    // Check if interview is in progress (not completed or no score)
    const isInProgress = session.status !== 'completed' || session.score === null;

    // If interview is in progress, show continue interview UI
    if (isInProgress) {
        return (
            <DashboardLayout>
                <div className="space-y-6 overflow-x-hidden max-w-full">
                    {/* Header Section */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || "Candidate"}</h1>
                                        <p className="text-slate-500 text-base md:text-lg truncate">{session.position}</p>
                                    </div>
                                    {sessionId && isCached.sessionDetail(sessionId) && (
                                        <Badge variant="outline" className="text-xs px-1 flex-shrink-0">📦 Cached</Badge>
                                    )}
                                </div>

                                {/* Status badge */}
                                <div className="flex-shrink-0">
                                    <div className="text-sm px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 font-medium whitespace-nowrap">In Progress</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Incomplete Message */}
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview In Progress</h2>
                                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                        This interview hasn't been completed yet. Continue your interview to receive detailed feedback and analysis.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={() => navigate(`/interview/${sessionId}/active`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Continue Interview
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interview Details */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-900">Interview Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                    <User className="h-4 w-4" />
                                    Candidate:
                                </div>
                                <span className="font-medium text-slate-900 truncate">{user?.user_metadata?.full_name || "Candidate"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                    <Calendar className="h-4 w-4" />
                                    Started:
                                </div>
                                <span className="font-medium text-slate-900 text-right break-words">{new Date(session.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                    <Briefcase className="h-4 w-4" />
                                    Position:
                                </div>
                                <span className="font-medium text-slate-900 truncate">{session.position}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm gap-2">
                                <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                    <Bot className="h-4 w-4" />
                                    Type:
                                </div>
                                <span className="font-medium text-slate-900 capitalize">{session.interview_type.replace('_', ' ')}</span>
                            </div>
                        </CardContent>
                    </Card>
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
            <div className="space-y-6 overflow-x-hidden max-w-full">
                {/* Header Section */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{reportData.candidateName}</h1>
                                    <p className="text-slate-500 text-base md:text-lg truncate">{reportData.position}</p>
                                </div>
                                {sessionId && isCached.sessionDetail(sessionId) && (
                                    <Badge variant="outline" className="text-xs px-1 flex-shrink-0">📦 Cached</Badge>
                                )}
                            </div>

                            {/* Saving status badge (from zustand) */}
                            <div className="flex-shrink-0">
                                {isSaving ? (
                                    <div className="text-sm px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 font-medium whitespace-nowrap">Saving…</div>
                                ) : saveError ? (
                                    <div className="text-sm px-3 py-1 rounded-full bg-red-50 text-red-800 font-medium whitespace-nowrap">Save failed</div>
                                ) : (
                                    <div className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-800 font-medium whitespace-nowrap">Saved</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-4">
                                <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
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
                                        <span className="text-lg md:text-xl font-bold text-slate-900">{reportData.overallScore}%</span>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-slate-500">Overall Match</div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={downloadReport} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Full Report
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Interview Report</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this interview report? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Navigation */}
                <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="bg-transparent p-0 gap-2 mb-6 overflow-x-auto scrollbar-hide flex-nowrap w-full justify-start">
                        <TabsTrigger
                            value="summary"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Summary
                        </TabsTrigger>
                        <TabsTrigger
                            value="skills"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Skills Analysis
                        </TabsTrigger>
                        <TabsTrigger
                            value="video"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
                        >
                            Video Playback
                        </TabsTrigger>
                        <TabsTrigger
                            value="transcript"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-slate-600 border border-slate-200 rounded-full px-6 flex-shrink-0 whitespace-nowrap"
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
                                        <p className="text-slate-600 leading-relaxed break-words">
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
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 break-words">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span className="break-words">{item}</span>
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
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 break-words">
                                                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                        <span className="break-words">{item}</span>
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
                                                    <div className="flex justify-between text-sm font-semibold text-slate-900 gap-2">
                                                        <span className="break-words flex-1">{skill.name}</span>
                                                        <span className="text-orange-500 flex-shrink-0">{skill.score}%</span>
                                                    </div>
                                                    <Progress value={skill.score} className="h-2 bg-slate-100" indicatorClassName="bg-orange-400" />
                                                    <p className="text-xs text-slate-500 break-words">{skill.feedback}</p>
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
                                                        <span className="break-words">{item}</span>
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
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                                <User className="h-4 w-4" />
                                                Candidate:
                                            </div>
                                            <span className="font-medium text-slate-900 truncate">{reportData.candidateName}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                                <Calendar className="h-4 w-4" />
                                                Date & Time:
                                            </div>
                                            <span className="font-medium text-slate-900 text-right break-words">{reportData.date}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Bot className="h-4 w-4" />
                                                AI Agent:
                                            </div>
                                            <span className="font-medium text-slate-900">AI Agent</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm gap-2">
                                            <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                                                <Briefcase className="h-4 w-4" />
                                                Position:
                                            </div>
                                            <span className="font-medium text-slate-900 truncate">{reportData.position}</span>
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
                                        <p className="text-sm text-slate-600 leading-relaxed break-words">
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
                                <Button onClick={downloadReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200">
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
                                                <span className="hidden md:inline">Copy Transcript</span>
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
                                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${msg.sender === 'ai'
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
                                <Button onClick={downloadReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-200">
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
