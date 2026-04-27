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
    Fingerprint,
    Sun,
    Moon,
    Search
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { BillingTab } from "./billing-tab";
import { Tier } from "@/lib/rate-limit-config";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/axios";
import { logout } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = "general" | "security" | "notifications" | "billing" | "workspace";

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

    const handleProfileUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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

    const handleWorkspaceUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-6xl mx-auto space-y-8 p-6">
                    <div className="space-y-2">
                        <div className="h-10 w-48 bg-muted/20 animate-pulse rounded-lg" />
                        <div className="h-4 w-72 bg-muted/10 animate-pulse rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-24 bg-muted/20 animate-pulse rounded-lg" />)}
                    </div>
                    <div className="h-96 w-full bg-muted/5 animate-pulse rounded-xl border" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage your account, security, and workspace preferences.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-9 rounded-lg border-border/60 bg-background/50" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                            Theme
                        </Button>
                        <Button className="h-9 rounded-lg bg-teal-500 hover:bg-teal-600 text-black font-bold px-6">
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* ── Stats Row (Optional) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatusCard icon={Shield} label="Security Score" value={mfaEnabled ? "95%" : "40%"} color={mfaEnabled ? "text-teal-500" : "text-rose-500"} />
                    <StatusCard icon={Laptop} label="Active Sessions" value={(user?.sessions?.length || 2).toString()} color="text-blue-500" />
                    <StatusCard icon={Key} label="Workspace" value={selectedWorkspace?.name || "Personal"} color="text-amber-500" />
                    <StatusCard icon={Zap} label="Current Tier" value={(user?.tier || "Free").toUpperCase()} color="text-purple-500" />
                </div>

                {/* ── Search Bar ── */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input
                        placeholder="Search settings, security, and profile..."
                        className="pl-10 h-10 bg-muted/20 border-border/40 rounded-lg focus-visible:ring-teal-500/30"
                    />
                </div>

                {/* ── Tabs (Pill Style) ── */}
                <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/40 w-fit">
                    {sideNav.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm border border-border/40"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Content Area ── */}
                <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="p-8 space-y-8"
                        >
                            {activeTab === "general" && (
                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row gap-12">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/20 flex items-center justify-center text-3xl font-bold text-teal-500/60 shadow-xl">
                                                    {name.charAt(0) || "U"}
                                                </div>
                                                <button className="absolute -bottom-2 -right-2 p-2 bg-background border border-border/60 rounded-lg shadow-lg hover:bg-muted transition-all">
                                                    <Camera className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avatar</p>
                                        </div>

                                        <div className="flex-1 space-y-6 max-w-2xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground">Full Name</Label>
                                                    <Input
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="bg-muted/10 border-border/40 rounded-lg"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-muted-foreground">Email Address</Label>
                                                    <Input
                                                        value={email}
                                                        disabled
                                                        className="bg-muted/5 border-border/40 rounded-lg opacity-60"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4 flex justify-end border-t border-border/40">
                                                <Button
                                                    onClick={() => handleProfileUpdate()}
                                                    disabled={isUpdatingProfile}
                                                    className="bg-teal-500 hover:bg-teal-600 text-black font-bold h-9 px-6 rounded-lg"
                                                >
                                                    {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Profile"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-border/40">
                                        <Button variant="outline" className="rounded-lg border-rose-500/20 text-rose-500 hover:bg-rose-500/5 h-10 px-6 font-bold" onClick={() => logout()}>
                                            <LogOut className="w-4 h-4 mr-2" /> Log out from all devices
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 rounded-xl border border-border/40 bg-muted/5">
                                        <div className="space-y-1">
                                            <h4 className="font-bold">Two-Factor Authentication</h4>
                                            <p className="text-sm text-muted-foreground font-medium">Add an extra layer of security to your account.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", mfaEnabled ? "bg-teal-500/10 text-teal-500 border-teal-500/20" : "bg-muted text-muted-foreground")}>
                                                {mfaEnabled ? "Active" : "Disabled"}
                                            </Badge>
                                            <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} disabled={isUpdatingSecurity} className="data-[state=checked]:bg-teal-500" />
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-bold text-lg">Active Hardware Sessions</h4>
                                            <Button variant="ghost" className="text-xs font-bold text-rose-500 h-8">Revoke All</Button>
                                        </div>
                                        <div className="divide-y divide-border/40 border-t border-border/40">
                                            {(user?.sessions || [1, 2]).map((s: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between py-6 group transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-lg bg-muted/20 border border-border/40 flex items-center justify-center">
                                                            <Laptop className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{i === 0 ? "Current Windows PC" : "MacBook Pro"}</span>
                                                                {i === 0 && <Badge className="bg-teal-500/10 text-teal-500 border-none text-[8px] font-black tracking-widest px-1.5 h-4">CURRENT</Badge>}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-medium">192.168.1.{100 + i} • London, UK • 2 mins ago</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" className="h-8 text-[10px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/5">Revoke</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-4">
                                    <SettingsPill label="Critical Alerts" desc="Security breaches, rotation failures, and auth errors." checked />
                                    <SettingsPill label="Usage Snapshots" desc="Weekly crystalline reports of your resource consumption." />
                                    <SettingsPill label="Product Updates" desc="New features, CLI versions, and registry changes." checked />
                                </div>
                            )}

                            {activeTab === "billing" && (
                                <div className="pt-4">
                                    <BillingTab currentTier={(user?.tier || "free") as Tier} />
                                </div>
                            )}

                            {activeTab === "workspace" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-muted-foreground">Workspace ID</Label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-muted/20 border border-border/40 px-3 py-2 rounded-lg text-sm font-mono truncate">{selectedWorkspace?.id}</code>
                                                    <Button variant="ghost" size="icon" onClick={copyWorkspaceId} className="h-9 w-9 border border-border/40 bg-muted/10">
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-muted-foreground">Designation Name</Label>
                                                <Input
                                                    value={workspaceName}
                                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                                    className="bg-muted/10 border-border/40 rounded-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-muted-foreground">Visual Branding (Emoji/URL)</Label>
                                                <Input
                                                    value={workspaceIcon}
                                                    onChange={(e) => setWorkspaceIcon(e.target.value)}
                                                    className="bg-muted/10 border-border/40 rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-4 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-rose-500">
                                                    <Shield className="w-5 h-5" />
                                                    <h4 className="font-bold">Danger Zone</h4>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed">Destroying this workspace will permanently vaporize all secrets and audit logs. This action is irreversible.</p>
                                            </div>
                                            <Button variant="destructive" className="w-full h-11 font-bold rounded-lg bg-rose-600 hover:bg-rose-700">Delete Workspace</Button>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-end border-t border-border/40">
                                        <Button
                                            onClick={() => handleWorkspaceUpdate()}
                                            disabled={isUpdatingWorkspace}
                                            className="bg-teal-500 hover:bg-teal-600 text-black font-bold h-9 px-6 rounded-lg"
                                        >
                                            {isUpdatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Workspace"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="p-5 rounded-xl border border-border/40 bg-card/20 space-y-4 group hover:bg-card/40 transition-all">
            <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4", color)} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
        </div>
    );
}

function SettingsPill({ label, desc, checked = false }: any) {
    return (
        <div className="flex items-center justify-between p-5 rounded-xl border border-border/40 bg-muted/5 group hover:bg-muted/10 transition-all">
            <div className="space-y-1">
                <h4 className="font-bold text-sm">{label}</h4>
                <p className="text-xs text-muted-foreground font-medium">{desc}</p>
            </div>
            <Switch defaultChecked={checked} className="data-[state=checked]:bg-teal-500" />
        </div>
    );
}

