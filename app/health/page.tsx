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
  ArrowRight,
  TrendingUp,
  Zap,
  Lock,
  GitBranch,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2
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

const MetricCard = ({ title, value, description, icon: Icon, color, trend }: any) => (
  <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`p-2.5 rounded-lg w-fit ${color} bg-background border shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
            {description}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SecurityScoreGauge = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getStatus = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 50) return "Average";
    return "Critical";
  };

  return (
    <Card className="col-span-full lg:col-span-1 border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
      <CardContent className="p-8 flex flex-col items-center justify-center text-center">
        <div className="relative h-48 w-48 mb-6">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle
              className="text-muted/20 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <motion.circle
              className={`${getColor(score)} stroke-current`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ strokeDasharray: "0 251" }}
              animate={{ strokeDasharray: `${(score / 100) * 251} 251` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-5xl font-bold tracking-tighter"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">pts</span>
          </div>
        </div>
        
        <Badge variant="outline" className={`${getColor(score)} bg-background border-current/20 px-4 py-1 text-sm mb-4`}>
          {getStatus(score)} Posture
        </Badge>
        
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Workspace Security Score</h3>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Based on rotation frequency, key uniqueness, and environmental parity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Page ---

export default function SecurityHealthPage() {
  const { selectedWorkspace } = useGlobalContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    if (!selectedWorkspace?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/secret/health?workspaceId=${selectedWorkspace.id}`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch health data:", err);
      setError("Failed to load security metrics. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
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

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="p-8 flex flex-col items-center justify-center text-center h-full max-w-md mx-auto space-y-4">
          <div className="p-4 rounded-full bg-red-500/10 text-red-500">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">{error || "No data available for this workspace."}</p>
          <Button onClick={fetchHealth}>Retry Load</Button>
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
              <ShieldCheck className="h-4 w-4" />
              Security Audit
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Security Health</h1>
            <p className="text-lg text-muted-foreground">
              Live posture analysis for <span className="font-semibold text-foreground">{selectedWorkspace?.label}</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchHealth}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analytics
            </Button>
            <Button className="shadow-lg shadow-primary/20">
              <TrendingUp className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Top Grid: Score & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SecurityScoreGauge score={data.securityScore} />
          
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Stale Secrets"
              value={data.staleCount}
              description="secrets haven't been rotated in 90d"
              icon={Clock}
              color="text-amber-500"
              trend={data.staleCount > 5 ? "+12%" : undefined}
            />
            <MetricCard
              title="Key Duplication"
              value={data.duplicateCount}
              description="keys used multiple times"
              icon={Key}
              color="text-blue-500"
            />
            <MetricCard
              title="Auto-Rotation"
              value={`${Math.round((data.autoRotationCount / data.total) * 100)}%`}
              description="adoption across all environments"
              icon={Zap}
              color="text-emerald-500"
            />
            <MetricCard
              title="Environmental Drift"
              value={data.environmentalDrift?.length || 0}
              description="config gaps between Staging & Prod"
              icon={GitBranch}
              color="text-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Critical Fixes List */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Critical Security Actions
                </CardTitle>
                <CardDescription>Recommended fixes to improve your security score.</CardDescription>
              </div>
              <Badge variant="outline" className="h-6">{data.criticalFixes?.length || 0} Active</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {data.criticalFixes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium">No critical risks detected!</p>
                    <p className="text-xs text-muted-foreground">Your workspace currently follows all best practices.</p>
                  </div>
                ) : (
                  data.criticalFixes.map((fix: any, idx: number) => (
                    <div key={idx} className="group flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-background border shadow-sm ${
                          fix.type === 'stale' ? 'text-amber-500' : 
                          fix.type === 'duplicate' ? 'text-blue-500' : 'text-primary'
                        }`}>
                          {fix.type === 'stale' ? <Clock className="h-4 w-4" /> : 
                           fix.type === 'duplicate' ? <Key className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{fix.key}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 uppercase">{fix.projectName}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {fix.type === 'stale' ? `Stale secret (updated ${fix.daysOld}d ago)` : 
                             fix.type === 'duplicate' ? `Reused across ${fix.count} projects` : fix.description}
                          </p>
                        </div>
                      </div>
                      <Link href={`/projects/${fix.projectId}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guidelines & Posture Trends */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Security Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Rotate secrets every 90 days</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Reducing secret lifespan minimizes the window of opportunity for stolen credentials.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Enable Automated Rotation</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Avoid manual error by linking Rotation Policies to your integrations (AWS, Doppler, GCP).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Eliminate Environment Drift</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Ensure staging and production configurations match to prevent parity-related fallout.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/50 p-6 flex flex-col justify-between">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-2xl">ZKP</h4>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium">Encryption Standard</p>
                </div>
              </Card>
              <Card className="border-border/50 p-6 flex flex-col justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-4">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-2xl">Live</h4>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-medium">Posture Scanning</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const Activity = ({ className }: { className?: string }) => (
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
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
