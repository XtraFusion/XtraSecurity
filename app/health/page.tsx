"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Key,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Zap,
  Lock,
  GitBranch,
  ExternalLink,
  Loader2,
  Activity,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalContext } from "@/hooks/useUser";
import Link from "next/link";
import axios from "axios";

// ── Main Page ─────────────────────────────────────────────
export default function SecurityHealthPage() {
  const { selectedWorkspace } = useGlobalContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async (isRefresh = false) => {
    if (!selectedWorkspace?.id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await axios.get(`/api/secret/health?workspaceId=${selectedWorkspace.id}`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch health data:", err);
      setError("Failed to load security metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHealth(); }, [selectedWorkspace]);

  // ── Skeleton ────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border p-6 flex flex-col items-center space-y-4">
              <Skeleton className="h-36 w-36 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2].map(i => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                {[1,2,3].map(j => <Skeleton key={j} className="h-12 w-full rounded" />)}
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ───────────────────────────────────────
  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl">
          <div className="rounded-lg border border-dashed p-16 text-center">
            <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-sm">Failed to load health data</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{error || "No data available."}</p>
            <Button size="sm" variant="outline" onClick={() => fetchHealth()} className="gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const score = data.securityScore;
  const scoreColor = score >= 80 ? "text-green-600 dark:text-green-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 50 ? "Needs Attention" : "Critical";
  const scoreBg = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const autoRotPct = data.total > 0 ? Math.round((data.autoRotationCount / data.total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        {/* ── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Health</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Posture analysis for <span className="font-medium text-foreground">{selectedWorkspace?.label}</span>.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchHealth(true)} disabled={refreshing} className="gap-1.5 h-8 text-xs">
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* ── Score + Metrics ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score gauge */}
          <div className="rounded-lg border bg-card p-6 flex flex-col items-center text-center">
            <div className="relative h-36 w-36 mb-4">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" className="text-muted/30" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="currentColor"
                  className={scoreBg}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 251} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold tracking-tight ${scoreColor}`}>{score}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">/ 100</span>
              </div>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${scoreBg}/10 ${scoreColor}`}>{scoreLabel}</span>
            <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">Based on rotation frequency, key uniqueness, and environmental parity.</p>
          </div>

          {/* Metric cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatCard label="Stale Secrets" value={data.staleCount} sub="Not rotated in 90+ days" warn={data.staleCount > 0} />
            <StatCard label="Key Duplication" value={data.duplicateCount} sub="Keys reused across projects" warn={data.duplicateCount > 0} />
            <StatCard label="Auto-Rotation" value={`${autoRotPct}%`} sub="Adoption across environments" />
            <StatCard label="Env. Drift" value={data.environmentalDrift?.length || 0} sub="Staging ↔ Production gaps" warn={(data.environmentalDrift?.length || 0) > 0} />
          </div>
        </div>

        {/* ── Bottom grid ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Critical fixes */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Critical Actions</p>
                <p className="text-xs text-muted-foreground">Recommendations to improve your score.</p>
              </div>
              {(data.criticalFixes?.length || 0) > 0 && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {data.criticalFixes.length} issues
                </span>
              )}
            </div>
            <div className="divide-y">
              {data.criticalFixes?.length > 0 ? data.criticalFixes.map((fix: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors">
                  <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                    fix.type === "stale" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                    fix.type === "duplicate" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>
                    {fix.type === "stale" ? <Clock className="h-3.5 w-3.5" /> :
                     fix.type === "duplicate" ? <Key className="h-3.5 w-3.5" /> :
                     <ShieldAlert className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[13px] font-medium truncate">{fix.key}</code>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fix.projectName}</code>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {fix.type === "stale" ? `Not rotated in ${fix.daysOld}d` :
                       fix.type === "duplicate" ? `Reused in ${fix.count} projects` : fix.description}
                    </p>
                  </div>
                  <Link href={`/projects/${fix.projectId}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )) : (
                <div className="p-10 text-center">
                  <ShieldCheck className="h-6 w-6 mx-auto text-green-500/50 mb-2" />
                  <p className="text-sm font-medium">No critical issues</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your workspace follows best practices.</p>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines + info */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">Security Guidelines</p>
              </div>
              <div className="p-4 space-y-4">
                <Guideline title="Rotate secrets every 90 days" desc="Reduces the window of opportunity for leaked credentials." />
                <Guideline title="Enable auto-rotation" desc="Link rotation policies to your integrations (AWS, Doppler, GCP)." />
                <Guideline title="Eliminate environment drift" desc="Ensure staging and production configurations match." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="h-7 w-7 rounded-md bg-green-500/10 flex items-center justify-center mb-3">
                  <Lock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-bold">ZKP</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Encryption Standard</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center mb-3">
                  <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold">Live</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Posture Scanning</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, sub, warn }: { label: string; value: string | number; sub: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${warn ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

// ── Guideline row ─────────────────────────────────────────
function Guideline({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-3 w-3 text-primary" />
      </div>
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
