"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
    User, 
    Lock, 
    Bell, 
    Smartphone, 
    Monitor, 
    Loader2, 
    Shield, 
    Briefcase, 
    CreditCard,
    ChevronRight,
    Camera,
    MapPin,
    Globe,
    LogOut,
    Copy,
    CheckCircle2,
    Laptop,
    Settings,
    Mail,
    Zap,
    ExternalLink
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { BillingTab } from "./billing-tab";
import { Tier } from "@/lib/rate-limit-config";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = "general" | "security" | "notifications" | "billing" | "workspace";

// ── Components ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { user: globalUser, selectedWorkspace } = useUser();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
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
            const res = await apiClient.get("/api/user/settings");
            if (res.data) {
                setUser(res.data);
                setName(res.data.name || "");
                setEmail(res.data.email || "");
                setMfaEnabled(res.data.mfaEnabled || false);
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
            await apiClient.patch("/api/user/settings", {
                type: "profile",
                data: { name, email }
            });
            toast({ title: "Profile Updated", description: "Your profile information has been saved." });
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSecurityUpdate = async (newMfaStatus: boolean) => {
        setIsUpdatingSecurity(true);
        try {
            await apiClient.patch("/api/user/settings", {
                type: "security",
                data: { mfaEnabled: newMfaStatus }
            });
            setMfaEnabled(newMfaStatus);
            toast({
                title: newMfaStatus ? "MFA Enabled" : "MFA Disabled",
                description: `Two-factor authentication is now ${newMfaStatus ? "active" : "inactive"}.`
            });
        } catch (error: any) {
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
            await apiClient.put("/api/workspace", {
                id: selectedWorkspace.id,
                name: workspaceName,
                icon: workspaceIcon
            });
            toast({ title: "Workspace Updated", description: "Your workspace settings have been saved." });
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to update workspace.", variant: "destructive" });
        } finally {
            setIsUpdatingWorkspace(false);
        }
    };

    const copyWorkspaceId = () => {
        if (!selectedWorkspace?.id) return;
        navigator.clipboard.writeText(selectedWorkspace.id);
        toast({ title: "ID Copied", description: "Workspace ID copied to clipboard." });
    };

    const isWorkspaceOwner = selectedWorkspace?.createdBy === globalUser?.id;
    const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
    const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

    // Sidebar Items
    const sideNav = useMemo(() => {
        const items = [
            { id: "general", label: "General", icon: User, desc: "Personal information and appearance" },
            { id: "security", label: "Security", icon: Lock, desc: "Account security and active sessions" },
            { id: "notifications", label: "Notifications", icon: Bell, desc: "Choose how you're alerted" },
            { id: "billing", label: "Billing", icon: CreditCard, desc: "Subscriptions and usage meters" },
        ];
        if (hasAdminAccess) {
            items.push({ id: "workspace", label: "Workspace", icon: Briefcase, desc: "Global workspace configuration" });
        }
        return items;
    }, [hasAdminAccess]);

    if (!hasAdminAccess && activeTab === 'workspace') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <Shield className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                    <p className="text-muted-foreground max-w-md">Workspace settings are exclusively available to admins and owners.</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="space-y-2">
                       <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                       <div className="h-4 w-96 bg-muted animate-pulse rounded opacity-60" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t">
                       <div className="space-y-3">
                           {[1,2,3,4].map(i => <div key={i} className="h-10 w-full bg-muted animate-pulse rounded" />)}
                       </div>
                       <div className="md:col-span-3 h-[400px] bg-muted animate-pulse rounded" />
                   </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
                
                {/* Header Section */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                        <Settings className="h-3 w-3" />
                        <span>Account Center</span>
                        <ChevronRight className="h-3 w-3 opacity-40" />
                        <span className="text-foreground capitalize">{activeTab}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage your secure identities, preferences, and workspace controls.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
                    
                    {/* Vertical Sidebar Navigation */}
                    <div className="space-y-1">
                        {sideNav.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                                    activeTab === item.id 
                                        ? "bg-primary/5 text-primary border border-primary/20 shadow-sm" 
                                        : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === item.id ? "text-primary font-bold" : "group-hover:text-foreground")} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{item.label}</span>
                                    <span className="text-[10px] hidden lg:block opacity-60 font-medium truncate max-w-[140px]">{item.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="md:col-span-3 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === "general" && (
                                    <div className="space-y-6">
                                        <Card className="border bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4">
                                                <CardTitle className="text-lg">Profile Information</CardTitle>
                                                <CardDescription>Visual identity and personal credentials.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-8 space-y-8">
                                                {/* Avatar Visualization */}
                                                <div className="flex items-center gap-6">
                                                   <div className="relative group">
                                                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border shadow-inner flex items-center justify-center">
                                                         <span className="text-3xl font-black text-primary/40 leading-none">{name.charAt(0)}</span>
                                                      </div>
                                                      <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors">
                                                         <Camera className="h-4 w-4 text-muted-foreground" />
                                                      </button>
                                                   </div>
                                                   <div className="space-y-1">
                                                      <h4 className="text-sm font-bold">Workspace Avatar</h4>
                                                      <p className="text-[11px] text-muted-foreground">Click the camera to upload a new profile picture.</p>
                                                      <div className="flex gap-2 pt-1 font-mono text-[9px] uppercase tracking-tighter opacity-60">
                                                         <span>JPG, PNG OR WEBP</span>
                                                         <span>·</span>
                                                         <span>MAX 2MB</span>
                                                      </div>
                                                   </div>
                                                </div>

                                                <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Display Name</Label>
                                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 text-sm font-semibold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Email Address</Label>
                                                        <Input id="email" type="email" value={email} disabled className="h-10 text-sm font-semibold opacity-60" />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end pt-4">
                                                        <Button type="submit" disabled={isUpdatingProfile} className="h-10 px-8 rounded-xl font-bold shadow-lg shadow-primary/10">
                                                            {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                            Update Profile
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        <Card className="border bg-card/60 shadow-sm rounded-2xl overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4">
                                                <CardTitle className="text-lg">Appearance</CardTitle>
                                                <CardDescription>Personalize the interface themes.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <span className="text-sm font-bold">Theme Mode</span>
                                                        <p className="text-xs text-muted-foreground">Toggle between automated and manual themes.</p>
                                                    </div>
                                                    <div className="flex items-center p-1 bg-muted/30 rounded-xl border border-border/50">
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm" 
                                                          onClick={() => setTheme('light')}
                                                          className={cn("h-8 rounded-lg text-xs font-bold gap-2", theme === 'light' ? "bg-background shadow-sm" : "text-muted-foreground")}
                                                        >
                                                            <Globe className="h-3 w-3" /> Light
                                                        </Button>
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm" 
                                                          onClick={() => setTheme('dark')}
                                                          className={cn("h-8 rounded-lg text-xs font-bold gap-2", theme === 'dark' ? "bg-background shadow-sm" : "text-muted-foreground")}
                                                        >
                                                            <Monitor className="h-3 w-3" /> Dark
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="space-y-6">
                                        <Card className="border bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4 flex flex-row items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                                                    <CardDescription>Multi-layered identity verification.</CardDescription>
                                                </div>
                                                <Badge className={cn("font-black tracking-widest text-[9px]", mfaEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border/50")}>
                                                   {mfaEnabled ? "PROTECTED" : "VULNERABLE"}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="pt-8">
                                                <div className="flex items-center justify-between p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                                   <div className="flex items-start gap-5">
                                                      <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center shadow-sm shrink-0">
                                                         <Smartphone className="h-6 w-6 text-primary" />
                                                      </div>
                                                      <div className="space-y-1">
                                                         <h4 className="text-sm font-bold">Authenticator Application</h4>
                                                         <p className="text-xs text-muted-foreground max-w-sm">Protect your workspace with 6-digit TOTP codes from apps like Google Authenticator or Authy.</p>
                                                      </div>
                                                   </div>
                                                   <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} disabled={isUpdatingSecurity} className="data-[state=checked]:bg-emerald-500" />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4">
                                                <CardTitle className="text-lg">Active Sessions</CardTitle>
                                                <CardDescription>Hardware and network identities current logged in.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y border-b decoration-border/10">
                                                    {(user?.sessions || [1]).map((s: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/5 transition-colors">
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center shadow-inner shrink-0">
                                                                    <Laptop className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                       <span className="text-sm font-bold">Windows PC (Chrome)</span>
                                                                       {i === 0 && <Badge className="text-[8px] font-black tracking-widest bg-emerald-500/10 text-emerald-600 border-none px-1.5 h-4">THIS DEVICE</Badge>}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                                       <MapPin className="h-3 w-3 opacity-40 shrink-0" />
                                                                       <span>Greater London, UK · 192.168.1.1</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-rose-500/5 hover:text-rose-600">
                                                                <LogOut className="h-3 w-3 mr-1.5" /> Force Logout
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div className="space-y-6">
                                        <Card className="border bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4">
                                                <CardTitle className="text-lg">Lifecycle Toggles</CardTitle>
                                                <CardDescription>Configure precise alerting for system and security events.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-8 space-y-8">
                                                <NotificationItem 
                                                  id="n1" 
                                                  label="Critical Security Alerts" 
                                                  desc="Instant alerts for unauthorized access attempts or suspicious IP patterns." 
                                                  defaultChecked 
                                                  icon={ShieldCheck2}
                                                  color="text-rose-600"
                                                />
                                                <Separator className="opacity-10" />
                                                <NotificationItem 
                                                  id="n2" 
                                                  label="Compliance & Auditing" 
                                                  desc="Weekly snapshots of your security index and key health metrics." 
                                                  icon={Zap}
                                                  color="text-amber-600"
                                                />
                                                <Separator className="opacity-10" />
                                                <NotificationItem 
                                                  id="n3" 
                                                  label="Product Pipeline" 
                                                  desc="Updates on new Xtra-CLI versions, SDK releases and feature news." 
                                                  icon={ExternalLink}
                                                  color="text-primary"
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === "billing" && (
                                    <BillingTab currentTier={(user?.tier || "free") as Tier} />
                                )}

                                {activeTab === "workspace" && (
                                    <div className="space-y-6">
                                        <Card className="border bg-card/60 rounded-2xl shadow-sm overflow-hidden">
                                            <CardHeader className="bg-muted/5 border-b pb-4">
                                                <CardTitle className="text-lg">Workspace Intelligence</CardTitle>
                                                <CardDescription>Global identifiers and branding preferences.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-8 space-y-8">
                                                <div className="p-5 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between">
                                                   <div className="flex items-center gap-4">
                                                      <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center shadow-inner">
                                                         <Terminal className="h-5 w-5 text-muted-foreground opacity-50" />
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unique Identifier</span>
                                                         <span className="text-xs font-mono font-bold">{selectedWorkspace?.id}</span>
                                                      </div>
                                                   </div>
                                                   <Button size="sm" variant="ghost" onClick={copyWorkspaceId} className="h-8 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-widest">
                                                      <Copy className="h-3 w-3" /> Copy ID
                                                   </Button>
                                                </div>

                                                <form onSubmit={handleWorkspaceUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="wsName" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Trading Name</Label>
                                                        <Input id="wsName" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required className="h-10 text-sm font-semibold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="wsIcon" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Branding Icon</Label>
                                                        <Input
                                                            id="wsIcon"
                                                            value={workspaceIcon}
                                                            onChange={(e) => setWorkspaceIcon(e.target.value)}
                                                            placeholder="Emoji or URL"
                                                            className="h-10 text-sm font-semibold"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end pt-4">
                                                        <Button type="submit" disabled={isUpdatingWorkspace} className="h-10 px-8 rounded-xl font-bold shadow-lg shadow-primary/10">
                                                            {isUpdatingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Confirm Changes
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="border bg-rose-50/10 dark:bg-rose-500/5 rounded-2xl shadow-sm overflow-hidden border-rose-500/20">
                                           <CardHeader className="bg-rose-500/5 border-b border-rose-500/10 pb-4">
                                              <CardTitle className="text-lg text-rose-600">Danger Zone</CardTitle>
                                              <CardDescription>Irreversible and destructive actions.</CardDescription>
                                           </CardHeader>
                                           <CardContent className="pt-6">
                                              <div className="flex items-center justify-between">
                                                 <div className="space-y-0.5">
                                                    <span className="text-sm font-bold">Delete this workspace</span>
                                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">Once deleted, all secrets, projects, and auditing data will be destroyed. This cannot be undone.</p>
                                                 </div>
                                                 <Button variant="destructive" size="sm" className="h-9 px-6 font-bold rounded-xl bg-rose-600 hover:bg-rose-700">Delete Workspace</Button>
                                              </div>
                                           </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function NotificationItem({ id, label, desc, defaultChecked = false, icon: Icon, color }: any) {
    return (
        <div className="flex items-start justify-between gap-6 group">
            <div className="flex items-start gap-4">
               <div className={cn("h-10 w-10 rounded-xl bg-background border flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform", color)}>
                  <Icon className="h-5 w-5" />
               </div>
               <div className="space-y-1">
                  <Label htmlFor={id} className="text-sm font-bold block leading-none">{label}</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{desc}</p>
               </div>
            </div>
            <Switch id={id} defaultChecked={defaultChecked} className="data-[state=checked]:bg-emerald-500" />
        </div>
    );
}

function ShieldCheck2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
    )
}

function Terminal({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
    )
}

function BarChart3({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
    )
}
