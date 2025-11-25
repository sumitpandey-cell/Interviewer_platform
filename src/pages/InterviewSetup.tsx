import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Mic, MicOff, Video, VideoOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SessionConfig {
    skills?: string[];
    jobDescription?: string;
    duration?: number;
}

interface SessionData {
    id: string;
    interview_type: string;
    position: string;
    duration_minutes?: number | null;
    config?: SessionConfig | null;
}

export default function InterviewSetup() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<SessionData | null>(null);
    const [fetchingSession, setFetchingSession] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const { data, error } = await supabase
                .from("interview_sessions")
                .select("id, interview_type, position, duration_minutes, config")
                .eq("id", sessionId)
                .single();

            if (error) throw error;
            // Cast config from Json to SessionConfig
            setSession(data as SessionData);
        } catch (error) {
            console.error("Error fetching session:", error);
            toast.error("Failed to load session details");
        } finally {
            setFetchingSession(false);
        }
    };

    const toggleMic = () => setIsMicOn(!isMicOn);
    
    const startCamera = async () => {
        try {
            setCameraError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraOn(true);
            setIsMicOn(true); // Also enable mic when camera starts
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Unable to access camera. Please check permissions.');
            toast.error('Camera access denied. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setIsMicOn(false); // Also disable mic when camera stops
    };

    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleStart = async () => {
        if (!isMicOn) {
            toast.error("Please turn on your microphone to continue");
            return;
        }

        if (!isCameraOn) {
            toast.error("Please turn on your camera to continue");
            return;
        }

        setIsLoading(true);
        // Simulate connection or setup delay
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Starting interview session...");
            // Navigate to the actual interview page
            navigate(`/interview/${sessionId}/active`);
            console.log("Starting interview for session:", sessionId);
        }, 1000);
    };

    if (fetchingSession) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 border-b border-slate-100 flex items-center px-6 lg:px-12">
                <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Brain className="h-8 w-8 text-blue-600" />
                    AI Interview Agents
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-12 items-center lg:items-start justify-center">

                {/* Left Column: Video Preview */}
                <div className="w-full max-w-3xl">
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">

                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isCameraOn ? 'block' : 'hidden'}`}
                        />

                        {/* User Label */}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-medium z-10">
                            {user?.user_metadata?.full_name || user?.email || "User"}
                        </div>

                        {/* Placeholder for Video Stream */}
                        {!isCameraOn && (
                            <div className="text-slate-500 flex flex-col items-center gap-2">
                                <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                                    <VideoOff className="h-8 w-8" />
                                </div>
                                <p>Camera is off</p>
                                {cameraError && (
                                    <p className="text-red-400 text-sm text-center max-w-xs">{cameraError}</p>
                                )}
                            </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10">
                            <button
                                onClick={toggleMic}
                                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Controls & Instructions */}
                <div className="w-full max-w-sm space-y-8">
                    {session && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">Interview Details</h3>
                            <div className="space-y-1 text-sm text-blue-800">
                                <p><strong>Type:</strong> {session.interview_type}</p>
                                <p><strong>Position:</strong> {session.position}</p>
                                {session.duration_minutes && (
                                    <p><strong>Duration:</strong> {session.duration_minutes} minutes</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="text-center space-y-6">
                        <h2 className="text-2xl font-semibold text-slate-900">Ready to join?</h2>

                        <div className="space-y-3">
                            <Button
                                size="lg"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-base font-medium rounded-full"
                                onClick={handleStart}
                                disabled={isLoading}
                            >
                                {isLoading ? "Connecting..." : "Start Now"}
                            </Button>

                            {!isMicOn && !isCameraOn && (
                                <p className="text-sm text-red-500 font-medium">Please turn on your microphone and camera.</p>
                            )}
                            {!isMicOn && isCameraOn && (
                                <p className="text-sm text-red-500 font-medium">Please turn on your microphone.</p>
                            )}
                            {isMicOn && !isCameraOn && (
                                <p className="text-sm text-red-500 font-medium">Please turn on your camera.</p>
                            )}

                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 h-12 text-base font-medium rounded-full"
                                onClick={() => navigate('/dashboard')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-semibold text-slate-900">Instructions</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Click the camera and microphone buttons to enable your devices.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>The AI will introduce itself and start the interview.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Sit in a quiet and well-lit place.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                <span>Ensure a stable internet connection.</span>
                            </li>
                        </ul>
                    </div>
                </div>

            </main>
        </div>
    );
}
