"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { User, Lock, Bell, Smartphone, Monitor, Loader2, Shield, Briefcase } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";

export default function SettingsPage() {
    const { user: globalUser, selectedWorkspace } = useUser();
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

    // Workspace specific states
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceIcon, setWorkspaceIcon] = useState("");
    const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);

    useEffect(() => {
        fetchSettings();
        if (selectedWorkspace) {
            setWorkspaceName(selectedWorkspace.name || "");
            setWorkspaceIcon(selectedWorkspace.icon || "");
        }
    }, [selectedWorkspace]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/user/settings");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setName(data.name || "");
                setEmail(data.email || "");
                setMfaEnabled(data.mfaEnabled || false);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            toast({ title: "Error", description: "Could not load settings.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "profile",
                    data: { name, email }
                })
            });

            if (res.ok) {
                toast({ title: "Profile Updated", description: "Your profile information has been saved." });
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSecurityUpdate = async (newMfaStatus: boolean) => {
        // Toggle MFA
        setIsUpdatingSecurity(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "security",
                    data: { mfaEnabled: newMfaStatus }
                })
            });

            if (res.ok) {
                setMfaEnabled(newMfaStatus);
                toast({
                    title: newMfaStatus ? "MFA Enabled" : "MFA Disabled",
                    description: `Two-factor authentication is now ${newMfaStatus ? "active" : "inactive"}.`
                });
            } else {
                throw new Error("Failed to update security settings");
            }
        } catch (error) {
            // Revert state if needed, but handled by opt-in usually
            toast({ title: "Error", description: "Failed to update security settings.", variant: "destructive" });
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const handleWorkspaceUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkspace?.id) return;

        setIsUpdatingWorkspace(true);
        try {
            const res = await fetch("/api/workspace", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedWorkspace.id,
                    name: workspaceName,
                    icon: workspaceIcon
                })
            });

            if (res.ok) {
                toast({ title: "Workspace Updated", description: "Your workspace settings have been saved." });
                // We could force a reload here, or let the user context auto-refresh if we implement swr or equivalent
                // For now a soft reload of the page to hydrate new context:
                window.location.reload();
            } else {
                throw new Error("Failed to update workspace");
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update workspace settings.", variant: "destructive" });
        } finally {
            setIsUpdatingWorkspace(false);
        }
    };

    const isWorkspaceOwner = selectedWorkspace?.createdBy === globalUser?.id;
    const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
    const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

    if (!hasAdminAccess) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <Shield className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
                    <p className="text-muted-foreground max-w-md text-center">
                        You do not have permission to view settings. This page is restricted to workspace admins and owners.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto pb-10">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Settings</h3>
                    <p className="text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>
                <Separator />

                <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="general" className="gap-2"><User className="h-4 w-4" /> General</TabsTrigger>
                        <TabsTrigger value="security" className="gap-2"><Lock className="h-4 w-4" /> Security</TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
                        {hasAdminAccess && (
                            <TabsTrigger value="workspace" className="gap-2"><Briefcase className="h-4 w-4" /> Workspace</TabsTrigger>
                        )}
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your public profile details.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Display Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Registered Email</Label>
                                        <Input id="email" type="email" value={email} disabled />
                                        <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isUpdatingProfile}>
                                            {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize the look and feel of the dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Theme Preference</Label>
                                        <p className="text-sm text-muted-foreground">Switch between light and dark modes.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}>Light</Button>
                                        <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}>Dark</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SECURITY TAB */}
                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                                <CardDescription>Add an extra layer of security to your account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Smartphone className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Authenticator App</Label>
                                            <p className="text-sm text-muted-foreground">Use an app like Google Authenticator to generate verification codes.</p>
                                        </div>
                                    </div>
                                    <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} disabled={isUpdatingSecurity} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Active Sessions</CardTitle>
                                <CardDescription>Manage devices where you are currently logged in.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {user?.sessions?.length > 0 ? (
                                        user.sessions.map((session: any) => (
                                            <div key={session.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-muted p-2 rounded-full">
                                                        <Monitor className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">Windows PC (Chrome)</p>
                                                        <p className="text-xs text-muted-foreground">Expires: {new Date(session.expires).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary">Active</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No active session details available (Using JWT).</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NOTIFICATIONS TAB */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Notifications</CardTitle>
                                <CardDescription>Choose what you want to be notified about.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Security Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Receive emails about suspicious activity.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Product Updates</Label>
                                        <p className="text-sm text-muted-foreground">Receive news about new features.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* WORKSPACE TAB */}
                    {hasAdminAccess && (
                        <TabsContent value="workspace" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Workspace Customization</CardTitle>
                                    <CardDescription>Update your workspace's primary details.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleWorkspaceUpdate} className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="wsName">Workspace Name</Label>
                                            <Input id="wsName" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="wsIcon">Workspace Icon / Emoji</Label>
                                            <Input
                                                id="wsIcon"
                                                value={workspaceIcon}
                                                onChange={(e) => setWorkspaceIcon(e.target.value)}
                                                placeholder="e.g. 🚀, 💼, or an image URL"
                                                maxLength={128}
                                            />
                                            <p className="text-xs text-muted-foreground">This icon shows up in the sidebar dropdown.</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={isUpdatingWorkspace}>
                                                {isUpdatingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Workspace
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

// Simple Badge component shim if simple import fails, but we can reuse existing
import { Badge } from "@/components/ui/badge";
