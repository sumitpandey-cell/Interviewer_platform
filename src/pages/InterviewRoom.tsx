import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, User, Sparkles, ChevronRight, ChevronLeft, Loader2, Code } from "lucide-react";
import { toast } from "sonner";
import { useLiveAPI } from "@/hooks/use-live-api";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { generateFeedback } from "@/lib/gemini-feedback";
import { useInterviewStore } from "@/stores/use-interview-store";
import { useOptimizedQueries } from "@/hooks/use-optimized-queries";
import { useSubscription } from "@/hooks/use-subscription";
import { useCompanyQuestions } from "@/hooks/use-company-questions";
import { CompanyQuestion } from "@/types/company-types";
import { CodingChallengeModal } from "@/components/CodingChallengeModal";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

interface SessionData {
    id: string;
    interview_type: string;
    position: string;
    duration_minutes?: number;
    config?: {
        companyInterviewConfig?: {
            companyTemplateId: string;
            companyName: string;
            role: string;
            experienceLevel: string;
        };
        [key: string]: any;
    };
}

import { loadSystemPrompt, containsCodingKeywords } from "@/lib/prompt-loader";

const generateSystemInstruction = (session: SessionData | null, timeLeftMinutes?: number, companyQuestions?: CompanyQuestion[]) => {
    if (!session) {
        return `You are a Senior Technical Interviewer. Conduct a professional interview.`;
    }

    const { interview_type, position } = session;
    const companyName = (session as any).config?.companyInterviewConfig?.companyName;

    // Use the new prompt loader system
    return loadSystemPrompt({
        interviewType: interview_type,
        position: position,
        companyName: companyName,
        timeLeftMinutes: timeLeftMinutes,
        questions: companyQuestions && companyQuestions.length > 0 ? companyQuestions : undefined
    });
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
    const { connect, disconnect, startRecording, stopRecording, pauseRecording, resumeRecording, sendTextMessage, suspendAudioOutput, resumeAudioOutput, connected, isRecording, volume } = useLiveAPI(cleanApiKey);
    const { setFeedback, setTranscript, setSaving, setSaveError, addCodingChallenge, setCurrentCodingQuestion, currentCodingQuestion } = useInterviewStore();
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
    const hasConnectedRef = useRef(false); // Track if connection has been initiated
    const { remaining_minutes, recordUsage, type: subscriptionType } = useSubscription();
    const [timeLeft, setTimeLeft] = useState(remaining_minutes * 60);

    // Coding challenge state
    const [isCodingModalOpen, setIsCodingModalOpen] = useState(false);
    const [isInterviewPaused, setIsInterviewPaused] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [isCodingChallengeAvailable, setIsCodingChallengeAvailable] = useState(false);

    // Fetch company questions if this is a company interview
    const companyTemplateId = session?.config?.companyInterviewConfig?.companyTemplateId;
    const { questions: companyQuestions, isLoading: loadingQuestions } = useCompanyQuestions({
        companyId: companyTemplateId || null,
        count: 5,
        role: session?.config?.companyInterviewConfig?.role || null
    });

    // Initialize timeLeft based on session duration or default to subscription time
    useEffect(() => {
        if (session?.duration_minutes) {
            // Use the duration from the interview session
            setTimeLeft(session.duration_minutes * 60);
        } else {
            // Fallback to subscription remaining time
            setTimeLeft(remaining_minutes * 60);
        }
    }, [session, remaining_minutes]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            // Don't increment elapsed time if interview is paused
            if (!isInterviewPaused) {
                setElapsedTime((prev) => prev + 1);
            }

            // Count down if session has duration OR if subscription is not unlimited
            const shouldCountDown = session?.duration_minutes || (subscriptionType !== 'paid' || remaining_minutes < 999999);

            if (shouldCountDown && !isInterviewPaused) {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        toast.info("Interview time has ended");
                        handleEndCall();
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [subscriptionType, remaining_minutes, session, isInterviewPaused]);

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
                    position: data.position,
                    config: data.config // Ensure config is passed
                });
            } else {
                setSession(null);
            }
        } catch (error) {
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

    // Transcript handling - Use ref to avoid reconnection loops
    const handleTranscriptFragmentRef = useRef<((sender: 'ai' | 'user', text: string) => void) | null>(null);

    // Update the ref whenever dependencies change, but don't recreate the function
    useEffect(() => {
        handleTranscriptFragmentRef.current = (sender: 'ai' | 'user', text: string) => {
            // Validate input
            if (!sender || !text) {
                console.warn('Invalid transcript fragment received:', { sender, text });
                return;
            }

            // Clean AI internal thoughts from display
            let cleanedText = text;
            if (sender === 'ai') {
                // Only remove **Bold markers** but keep the text content
                cleanedText = cleanedText.replace(/\*\*/g, '');

                // Remove empty lines
                cleanedText = cleanedText.split('\n')
                    .filter(line => line.trim())
                    .join('\n')
                    .trim();
            }

            // Skip if text is empty after cleaning
            if (!cleanedText.trim()) {
                console.log(`Skipping empty text from ${sender} after filtering`);
                return;
            }


            // Enhanced coding question detection
            // Strategy 1: Marker-based detection (Primary & Most Accurate)
            if (sender === 'ai' && cleanedText.includes('[CODING_CHALLENGE]')) {
                console.log('✅ Detected coding question via marker [CODING_CHALLENGE]');
                console.log('Current question index:', currentQuestionIndex);
                console.log('Total company questions:', companyQuestions.length);

                // Remove the marker from the text to be displayed
                const textWithoutMarker = cleanedText.replace('[CODING_CHALLENGE]', '').trim();

                // Update the message with clean text if there is any remaining text
                if (textWithoutMarker) {
                    setMessages((prev) => {
                        const lastMessageIndex = prev.length > 0 ? prev.length - 1 : -1;
                        const lastMessage = prev[lastMessageIndex];

                        if (lastMessage && lastMessage.sender === sender) {
                            const updated = [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + textWithoutMarker }];
                            console.log(`✅ Appended to AI message. Total messages: ${updated.length}`);
                            return updated;
                        } else {
                            messageIdRef.current += 1;
                            const newMessage = {
                                id: messageIdRef.current,
                                sender,
                                text: textWithoutMarker,
                                timestamp: new Date().toISOString()
                            };
                            const updated = [...prev, newMessage];
                            console.log(`✅ Created new AI message. Total messages: ${updated.length}. Message: "${textWithoutMarker.substring(0, 30)}..."`);
                            return updated;
                        }
                    });
                }

                // Auto-open coding modal after AI finishes speaking
                // We'll use a small delay to ensure AI has finished speaking
                if (!isCodingModalOpen && !isInterviewPaused) {
                    console.log('⏳ Scheduling auto-open of coding modal...');

                    // Strategy: Search through ALL coding questions to find one that hasn't been asked yet
                    // We'll look for the first coding question starting from currentQuestionIndex
                    let questionToUse = companyQuestions
                        .slice(currentQuestionIndex)
                        .find(q => q.question_type === 'Coding');

                    // If we didn't find one from currentQuestionIndex onwards, it might be that
                    // the AI is asking questions out of order. Let's search all questions.
                    if (!questionToUse && companyQuestions.length > 0) {
                        console.log('⚠️ No coding question found from current index, searching all questions...');
                        questionToUse = companyQuestions.find(q => q.question_type === 'Coding');
                    }

                    // If still no question found in company questions, create a generic one
                    if (!questionToUse) {
                        console.log('⚠️ No coding question found in company questions, creating generic one');
                        questionToUse = {
                            id: 'generic-coding-' + Date.now(),
                            company_id: 'general',
                            question_text: textWithoutMarker || 'Please solve the coding problem described by the interviewer.',
                            question_type: 'Coding',
                            difficulty: 'Medium',
                            role: 'General',
                            experience_level: null,
                            tags: ['coding', 'general'],
                            metadata: {},
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    }

                    console.log('📝 Selected coding question:', questionToUse.question_text.substring(0, 50) + '...');

                    // Set the question first
                    setCurrentCodingQuestion(questionToUse);

                    // Wait 2 seconds for AI to finish speaking, then auto-open
                    setTimeout(() => {
                        console.log('🚀 Auto-opening coding modal');
                        setIsCodingModalOpen(true);
                        setIsInterviewPaused(true);
                        // Only pause user's microphone, let AI continue speaking
                        pauseRecording();
                        toast.success("Coding challenge started! Write your solution below.");

                        // Update question index ONLY if it's from company questions and we found it in the list
                        const questionIndex = companyQuestions.findIndex(q => q.id === questionToUse!.id);
                        if (questionIndex !== -1 && questionIndex >= currentQuestionIndex) {
                            console.log(`Updating question index from ${currentQuestionIndex} to ${questionIndex + 1}`);
                            setCurrentQuestionIndex(questionIndex + 1);
                        }
                    }, 2000); // 2 second delay to let AI finish speaking
                }

                // We handled the message update manually (or skipped if empty), so we return
                return;
            }

            setMessages((prev) => {
                // Find the last message from the same sender to append to it
                const lastMessageIndex = prev.length > 0 ? prev.length - 1 : -1;
                const lastMessage = prev[lastMessageIndex];

                if (lastMessage && lastMessage.sender === sender) {
                    // Append to existing line from same sender
                    const updated = [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + cleanedText }];
                    console.log(`✅ Appended to ${sender} message. Total messages: ${updated.length}`);
                    return updated;
                } else {
                    // Create new message line
                    messageIdRef.current += 1;
                    const newMessage = {
                        id: messageIdRef.current,
                        sender,
                        text: cleanedText,
                        timestamp: new Date().toISOString()
                    };
                    const updated = [...prev, newMessage];
                    console.log(`✅ Created new ${sender} message. Total messages: ${updated.length}. Message: "${cleanedText.substring(0, 30)}..."`);
                    return updated;
                }
            });

            // Strategy 2: Keyword-based detection (Fallback)
            if (sender === 'ai' && companyQuestions.length > 0 && !isCodingModalOpen && !isInterviewPaused) {
                if (containsCodingKeywords(cleanedText)) {
                    // Find the next unasked coding question
                    const nextCodingQuestion = companyQuestions
                        .slice(currentQuestionIndex)
                        .find(q => q.question_type === 'Coding');

                    if (nextCodingQuestion) {
                        console.log(`Detected coding question via keywords: ${nextCodingQuestion.question_text.substring(0, 50)}...`);

                        // Longer delay for keyword detection to ensure question is fully asked
                        setTimeout(() => {
                            if (!isCodingModalOpen) { // Double check
                                console.log('Opening coding modal (keyword detection)');
                                setCurrentCodingQuestion(nextCodingQuestion);
                                setIsCodingModalOpen(true);
                                setIsInterviewPaused(true);

                                const newIndex = companyQuestions.indexOf(nextCodingQuestion);
                                if (newIndex !== -1) {
                                    setCurrentQuestionIndex(newIndex + 1);
                                }

                                // Only pause user's mic, let AI keep speaking
                                pauseRecording();
                            }
                        }, 3000); // 3s delay for fallback
                    }
                }
            }
        };
    }, [companyQuestions, currentQuestionIndex, isCodingModalOpen, isInterviewPaused, setCurrentCodingQuestion, pauseRecording, suspendAudioOutput]);

    // Stable callback wrapper that never changes
    const handleTranscriptFragment = useCallback((sender: 'ai' | 'user', text: string) => {
        if (handleTranscriptFragmentRef.current) {
            handleTranscriptFragmentRef.current(sender, text);
        }
    }, []);


    // Sync messages to Zustand store for instant access in report page
    useEffect(() => {
        if (messages.length > 0) {
            console.log('🔄 Syncing messages to Zustand store:');
            console.log(`   Total: ${messages.length} messages`);
            messages.forEach((msg, idx) => {
                console.log(`   [${idx}] ${msg.sender.toUpperCase()}: ${msg.text.substring(0, 50)}...`);
            });
            setTranscript(messages);
        }
    }, [messages, setTranscript]);

    // Auto-connect on mount after session is loaded
    useEffect(() => {
        if (!API_KEY || !sessionLoaded) {
            return;
        }

        // Check if this is a company interview
        const isCompanyInterview = !!session?.config?.companyInterviewConfig?.companyTemplateId;

        // If it is a company interview, we must wait for questions to be loaded.
        // We proceed only if:
        // 1. It's NOT a company interview
        // 2. OR It IS a company interview AND we have questions
        // 3. OR It IS a company interview AND loading is finished (and we have 0 questions - edge case)
        if (isCompanyInterview && companyQuestions.length === 0) {
            console.log('Waiting for company questions to load...');
            return;
        }

        // Prevent multiple connections - only connect once
        if (hasConnectedRef.current) {
            console.log('Connection already initiated, skipping...');
            return;
        }

        console.log('Starting connection initialization...');
        const initConnection = async () => {
            hasConnectedRef.current = true;

            try {
                const systemInstruction = generateSystemInstruction(
                    session,
                    Math.floor(timeLeft / 60),
                    companyQuestions.length > 0 ? companyQuestions : undefined
                );

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
                    // Enable input transcription for user speech
                    // Add input and output audio transcription
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    onTranscriptFragment: handleTranscriptFragment
                });
                startTimeRef.current = Date.now();
                console.log('Connection established successfully');
            } catch (error) {
                console.error("Failed to connect to Gemini Live API:", error);
                toast.error("Failed to connect to AI interviewer. Please check your API key and try again.");
                hasConnectedRef.current = false; // Reset on error to allow retry
            }
        };

        initConnection();

        return () => {
            console.log('Cleaning up connection...');
            disconnect();
            hasConnectedRef.current = false; // Reset on cleanup
        };
    }, [sessionLoaded, connect, disconnect, companyQuestions, loadingQuestions, session, handleTranscriptFragment]);

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
        if (isEnding) return;
        setIsEnding(true);
        console.log('Ending call...');
        try {
            // Stop recording and disconnect
            if (isRecording) {
                await stopRecording();
            }
            disconnect();
            stopListening();

            // Calculate actual duration
            const durationMinutes = Math.floor(elapsedTime / 60);

            // Complete the session
            if (sessionId) {
                await completeInterviewSession(sessionId, {
                    status: 'completed',
                    duration_minutes: durationMinutes,
                });
            }

            // Record usage
            await recordUsage(durationMinutes);

            console.log('🔍 Generating feedback with messages:', messages.length, 'messages');
            console.log('First 3 messages:', messages.slice(0, 3));

            let feedback;
            let feedbackWithTs;

            try {
                feedback = await generateFeedback(messages, session.position, session.interview_type);
                console.log('✅ Feedback generated successfully:', feedback);

                // Attach generated timestamp to feedback for merging/ordering
                feedbackWithTs = { ...feedback, generatedAt: new Date().toISOString() };

                // Store feedback in Zustand for instant UI display
                setFeedback(feedbackWithTs as any);
            } catch (feedbackError) {
                console.error('❌ Error generating feedback:', feedbackError);
                // Create fallback feedback
                feedbackWithTs = {
                    executiveSummary: "Feedback generation encountered an error.",
                    strengths: ["Unable to analyze"],
                    improvements: ["Unable to analyze"],
                    skills: [
                        { name: "Technical Knowledge", score: 0, feedback: "Analysis failed" },
                        { name: "Communication", score: 0, feedback: "Analysis failed" },
                        { name: "Problem Solving", score: 0, feedback: "Analysis failed" },
                        { name: "Cultural Fit", score: 0, feedback: "Analysis failed" }
                    ],
                    actionPlan: ["Please review transcript manually"],
                    generatedAt: new Date().toISOString()
                };
                setFeedback(feedbackWithTs as any);
            }

            // Calculate average score
            const averageScore = Math.round((feedbackWithTs.skills || []).reduce((acc: number, s: any) => acc + (s.score || 0), 0) / ((feedbackWithTs.skills || []).length || 1));

            // Save to database
            setSaving(true);
            setSaveError(null);

            const doSaveWithRetry = async (attempt = 1) => {
                try {
                    console.log(`Saving interview (attempt ${attempt})`);
                    console.log(`Interview Data:
                    - Duration: ${durationMinutes} minutes
                    - Score: ${averageScore}
                    - Messages: ${messages.length}
                    - Transcript Messages:`);

                    messages.forEach((msg, idx) => {
                        console.log(`  [${idx}] ${msg.sender.toUpperCase()}: ${msg.text.substring(0, 40)}...`);
                    });

                    await completeInterviewSession(sessionId!, {
                        duration_minutes: durationMinutes,
                        score: averageScore,
                        transcript: messages,
                        feedback: feedbackWithTs
                        , status: 'completed'
                    });

                    setSaving(false);
                    setSaveError(null);
                    console.log('✅ Interview saved successfully');
                } catch (err: any) {
                    console.error(`❌ Save attempt ${attempt} failed:`, err?.message || err);
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

            toast.success("Interview ended. Generating your report...");

            // Navigate to dashboard with progress indicator
            navigate('/dashboard', {
                state: {
                    showReportProgress: true,
                    sessionId: sessionId,
                    message: "Your interview report is being generated. This may take a few moments..."
                }
            });
        } catch (error) {
            console.error("Error ending call:", error);
            toast.error("Failed to end interview properly");
            setIsEnding(false);
        }
    };

    // Handle coding challenge submission
    const handleCodingSubmit = (code: string, language: string, timeSpent: number) => {
        if (!currentCodingQuestion) return;

        console.log('Coding challenge submitted, resuming audio');

        // Save to store
        addCodingChallenge({
            id: crypto.randomUUID(),
            question: currentCodingQuestion.question_text,
            code,
            language,
            timeSpent,
            submittedAt: new Date().toISOString()
        });

        // Send code to Aura for examination with context
        const timeSpentMinutes = Math.floor(timeSpent / 60);
        const timeSpentSeconds = timeSpent % 60;
        const timeSpentText = timeSpentMinutes > 0
            ? `${timeSpentMinutes} minute${timeSpentMinutes !== 1 ? 's' : ''} and ${timeSpentSeconds} second${timeSpentSeconds !== 1 ? 's' : ''}`
            : `${timeSpentSeconds} second${timeSpentSeconds !== 1 ? 's' : ''}`;

        const codeMessage = `I've completed the coding challenge. Time spent: ${timeSpentText}. Here's my ${language} solution:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease review my solution and provide feedback.`;

        // Add to messages
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: codeMessage,
            timestamp: new Date().toISOString()
        }]);

        // Resume interview and audio
        setIsCodingModalOpen(false);
        setIsInterviewPaused(false);
        setCurrentCodingQuestion(null);

        // Resume audio recording and output
        resumeRecording();
        resumeAudioOutput();

        // Send the message to Aura
        sendTextMessage(codeMessage);

        toast.success("Code submitted! Aura will review it now.");
    };

    // Handle coding challenge abort
    const handleCodingAbort = () => {
        console.log('Coding challenge aborted, resuming audio');

        // Notify Aura that the candidate skipped the coding question
        const abortMessage = "I'd like to skip this coding question and move on to the next part of the interview.";

        setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'user',
            text: abortMessage,
            timestamp: new Date().toISOString()
        }]);

        setIsCodingModalOpen(false);
        setIsInterviewPaused(false);
        setCurrentCodingQuestion(null);

        // Resume audio recording and output
        resumeRecording();
        resumeAudioOutput();

        // Send the message to Aura
        sendTextMessage(abortMessage);

        toast.info("Coding challenge skipped. Interview resumed.");
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
                            disabled={isEnding}
                            title="End Interview"
                        >
                            {isEnding ? <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" /> : <PhoneOff className="h-6 w-6 sm:h-8 sm:w-8" />}
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

            {/* Coding Challenge Modal */}
            <CodingChallengeModal
                isOpen={isCodingModalOpen}
                question={currentCodingQuestion?.question_text || ''}
                onSubmit={handleCodingSubmit}
                onAbort={handleCodingAbort}
            />
        </div>
    );
}
