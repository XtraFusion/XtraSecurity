"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  BarChart3,
  Users,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  User,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGlobalContext } from "@/hooks/useUser";
import axios from "axios";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const PIE_COLORS = ["#3b82f6", "#10b981"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/40 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-primary flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {payload[0].value} Fetches
        </p>
      </div>
    );
  }
  return null;
};

export default function UsageAnalyticsPage() {
  const { selectedWorkspace } = useGlobalContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!selectedWorkspace?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/analytics/usage?workspaceId=${selectedWorkspace.id}`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load secret usage data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
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

  if (!data) return null;

  const pieData = [
    { name: "Service Account (CLI)", value: data.summary.saFetches },
    { name: "Human (Web UI)", value: data.summary.humanFetches }
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1 uppercase tracking-wider">
              <BarChart3 className="h-4 w-4" />
              Security Intel
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Secret Usage Analytics</h1>
            <p className="text-lg text-muted-foreground">
              Deep visibility into secret access patterns and actor behavior.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={fetchAnalytics} className="bg-background/50">
               <RefreshCw className="mr-2 h-4 w-4" />
               Refresh Report
             </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 bg-primary/[0.02] shadow-sm overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldAlert className="h-20 w-20" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Access Events (30d)</p>
              <div className="flex items-end justify-between relative z-10">
                <h3 className="text-3xl font-bold tracking-tighter">{data.summary.totalFetches.toLocaleString()}</h3>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                Aggregated across CLI & Web
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-6 relative">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Cpu className="h-20 w-20" />
               </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Automated (SA) Fetches</p>
              <div className="flex items-end justify-between relative z-10">
                <h3 className="text-3xl font-bold tracking-tighter">{data.summary.saFetches.toLocaleString()}</h3>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{data.summary.saPercentage}% of total</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest font-mono">CLI Access Pattern Flag</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <RefreshCw className="h-20 w-20" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Avg. Response Time</p>
              <div className="flex items-end justify-between relative z-10">
                <h3 className="text-3xl font-bold tracking-tighter">42ms</h3>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">High-performance secret delivery</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="h-20 w-20" />
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Active Secret Consumers</p>
              <div className="flex items-end justify-between relative z-10">
                <h3 className="text-3xl font-bold tracking-tighter">{data.topActors.length}</h3>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Unique humans and service accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Usage Timeline (Large) */}
          <Card className="lg:col-span-2 border-border/50 bg-card/40 backdrop-blur-sm self-start">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                   <TrendingUp className="h-5 w-5 text-primary" />
                   Access Timeline (Last 30 Days)
                </CardTitle>
                <CardDescription>Daily fetch volume aggregation over time.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usageTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Actor Distribution */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                 <Users className="h-5 w-5 text-amber-500" />
                 Actor Distribution
              </CardTitle>
              <CardDescription>CLI (SA) vs Web UI fetched count.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
            <CardContent className="pt-4 border-t border-border/40 space-y-4">
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span>CLI Access</span>
                 </div>
                 <span className="font-bold">{data.summary.saPercentage}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Web Interface</span>
                 </div>
                 <span className="font-bold">{100 - data.summary.saPercentage}%</span>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Projects */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                 <LayoutGrid className="h-5 w-5 text-primary/70" />
                 High-Traffic Projects
              </CardTitle>
              <CardDescription>Projects with the highest fetch volume.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-6">
                 {data.topProjects.map((p: any, i: number) => (
                   <div key={p.id} className="group flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-4 text-center">#{i+1}</span>
                            <span className="font-semibold">{p.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{p.count}</span>
                            <Badge variant="secondary" className="text-[10px]">TOTAL FETCHES</Badge>
                         </div>
                      </div>
                      <Progress value={(p.count / (data.topProjects[0]?.count || 1)) * 100} className="h-1.5" />
                   </div>
                 ))}
                 {data.topProjects.length === 0 && (
                   <div className="py-8 text-center text-muted-foreground text-sm">No activity recorded yet</div>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Top Actors */}
          <Card className="border-border/50">
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500/70" />
                  Most Active Actors
               </CardTitle>
               <CardDescription>Heavily active Service Accounts and Users.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="divide-y divide-border/40">
                 {data.topActors.map((actor: any) => (
                   <div key={actor.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${actor.isSA ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {actor.isSA ? <Cpu className="h-4 w-4" /> : <User className="h-4 w-4" />}
                         </div>
                         <div>
                            <p className="font-semibold text-sm truncate max-w-[150px] md:max-w-[300px]">
                              {actor.email || actor.id}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                               {actor.isSA ? 'Service Account' : 'Human User'}
                               <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                               ID: {actor.id.replace('sa_', '')}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-sm tracking-tight">{actor.count}</p>
                         <p className="text-[10px] text-muted-foreground uppercase">Fetches</p>
                      </div>
                   </div>
                 ))}
                 {data.topActors.length === 0 && (
                   <div className="py-8 text-center text-muted-foreground text-sm">No active actors found</div>
                 )}
               </div>
             </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
}

const LayoutGrid = ({ className }: { className?: string }) => (
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
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);
