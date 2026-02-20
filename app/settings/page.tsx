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
import { User, Lock, Bell, Smartphone, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mfaEnabled, setMfaEnabled] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

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
        }
    };

    const handleSecurityUpdate = async (newMfaStatus: boolean) => {
        // Toggle MFA
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
        }
    };

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
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit">Save Changes</Button>
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
                                    <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} />
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
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

// Simple Badge component shim if simple import fails, but we can reuse existing
import { Badge } from "@/components/ui/badge";
