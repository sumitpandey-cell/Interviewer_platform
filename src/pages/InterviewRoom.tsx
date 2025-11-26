import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useLiveAPI } from "@/hooks/use-live-api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { generateFeedback } from "@/lib/gemini-feedback";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

interface SessionData {
    id: string;
    interview_type: string;
    position: string;
}

const generateSystemInstruction = (session: SessionData | null, timeLeftMinutes?: number) => {
    if (!session) {
        return `You are a Senior Technical Interviewer. Conduct a professional interview.`;
    }

    const { interview_type, position } = session;

    return `
You are conducting a ${interview_type} interview for the ${position} position.

Your goal is to assess the candidate's abilities based on the following principles:
1. Code Quality: Look for production-grade code, clear naming, and avoidance of magic numbers.
2. Error Handling: Ensure they handle failure paths and validate inputs.
3. Edge Cases: Check if they consider missing inputs, invalid types, concurrency, etc.
4. Architecture: Look for separation of concerns and appropriate abstraction.
5. Testing: Ask about test cases for normal flow, boundary conditions, and failure handling.
6. Documentation: Expect clear explanations of core logic and assumptions.

Conduct the interview in a professional but encouraging tone. Start by introducing yourself as name Aura and asking the candidate to introduce themselves. Then proceed to ask ${interview_type.toLowerCase()} questions relevant to the ${position} position.

IMPORTANT: Your text output must be an exact transcript of your audio output. Do not output internal thoughts, reasoning, or system logs in the text channel. Only output what you speak.

${timeLeftMinutes ? `You have approximately ${timeLeftMinutes} minutes remaining for this interview. Manage your time accordingly.` : ''}
`.trim();
};

interface Message {
    id: number;
    sender: "ai" | "user";
    text: string;
}

export default function InterviewRoom() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { fetchSessionDetail, completeInterviewSession } = useOptimizedQueries();

    // Sanitize API Key
    const cleanApiKey = API_KEY.replace(/[^a-zA-Z0-9_\-]/g, '');
    const { connect, disconnect, startRecording, stopRecording, connected, isRecording, volume } = useLiveAPI(cleanApiKey);
    const { setFeedback, setTranscript, setSaving, setSaveError } = useInterviewStore();
    const { startListening, stopListening, hasSupport } = useSpeechRecognition();
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const messageIdRef = useRef(0);
    const { remaining_minutes, recordUsage, type: subscriptionType } = useSubscription();
    const [timeLeft, setTimeLeft] = useState(remaining_minutes * 60);

    // Update timeLeft when remaining_minutes changes
    useEffect(() => {
        setTimeLeft(remaining_minutes * 60);
    }, [remaining_minutes]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime((prev) => prev + 1);

            if (subscriptionType !== 'paid' || remaining_minutes < 999999) { // Don't count down for unlimited
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleEndCall();
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [subscriptionType, remaining_minutes]);

    // AI speaking animation based on volume
    useEffect(() => {
        setIsAiSpeaking(volume > 0.01);
    }, [volume]);

    // Fetch session data
    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const data = await fetchSessionDetail(sessionId!);

            if (data) {
                setSession({
                    id: data.id,
                    interview_type: data.interview_type,
                    position: data.position
                });
            } else {
                setSession(null);
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            setSession(null);
        } finally {
            setSessionLoaded(true);
        }
    };

    // Camera handling
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (isCameraOn) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    toast.error("Could not access camera");
                    setIsCameraOn(false);
                }
            } else {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOn]);

    // Transcript handling - Set up early before any connections
    useEffect(() => {
        const handleTranscriptFragment = (e: CustomEvent) => {
            const { text, sender } = e.detail;
            console.log(`Transcript fragment received: ${sender}: ${text}`);

            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.sender === sender) {
                    // Append to existing line from same sender
                    const updated = [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    console.log('Appended to existing message:', updated);
                    return updated;
                }
                // Create new message line
                const newMessage = {
                    id: messageIdRef.current++,
                    sender,
                    text
                };
                const newMessages = [...prev, newMessage];
                console.log('Created new message:', newMessages);
                return newMessages;
            });
        };

        console.log('Setting up transcript fragment event listeners');
        window.addEventListener('ai-transcript-fragment', handleTranscriptFragment as EventListener);
        window.addEventListener('user-transcript-fragment', handleTranscriptFragment as EventListener);

        return () => {
            console.log('Removing transcript fragment event listeners');
            window.removeEventListener('ai-transcript-fragment', handleTranscriptFragment as EventListener);
            window.removeEventListener('user-transcript-fragment', handleTranscriptFragment as EventListener);
        };
    }, []);

    // Sync messages to Zustand store for instant access in report page
    useEffect(() => {
        console.log('Syncing messages to Zustand store:', messages.length, 'messages');
        setTranscript(messages);
    }, [messages, setTranscript]);

    // Auto-connect on mount after session is loaded
    useEffect(() => {
        if (!API_KEY || !sessionLoaded) {
            return;
        }

        console.log('Starting connection initialization...');
        const initConnection = async () => {
            try {
                const systemInstruction = generateSystemInstruction(session, Math.floor(timeLeft / 60));

                await connect({
                    model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: "Kore"
                                }
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    // Add input and output audio transcription
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                });
                startTimeRef.current = Date.now();
                console.log('Connection established successfully');
            } catch (error) {
                console.error("Failed to connect to Gemini Live API:", error);
                toast.error("Failed to connect to AI interviewer. Please check your API key and try again.");
            }
        };

        initConnection();

        return () => {
            disconnect();
        };
    }, [sessionLoaded]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (subscriptionType === 'paid' && remaining_minutes > 999999) return 'text-white'; // Unlimited
        if (timeLeft < 60) return 'text-red-500 animate-pulse';
        if (timeLeft < 300) return 'text-yellow-500';
        return 'text-white';
    };

    const handleEndCall = async () => {
        disconnect();

        if (sessionId && startTimeRef.current && session) {
            const durationMinutes = Math.ceil((Date.now() - startTimeRef.current) / 60000);

            // Record usage
            await recordUsage(durationMinutes);

            // Immediately redirect to dashboard with progress notification
            toast.success("Interview completed! Your report is being generated...", {
                duration: 5000
            });

            // Small delay to ensure user sees the completion message
            setTimeout(() => {
                navigate('/dashboard', {
                    state: {
                        showReportProgress: true,
                        sessionId: sessionId,
                        message: "Your interview report is being generated. This may take a few moments."
                    }
                });
            }, 1000);

            // Generate feedback and save asynchronously (fire-and-forget)
            setTimeout(async () => {
                try {
                    console.log("Messages at end call:", messages);
                    console.log("Messages count:", messages.length);

                    // Generate feedback
                    const feedback = await generateFeedback(messages, session.position, session.interview_type);

                    // Attach generated timestamp to feedback for merging/ordering
                    const feedbackWithTs = { ...feedback, generatedAt: new Date().toISOString() };

                    // Store feedback in Zustand for instant UI display
                    setFeedback(feedbackWithTs as any);

                    // Calculate average score
                    const averageScore = Math.round((feedbackWithTs.skills || []).reduce((acc: number, s: any) => acc + (s.score || 0), 0) / ((feedbackWithTs.skills || []).length || 1));

                    // Save to database
                    setSaving(true);
                    setSaveError(null);

                    const doSaveWithRetry = async (attempt = 1) => {
                        try {
                            console.log(`Saving interview (attempt ${attempt})`);

                            await completeInterviewSession(sessionId!, {
                                duration_minutes: durationMinutes,
                                score: averageScore,
                                transcript: messages,
                                feedback: feedbackWithTs
                                , status: 'completed'
                            });

                            setSaving(false);
                            setSaveError(null);
                            console.log('Interview saved successfully');
                        } catch (err: any) {
                            console.error(`Save attempt ${attempt} failed:`, err?.message || err);
                            if (attempt < 3) {
                                // exponential backoff
                                const backoff = 1000 * Math.pow(2, attempt - 1);
                                setTimeout(() => doSaveWithRetry(attempt + 1), backoff);
                            } else {
                                setSaving(false);
                                setSaveError(err?.message || 'Failed to save interview');
                                console.error('Failed to save interview after multiple attempts');
                            }
                        }
                    };

                    doSaveWithRetry();
                } catch (error) {
                    console.error("Error generating feedback:", error);
                    setSaveError('Failed to generate interview feedback');
                }
            }, 100); // Small delay to allow navigation to complete
        } else {
            // No session data - just disconnect and go to dashboard
            toast.info("Interview ended.");
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        }
    };

    const toggleMic = async () => {
        if (isRecording) {
            stopRecording();
            stopListening();
        } else {
            try {
                await startRecording();
                startListening();
            } catch (error) {
                console.error("Failed to start recording:", error);
                toast.error("Failed to start microphone. Please check permissions.");
            }
        }
    };

    return (
        <div className="relative h-screen w-screen bg-slate-950 overflow-hidden">
            {/* Fullscreen Video Background */}
            <div className="absolute inset-0">
                {!isCameraOn ? (
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-900 to-slate-950">
                        <div className="h-32 w-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 mb-4">
                            <User className="h-16 w-16 text-slate-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">Camera is turned off</p>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                    />
                )}
            </div>

            {/* Overlay Gradient for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Timer - Top Left */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
                <div className={`bg-black/60 backdrop-blur-md border border-white/10 px-3 sm:px-4 py-2 rounded-full font-mono text-xs sm:text-sm font-medium tracking-wider flex items-center gap-2 shadow-lg ${getTimerColor()}`}>
                    <div className={`h-2 w-2 rounded-full animate-pulse ${timeLeft < 60 ? 'bg-red-500' : 'bg-green-500'}`} />
                    {subscriptionType === 'paid' && remaining_minutes > 999999 ? formatTime(elapsedTime) : formatTime(timeLeft)}
                </div>
            </div>

            {/* Aura AI Card - Top Right */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
                <Card className="bg-black/60 backdrop-blur-xl border-white/10 p-3 sm:p-4 rounded-2xl w-56 sm:w-64 shadow-2xl">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {/* Aura Avatar */}
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/50 to-blue-600/50 animate-pulse" />
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white relative z-10" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-white text-sm sm:text-base font-bold truncate bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Aura
                            </h3>
                            <p className="text-slate-400 text-[10px] sm:text-xs">
                                {connected ? "AI Interviewer • Connected" : "Connecting..."}
                            </p>
                        </div>
                        {connected && (
                            <div className="flex gap-1 flex-shrink-0">
                                <div className="h-3 w-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="h-3 w-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="h-3 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>

                    {/* Aura Speaking Visualizer */}
                    <div className="h-12 sm:h-16 flex items-center justify-center gap-1">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ease-in-out ${isAiSpeaking ? 'animate-pulse' : ''
                                    }`}
                                style={{
                                    background: isAiSpeaking
                                        ? `linear-gradient(to top, rgb(168, 85, 247), rgb(59, 130, 246), rgb(34, 211, 238))`
                                        : 'rgb(100, 116, 139)',
                                    height: isAiSpeaking ? `${Math.random() * 100}%` : '4px',
                                    opacity: isAiSpeaking ? 1 : 0.3
                                }}
                            />
                        ))}
                    </div>
                </Card>
            </div>

            {/* User Label - Bottom Left */}
            <div className="absolute bottom-24 sm:bottom-28 left-4 sm:left-6 z-20">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full font-medium text-sm sm:text-base shadow-lg">
                    You
                </div>
            </div>

            {/* Microphone Status - Bottom Right */}
            <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-20">
                <div className={`px-3 sm:px-4 py-2 rounded-full backdrop-blur-md border flex items-center gap-2 shadow-lg ${isRecording
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-red-500/20 border-red-500/50 text-red-400'
                    }`}>
                    {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                        {isRecording ? "Listening" : "Muted"}
                    </span>
                </div>
            </div>

            {/* Floating Controls - Bottom Center */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-3 sm:p-4 shadow-2xl">
                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Mic Toggle */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isRecording
                                ? 'bg-slate-700/80 text-white hover:bg-slate-600'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                            onClick={toggleMic}
                            title={isRecording ? "Mute" : "Unmute"}
                        >
                            {isRecording ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </Button>

                        {/* End Call */}
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl hover:scale-105 transition-transform bg-red-600 hover:bg-red-700 border-2 border-red-500"
                            onClick={handleEndCall}
                            title="End Interview"
                        >
                            <PhoneOff className="h-6 w-6 sm:h-8 sm:w-8" />
                        </Button>

                        {/* Camera Toggle */}
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border-0 shadow-lg transition-all duration-300 ${isCameraOn
                                ? 'bg-slate-700/80 text-white hover:bg-slate-600'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                            onClick={() => setIsCameraOn(!isCameraOn)}
                            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                            {isCameraOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
