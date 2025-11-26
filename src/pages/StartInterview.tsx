import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Sparkles, Play, Briefcase, Clock, FileText, Code, User, Monitor } from "lucide-react";

const formSchema = z.object({
    interviewType: z.string().min(1, "Interview type is required"),
    position: z.string().min(1, "Position is required"),
    skills: z.string().optional(),
    duration: z.string().min(1, "Duration is required"),
    jobDescription: z.any().optional(),
});

export default function StartInterview() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [skillsList, setSkillsList] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [jobDescriptionType, setJobDescriptionType] = useState<'upload' | 'manual'>('upload');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            interviewType: "",
            position: "",
            skills: "",
            duration: "",
        },
    });

    const handleAddSkill = () => {
        if (skillInput.trim()) {
            setSkillsList([...skillsList, skillInput.trim()]);
            setSkillInput("");
            form.setValue("skills", ""); // Clear the hidden input if we were using one, or just manage state
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) {
            toast.error("You must be logged in to start an interview");
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.from("interview_sessions").insert({
                user_id: user.id,
                interview_type: values.interviewType,
                position: values.position,
                duration_minutes: parseInt(values.duration),
                status: "pending",
                config: {
                    skills: skillsList,
                    jobDescription: values.jobDescription || null,
                    duration: parseInt(values.duration)
                }
            }).select();

            if (error) throw error;

            if (data && data.length > 0) {
                toast.success("Interview session created!");
                navigate(`/interview/${data[0].id}/setup`);
            }
        } catch (error) {
            console.error("Error creating session:", error);
            toast.error("Failed to create interview session");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-3xl space-y-8 pb-12">
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm border border-primary/20">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI-Powered Interview
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Start Practice Interview</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                        Configure your AI-powered interview session with advanced customization options
                    </p>
                </div>

                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <CardContent className="p-8 sm:p-10">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                <FormField
                                    control={form.control}
                                    name="interviewType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                Interview Type <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-input h-12 text-base">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Technical">
                                                        <div className="flex items-center gap-2">
                                                            <Code className="h-4 w-4 text-muted-foreground" />
                                                            Technical
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="Behavioral">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            Behavioral
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="System Design">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                                            System Design
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                Choose Position
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Senior Frontend Engineer" className="bg-background/50 border-input h-12 text-base" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-3">
                                    <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        Select Skills <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a skill (e.g. React, Python)"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            className="bg-background/50 border-input h-12 text-base"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                        />
                                        <Button type="button" onClick={handleAddSkill} className="h-12 w-12 bg-primary hover:bg-primary/90 shadow-sm">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    {skillsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                                            {skillsList.map((skill, index) => (
                                                <div key={index} className="bg-background border border-border px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSkillsList(skillsList.filter((_, i) => i !== index))}
                                                        className="text-muted-foreground hover:text-destructive transition-colors rounded-full p-0.5 hover:bg-destructive/10"
                                                    >
                                                        <Plus className="h-3 w-3 rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                                <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                Interview Duration (max 15 minutes) <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" max={15} placeholder="Enter duration (in minutes)" className="bg-background/50 border-input h-12 text-base" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormLabel className="text-foreground font-semibold flex items-center gap-2 text-base">
                                        <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        Job Description
                                    </FormLabel>
                                    <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('upload')}
                                            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${jobDescriptionType === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('manual')}
                                            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${jobDescriptionType === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                        >
                                            Manual Entry
                                        </button>
                                    </div>

                                    {jobDescriptionType === 'upload' ? (
                                        <div className="border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 p-10 text-center hover:bg-primary/10 transition-colors cursor-pointer group">
                                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-foreground font-semibold mb-1 text-lg">Upload job description file</h3>
                                            <p className="text-muted-foreground text-sm mb-6">PDF or DOCX (Max 5MB)</p>
                                            <Button type="button" variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">Choose File</Button>
                                        </div>
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="jobDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Paste or type the job description here..."
                                                            className="min-h-[200px] bg-background/50 border-input resize-none focus-visible:ring-primary"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] hover:shadow-primary/40"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Starting Session...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-5 w-5 fill-current" />
                                            Start Interview Session
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
