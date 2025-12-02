import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Bell, Shield, Trash2, Save, Upload, CreditCard, Lock, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';
import { getAvatarUrl, getInitials } from "@/lib/avatar-utils";
import { useCacheStore } from "@/stores/use-cache-store";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getPreferredLanguage, type LanguageOption } from "@/lib/language-config";

type SettingsSection = "general" | "notifications" | "security" | "billing";

export default function Settings() {
    const { user } = useAuth();
    const { onProfileUpdated } = useCacheStore();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<SettingsSection>("general");

    // Profile settings
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [gender, setGender] = useState(user?.user_metadata?.gender || "");
    const [email] = useState(user?.email || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || user?.user_metadata?.picture);

    // Language settings
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(getPreferredLanguage());

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [interviewReminders, setInterviewReminders] = useState(true);
    const [weeklyReports, setWeeklyReports] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    // Account settings
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLanguageChange = (language: LanguageOption) => {
        setSelectedLanguage(language);
        toast.success(`Language changed to ${language.name}`);
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            setLoading(true);
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 500,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `avatar.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (profileError) throw profileError;

            setAvatarUrl(publicUrl);
            onProfileUpdated();
            toast.success("Profile picture updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile picture:", error);
            toast.error(error.message || "Failed to update profile picture");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    gender: gender
                }
            });

            if (error) throw error;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            onProfileUpdated();
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast.success("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            const { error: deleteError } = await supabase
                .from('interview_sessions')
                .delete()
                .eq('user_id', user?.id);

            if (deleteError) throw deleteError;

            toast.info("Please contact support to complete account deletion.");
        } catch (error: any) {
            console.error("Error deleting account:", error);
            toast.error(error.message || "Failed to delete account");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = () => {
        toast.success("Notification preferences saved!");
    };

    const sidebarItems = [
        { id: "general", label: "General", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "security", label: "Security", icon: Shield },
        { id: "billing", label: "Billing", icon: CreditCard },
    ];

    return (
        <DashboardLayout>
            <div className="w-full max-w-7xl space-y-8 pb-10 px-4 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id as SettingsSection)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 space-y-6">
                        {activeSection === "general" && (
                            <Card className="border-none shadow-sm bg-card">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your photo and personal details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="relative group">
                                            <Label htmlFor="avatar-upload" className="cursor-pointer block relative">
                                                <Avatar className="h-24 w-24 border-4 border-background shadow-xl group-hover:opacity-90 transition-all">
                                                    <AvatarImage src={getAvatarUrl(avatarUrl, user?.id || 'user', 'avataaars', null, gender)} />
                                                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                                        {getInitials(fullName) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                                    <Upload className="h-6 w-6 text-white" />
                                                </div>
                                            </Label>
                                            <Input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h3 className="font-bold text-xl text-foreground">{fullName || "User"}</h3>
                                            <p className="text-sm text-muted-foreground">{email}</p>
                                            <p className="text-xs text-primary font-medium mt-1">Free Plan</p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid gap-6 max-w-xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="max-w-md"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select value={gender} onValueChange={setGender}>
                                                <SelectTrigger className="max-w-md">
                                                    <SelectValue placeholder="Select your gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                value={email}
                                                disabled
                                                className="max-w-md bg-muted"
                                            />
                                        </div>

                                        <Separator />

                                        {/* Language Preferences */}
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-medium">Language Preferences</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Choose your preferred language for interviews
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Interview Language</Label>
                                                <LanguageSelector
                                                    selectedLanguage={selectedLanguage}
                                                    onLanguageChange={handleLanguageChange}
                                                    className="max-w-md"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    This language will be used for speech recognition and AI communication during interviews.
                                                    You can always change this before starting an interview.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button onClick={handleUpdateProfile} disabled={loading}>
                                                {loading ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === "notifications" && (
                            <Card className="border-none shadow-sm bg-card">
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>Choose what we communicate to you.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {[
                                        {
                                            id: "email-notifications",
                                            label: "Email Notifications",
                                            desc: "Receive emails about your account activity.",
                                            checked: emailNotifications,
                                            onChange: setEmailNotifications
                                        },
                                        {
                                            id: "interview-reminders",
                                            label: "Interview Reminders",
                                            desc: "Get reminded 1 hour before your sessions.",
                                            checked: interviewReminders,
                                            onChange: setInterviewReminders
                                        },
                                        {
                                            id: "weekly-reports",
                                            label: "Weekly Reports",
                                            desc: "A weekly summary of your progress.",
                                            checked: weeklyReports,
                                            onChange: setWeeklyReports
                                        },
                                        {
                                            id: "marketing-emails",
                                            label: "Product Updates",
                                            desc: "News about new features and improvements.",
                                            checked: marketingEmails,
                                            onChange: setMarketingEmails
                                        }
                                    ].map((item, i) => (
                                        <div key={item.id}>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor={item.id} className="text-base font-medium">
                                                        {item.label}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                                <Switch
                                                    id={item.id}
                                                    checked={item.checked}
                                                    onCheckedChange={item.onChange}
                                                />
                                            </div>
                                            {i < 3 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <Button onClick={handleSaveNotifications}>Save Preferences</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === "security" && (
                            <div className="space-y-6">
                                <Card className="border-none shadow-sm bg-card">
                                    <CardHeader>
                                        <CardTitle>Password</CardTitle>
                                        <CardDescription>Change your password to keep your account secure.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 max-w-xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="current-password">Current Password</Label>
                                            <Input
                                                id="current-password"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm Password</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <Button onClick={handleUpdatePassword} disabled={loading}>
                                                Update Password
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-destructive/20 bg-destructive/10 shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-destructive flex items-center gap-2">
                                            <Trash2 className="h-5 w-5" />
                                            Delete Account
                                        </CardTitle>
                                        <CardDescription className="text-destructive/80">
                                            Permanently delete your account and all of your content.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-destructive/80 max-w-md">
                                                Once you delete your account, there is no going back. Please be certain.
                                            </p>
                                            <Button variant="destructive" onClick={handleDeleteAccount}>
                                                Delete Account
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeSection === "billing" && (
                            <Card className="border-none shadow-sm bg-card">
                                <CardHeader>
                                    <CardTitle>Billing & Plans</CardTitle>
                                    <CardDescription>Manage your subscription and payment methods.</CardDescription>
                                </CardHeader>
                                <CardContent className="py-12 text-center">
                                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                                        You are currently on the free plan. Upgrade to unlock premium features like unlimited interviews and advanced analytics.
                                    </p>
                                    <Button variant="outline">View Plans</Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
