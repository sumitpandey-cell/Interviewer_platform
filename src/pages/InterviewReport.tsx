import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2, XCircle, Calendar, User, Briefcase, Bot, ArrowRight, ExternalLink } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function InterviewReport() {
    const { sessionId } = useParams();

    // Mock data - in a real app, fetch based on sessionId
    const reportData = {
        candidateName: "Ujjawal Mishra",
        position: "Frontend Intern",
        overallScore: 20,
        date: "2025-11-20, 18:31:00",
        executiveSummary: "The candidate, currently a B.Sc. Computer Science student, showed basic awareness of core frontend, but struggled to articulate detailed concepts such as the CSS box model and semantic HTML. Past questions, for most clarity, responses partial explanation the box model and inability to recall media queries for responsive design. At times off-topic, suggesting was broken and presenting and knowledge coherently. Motivation development was not clearly demonstrated, and cultural fit remains uncertain due to diverted attention to unrelated subjects.",
        strengths: [
            "The candidate is pursuing a technical degree in Computer Science, showing foundational background.",
            "They recognize basic concepts like the CSS box model and the use of margin and padding.",
            "The candidate is aware of the distinction between 'id' and 'class'."
        ],
        improvements: [
            "Explanations lacked depth and structure, with minimal detail provided for most technical questions.",
            "The candidate were unable to recall or explain key design and media queries.",
            "Communication was inconsistent and at times or incorrect."
        ],
        skills: [
            { name: "Technical Expertise", score: 30, feedback: "Demonstrated limited technical knowledge; answers were basic and lacked depth." },
            { name: "Problem Solving", score: 20, feedback: "Rarely structured problem-solving; struggled to explain frontend solving approaches." },
            { name: "Decision & Judgment", score: 20, feedback: "Did not show evidence of making logical or data-driven decisions." },
            { name: "Debugging Mindset", score: 10, feedback: "No evidence of debugging skills or troubleshooting approaches." }
        ],
        actionPlan: [
            "Practice answering common frontend interview questions.",
            "Study and implement core responsive design techniques.",
            "Prepare and rehearse answers to common technical questions.",
            "Improve communication skills and reviewing yourself.",
            "Reflect on your interest in frontend development and projects."
        ],
        transcript: [
            { id: 1, sender: "ai", text: "Hello! I'm your AI interviewer today. I've reviewed your application for the Senior Frontend Developer role. To start, could you tell me a bit about your experience with React and modern state management libraries?", timestamp: "18:31:05" },
            { id: 2, sender: "user", text: "Hi! Sure. I've been working with React for about 5 years now. In my last role, I led the migration from a legacy Redux codebase to using React Query and Context API for server and client state respectively. I found this significantly reduced boilerplate and improved performance.", timestamp: "18:31:45" },
            { id: 3, sender: "ai", text: "That sounds like a significant improvement. Can you elaborate on how you handled complex dependent queries with React Query? specifically in scenarios where one piece of data relied on another?", timestamp: "18:32:15" },
            { id: 4, sender: "user", text: "Yes, for dependent queries, we utilized the `enabled` option in `useQuery`. Basically, we would pass a boolean that checks if the required data from the first query is available. If it's not, the second query doesn't run. This ensures a waterfall effect where data is fetched in the correct order without errors.", timestamp: "18:33:00" },
            { id: 5, sender: "ai", text: "Good approach. Now, let's shift gears to CSS. Can you explain the Box Model and how `box-sizing: border-box` affects it?", timestamp: "18:33:30" },
            { id: 6, sender: "user", text: "The Box Model consists of margins, borders, padding, and the actual content. By default, the width of an element only includes the content. If you add padding or borders, the element grows bigger than the specified width. `box-sizing: border-box` changes this so that padding and borders are included in the element's total width and height, making layout calculations much easier.", timestamp: "18:34:10" },
        ]
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{reportData.candidateName}</h1>
                            <p className="text-slate-500 text-lg">{reportData.position}</p>
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
                                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-bold">
                                            Verdict: Do Not Proceed
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the low overall match score and critical skill gaps, this candidate is not recommended for the {reportData.position} role at this time.
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
                                                The candidate is having a technical degree in Computer Science, and lacked depth. For most clarity, responses partial explanation for the box model backgrounds.
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
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
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
                                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-bold flex items-center justify-between">
                                            Verdict: Do Not Proceed
                                            <XCircle className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the low overall match score and critical skill gaps, this candidate is not recommended for the {reportData.position} role at this time.
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
                                        <CardTitle className="text-lg font-bold text-slate-900">Interview Transcript</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {reportData.transcript.map((msg) => (
                                            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {msg.sender === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                </div>
                                                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'ai'
                                                        ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                                        : 'bg-blue-600 text-white rounded-tr-none'
                                                        }`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                        {msg.timestamp}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
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
                                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-bold flex items-center justify-between">
                                            Verdict: Do Not Proceed
                                            <XCircle className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Based on the low overall match score and critical skill gaps, this candidate is not recommended for the {reportData.position} role at this time.
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
