"use client";

import { useState, useEffect, useCallback } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    Shield, AlertTriangle, Activity, Globe, Zap,
    ArrowLeft, RefreshCw, Clock, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
    range: string;
    stats: {
        totalEvents: number;
        anomalyCount: number;
        rateLimitCount: number;
        uniqueIps: number;
    };
    activityTrend: { date: string; events: number; anomalies: number }[];
    topCountries: { country: string; count: number }[];
    recentAnomalies: {
        id: string;
        timestamp: string;
        ipAddress?: string;
        country?: string;
        city?: string;
        endpoint: string;
        method: string;
        statusCode: number;
        riskFactors: string[];
        userEmail?: string;
    }[];
    recentAuditLogs: {
        id: string;
        action: string;
        entity: string;
        entityId: string;
        timestamp: string;
        workspaceId?: string;
    }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function statusColor(code: number) {
    if (code >= 500) return "destructive";
    if (code >= 400) return "secondary";
    return "default";
}

const RANGE_OPTIONS = [
    { label: "24h", value: "24h" },
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    title, value, icon: Icon, description, accent,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    description?: string;
    accent?: string;
}) {
    return (
        <Card className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">{title}</p>
                        <p className={`text-3xl font-bold mt-1 ${accent ?? "text-foreground"}`}>
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl ${accent ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <Icon className={`h-5 w-5 ${accent ?? "text-primary"}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <Icon className="h-10 w-10 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SecurityDashboardPage() {
    const [range, setRange] = useState("7d");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/security/dashboard?range=${range}`);
            if (!res.ok) throw new Error("Failed to load dashboard data");
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/projects">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                                Security Dashboard
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Real-time security monitoring and anomaly detection
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Time range selector */}
                        <div className="flex rounded-lg border border-border overflow-hidden">
                            {RANGE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRange(opt.value)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${range === opt.value
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Events"
                        value={data?.stats.totalEvents ?? "—"}
                        icon={Activity}
                        description={`Last ${range}`}
                    />
                    <StatCard
                        title="Anomalies Detected"
                        value={data?.stats.anomalyCount ?? "—"}
                        icon={AlertTriangle}
                        description="Suspicious activity"
                        accent={data?.stats.anomalyCount ? "text-destructive" : undefined}
                    />
                    <StatCard
                        title="Rate Limit Hits"
                        value={data?.stats.rateLimitCount ?? "—"}
                        icon={Zap}
                        description="Throttled requests"
                    />
                    <StatCard
                        title="Unique IPs"
                        value={data?.stats.uniqueIps ?? "—"}
                        icon={Globe}
                        description="Distinct sources"
                    />
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Activity Trend */}
                    <Card className="lg:col-span-2 bg-gradient-card border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <CardTitle>Activity Over Time</CardTitle>
                            </div>
                            <CardDescription>Events and anomalies per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!data || data.activityTrend.length === 0 ? (
                                <EmptyState icon={Activity} message="No activity data for this period" />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={data.activityTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="events"
                                            name="Events"
                                            stroke="hsl(var(--primary))"
                                            fill="url(#eventsGrad)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="anomalies"
                                            name="Anomalies"
                                            stroke="hsl(var(--destructive))"
                                            fill="url(#anomalyGrad)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Countries */}
                    <Card className="bg-gradient-card border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <CardTitle>Access by Location</CardTitle>
                            </div>
                            <CardDescription>Top countries by request count</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!data || data.topCountries.length === 0 ? (
                                <EmptyState icon={Globe} message="No location data available" />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        layout="vertical"
                                        data={data.topCountries}
                                        margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="country"
                                            width={80}
                                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Requests" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Bottom Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Anomaly Alerts */}
                    <Card className="bg-gradient-card border-destructive/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <CardTitle>Recent Anomalies</CardTitle>
                            </div>
                            <CardDescription>Suspicious events requiring attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!data || data.recentAnomalies.length === 0 ? (
                                <EmptyState icon={Shield} message="No anomalies detected — all clear!" />
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {data.recentAnomalies.map((evt) => (
                                        <div
                                            key={evt.id}
                                            className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-mono font-medium truncate">
                                                        {evt.method} {evt.endpoint}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {evt.ipAddress ?? "Unknown IP"}
                                                        {evt.city ? ` · ${evt.city}` : ""}
                                                        {evt.country ? `, ${evt.country}` : ""}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant={statusColor(evt.statusCode) as any}>
                                                        {evt.statusCode}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {evt.riskFactors.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {evt.riskFactors.map((rf) => (
                                                        <Badge key={rf} variant="outline" className="text-xs border-destructive/40 text-destructive">
                                                            {rf}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">{formatTime(evt.timestamp)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Audit Log */}
                    <Card className="bg-gradient-card border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <CardTitle>Recent Audit Log</CardTitle>
                            </div>
                            <CardDescription>Your recent account activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!data || data.recentAuditLogs.length === 0 ? (
                                <EmptyState icon={Clock} message="No audit events recorded yet" />
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {data.recentAuditLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs font-mono shrink-0">
                                                        {log.action}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground truncate">
                                                        {log.entity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatTime(log.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
