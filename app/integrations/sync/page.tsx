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
  List as ListIcon
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
  github: RefreshCw, // Placeholder
  heroku: Server,
  doppler: Key,
  gcp: Cloud,
  default: Cloud
};

const PROVIDER_COLORS: Record<string, string> = {
  aws: "text-amber-500",
  vercel: "text-blue-500",
  netlify: "text-emerald-500",
  github: "text-purple-500",
  default: "text-primary"
};

const ProviderCard = ({ provider }: any) => {
  const Icon = PROVIDER_ICONS[provider.type] || PROVIDER_ICONS.default;
  const color = PROVIDER_COLORS[provider.type] || PROVIDER_COLORS.default;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg bg-background border shadow-sm ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-lg capitalize">{provider.type}</h4>
                {provider.enabled && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-4">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[140px]">{provider.name}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
               <span className={`h-1.5 w-1.5 rounded-full ${provider.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
               <span className="capitalize">{provider.status}</span>
             </div>
             <p className="text-[10px] text-muted-foreground whitespace-nowrap">
               Last sync: {provider.lastSync ? new Date(provider.lastSync).toLocaleDateString() : 'Never'}
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SyncLogItem = ({ log }: any) => {
  const Icon = PROVIDER_ICONS[log.action.replace("_sync", "")] || PROVIDER_ICONS.default;
  const color = PROVIDER_COLORS[log.action.replace("_sync", "")] || PROVIDER_COLORS.default;
  const isSuccess = log.metadata?.successCount > 0 && (!log.metadata?.failedCount || log.metadata?.failedCount === 0);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-background border shadow-sm ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm capitalize">{log.action.replace("_sync", " ")}</span>
            <Badge variant="secondary" className="text-[10px] uppercase font-mono">{log.projectName}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
               <Clock className="h-3 w-3" />
               {new Date(log.timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
               <Zap className="h-3 w-3" />
               {log.metadata?.secretsCount || 0} secrets
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {isSuccess ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-sm">Success</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1.5 py-1 px-3">
            <XCircle className="h-3.5 w-3.5" />
            <span className="text-sm">Failed</span>
          </Badge>
        )}
        <Link href={`/projects/${log.projectId}`}>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 bg-primary/[0.02]">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Connected Providers</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold">{data.integrations.length}</h3>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Cloud className="h-5 w-5" />
                </div>
              </div>
              <Progress value={(data.integrations.filter((i: any) => i.status === 'connected').length / (data.integrations.length || 1)) * 100} className="h-1 mt-4" />
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">24h Success Rate</p>
              <div className="flex items-end justify-between">
                <h3 className={`text-3xl font-bold ${data.summary.successRate >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {data.summary.successRate}%
                </h3>
                <div className={`p-2 rounded-lg ${data.summary.successRate >= 95 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{data.summary.total24h} total sync events</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
             <CardContent className="p-6">
               <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">24h Failures</p>
               <div className="flex items-end justify-between">
                 <h3 className={`text-3xl font-bold ${data.summary.failed24h > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                   {data.summary.failed24h}
                 </h3>
                 <div className={`p-2 rounded-lg ${data.summary.failed24h > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                   <AlertTriangle className="h-5 w-5" />
                 </div>
               </div>
               <p className="text-xs text-muted-foreground mt-4">Manual intervention might be needed</p>
             </CardContent>
           </Card>

           <Card className="border-border/50">
             <CardContent className="p-6">
               <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Deployments (XRS)</p>
               <div className="flex items-end justify-between">
                 <h3 className="text-3xl font-bold">{data.history.reduce((acc: number, log: any) => acc + (log.metadata?.secretsCount || 0), 0)}</h3>
                 <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                   <Activity className="h-5 w-5" />
                 </div>
               </div>
               <p className="text-xs text-muted-foreground mt-4">Total secret payloads delivered</p>
             </CardContent>
           </Card>
        </div>

        {/* Connected Integration Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              Connected Providers
            </h3>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{data.integrations.length} Total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.integrations.map((i: any) => (
              <ProviderCard key={i.id} provider={i} />
            ))}
            {data.integrations.length === 0 && (
              <Card className="col-span-full border-dashed border-2 py-12 flex flex-col items-center justify-center text-center bg-muted/20">
                <Cloud className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h4 className="font-semibold">No integrations connected</h4>
                <p className="text-sm text-muted-foreground mb-4">Connect to AWS, Vercel, or Netlify to start syncing secrets.</p>
                <Link href="/integrations">
                  <Button size="sm">Get Started</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Sync History */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b py-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="h-5 w-5" />
                Sync History
              </CardTitle>
              <CardDescription>Comprehensive audit of the last 50 synchronization events.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="secondary" className="px-3">All Regions</Badge>
               <Badge variant="outline" className="px-3">Success Rate: {data.summary.successRate}%</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {data.history.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Info className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
                  <p className="text-muted-foreground">No recent sync events found in Audit Logs.</p>
                </div>
              ) : (
                data.history.map((log: any) => (
                  <SyncLogItem key={log.id} log={log} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
