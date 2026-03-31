"use client";

import React, { useState, useEffect } from "react";
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Globe,
  Zap,
  Activity,
  History,
  Info,
  Server,
  Key,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List as ListIcon,
  Github,
  Gitlab
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGlobalContext } from "@/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import axios from "axios";

// --- Components ---

const PROVIDER_ICONS: Record<string, any> = {
  aws: Database,
  vercel: Globe,
  netlify: Zap,
  github: Github,
  gitlab: Gitlab,
  heroku: Server,
  doppler: Key,
  gcp: Cloud,
  default: Cloud
};

const PROVIDER_COLORS: Record<string, string> = {
  aws: "text-[#FF9900]",
  vercel: "text-[#111111] dark:text-white",
  netlify: "text-[#00C7B7]",
  github: "text-[#24292e] dark:text-white",
  gitlab: "text-[#E24329]",
  heroku: "text-[#430098]",
  doppler: "text-[#1C63ED]",
  default: "text-[#00CBE7]"
};

const PROVIDER_BG: Record<string, string> = {
  aws: "bg-[#FF9900]/10 border-[#FF9900]/20",
  vercel: "bg-black/10 border-black/20 dark:bg-white/10 dark:border-white/20",
  netlify: "bg-[#00C7B7]/10 border-[#00C7B7]/20",
  github: "bg-[#24292e]/10 border-[#24292e]/20 dark:bg-white/10 dark:border-white/20",
  gitlab: "bg-[#E24329]/10 border-[#E24329]/20",
  heroku: "bg-[#430098]/10 border-[#430098]/20",
  doppler: "bg-[#1C63ED]/10 border-[#1C63ED]/20",
  default: "bg-[#00CBE7]/10 border-[#00CBE7]/20"
};

const ProviderCard = ({ provider }: any) => {
  const Icon = PROVIDER_ICONS[provider.type] || PROVIDER_ICONS.default;
  const colorClass = PROVIDER_COLORS[provider.type] || PROVIDER_COLORS.default;
  const bgClass = PROVIDER_BG[provider.type] || PROVIDER_BG.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden relative group hover:shadow-xl hover:shadow-primary/5 transition-all">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 ${bgClass.split(' ')[0]}`} />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border shadow-sm transition-transform group-hover:scale-110 duration-500 ${bgClass} ${colorClass}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg tracking-tight capitalize">{provider.type}</h4>
                  {provider.enabled && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1 opacity-70 truncate max-w-[150px]">{provider.name}</p>
              </div>
            </div>
            <div className="text-right">
               <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2 ${provider.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                 {provider.status}
               </div>
               <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-end gap-1.5">
                 <Clock className="h-3 w-3 opacity-50" />
                 {provider.lastSync ? new Date(provider.lastSync).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never'}
               </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SyncLogItem = ({ log }: any) => {
  const Icon = PROVIDER_ICONS[log.action.replace("_sync", "")] || PROVIDER_ICONS.default;
  const colorClass = PROVIDER_COLORS[log.action.replace("_sync", "")] || PROVIDER_COLORS.default;
  const bgClass = PROVIDER_BG[log.action.replace("_sync", "")] || PROVIDER_BG.default;
  const isSuccess = log.metadata?.successCount > 0 && (!log.metadata?.failedCount || log.metadata?.failedCount === 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-5 rounded-2xl border border-border/40 hover:bg-muted/40 hover:border-border transition-all group"
    >
      <div className="flex items-center gap-5">
        <div className={`p-3 rounded-xl border shadow-sm transition-all group-hover:rotate-6 ${bgClass} ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-tight capitalize">{log.action.replace("_sync", "").replace("_", " ")} Sync</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50 uppercase">{log.projectName}</span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
               <Clock className="h-3.5 w-3.5 opacity-40" />
               {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               <span className="mx-1 opacity-20">|</span>
               {new Date(log.timestamp).toLocaleDateString()}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
               <Zap className="h-3.5 w-3.5 text-amber-500" />
               <span className="text-foreground">{log.metadata?.secretsCount || 0}</span> secrets
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="hidden sm:block">
           {isSuccess ? (
             <div className="flex items-center gap-2 text-emerald-500 font-bold text-[11px] uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
               <CheckCircle2 className="h-3.5 w-3.5" />
               Success
             </div>
           ) : (
             <div className="flex items-center gap-2 text-red-500 font-bold text-[11px] uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-full border border-red-500/10">
               <XCircle className="h-3.5 w-3.5" />
               Failed
             </div>
           )}
        </div>
        <Link href={`/projects/${log.projectId}`}>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

// --- Main Page ---

export default function SyncDashboardPage() {
  const { selectedWorkspace } = useGlobalContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncData = async () => {
    if (!selectedWorkspace?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/integrations/sync/status?workspaceId=${selectedWorkspace.id}`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch sync status:", err);
      setError("Failed to load global sync data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, [selectedWorkspace]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1 uppercase tracking-wider">
              <Activity className="h-4 w-4" />
              Live Deployment Status
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Sync Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Monitor secret synchronization health across connected cloud providers.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchSyncData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Refresh
            </Button>
            <Link href="/integrations">
              <Button className="shadow-lg shadow-primary/20">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Integration
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 via-primary/[0.02] to-transparent relative overflow-hidden group rounded-3xl backdrop-blur-sm">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <CardContent className="p-7 relative z-10">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Connections</p>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <h3 className="text-4xl font-extrabold tracking-tight">{data.integrations.length}</h3>
                  <p className="text-xs text-muted-foreground font-medium">Cloud Providers</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Cloud className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <span>Health</span>
                  <span>{Math.round((data.integrations.filter((i: any) => i.status === 'connected').length / (data.integrations.length || 1)) * 100)}%</span>
                </div>
                <Progress value={(data.integrations.filter((i: any) => i.status === 'connected').length / (data.integrations.length || 1)) * 100} className="h-1.5 bg-primary/10" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 relative overflow-hidden group rounded-3xl backdrop-blur-sm">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <CardContent className="p-7 relative z-10">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Success</p>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <h3 className={`text-4xl font-extrabold tracking-tight ${data.summary.successRate >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {data.summary.successRate}%
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">24h Health Rate</p>
                </div>
                <div className={`p-3.5 rounded-2xl shadow-lg ${data.summary.successRate >= 95 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6">
                 <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   {data.summary.total24h} Total Events
                 </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 relative overflow-hidden group rounded-3xl backdrop-blur-sm">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <CardContent className="p-7 relative z-10">
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Anomalies</p>
               <div className="flex items-end justify-between">
                 <div className="space-y-1">
                   <h3 className={`text-4xl font-extrabold tracking-tight ${data.summary.failed24h > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                     {data.summary.failed24h}
                   </h3>
                   <p className="text-xs text-muted-foreground font-medium">24h Failures</p>
                 </div>
                 <div className={`p-3.5 rounded-2xl shadow-lg ${data.summary.failed24h > 0 ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                   <AlertTriangle className="h-6 w-6" />
                 </div>
               </div>
               <div className="mt-6">
                 <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
                   <Info className="h-3.5 w-3.5 opacity-50" />
                   Review Audit Logs
                 </p>
               </div>
             </CardContent>
           </Card>

           <Card className="border-border/50 relative overflow-hidden group rounded-3xl backdrop-blur-sm">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <CardContent className="p-7 relative z-10">
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Volume</p>
               <div className="flex items-end justify-between">
                 <div className="space-y-1">
                   <h3 className="text-4xl font-extrabold tracking-tight text-blue-500">
                     {data.history.reduce((acc: number, log: any) => acc + (log.metadata?.secretsCount || 0), 0)}
                   </h3>
                   <p className="text-xs text-muted-foreground font-medium">Total Secrets</p>
                 </div>
                 <div className="p-3.5 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                   <Zap className="h-6 w-6" />
                 </div>
               </div>
               <div className="mt-6">
                 <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2">
                   <Activity className="h-3.5 w-3.5 opacity-50" />
                   Delivered across Cloud
                 </p>
               </div>
             </CardContent>
           </Card>
        </motion.div>

        {/* Connected Integration Map */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center border border-border/50">
                <Server className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Active Integrations</h3>
                <p className="text-xs text-muted-foreground">Manage your connected deployment targets.</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-muted text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground border border-border/40">
              {data.integrations.length} Active
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.integrations.map((i: any) => (
              <ProviderCard key={i.id} provider={i} />
            ))}
            {data.integrations.length === 0 && (
              <Card className="col-span-full border-dashed border-2 py-16 flex flex-col items-center justify-center text-center bg-muted/20 rounded-3xl group">
                <div className="p-6 rounded-full bg-background border shadow-inner mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Cloud className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
                <h4 className="font-bold text-xl mb-2">Fuel your pipeline</h4>
                <p className="text-sm text-muted-foreground mb-8 max-w-[320px]">
                  Connect AWS, Vercel, or Netlify to start automating your secret delivery workflow.
                </p>
                <Link href="/integrations">
                  <Button className="rounded-2xl px-8 h-12 text-sm font-bold shadow-xl shadow-primary/20 gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Recent Sync History */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 bg-card/40 backdrop-blur-md overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b py-6 px-7">
              <div className="space-y-1.5 font-bold">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-background border shadow-sm">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  Sync Activity
                </CardTitle>
                <CardDescription className="text-sm font-medium">Automatic audit logs for all synchronization events.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden md:flex flex-col items-end gap-1 px-4 py-1.5 bg-background/50 border rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Global Health</span>
                    <span className="text-xs font-bold text-emerald-500">{data.summary.successRate}% OK</span>
                 </div>
                 <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-dashed bg-muted/60">Live Logs</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                {data.history.length === 0 ? (
                  <div className="py-24 text-center flex flex-col items-center justify-center">
                    <div className="p-6 rounded-full bg-muted/40 mb-4">
                      <ListIcon className="h-10 w-10 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground tracking-tight">No activity recorded yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-widest">Awaiting first sync event...</p>
                  </div>
                ) : (
                  data.history.map((log: any) => (
                    <SyncLogItem key={log.id} log={log} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
