import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Mock Transcript Data
const MOCK_TRANSCRIPT = [
    { id: 1, sender: "ai", text: "Hello! I'm your AI interviewer today. I've reviewed your application for the Senior Frontend Developer role. To start, could you tell me a bit about your experience with React and modern state management libraries?" },
    { id: 2, sender: "user", text: "Hi! Sure. I've been working with React for about 5 years now. In my last role, I led the migration from a legacy Redux codebase to using React Query and Context API for server and client state respectively. I found this significantly reduced boilerplate and improved performance." },
    { id: 3, sender: "ai", text: "That sounds like a significant improvement. Can you elaborate on how you handled complex dependent queries with React Query? specifically in scenarios where one piece of data relied on another?" },
];

export default function InterviewRoom() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [messages, setMessages] = useState(MOCK_TRANSCRIPT);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Mock AI speaking animation toggle
    useEffect(() => {
        const interval = setInterval(() => {
            setIsAiSpeaking((prev) => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = () => {
        toast.success("Interview ended successfully.");
        navigate(`/interview/${sessionId}/complete`);
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
            {/* Left Section - Live Call Window */}
            <div className="flex-1 flex flex-col relative p-4 lg:p-6">

                {/* Header / Timer */}
                <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full font-mono text-sm font-medium tracking-wider flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    {formatTime(elapsedTime)}
                </div>

                {/* Main Video Area */}
                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col">

                    {/* AI Avatar / Visualization Area */}
                    <div className="absolute top-6 right-6 z-10">
                        <Card className="bg-black/60 backdrop-blur-xl border-white/10 p-4 rounded-2xl w-64 shadow-xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-semibold">AI Interviewer</h3>
                                    <p className="text-slate-400 text-xs">Senior Tech Recruiter</p>
                                </div>
                                <div className="ml-auto flex gap-1">
                                    <div className="h-3 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="h-3 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="h-3 w-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>

                            {/* AI Speaking Visualizer */}
                            <div className="h-16 flex items-center justify-center gap-1">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 bg-blue-500/80 rounded-full transition-all duration-150 ease-in-out ${isAiSpeaking ? 'animate-pulse' : ''}`}
                                        style={{
                                            height: isAiSpeaking ? `${Math.random() * 100}%` : '4px',
                                            opacity: isAiSpeaking ? 1 : 0.3
                                        }}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* User Video (Center/Large) */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {!isCameraOn ? (
                            <div className="flex flex-col items-center gap-4 text-slate-500">
                                <div className="h-32 w-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                                    <User className="h-16 w-16" />
                                </div>
                                <p className="text-lg font-medium">Camera is turned off</p>
                            </div>
                        ) : (
                            // Placeholder for actual video stream
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 opacity-50" />
                        )}

                        {/* User Label */}
                        <div className="absolute bottom-6 left-6 text-white font-medium text-lg drop-shadow-md">
                            You
                        </div>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="h-24 flex items-center justify-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-14 w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        onClick={() => setIsMicOn(!isMicOn)}
                    >
                        {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                    </Button>

                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-16 w-16 rounded-full shadow-xl hover:scale-105 transition-transform bg-red-600 hover:bg-red-700"
                        onClick={handleEndCall}
                    >
                        <PhoneOff className="h-8 w-8" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className={`h-14 w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isCameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                        onClick={() => setIsCameraOn(!isCameraOn)}
                    >
                        {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Right Section - Transcript Panel */}
            <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col hidden lg:flex">
                <div className="h-16 border-b border-slate-100 flex items-center px-6 justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Live Transcript
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                        Active
                    </span>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                                    <AvatarImage src={msg.sender === 'ai' ? "/ai-avatar.png" : "/user-avatar.png"} />
                                    <AvatarFallback className={msg.sender === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}>
                                        {msg.sender === 'ai' ? 'AI' : 'ME'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'ai'
                                        ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                        : 'bg-blue-600 text-white rounded-tr-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                                        {msg.sender === 'ai' ? 'Interviewer' : 'You'} • Just now
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isAiSpeaking && (
                            <div className="flex gap-4">
                                <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                                    <AvatarFallback className="bg-blue-100 text-blue-600">AI</AvatarFallback>
                                </Avatar>
                                <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-10">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-xs text-center text-slate-400">
                        Transcript is generated in real-time
                    </div>
                </div>
            </div>
        </div>
    );
}
