"use client";

import { useState, useCallback } from "react";
import {
    Shield, Download, RefreshCw, ArrowLeft,
    CheckCircle, AlertTriangle, Clock, Users, Key, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
}

function fmtFull(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, count }: {
    icon: React.ElementType; title: string; count?: number;
}) {
    return (
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border print:border-gray-300">
            <div className="p-2 bg-primary/10 rounded-lg print:bg-gray-100">
                <Icon className="h-5 w-5 text-primary print:text-gray-700" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
            {count !== undefined && (
                <Badge variant="secondary" className="ml-auto">{count} items</Badge>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompliancePage() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/compliance/report");
            if (!res.ok) throw new Error("Failed to generate report");
            setReport(await res.json());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadPdf = () => window.print();

    return (
        <>
            {/* ── Print Styles (injected inline so no extra CSS file needed) ── */}
            <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .report-page { padding: 0 !important; max-width: 100% !important; }
          .report-card {
            border: 1px solid #e5e7eb !important;
            background: white !important;
            box-shadow: none !important;
            break-inside: avoid;
            margin-bottom: 1.5rem;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 10px; font-size: 11px; }
          th { background: #f9fafb; font-weight: 600; }
          @page { margin: 1.5cm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

            <div className="min-h-screen bg-background">
                <div className="max-w-5xl mx-auto px-4 py-8 report-page">

                    {/* ── Header (screen only) ── */}
                    <div className="no-print">
                        <div className="flex items-center gap-4 mb-6">
                            <Link href="/projects">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                                    Compliance Report
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Generate SOC2 / GDPR audit reports for your workspace
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={generateReport} disabled={loading} className="gap-2">
                                    {loading
                                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                                        : <FileText className="h-4 w-4" />}
                                    {loading ? "Generating…" : "Generate Report"}
                                </Button>
                                {report && (
                                    <Button variant="outline" onClick={downloadPdf} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {!report && !loading && (
                            <Card className="bg-gradient-card border-primary/20">
                                <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                    <Shield className="h-16 w-16 opacity-20" />
                                    <p className="text-lg font-medium">No report generated yet</p>
                                    <p className="text-sm">Click "Generate Report" to create a compliance snapshot</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Report Content (shown after generation, also printed) ── */}
                    {report && (
                        <div className="space-y-8">

                            {/* Cover */}
                            <div className="report-card rounded-xl border border-primary/20 bg-gradient-card p-8">
                                {/* Print-only header */}
                                <div className="print-only mb-6">
                                    <h1 className="text-2xl font-bold">XtraSecurity — Compliance Report</h1>
                                </div>
                                <div className="flex items-start justify-between flex-wrap gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4 no-print">
                                            <div className="p-3 bg-primary/10 rounded-xl">
                                                <Shield className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">Security Compliance Report</h2>
                                                <p className="text-muted-foreground text-sm">XtraSecurity Platform</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p><span className="font-medium text-foreground">Generated:</span> {fmtFull(report.generatedAt)}</p>
                                            <p><span className="font-medium text-foreground">Prepared by:</span> {report.generatedBy}</p>
                                        </div>
                                    </div>
                                    {/* Summary stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { label: "Projects", value: report.summary.totalProjects, icon: FileText },
                                            { label: "Secrets", value: report.summary.totalSecrets, icon: Key },
                                            { label: "Overdue Rotations", value: report.summary.overdueRotations, icon: AlertTriangle, warn: report.summary.overdueRotations > 0 },
                                            { label: "Access Entries", value: report.summary.prodAccessEntries, icon: Users },
                                            { label: "Audit Events", value: report.summary.totalAuditEntries, icon: Clock },
                                        ].map(({ label, value, icon: Icon, warn }) => (
                                            <div key={label} className={`p-3 rounded-lg border text-center ${warn ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"}`}>
                                                <Icon className={`h-4 w-4 mx-auto mb-1 ${warn ? "text-destructive" : "text-muted-foreground"}`} />
                                                <p className={`text-xl font-bold ${warn ? "text-destructive" : ""}`}>{value}</p>
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Projects */}
                            <div className="report-card rounded-xl border border-primary/20 bg-gradient-card p-6">
                                <SectionHeading icon={FileText} title="Project Security Configuration" count={report.projects.length} />
                                {report.projects.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No projects found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {["Project", "Access", "Security Level", "2FA Required", "Audit Logging", "Last Audit"].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.projects.map((p) => (
                                                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="py-2 px-3 font-medium">{p.name}</td>
                                                        <td className="py-2 px-3">
                                                            <Badge variant="outline" className="text-xs">{p.accessControl ?? "private"}</Badge>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <Badge variant={p.securityLevel === "high" ? "destructive" : "secondary"} className="text-xs">
                                                                {p.securityLevel ?? "low"}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {p.twoFactorRequired
                                                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                                : <span className="text-muted-foreground">—</span>}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {p.auditLogging
                                                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                                                : <span className="text-muted-foreground">—</span>}
                                                        </td>
                                                        <td className="py-2 px-3 text-muted-foreground text-xs">{fmt(p.lastSecurityAudit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Access Control */}
                            <div className="report-card rounded-xl border border-primary/20 bg-gradient-card p-6">
                                <SectionHeading icon={Users} title="Access Control — Who Has Access" count={report.accessControl.length} />
                                {report.accessControl.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No role assignments found. Users may be using default project access.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {["User", "Email", "Role", "Project", "Granted", "Expires"].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.accessControl.map((ac, i) => (
                                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="py-2 px-3 font-medium">{ac.user}</td>
                                                        <td className="py-2 px-3 text-muted-foreground text-xs">{ac.email}</td>
                                                        <td className="py-2 px-3">
                                                            <Badge variant="outline" className="text-xs">{ac.role}</Badge>
                                                        </td>
                                                        <td className="py-2 px-3">{ac.project}</td>
                                                        <td className="py-2 px-3 text-xs text-muted-foreground">{fmt(ac.grantedAt)}</td>
                                                        <td className="py-2 px-3 text-xs text-muted-foreground">
                                                            {ac.expiresAt ? (
                                                                <span className={new Date(ac.expiresAt) < new Date() ? "text-destructive font-medium" : ""}>
                                                                    {fmt(ac.expiresAt)}
                                                                </span>
                                                            ) : "Never"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Secret Rotation */}
                            <div className="report-card rounded-xl border border-primary/20 bg-gradient-card p-6">
                                <SectionHeading icon={Key} title="Secret Rotation Status" count={report.rotationStatus.length} />
                                {report.rotationStatus.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No secrets found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {["Secret Key", "Project", "Env", "Policy", "Last Rotated", "Next Rotation", "Status"].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.rotationStatus.map((s, i) => (
                                                    <tr key={i} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${s.isOverdue ? "bg-destructive/5" : ""}`}>
                                                        <td className="py-2 px-3 font-mono font-medium text-xs">{s.key}</td>
                                                        <td className="py-2 px-3 text-xs">{s.project}</td>
                                                        <td className="py-2 px-3">
                                                            <Badge variant="outline" className="text-xs">{s.environment}</Badge>
                                                        </td>
                                                        <td className="py-2 px-3 text-xs text-muted-foreground">{s.policy}</td>
                                                        <td className="py-2 px-3 text-xs text-muted-foreground">{fmt(s.lastRotated)}</td>
                                                        <td className="py-2 px-3 text-xs">
                                                            {s.nextRotation ? (
                                                                <span className={s.isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                                                    {fmt(s.nextRotation)}
                                                                </span>
                                                            ) : "—"}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {s.isOverdue ? (
                                                                <Badge variant="destructive" className="text-xs gap-1">
                                                                    <AlertTriangle className="h-3 w-3" />Overdue
                                                                </Badge>
                                                            ) : s.scheduleStatus === "active" ? (
                                                                <Badge className="text-xs bg-green-500/20 text-green-600 border-green-500/30">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">{s.scheduleStatus}</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Audit Log */}
                            <div className="report-card rounded-xl border border-primary/20 bg-gradient-card p-6">
                                <SectionHeading icon={Clock} title="Admin Actions Audit Log" count={report.auditEntries.length} />
                                {report.auditEntries.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No audit entries found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    {["Timestamp", "Action", "Entity", "Entity ID", "User"].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.auditEntries.map((entry, i) => (
                                                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                        <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">{fmtFull(entry.timestamp)}</td>
                                                        <td className="py-2 px-3">
                                                            <Badge variant="outline" className="text-xs font-mono">{entry.action}</Badge>
                                                        </td>
                                                        <td className="py-2 px-3 text-xs">{entry.entity}</td>
                                                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{entry.entityId}</td>
                                                        <td className="py-2 px-3 text-xs">{entry.user}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
                                Report generated by XtraSecurity · {fmtFull(report.generatedAt)} · Confidential
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
