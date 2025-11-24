import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Mic, MicOff, Video, VideoOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function InterviewSetup() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const toggleMic = () => setIsMicOn(!isMicOn);
    const toggleCamera = () => setIsCameraOn(!isCameraOn);

    const handleStart = async () => {
        if (!isMicOn) {
            toast.error("Please turn on your microphone to continue");
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

                        {/* User Label */}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-medium">
                            {user?.user_metadata?.full_name || user?.email || "User"}
                        </div>

                        {/* Placeholder for Video Stream */}
                        {!isCameraOn && (
                            <div className="text-slate-500 flex flex-col items-center gap-2">
                                <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                                    <VideoOff className="h-8 w-8" />
                                </div>
                                <p>Camera is off</p>
                            </div>
                        )}

                        {/* Controls Overlay */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
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

                            {!isMicOn && (
                                <p className="text-sm text-red-500 font-medium">Please turn on your microphone.</p>
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
                                <span>Start the interview with "Hello".</span>
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
