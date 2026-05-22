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
import { OtpVerificationModal } from "@/components/settings/OtpVerificationModal";

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

    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

    const handleDeleteWorkspace = async () => {
        if (!selectedWorkspace?.id) return;
        if (!confirm("Are you sure you want to permanently delete this workspace? This action cannot be undone.")) return;
        
        setIsDeletingWorkspace(true);
        try {
            await apiClient.delete(`/api/workspace?id=${selectedWorkspace.id}`);
            toast({ title: "Workspace Deleted", description: "The workspace has been permanently deleted." });
            localStorage.removeItem("selectedWorkspace");
            setTimeout(() => window.location.href = "/dashboard", 1000);
        } catch (error: any) {
            toast({ title: "Error", description: error.response?.data?.error || "Failed to delete workspace.", variant: "destructive" });
        } finally {
            setIsDeletingWorkspace(false);
        }
    };

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

    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [pendingMfaStatus, setPendingMfaStatus] = useState(false);

    const handleSecurityUpdate = async (newMfaStatus: boolean) => {
        setPendingMfaStatus(newMfaStatus);
        setIsUpdatingSecurity(true);
        try {
            await apiClient.post("/api/user/security/send-otp");
            setIsOtpModalOpen(true);
            toast({
                title: "Verification Required",
                description: "Please enter the code sent to your email to confirm."
            });
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to send verification code.", variant: "destructive" });
        } finally {
            setIsUpdatingSecurity(false);
        }
    };

    const handleOtpSuccess = () => {
        setMfaEnabled(pendingMfaStatus);
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
                    <StatusCard icon={Laptop} label="Active Sessions" value={(user?.sessions?.length || 1).toString()} color="text-blue-500" />
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
                <div className="min-h-[400px] pt-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-6"
                        >
                            {activeTab === "general" && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Profile Information</CardTitle>
                                            <CardDescription>Update your personal information and avatar.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                                {/* Avatar */}
                                                <div className="flex flex-col items-center gap-4 pt-2">
                                                    <div className="relative">
                                                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl font-bold text-primary/60 shadow-xl">
                                                            {name.charAt(0) || "U"}
                                                        </div>
                                                        <button className="absolute -bottom-2 -right-2 p-2 bg-background border rounded-lg shadow-sm hover:bg-muted transition-all">
                                                            <Camera className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Form */}
                                                <div className="flex-1 space-y-4 w-full">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Full Name</Label>
                                                            <Input
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Email Address</Label>
                                                            <Input
                                                                value={email}
                                                                disabled
                                                                className="bg-muted/50"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t px-6 py-4 flex justify-end">
                                            <Button
                                                onClick={() => handleProfileUpdate()}
                                                disabled={isUpdatingProfile}
                                                className="font-semibold"
                                            >
                                                {isUpdatingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Save Changes
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <Card className="border-destructive/20 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                            <CardDescription>Log out from your account across all devices.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button variant="destructive" className="font-semibold" onClick={() => logout()}>
                                                <LogOut className="w-4 h-4 mr-2" /> Log Out
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {activeTab === "security" && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Two-Factor Authentication</CardTitle>
                                            <CardDescription>Add an extra layer of security to your account.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex items-center justify-between border-t p-6">
                                            <div className="flex items-center gap-4">
                                                <Badge variant={mfaEnabled ? "default" : "secondary"}>
                                                    {mfaEnabled ? "Active" : "Disabled"}
                                                </Badge>
                                                <p className="text-sm font-medium text-muted-foreground hidden sm:block">
                                                    {mfaEnabled ? "MFA is currently active on your account." : "MFA is disabled. We highly recommend enabling it."}
                                                </p>
                                            </div>
                                            <Switch checked={mfaEnabled} onCheckedChange={handleSecurityUpdate} disabled={isUpdatingSecurity} />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                            <div className="space-y-1">
                                                <CardTitle>Active Hardware Sessions</CardTitle>
                                                <CardDescription>Manage devices currently logged into your account.</CardDescription>
                                            </div>
                                            <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5 hidden sm:flex" onClick={() => logout()}>Revoke All</Button>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="divide-y divide-border border rounded-md">
                                                {(user?.sessions?.length ? user.sessions : [1]).map((s: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-4 group transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                                <Laptop className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm">{i === 0 ? "Current Windows PC" : "MacBook Pro"}</span>
                                                                    {i === 0 && <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 h-4">Current</Badge>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">Local Session • Active now</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                                            if (i === 0) toast({ title: "Cannot Revoke", description: "You cannot revoke your current active session. Use 'Revoke All' to log out.", variant: "destructive" });
                                                        }}>Revoke</Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5 w-full mt-4 sm:hidden" onClick={() => logout()}>Revoke All</Button>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {activeTab === "notifications" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Notification Preferences</CardTitle>
                                        <CardDescription>Choose what updates you want to receive.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <SettingsPill label="Critical Alerts" desc="Security breaches, rotation failures, and auth errors." checked />
                                        <SettingsPill label="Usage Snapshots" desc="Weekly crystalline reports of your resource consumption." />
                                        <SettingsPill label="Product Updates" desc="New features, CLI versions, and registry changes." checked />
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "billing" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Billing & Plan</CardTitle>
                                        <CardDescription>Manage your subscription and view usage.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <BillingTab currentTier={(user?.tier || "free") as Tier} />
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "workspace" && (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Workspace Settings</CardTitle>
                                            <CardDescription>Manage your workspace details and branding.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Workspace ID</Label>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 bg-muted border px-3 py-2 rounded-md text-sm font-mono truncate">{selectedWorkspace?.id}</code>
                                                        <Button variant="outline" size="icon" onClick={copyWorkspaceId}>
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Designation Name</Label>
                                                    <Input
                                                        value={workspaceName}
                                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Visual Branding (Emoji/URL)</Label>
                                                    <Input
                                                        value={workspaceIcon}
                                                        onChange={(e) => setWorkspaceIcon(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t px-6 py-4 flex justify-end">
                                            <Button
                                                onClick={() => handleWorkspaceUpdate()}
                                                disabled={isUpdatingWorkspace}
                                                className="font-semibold"
                                            >
                                                {isUpdatingWorkspace && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                Save Workspace
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <Card className="border-destructive/20 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-destructive flex items-center gap-2">
                                                <Shield className="w-5 h-5" /> Danger Zone
                                            </CardTitle>
                                            <CardDescription>
                                                Destroying this workspace will permanently vaporize all secrets and audit logs. This action is irreversible.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isDeletingWorkspace} className="font-semibold">
                                                {isDeletingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" />}
                                                Delete Workspace
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <OtpVerificationModal 
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onSuccess={handleOtpSuccess}
                mfaEnabled={pendingMfaStatus}
            />
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

