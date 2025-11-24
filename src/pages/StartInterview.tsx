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
import { Loader2, Plus, Upload, Sparkles } from "lucide-react";

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
                // Note: skills and jobDescription are not currently saved to DB as per schema
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
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI-Powered Interview
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Start Practice Interview</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Configure your AI-powered interview session with advanced customization options
                    </p>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
                    <CardContent className="p-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                <FormField
                                    control={form.control}
                                    name="interviewType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                                                <span className="text-green-500">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                                </span>
                                                Interview Type <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 h-12">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                                                    <SelectItem value="System Design">System Design</SelectItem>
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
                                            <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                                                <span className="text-green-500">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                                </span>
                                                Choose Position
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Type or select a position..." className="bg-white border-slate-200 h-12" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-3">
                                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                                        <span className="text-green-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                        </span>
                                        Select Skills <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a skill"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            className="bg-white border-slate-200 h-12"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSkill();
                                                }
                                            }}
                                        />
                                        <Button type="button" onClick={handleAddSkill} className="h-12 w-12 bg-blue-600 hover:bg-blue-700">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    {skillsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {skillsList.map((skill, index) => (
                                                <div key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSkillsList(skillsList.filter((_, i) => i !== index))}
                                                        className="hover:text-blue-900"
                                                    >
                                                        ×
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
                                            <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                                                <span className="text-green-500">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                </span>
                                                Interview Duration (max 15 minutes) <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" max={15} placeholder="Enter duration (in minutes)" className="bg-white border-slate-200 h-12" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                                        <span className="text-green-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        </span>
                                        Job Description
                                    </FormLabel>
                                    <div className="grid grid-cols-2 gap-0 bg-slate-100 p-1 rounded-lg mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('upload')}
                                            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${jobDescriptionType === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobDescriptionType('manual')}
                                            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${jobDescriptionType === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            Manual
                                        </button>
                                    </div>

                                    {jobDescriptionType === 'upload' ? (
                                        <div className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 p-10 text-center hover:bg-blue-50/50 transition-colors cursor-pointer">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-slate-900 font-semibold mb-1">Upload job description file</h3>
                                            <p className="text-slate-500 text-sm mb-6">PDF or DOCX (Max 5MB)</p>
                                            <Button type="button" className="bg-blue-600 hover:bg-blue-700">Choose File</Button>
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
                                                            className="min-h-[200px] bg-white border-slate-200 resize-none focus-visible:ring-blue-500"
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
                                    className="w-full h-14 text-lg bg-slate-300 hover:bg-slate-400 text-slate-600 hover:text-slate-800 font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            Start Interview
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
