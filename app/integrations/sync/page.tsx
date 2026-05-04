"use client";

import React, { useState, useEffect } from "react";
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Database,
  Globe,
  Zap,
  Activity,
  History,
  Info,
  Server,
  Key,
  AlertTriangle,
  Loader2,
  Github,
  Gitlab,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalContext } from "@/hooks/useUser";
import Link from "next/link";
import axios from "axios";

// ── Provider config ───────────────────────────────────────
const PROVIDER_META: Record<string, { icon: any; color: string; darkColor?: string; bg: string; label: string }> = {
  aws:       { icon: Database, color: "#FF9900", bg: "bg-[#FF9900]/10",                     label: "AWS" },
  vercel:    { icon: Globe,    color: "#000000", darkColor: "#ffffff", bg: "bg-neutral-500/10", label: "Vercel" },
  netlify:   { icon: Zap,      color: "#00C7B7", bg: "bg-[#00C7B7]/10",                       label: "Netlify" },
  github:    { icon: Github,   color: "#24292e", darkColor: "#e6edf3", bg: "bg-neutral-500/10", label: "GitHub" },
  gitlab:    { icon: Gitlab,   color: "#E24329", bg: "bg-[#E24329]/10",                       label: "GitLab" },
  heroku:    { icon: Server,   color: "#6762A6", bg: "bg-[#6762A6]/10",                       label: "Heroku" },
  doppler:   { icon: Key,      color: "#6366f1", bg: "bg-[#6366f1]/10",                       label: "Doppler" },
  gcp:       { icon: Cloud,    color: "#4285F4", bg: "bg-[#4285F4]/10",                       label: "Google Cloud" },
  azure:     { icon: Shield,   color: "#0089D6", bg: "bg-[#0089D6]/10",                       label: "Azure" },
  railway:   { icon: Server,   color: "#0B0D0E", darkColor: "#e0e0e0", bg: "bg-neutral-500/10", label: "Railway" },
  bitbucket: { icon: Database, color: "#0052CC", bg: "bg-[#0052CC]/10",                       label: "Bitbucket" },
};

function getMeta(type: string) {
  return PROVIDER_META[type] || { icon: Cloud, color: "#888", bg: "bg-muted", label: type };
}

function useIsDark() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ── Main Page ────────────────────────────────────────────
export default function SyncDashboardPage() {
  const { selectedWorkspace, workspaceRole } = useGlobalContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = require("next/navigation").useRouter();

  useEffect(() => {
    if (workspaceRole === "viewer") {
      router.push("/dashboard");
    }
  }, [workspaceRole, router]);

  const fetchSyncData = async (isRefresh = false) => {
    if (!selectedWorkspace?.id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await axios.get(`/api/integrations/sync/status?workspaceId=${selectedWorkspace.id}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSyncData(); }, [selectedWorkspace]);

  const isDark = useIsDark();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-lg border p-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="flex-1 space-y-1"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-2.5 w-28" /></div>
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-lg border p-4 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-2.5 w-40" /></div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const integrations = data?.integrations || [];
  const history = data?.history || [];
  const summary = data?.summary || { total24h: 0, failed24h: 0, successRate: 100 };
  const connected = integrations.filter((i: any) => i.status === "connected").length;
  const totalSecrets = history.reduce((acc: number, log: any) => acc + (log.metadata?.secretsCount || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        {/* ── Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sync Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Monitor synchronization health across connected providers.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchSyncData(true)} disabled={refreshing} className="gap-1.5 h-8 text-xs">
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link href="/integrations">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3 w-3" /> Add Integration
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Connections"
            value={connected}
            sub={`${integrations.length} total`}
            accent={connected > 0 ? "text-foreground" : "text-muted-foreground"}
          />
          <StatCard
            label="Health"
            value={`${summary.successRate}%`}
            sub={`${summary.total24h} events (24h)`}
            accent={summary.successRate >= 95 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}
          />
          <StatCard
            label="Failures"
            value={summary.failed24h}
            sub="Last 24 hours"
            accent={summary.failed24h > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
          />
          <StatCard
            label="Secrets Synced"
            value={totalSecrets}
            sub="All time"
            accent="text-foreground"
          />
        </div>

        {/* ── Active Integrations ──────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Active Integrations</h2>
            <span className="text-[11px] font-medium text-muted-foreground">{connected} active</span>
          </div>

          {integrations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {integrations.map((provider: any) => {
                const meta = getMeta(provider.type);
                const Icon = meta.icon;
                return (
                  <div key={provider.id} className="rounded-lg border bg-card p-3.5 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <Icon className="h-4 w-4" style={{ color: (isDark && meta.darkColor) ? meta.darkColor : meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[13px] capitalize leading-tight">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">{provider.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {provider.status === "connected" ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <span className="h-1 w-1 rounded-full bg-green-500" />Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Inactive</span>
                        )}
                        {provider.lastSync && (
                          <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
                            {new Date(provider.lastSync).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Cloud className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-medium text-sm">No integrations connected</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Connect a provider to start syncing secrets.</p>
              <Link href="/integrations">
                <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3 w-3" /> Add Integration</Button>
              </Link>
            </div>
          )}
        </div>

        {/* ── Sync History ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            {summary.successRate > 0 && (
              <span className={`text-[11px] font-medium ${summary.successRate >= 95 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                {summary.successRate}% success rate
              </span>
            )}
          </div>

          {history.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="divide-y">
                {history.map((log: any) => {
                  const provType = log.action?.replace("_sync", "").replace("_", "") || "default";
                  const meta = getMeta(provType);
                  const Icon = meta.icon;
                  const isSuccess = log.metadata?.successCount > 0 && (!log.metadata?.failedCount || log.metadata?.failedCount === 0);

                  return (
                    <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <Icon className="h-4 w-4" style={{ color: (isDark && meta.darkColor) ? meta.darkColor : meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[13px] capitalize">{provType} sync</span>
                          <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{log.projectName}</code>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 opacity-40" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" \u00b7 "}
                            {new Date(log.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {log.metadata?.secretsCount || 0} secrets
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSuccess ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                        <Link href={`/projects/${log.projectId}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <History className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-medium text-sm">No sync activity yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Events will appear here after your first sync.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
