"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Cpu,
  User,
  Loader2,
  RefreshCw,
  LayoutGrid,
  ChevronRight,
  Download,
  Calendar,
  Filter,
  ExternalLink,
  Search,
  Zap,
  MousePointer2
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGlobalContext } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/axios";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
    summary: {
        totalFetches: number;
        saFetches: number;
        humanFetches: number;
        saPercentage: number;
    };
    topProjects: { id: string; name: string; count: number }[];
    topActors: { id: string; count: number; email?: string; isSA: boolean }[];
    usageTimeline: { date: string; count: number }[];
}

const PIE_COLORS = ["#3b82f6", "#10b981"];

// ── Components ────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border text-[11px] p-2.5 rounded-lg shadow-xl backdrop-blur-md">
      <p className="text-muted-foreground font-medium mb-1">{new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <p className="font-bold text-foreground text-sm">{payload[0].value} <span className="font-normal text-muted-foreground">fetches</span></p>
      </div>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border text-[11px] p-3 rounded-lg shadow-xl backdrop-blur-md">
      <p className="font-bold text-foreground text-sm flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
        {payload[0].name}: {payload[0].value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Distribution across workspace actors</p>
    </div>
  );
};

export default function UsageAnalyticsPage() {
  const { selectedWorkspace } = useGlobalContext();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!selectedWorkspace?.id) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await apiClient.get(`/api/analytics/usage?workspaceId=${selectedWorkspace.id}&days=${days}`);
      setData(res.data);
    } catch (err) {
      toast({ title: "Fetch failed", description: "Could not retrieve usage analytics data.", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedWorkspace, days]);

  useEffect(() => { 
    fetchAnalytics(); 
  }, [fetchAnalytics]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Service Accounts", value: data.summary.saFetches },
      { name: "Human Actors", value: data.summary.humanFetches },
    ];
  }, [data]);

  const exportCSV = () => {
    if (!data) return;
    const headers = "Date,Count\n";
    const rows = data.usageTimeline.map(t => `${t.date},${t.count}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-analytics-${selectedWorkspace?.slug || 'workspace'}.csv`;
    a.click();
    toast({ title: "Export Started", description: "Usage timeline has been exported to CSV." });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl space-y-10">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 opacity-60" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl border" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-[450px] w-full rounded-xl border" />
            <Skeleton className="h-[450px] w-full rounded-xl border" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-10 pb-20">
        
        {/* ── Header & Filters ───────────────────── */}
        <div className="flex flex-col gap-6 lg:border-b pb-8 border-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <LayoutGrid className="h-3 w-3" />
                <span>Analytics</span>
                <ChevronRight className="h-3 w-3 opacity-40" />
                <span className="text-foreground">Usage Summary</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
              <p className="text-sm text-muted-foreground">Detailed intelligence on secret access volume and behavioral distribution.</p>
            </div>
            
            <div className="flex items-center gap-3 no-print">
               <Select value={days} onValueChange={setDays}>
                  <SelectTrigger className="w-[160px] h-9 bg-card shadow-sm">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
               </Select>
               
               <Button variant="outline" size="sm" onClick={() => fetchAnalytics(true)} disabled={refreshing} className="h-9 gap-2 shadow-sm">
                 <RefreshCw className={cn("h-3.5 w-3.5", refreshing ? "animate-spin" : "")} />
                 {refreshing ? "Updating..." : "Refresh"}
               </Button>
               
               <Button size="sm" variant="secondary" onClick={exportCSV} className="h-9 gap-2 shadow-sm">
                 <Download className="h-3.5 w-3.5" />
                 Export
               </Button>
            </div>
          </div>
        </div>

        {/* ── Metric Cards ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard 
            label="Total Access Volume" 
            value={data.summary.totalFetches.toLocaleString()} 
            sub="Total successful fetches" 
            icon={TrendingUp}
            color="text-blue-600"
            bg="bg-blue-500/10"
          />
          <PremiumStatCard 
            label="Automated (CLI)" 
            value={data.summary.saFetches.toLocaleString()} 
            sub={`${data.summary.saPercentage}% of overall volume`} 
            icon={Cpu}
            color="text-amber-600"
            bg="bg-amber-500/10"
          />
          <PremiumStatCard 
            label="Human Interactions" 
            value={data.summary.humanFetches.toLocaleString()} 
            sub={`${100 - data.summary.saPercentage}% manual access`} 
            icon={User}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
          />
          <PremiumStatCard 
            label="Behavioral Latency" 
            value="38ms" 
            sub="P95 Secret delivery time" 
            icon={Zap}
            color="text-violet-600"
            bg="bg-violet-500/10"
          />
        </div>

        {/* ── Primary Charts Row ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Access Timeline Area Chart */}
          <Card className="lg:col-span-2 border bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-0 border-b bg-muted/5">
              <div className="flex items-center justify-between py-2">
                <div>
                  <CardTitle className="text-lg">Access Volume Timeline</CardTitle>
                  <CardDescription>Daily fetch distribution over the last {days} days.</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 flex-1">
              <div className="h-[320px] w-full flex flex-col items-center justify-center">
                {data.summary.totalFetches > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.usageTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "rgba(128,128,128,0.6)", fontWeight: 500 }}
                        tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(128,128,128,0.6)", fontWeight: 500 }} allowDecimals={false} />
                      <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "transparent", stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                    <History className="h-12 w-12" />
                    <p className="text-sm font-medium italic">No activity till yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actor Distribution Donut */}
          <Card className="border bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-0 border-b bg-muted/5">
              <div className="flex items-center justify-between py-2">
                <div>
                  <CardTitle className="text-lg">Actor Distribution</CardTitle>
                  <CardDescription>CLI vs Web UI interaction</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <MousePointer2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 flex-1 flex flex-col justify-center">
              {data.summary.totalFetches > 0 ? (
                <>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={1000}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
                        </Pie>
                        <RechartsTooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black">{data.summary.totalFetches}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Total Ops</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-8">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-sm font-semibold">Service Accounts</span>
                      </div>
                      <span className="text-sm font-mono font-bold">{data.summary.saPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-sm font-semibold">Human Users</span>
                      </div>
                      <span className="text-sm font-mono font-bold">{100 - data.summary.saPercentage}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 py-12 opacity-40">
                  <MousePointer2 className="h-12 w-12" />
                  <p className="text-sm font-medium italic">No activity till yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Data Tables Row ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Projects Leaderboard */}
          <Card className="border shadow-none bg-card/30">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold">Volume by Project</CardTitle>
                <CardDescription className="text-xs">Projects prioritized by fetch frequency.</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground opacity-30" />
            </CardHeader>
            <CardContent className="pt-6 px-6">
              <div className="space-y-6">
                {data.topProjects.length > 0 ? data.topProjects.map((p: any, i: number) => (
                  <div key={p.id} className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground/30 w-4 text-right tabular-nums group-hover:text-primary transition-colors">{(i + 1).toString().padStart(2, '0')}</span>
                        <Link href={`/projects/${p.id}`} className="text-sm font-bold hover:text-primary hover:underline transition-all underline-offset-4 decoration-primary/30 flex items-center gap-1.5">
                          {p.name}
                          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px] h-5 tabular-nums bg-background">{p.count} ops</Badge>
                    </div>
                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(p.count / (data.topProjects[0]?.count || 1)) * 100}%` }}
                         transition={{ duration: 1, delay: i * 0.05 }}
                         className="h-full bg-primary/30 group-hover:bg-primary/50 transition-colors rounded-full"
                       />
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-muted-foreground opacity-40">
                    <History className="h-10 w-10 mx-auto mb-4" />
                    <p className="text-sm italic">No activity till yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Actors Leaderboard */}
          <Card className="border shadow-none bg-card/30 overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold">Inferred Access Actors</CardTitle>
                <CardDescription className="text-xs">Highest activity accounts detected.</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground opacity-30" />
            </CardHeader>
            <div className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-muted/20 text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                     <tr>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Origin</th>
                        <th className="px-6 py-4 text-right">Fetch Count</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y border-b decoration-border">
                     {data.topActors.length > 0 ? data.topActors.map((actor: any, i: number) => (
                       <tr key={i} className="hover:bg-muted/5 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                                actor.isSA ? "bg-amber-500/5 text-amber-500 border-amber-500/10" : "bg-blue-500/5 text-blue-500 border-blue-500/10"
                              )}>
                                {actor.isSA ? <Cpu className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs truncate max-w-[140px]">{actor.email || actor.id}</span>
                                <span className={cn("text-[9px] uppercase font-black tracking-tighter", actor.isSA ? "text-amber-600/60" : "text-blue-600/60")}>
                                  {actor.isSA ? "Service Account" : "Human Actor"}
                                </span>
                              </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-mono opacity-60">INFERRED_API</Badge>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <span className="font-mono text-sm font-bold tabular-nums">{actor.count}</span>
                            <span className="text-[10px] ml-1 text-muted-foreground font-medium uppercase tracking-tighter">ops</span>
                         </td>
                       </tr>
                     )) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground opacity-40">
                             <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8" />
                                <p className="text-sm italic font-medium">No activity till yet</p>
                             </div>
                          </td>
                        </tr>
                     )}
                   </tbody>
                 </table>
               </div>
               <div className="p-4 bg-muted/5 flex justify-center">
                  <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-7" asChild>
                    <Link href="/audit" className="flex items-center gap-1.5">
                      Explore Audit Events <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PremiumStatCard({ label, value, sub, icon: Icon, color, bg }: { 
  label: string; value: string | number; sub: string; icon: any; color: string; bg: string 
}) {
  return (
    <Card className="border bg-card/60 backdrop-blur-xl shadow-sm relative overflow-hidden group">
      <div className={cn("absolute right-0 top-0 h-24 w-24 -mr-6 -mt-6 opacity-5 rotate-12 transition-transform group-hover:scale-110 duration-500", color)}>
        <Icon className="h-full w-full" />
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-border/50 bg-background", color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{label}</p>
            <div className="flex items-baseline gap-2">
               <h2 className="text-2xl font-black tracking-tight">{value}</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/80 font-medium">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function History({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
    )
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
    )
}
