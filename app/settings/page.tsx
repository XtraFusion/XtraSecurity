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
    Settings as SettingsIcon,
    Mail,
    Zap,
    ExternalLink,
    ShieldCheck,
    Cpu,
    Activity,
    MoreVertical,
    History,
    Key,
    Fingerprint
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
            { id: "general", label: "General", icon: User, desc: "Personal info" },
            { id: "security", label: "Security", icon: Lock, desc: "Access & Auth" },
            { id: "notifications", label: "Notifications", icon: Bell, desc: "Alert prefs" },
            { id: "billing", label: "Billing", icon: CreditCard, desc: "Plan & Usage" },
        ];
        if (hasAdminAccess) {
            items.push({ id: "workspace", label: "Workspace", icon: Briefcase, desc: "Shared controls" });
        }
        return items;
    }, [hasAdminAccess]);

    if (!hasAdminAccess && activeTab === 'workspace') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
                    <div className="p-8 rounded-full bg-rose-500/10 border border-border/50">
                        <Shield className="h-12 w-12 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
                    <p className="text-muted-foreground max-w-sm">Workspace settings are exclusively available to workspace admins and owners.</p>
                    <Button variant="outline" onClick={() => setActiveTab("general")}>Back to General</Button>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto space-y-8 px-6 pt-12">
                   <div className="space-y-4">
                       <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
                       <div className="h-4 w-96 bg-muted animate-pulse rounded-full opacity-60" />
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-8 border-t">
                       <div className="space-y-3">
                           {[1,2,3,4].map(i => <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-xl" />)}
                       </div>
                       <div className="lg:col-span-3 h-[500px] bg-muted animate-pulse rounded-2xl" />
                   </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-32 px-6 pt-12 relative">
                
                {/* ── Header Area ── */}
                <header className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">
                        <SettingsIcon className="h-3 w-3" />
                        <span>Settings Center</span>
                        <ChevronRight className="h-3 w-3 opacity-40" />
                        <span className="text-foreground">{activeTab}</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                                Account Settings
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-2xl">
                                Manage your identity, security protocols, and workspace preferences.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start pt-4 border-t border-border">
                    
                    {/* ── Left Sidebar ── */}
                    <aside className="space-y-8 sticky top-24">
                        <nav className="space-y-1">
                            {sideNav.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveTab(s.id as SettingsTab)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                                        activeTab === s.id 
                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <s.icon className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === s.id ? "text-primary" : "group-hover:text-foreground")} />
                                    <div className="flex flex-col items-start overflow-hidden text-left">
                                        <span className="text-sm font-bold truncate">{s.label}</span>
                                        <span className="text-[10px] opacity-60 font-medium truncate">{s.desc}</span>
                                    </div>
                                    {activeTab === s.id && (
                                       <motion.div layoutId="setting-nav-pill" className="absolute left-0 w-1 h-2/3 bg-primary rounded-full" />
                                    )}
                                </button>
                            ))}
                        </nav>

                        <Card className="bg-muted/30 border-dashed rounded-3xl overflow-hidden relative group">
                           <CardContent className="p-6 space-y-4">
                               <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center shadow-sm">
                                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                               </div>
                               <div className="space-y-1">
                                  <h4 className="text-xs font-bold uppercase tracking-widest">Active Protection</h4>
                                  <p className="text-[11px] text-muted-foreground font-medium">Your identity is secured with multi-factor authentication.</p>
                               </div>
                               <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] font-bold text-emerald-600">SOC2 Verified</span>
                               </div>
                           </CardContent>
                        </Card>
                    </aside>

                    {/* ── Main Content Area ── */}
                    <div className="lg:col-span-3 space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                {activeTab === "general" && (
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                        <Card className="xl:col-span-2 border rounded-3xl shadow-sm overflow-hidden bg-white/[0.02] backdrop-blur-xl group">
                                            <CardHeader className="p-8 pb-0">
                                                <CardTitle className="text-2xl font-bold tracking-tight">Profile Information</CardTitle>
                                                <CardDescription className="text-base">Your digital identity within the XtraSecurity ecosystem.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8">
                                                <div className="flex items-center gap-8 group/avatar">
                                                   <div className="relative">
                                                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border shadow-sm flex items-center justify-center overflow-hidden transition-all group-hover/avatar:scale-105">
                                                         <span className="text-3xl font-black text-primary/40 leading-none">{name.charAt(0)}</span>
                                                      </div>
                                                      <button className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-full bg-white text-black border-4 border-background shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
                                                         <Camera className="h-4 w-4" />
                                                      </button>
                                                   </div>
                                                   <div className="space-y-1">
                                                      <h4 className="text-sm font-bold">Public Avatar</h4>
                                                      <p className="text-xs text-muted-foreground font-medium max-w-xs leading-relaxed">Shown across workspace logs and audit history.</p>
                                                      <div className="flex gap-3 pt-2">
                                                         <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 opacity-60">WEBP / PNG</Badge>
                                                         <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 opacity-60">MAX 2MB</Badge>
                                                      </div>
                                                   </div>
                                                </div>

                                                <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-muted-foreground px-1">Display Name</Label>
                                                        <Input 
                                                            value={name} 
                                                            onChange={(e) => setName(e.target.value)} 
                                                            className="h-11 rounded-xl font-medium" 
                                                            placeholder="Your Name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-muted-foreground px-1">Email Address (Registry)</Label>
                                                        <Input 
                                                            value={email} 
                                                            disabled 
                                                            className="h-11 rounded-xl opacity-60 font-medium" 
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end pt-4">
                                                        <Button 
                                                            type="submit" 
                                                            disabled={isUpdatingProfile} 
                                                            className="h-11 px-8 rounded-xl font-bold shadow-sm"
                                                        >
                                                            {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                            Save Changes
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        <Card className="border rounded-3xl shadow-sm bg-white/[0.01] flex flex-col group h-full">
                                            <CardHeader className="p-8 pb-4">
                                                <CardTitle className="text-xl font-bold tracking-tight">Security Score</CardTitle>
                                                <CardDescription className="text-sm mt-1">Identity health index</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 pt-0 flex-1 flex flex-col items-center justify-center space-y-8">
                                                <div className="relative h-40 w-40">
                                                   <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                                                      <circle className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                                                      <circle
                                                         className="text-primary transition-all duration-1000 ease-out"
                                                         strokeWidth="6"
                                                         strokeLinecap="round"
                                                         strokeDasharray={264}
                                                         strokeDashoffset={264 - (264 * (mfaEnabled ? 95 : 40)) / 100}
                                                         stroke="currentColor"
                                                         fill="transparent"
                                                         r="42"
                                                         cx="50"
                                                         cy="50"
                                                      />
                                                   </svg>
                                                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                      <span className="text-4xl font-bold text-foreground tracking-tighter">{mfaEnabled ? "95" : "40"}%</span>
                                                   </div>
                                                </div>
                                                <div className="w-full space-y-3">
                                                   <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30">
                                                      <span className="font-semibold text-muted-foreground">MFA Enabled</span>
                                                      {mfaEnabled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <div className="h-2 w-2 rounded-full bg-rose-500" />}
                                                   </div>
                                                   <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30">
                                                      <span className="font-semibold text-muted-foreground">Profile Verified</span>
                                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                   </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="xl:col-span-3 border rounded-3xl bg-muted/5">
                                            <CardContent className="p-8 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-bold">Appearance Resonance</h3>
                                                    <p className="text-sm text-muted-foreground font-medium opacity-70">Synchronize the interface with your visual environment.</p>
                                                </div>
                                                <div className="flex items-center p-1.5 bg-muted/50 rounded-2xl border border-border/50">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setTheme('light')}
                                                        className={cn("h-10 px-6 rounded-xl text-xs font-bold gap-2 transition-all", theme === 'light' ? "bg-white text-black shadow-sm" : "text-muted-foreground")}
                                                    >
                                                        <Globe className="h-3.5 w-3.5" /> Light
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setTheme('dark')}
                                                        className={cn("h-10 px-6 rounded-xl text-xs font-bold gap-2 transition-all", theme === 'dark' ? "bg-white text-black shadow-sm" : "text-muted-foreground")}
                                                    >
                                                        <Monitor className="h-3.5 w-3.5" /> Dark
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="space-y-8">
                                        <Card className="border rounded-3xl overflow-hidden shadow-sm bg-white/[0.02]">
                                            <CardHeader className="p-8 flex flex-row items-center justify-between border-b bg-muted/10">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-2xl font-bold tracking-tight">Two-Factor Authentication</CardTitle>
                                                    <CardDescription className="text-base text-muted-foreground">Multi-layered account protection.</CardDescription>
                                                </div>
                                                <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[9px]", mfaEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground")}>
                                                   {mfaEnabled ? "PROTECTED" : "UNPROTECTED"}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="p-8">
                                                <div className="flex items-center justify-between p-8 rounded-2xl border bg-muted/5 group/mfa hover:border-border transition-all">
                                                   <div className="flex items-start gap-6">
                                                      <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center shadow-sm">
                                                         <Smartphone className="h-6 w-6 text-muted-foreground" />
                                                      </div>
                                                      <div className="space-y-1 pt-1">
                                                         <h4 className="text-lg font-bold">Authenticator Application</h4>
                                                         <p className="text-sm text-muted-foreground max-w-xl font-medium leading-relaxed italic">Provisioning 6-digit cryptographic security tokens (TOTP).</p>
                                                      </div>
                                                   </div>
                                                   <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} disabled={isUpdatingSecurity} className="data-[state=checked]:bg-emerald-500" />
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border rounded-3xl shadow-sm overflow-hidden">
                                            <CardHeader className="p-8 border-b bg-muted/10">
                                                <CardTitle className="text-2xl font-bold tracking-tight">Active Hardware Sessions</CardTitle>
                                                <CardDescription className="text-base text-muted-foreground">Identities currently logged in across the Xtra matrix.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y divide-border">
                                                    {(user?.sessions || [1, 2]).map((s: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-8 hover:bg-muted/5 transition-all">
                                                            <div className="flex items-center gap-6">
                                                                <div className="h-12 w-12 rounded-xl bg-muted/30 border flex items-center justify-center shadow-sm">
                                                                    <Laptop className="h-6 w-6 text-muted-foreground" />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-3">
                                                                       <span className="text-lg font-bold text-foreground leading-none">{i === 0 ? "Windows Workstation" : "MacBook Pro"}</span>
                                                                       {i === 0 && <Badge variant="secondary" className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest text-emerald-600 bg-emerald-500/5 border-none">Current Session</Badge>}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                                       <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 opacity-60" /> 192.168.1.{100+i}</span>
                                                                       <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-60" /> London, UK</span>
                                                                       <span className="flex items-center gap-1.5"><History className="h-3 w-3 opacity-60" /> Active now</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="h-9 px-5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 hover:text-rose-600">
                                                                Force Revoke
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div className="space-y-8">
                                        <Card className="border rounded-3xl overflow-hidden glassmorphism shadow-sm">
                                            <CardHeader className="p-8 border-b bg-muted/10">
                                                <CardTitle className="text-2xl font-bold tracking-tight">Signal Configuration</CardTitle>
                                                <CardDescription className="text-base text-muted-foreground">Alert lifecycle for security and system events.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-8">
                                                <NotificationItemBasic 
                                                  id="n1" 
                                                  label="Critical Security Pulse" 
                                                  desc="Fingerprint updates, unauthorized logins, and hardware environment drift." 
                                                  defaultChecked 
                                                  icon={ShieldCheck}
                                                  color="text-rose-500"
                                                />
                                                <Separator />
                                                <NotificationItemBasic 
                                                  id="n2" 
                                                  label="Identity Rotation Logs" 
                                                  desc="Weekly crystalline snapshots of your rotation engine and health index." 
                                                  icon={Zap}
                                                  color="text-amber-500"
                                                />
                                                <Separator />
                                                <NotificationItemBasic 
                                                  id="n3" 
                                                  label="Registry Protocol Updates" 
                                                  desc="Lifecycle news about Xtra-CLI engine patches and core primitive releases." 
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
                                    <div className="space-y-12">
                                        <Card className="border rounded-3xl overflow-hidden shadow-sm bg-white/[0.02]">
                                            <CardHeader className="p-8 border-b bg-muted/10">
                                                <CardTitle className="text-2xl font-bold tracking-tight">Identity Matrix</CardTitle>
                                                <CardDescription className="text-base text-muted-foreground">Global identifiers and designation settings.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-8 space-y-10">
                                                <div className="p-8 rounded-2xl bg-muted/30 border border-dashed flex items-center justify-between group/ws transition-all">
                                                   <div className="flex items-center gap-6">
                                                      <div className="h-14 w-14 rounded-2xl bg-background border flex items-center justify-center shadow-sm group-hover/ws:border-primary/50 transition-colors">
                                                         <Key className="h-7 w-7 text-muted-foreground opacity-40 group-hover/ws:text-primary transition-colors" />
                                                      </div>
                                                      <div className="flex flex-col gap-1">
                                                         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Matrix Identifier</span>
                                                         <span className="text-sm font-mono font-bold tracking-wider">{selectedWorkspace?.id}</span>
                                                      </div>
                                                   </div>
                                                   <Button variant="ghost" size="sm" onClick={copyWorkspaceId} className="h-10 px-5 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95">
                                                      <Copy className="h-4 w-4" /> Copy ID
                                                   </Button>
                                                </div>

                                                <form onSubmit={handleWorkspaceUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-muted-foreground px-1">Designation Name</Label>
                                                        <Input 
                                                            value={workspaceName} 
                                                            onChange={(e) => setWorkspaceName(e.target.value)} 
                                                            required 
                                                            className="h-12 rounded-xl font-medium" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-muted-foreground px-1">Visual Branding</Label>
                                                        <Input
                                                            value={workspaceIcon}
                                                            onChange={(e) => setWorkspaceIcon(e.target.value)}
                                                            placeholder="Emoji or URL"
                                                            className="h-12 rounded-xl font-medium"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end">
                                                        <Button 
                                                            type="submit" 
                                                            disabled={isUpdatingWorkspace} 
                                                            className="h-12 px-10 rounded-xl font-bold shadow-sm"
                                                        >
                                                            {isUpdatingWorkspace && <Loader2 className="mr-3 h-4 w-4 animate-spin" />}
                                                            Commit Changes
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="border-rose-500/20 bg-rose-500/5 rounded-3xl overflow-hidden glassmorphism group">
                                           <CardHeader className="p-8 border-b border-rose-500/10 bg-rose-500/5">
                                              <CardTitle className="text-2xl font-bold tracking-tight text-rose-500">Danger Operations</CardTitle>
                                              <CardDescription className="text-base text-rose-400/80 font-medium italic">Irreversible system blackout actions.</CardDescription>
                                           </CardHeader>
                                           <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                              <p className="text-sm text-rose-300 font-medium leading-relaxed max-w-xl">
                                                Destroying a workspace will permanently vaporize all secrets, encryption branches, and cryptographically signed audit logs. There is no recovery.
                                              </p>
                                              <Button variant="destructive" className="h-12 px-10 font-bold rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-900/10 active:scale-95 transition-all">Blackout Workspace</Button>
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

function NotificationItemBasic({ id, label, desc, defaultChecked = false, icon: Icon, color }: any) {
    return (
        <div className="flex items-center justify-between gap-8 group">
            <div className="flex items-start gap-6">
               <div className={cn("h-12 w-12 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500", color)}>
                  <Icon className="h-6 w-6" />
               </div>
               <div className="space-y-1 pt-0.5">
                  <Label htmlFor={id} className="text-lg font-bold block leading-none">{label}</Label>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm">{desc}</p>
               </div>
            </div>
            <Switch id={id} defaultChecked={defaultChecked} className="data-[state=checked]:bg-emerald-500" />
        </div>
    );
}
