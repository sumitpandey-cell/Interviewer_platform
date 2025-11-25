import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Bell, Shield, Trash2, Save, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';

export default function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Profile settings
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || user?.user_metadata?.picture);

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [interviewReminders, setInterviewReminders] = useState(true);
    const [weeklyReports, setWeeklyReports] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    // Account settings
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

            setAvatarUrl(publicUrl);
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
                data: { full_name: fullName }
            });

            if (error) throw error;

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
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
        );

        if (!confirmed) return;

        const doubleConfirm = window.confirm(
            "This is your last chance. Are you absolutely sure you want to delete your account?"
        );

        if (!doubleConfirm) return;

        try {
            setLoading(true);

            // Delete user data from database
            const { error: deleteError } = await supabase
                .from('interview_sessions')
                .delete()
                .eq('user_id', user?.id);

            if (deleteError) throw deleteError;

            // Note: Supabase doesn't allow direct user deletion from client
            // You would need to implement this via a server function or admin API
            toast.info("Please contact support to complete account deletion.");

        } catch (error: any) {
            console.error("Error deleting account:", error);
            toast.error(error.message || "Failed to delete account");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = () => {
        // In a real app, you would save these to a database
        toast.success("Notification preferences saved!");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your account settings and preferences
                    </p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">Notifications</span>
                        </TabsTrigger>
                        <TabsTrigger value="account" className="gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Account</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Update your personal information and profile details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                                            <Avatar className="h-20 w-20 border-4 border-white shadow-lg group-hover:opacity-90 transition-opacity">
                                                <AvatarImage src={avatarUrl} />
                                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                                    {user?.email?.charAt(0).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <div>
                                        <h3 className="font-semibold text-lg">{fullName || "User"}</h3>
                                        <p className="text-sm text-muted-foreground">{email}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Email cannot be changed. Contact support if you need to update it.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={loading}
                                        className="w-full sm:w-auto"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {loading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Manage how you receive notifications and updates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="email-notifications" className="text-base font-medium">
                                                Email Notifications
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email notifications about your account activity
                                            </p>
                                        </div>
                                        <Switch
                                            id="email-notifications"
                                            checked={emailNotifications}
                                            onCheckedChange={setEmailNotifications}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="interview-reminders" className="text-base font-medium">
                                                Interview Reminders
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Get reminders about upcoming practice sessions
                                            </p>
                                        </div>
                                        <Switch
                                            id="interview-reminders"
                                            checked={interviewReminders}
                                            onCheckedChange={setInterviewReminders}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="weekly-reports" className="text-base font-medium">
                                                Weekly Progress Reports
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive weekly summaries of your interview performance
                                            </p>
                                        </div>
                                        <Switch
                                            id="weekly-reports"
                                            checked={weeklyReports}
                                            onCheckedChange={setWeeklyReports}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="marketing-emails" className="text-base font-medium">
                                                Marketing Emails
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive updates about new features and promotions
                                            </p>
                                        </div>
                                        <Switch
                                            id="marketing-emails"
                                            checked={marketingEmails}
                                            onCheckedChange={setMarketingEmails}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSaveNotifications}
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Preferences
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Tab */}
                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password to keep your account secure
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    onClick={handleUpdatePassword}
                                    disabled={loading || !newPassword || !confirmPassword}
                                    className="w-full sm:w-auto"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {loading ? "Updating..." : "Update Password"}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader>
                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                <CardDescription>
                                    Irreversible actions that will permanently affect your account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-red-200 bg-white p-4">
                                    <h4 className="font-semibold text-red-600 mb-2">Delete Account</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Once you delete your account, there is no going back. All your interview
                                        history, reports, and personal data will be permanently deleted.
                                    </p>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={loading}
                                        className="w-full sm:w-auto"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
