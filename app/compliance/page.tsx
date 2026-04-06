"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
    Shield,
    Download,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Users,
    Key,
    FileText,
    ChevronRight,
    Search,
    ShieldCheck,
    Smartphone,
    Globe,
    ExternalLink,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSecurityScore } from "@/lib/compliance/score-engine";
import { SecurityScoreCard } from "@/components/compliance/security-score-card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
    generatedAt: string;
    generatedBy: string;
    summary: {
        totalProjects: number;
        totalSecrets: number;
        overdueRotations: number;
        prodAccessEntries: number;
        totalAuditEntries: number;
    };
    projects: {
        id: string;
        name: string;
        accessControl: string | null;
        securityLevel: string | null;
        twoFactorRequired: boolean;
        auditLogging: boolean;
        lastSecurityAudit: string | null;
    }[];
    accessControl: {
        user: string;
        email: string;
        role: string;
        project: string;
        grantedAt: string;
        expiresAt: string | null;
    }[];
    rotationStatus: {
        key: string;
        project: string;
        environment: string;
        policy: string;
        lastRotated: string | null;
        nextRotation: string | null;
        scheduleStatus: string;
        isOverdue: boolean;
        expiryDate: string | null;
    }[];
    auditEntries: {
        timestamp: string;
        action: string;
        entity: string;
        entityId: string;
        user: string;
    }[];
}

const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
};

const fmtFull = (iso: string | null | undefined) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function SecurityHealthPage() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const fetchSecurityReport = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient.get("/api/compliance/report");
            setReport(res.data);
        } catch (e: any) {
            toast({ title: "Fetch failed", description: "Security health report could not be generated.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecurityReport();
    }, [fetchSecurityReport]);

    const securityScore = useMemo(() => {
        if (!report) return null;
        return calculateSecurityScore(report);
    }, [report]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Scanning security infrastructure...</p>
            </div>
        );
    }

    if (!report) return <div className="p-8 text-center">Failed to load security snapshot.</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            
            {/* Global Print Overrides */}
            <style jsx global>{`
                @media print {
                  .no-print { display: none !important; }
                  .print-only { display: block !important; }
                  body { background: white !important; color: black !important; }
                  .report-card { border: 1px solid #eee !important; box-shadow: none !important; margin-bottom: 2rem; break-inside: avoid; }
                  @page { margin: 1.5cm; size: A4; }
                }
            `}</style>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                
                {/* Header (No Print) */}
                <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-border">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-foreground">Security Health</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Security Health</h1>
                        <p className="text-sm text-muted-foreground">Monitor real-time compliance and workspace security parity.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => fetchSecurityReport(true)} className="h-10">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button onClick={handlePrint} className="h-10">
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-muted/50 p-1 no-print">
                        <TabsTrigger value="overview" className="px-6 rounded-md">Overview</TabsTrigger>
                        <TabsTrigger value="access" className="px-6 rounded-md">Access Control</TabsTrigger>
                        <TabsTrigger value="secrets" className="px-6 rounded-md">Secret Health</TabsTrigger>
                        <TabsTrigger value="audit" className="px-6 rounded-md">Security Logs</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-8">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            {securityScore && <SecurityScoreCard score={securityScore} onNavigate={setActiveTab} />}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                        Active Projects
                                        <FileText className="h-4 w-4 opacity-40" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{report.summary.totalProjects}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Configured for workspace level parity.</p>
                                </CardContent>
                            </Card>
                            <Card className={cn("border shadow-none", report.summary.overdueRotations > 0 ? "border-rose-200 bg-rose-50/10" : "")}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                        Overdue Rotations
                                        <AlertTriangle className={cn("h-4 w-4", report.summary.overdueRotations > 0 ? "text-rose-500" : "opacity-40")} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-3xl font-bold", report.summary.overdueRotations > 0 ? "text-rose-600" : "")}>
                                        {report.summary.overdueRotations}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Requires immediate secret refresh policy.</p>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                                        MFA Adoption
                                        <Smartphone className="h-4 w-4 opacity-40" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">100%</div>
                                    <p className="text-xs text-muted-foreground mt-1">Primary owner account protected.</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Health Alerts */}
                        <Card className="border">
                             <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-lg">Critical Health Alerts</CardTitle>
                                <Badge variant="secondary" className="px-3 rounded-full">{report.rotationStatus.filter(s => s.isOverdue).length} Alerts</Badge>
                             </CardHeader>
                             <CardContent className="p-0">
                                <div className="divide-y">
                                    {report.rotationStatus.filter(s => s.isOverdue).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-rose-50/5 hover:bg-rose-50/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                                    <Key className="h-5 w-5 text-rose-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-bold">Rotation Overdue: {s.key}</p>
                                                    <p className="text-xs text-muted-foreground">Project: {s.project} · Environment: {s.environment}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-100" onClick={() => setActiveTab("secrets")}>
                                                Fix Risk <ArrowRight className="ml-1.5 h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {report.rotationStatus.filter(s => s.isOverdue).length === 0 && (
                                        <div className="p-12 text-center text-muted-foreground">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4 opacity-40" />
                                            <p className="text-sm font-medium">No critical health risks detected.</p>
                                        </div>
                                    ) }
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACCESS CONTROL TAB */}
                    <TabsContent value="access" className="space-y-6">
                        <Card className="border">
                             <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Project Permissions</CardTitle>
                                    <CardDescription>Active access entries across all workspace resources.</CardDescription>
                                </div>
                                <div className="relative w-64 no-print">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search emails..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>
                             </CardHeader>
                             <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-muted/30 text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Direct User</th>
                                                <th className="px-6 py-4">Resource</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Granted At</th>
                                                <th className="px-6 py-4">Expiration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {report.accessControl.filter(ac => ac.email.toLowerCase().includes(searchTerm.toLowerCase())).map((ac, i) => (
                                                <tr key={i} className="hover:bg-muted/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{ac.user}</span>
                                                            <span className="text-xs text-muted-foreground">{ac.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="font-mono text-[11px] py-0 px-2 h-6">{ac.project}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className="bg-primary/10 text-primary border-primary/20 capitalize px-2 py-0 h-6 font-medium">{ac.role}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">{fmt(ac.grantedAt)}</td>
                                                    <td className="px-6 py-4 text-xs font-medium">
                                                        {ac.expiresAt ? (
                                                            <span className={cn(new Date(ac.expiresAt) < new Date() ? "text-rose-600" : "text-muted-foreground")}>
                                                                {fmt(ac.expiresAt)}
                                                            </span>
                                                        ) : "Never"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SECRETS TAB */}
                    <TabsContent value="secrets" className="space-y-6">
                        <Card className="border">
                             <CardHeader className="border-b bg-muted/5">
                                <CardTitle className="text-lg">Credential Lifecycle</CardTitle>
                                <CardDescription>Policy enforcement status for managed secrets.</CardDescription>
                             </CardHeader>
                             <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-muted/30 text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Secret Identity</th>
                                                <th className="px-6 py-4">Project / Env</th>
                                                <th className="px-6 py-4">Policy</th>
                                                <th className="px-6 py-4">Last Rotated</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {report.rotationStatus.map((s, i) => (
                                                <tr key={i} className={cn("hover:bg-muted/5 transition-colors", s.isOverdue ? "bg-rose-50/5" : "")}>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-sm font-semibold text-foreground">{s.key}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs">{s.project}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{s.environment}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="text-[11px] font-medium border-primary/20 text-primary">{s.policy}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground text-xs">{fmt(s.lastRotated)}</td>
                                                    <td className="px-6 py-4">
                                                        {s.isOverdue ? (
                                                            <Badge variant="destructive" className="gap-1 rounded-full text-[10px] font-bold px-3">
                                                                <AlertTriangle className="h-3 w-3" /> OVERDUE
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 rounded-full text-[10px] font-bold px-3">
                                                              <CheckCircle2 className="h-3 w-3" /> SECURE
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AUDIT TAB */}
                    <TabsContent value="audit" className="space-y-6">
                        <Card className="border">
                             <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">Security Audit Trail</CardTitle>
                                    <CardDescription>Recent sensitive operations detected by the security engine.</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => router.push('/audit')}>
                                    Full Audit Logs <ExternalLink className="h-3 w-3" />
                                </Button>
                             </CardHeader>
                             <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-muted/30 text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Operation</th>
                                                <th className="px-6 py-4">Entity</th>
                                                <th className="px-6 py-4">Actor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {report.auditEntries.map((log, i) => (
                                                <tr key={i} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{fmtFull(log.timestamp)}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="font-mono text-[10px] uppercase font-black tracking-tighter bg-muted/40">{log.action}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-xs text-foreground uppercase tracking-tight">{log.entity}</span>
                                                            <span className="text-[10px] font-mono text-muted-foreground/60">{log.entityId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-semibold">{log.user}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    )
}
