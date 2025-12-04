import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowLeft, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { INTERVIEWER_AVATARS, getDefaultAvatar, type InterviewerAvatar } from "@/config/interviewer-avatars";

export default function AvatarSelection() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [selectedAvatar, setSelectedAvatar] = useState<InterviewerAvatar>(getDefaultAvatar());
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!sessionId) {
            toast.error("Session not found");
            return;
        }

        setIsLoading(true);

        try {
            // Fetch current session config
            const { data: session, error: fetchError } = await supabase
                .from('interview_sessions')
                .select('config')
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            // Update session config with selected avatar
            const currentConfig = (session?.config as Record<string, any>) || {};
            const updatedConfig = {
                ...currentConfig,
                selectedAvatar: selectedAvatar.id
            };

            const { error: updateError } = await supabase
                .from('interview_sessions')
                .update({ config: updatedConfig })
                .eq('id', sessionId);

            if (updateError) throw updateError;

            toast.success(`${selectedAvatar.name} will be your interviewer!`);

            // Navigate to interview setup
            setTimeout(() => {
                navigate(`/interview/${sessionId}/setup`);
            }, 500);
        } catch (error) {
            console.error("Error saving avatar selection:", error);
            toast.error("Failed to save selection. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50 flex items-center px-6 lg:px-12 justify-between">
                <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Brain className="h-6 w-6" />
                    </div>
                    AI Interview Agents
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-4xl w-full space-y-8">
                    {/* Title Section */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            <Sparkles className="h-4 w-4" />
                            Step 1 of 2
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                            Choose Your AI Interviewer
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Select an interviewer whose style matches your preference. Each has a unique personality and approach.
                        </p>
                    </div>

                    {/* Avatar Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {INTERVIEWER_AVATARS.map((avatar) => (
                            <Card
                                key={avatar.id}
                                className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${selectedAvatar.id === avatar.id
                                    ? 'border-2 border-primary shadow-2xl shadow-primary/25 bg-primary/5'
                                    : 'border border-border/50 hover:border-primary/50 bg-card/50'
                                    }`}
                                onClick={() => setSelectedAvatar(avatar)}
                            >
                                {/* Selected Badge */}
                                {selectedAvatar.id === avatar.id && (
                                    <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg z-10 animate-in zoom-in duration-300">
                                        <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                )}

                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-4xl shadow-xl flex-shrink-0 transform transition-transform ${selectedAvatar.id === avatar.id ? 'scale-110' : ''
                                            }`}>
                                            {avatar.avatar}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">{avatar.name}</h3>
                                                <p className="text-sm text-muted-foreground">{avatar.description}</p>
                                            </div>

                                            <div className="pt-2 border-t border-border/50">
                                                <p className="text-xs text-muted-foreground mb-1 font-medium">Interview Style:</p>
                                                <p className="text-sm text-foreground/80 italic leading-relaxed">
                                                    "{avatar.personality}"
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="text-xs text-muted-foreground">
                                                    {avatar.gender === 'female' ? 'Female' : 'Male'} Voice
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Selected Avatar Summary */}
                    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-3xl shadow-lg`}>
                                    {selectedAvatar.avatar}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">You've selected:</p>
                                    <h3 className="text-2xl font-bold text-foreground">{selectedAvatar.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedAvatar.name} will introduce themselves and guide you through the interview
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/dashboard')}
                            className="min-w-[200px]"
                            disabled={isLoading}
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleContinue}
                            disabled={isLoading}
                            className="min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Continue to Setup
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer Note */}
            <footer className="py-6 text-center text-sm text-muted-foreground">
                <p>💡 You can change your interviewer preference anytime from your dashboard</p>
            </footer>
        </div>
    );
}
