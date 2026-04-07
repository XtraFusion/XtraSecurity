"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useGlobalContext } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Search,
    Download,
    Shield,
    User,
    Key,
    Settings,
    AlertTriangle,
    Info,
    XCircle,
    CheckCircle,
    Clock,
    MapPin,
    Monitor,
    Smartphone,
    Globe,
    FileText,
    CalendarIcon,
    RefreshCw,
    Filter,
    ChevronRight,
    ExternalLink,
    Terminal,
    ArrowRight,
    History,
    Activity,
    ShieldAlert,
    ShieldCheck,
    Users,
    LayoutGrid
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip,
    Cell
} from "recharts";
import apiClient from "@/lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    id: string;
  };
  action: string;
  category: "auth" | "project" | "secret" | "team" | "system";
  severity: "info" | "warning" | "error" | "critical";
  description: string;
  details: {
    ip: string;
    userAgent: string;
    location?: string;
    resource?: string;
  };
  changes?: Record<string, { old: any; new: any }>;
  status: "success" | "failed" | "pending";
}

const categoryConfig = {
  auth: { label: "Authentication", icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10" },
  project: { label: "Project", icon: Settings, color: "text-green-500", bg: "bg-green-500/10" },
  secret: { label: "Secret", icon: Key, color: "text-purple-500", bg: "bg-purple-500/10" },
  team: { label: "Team", icon: User, color: "text-orange-500", bg: "bg-orange-500/10" },
  system: { label: "System", icon: Monitor, color: "text-gray-500", bg: "bg-gray-500/10" },
};

const severityConfig = {
  info: { label: "Info", icon: Info, color: "text-blue-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-amber-500" },
  error: { label: "Error", icon: XCircle, color: "text-rose-500" },
  critical: { label: "Critical", icon: ShieldAlert, color: "text-rose-600" },
};

const statusConfig = {
  success: { label: "Success", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  failed: { label: "Failed", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
};

const getDeviceIcon = (userAgent: string) => {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
  return Monitor;
};

// ── Components ────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border text-[11px] p-2.5 rounded-lg shadow-xl backdrop-blur-md">
      <p className="text-muted-foreground font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <p className="font-bold text-foreground text-sm">{payload[0].value} <span className="font-normal text-muted-foreground text-[10px]">events</span></p>
      </div>
    </div>
  );
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, criticalEvents: 0, failedActions: 0, activeUsers: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedWorkspace } = useGlobalContext();

  const loadData = useCallback(async (silent = false) => {
    if (!selectedWorkspace) return;
    if (!silent) setIsLoading(true);
    try {
      // 1. Load Stats
      const statsRes = await apiClient.get(`/api/audit/dashboard?range=7d&workspaceId=${selectedWorkspace.id}`);
      if (statsRes.data) {
        setStats({
          totalEvents: statsRes.data.stats.totalEvents,
          criticalEvents: statsRes.data.anomalies.length,
          failedActions: statsRes.data.stats.failedLogins,
          activeUsers: statsRes.data.stats.activeUsers || 0
        });
      }

      // 2. Load Logs
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('workspaceId', selectedWorkspace.id);
      if (searchTerm) params.set('search', searchTerm);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateRange.from) params.set('startDate', dateRange.from.toISOString());
      if (dateRange.to) params.set('endDate', dateRange.to.toISOString());

      const logsRes = await apiClient.get(`/api/audit?${params.toString()}`);
      if (logsRes.data) {
        setLogs((logsRes.data.data || []).map((l: any) => ({
          ...l,
          category: (l.entity as any) || 'system',
          severity: l.action.toLowerCase().includes('critical') ? 'critical' : l.action.toLowerCase().includes('fail') ? 'warning' : 'info',
          status: l.action.toLowerCase().includes('fail') ? 'failed' : 'success',
          user: { id: l.user?.id || 'unknown', name: l.user?.name || 'Unknown', email: l.user?.email || '' },
          details: { ip: l.ipAddress || '—', userAgent: l.userAgent || '—', resource: l.project?.name || '—' },
          timestamp: l.timestamp || l.createdAt
        })));
        setTotal(logsRes.data.total || 0);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Audit load failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspace, page, pageSize, searchTerm, categoryFilter, severityFilter, statusFilter, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;
    const interval = setInterval(() => loadData(true), 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [realTimeEnabled, loadData]);

  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets[format(d, "EEE")] = 0;
    }
    logs.forEach(log => {
        const day = format(new Date(log.timestamp), "EEE");
        if (day in buckets) buckets[day]++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [logs]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await apiClient.post("/api/audit/export", {
        format,
        workspaceId: selectedWorkspace?.id,
        startDate: dateRange.from,
        endDate: dateRange.to
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-export-${selectedWorkspace?.slug || 'log'}.${format}`;
      a.click();
      toast({ title: "Export Successful", description: `Audit trail exported to ${format.toUpperCase()}.` });
    } catch (e: any) {
      toast({ title: "Export Failed", description: "Audit trail could not be exported.", variant: "destructive" });
    }
  };

  const activeFilterCount = [categoryFilter !== 'all', severityFilter !== 'all', statusFilter !== 'all', !!dateRange.from].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 border-b pb-8 border-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                <span>Security</span>
                <ChevronRight className="h-3 w-3 opacity-40" />
                <span className="text-foreground">Audit Logs</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Operations</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Detailed record of all workspace activities
                {realTimeEnabled && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3 no-print">
               <div className="flex items-center gap-3 px-4 h-9 bg-card border rounded-lg shadow-sm">
                  <Switch id="live-polling" checked={realTimeEnabled} onCheckedChange={setRealTimeEnabled} className="scale-75" />
                  <Label htmlFor="live-polling" className="text-xs font-bold uppercase tracking-tighter opacity-70">Real-time</Label>
               </div>
               
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm font-semibold">
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Download format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleExport('csv')}>
                       <FileText className="h-4 w-4 opacity-70" /> CSV Spreadsheet
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleExport('json')}>
                       <Terminal className="h-4 w-4 opacity-70" /> JSON Format
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>

               <Button variant="outline" size="sm" onClick={() => loadData()} disabled={isLoading} className="h-9 w-9 p-0 shadow-sm">
                  <RefreshCw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
               </Button>
            </div>
          </div>
        </div>

        {/* Operational Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <PremiumStatCard label="Total Operations" value={stats.totalEvents} sub="Across all categories" icon={Activity} />
           <PremiumStatCard label="Security Risks" value={stats.criticalEvents} sub="Unusual behavior detected" icon={ShieldAlert} color="text-rose-600" bg="bg-rose-500/5" />
           <PremiumStatCard label="Failed Attempts" value={stats.failedActions} sub="Unauthorized or rejected" icon={XCircle} color="text-amber-600" bg="bg-amber-500/5" />
           <PremiumStatCard label="Unique Actors" value={stats.activeUsers} sub="Total unique identifiers" icon={Users} />
        </div>

        {/* Activity Volume Graph */}
        <Card className="border bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
           <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Log Volume Distribution
                 </CardTitle>
                 <CardDescription className="text-xs">Event frequency trends over the last 7 days.</CardDescription>
              </div>
              <Badge variant="outline" className="font-black text-[10px] tracking-tighter opacity-60">PAGE VIEW ANALYTICS</Badge>
           </CardHeader>
           <CardContent className="pt-8">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(128,128,128,0.5)", fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(128,128,128,0.5)", fontWeight: 700 }} />
                      <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--primary)/2%)" }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                         {chartData.map((entry, index) => (
                           <Cell 
                             key={index} 
                             fill={entry.count > 0 ? "hsl(var(--primary))" : "rgba(128,128,128,0.1)"} 
                             fillOpacity={0.8}
                           />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
           </CardContent>
        </Card>

        {/* Audit Trail List */}
        <Card className="border shadow-sm">
           <CardHeader className="border-b bg-muted/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 <div className="space-y-1">
                    <CardTitle className="text-lg">Audit Trail</CardTitle>
                    <CardDescription>Comprehensive immutable record of workspace interactions.</CardDescription>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-3 no-print">
                    <div className="relative w-full sm:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                       <Input 
                         placeholder="Filter logs..." 
                         value={searchTerm} 
                         onChange={e => setSearchTerm(e.target.value)}
                         className="pl-9 h-9 text-xs"
                       />
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                       <SelectTrigger className="w-[140px] h-9 text-xs">
                          <SelectValue placeholder="Category" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="all">All Entries</SelectItem>
                          {Object.keys(categoryConfig).map(k => (
                             <SelectItem key={k} value={k}>{categoryConfig[k as keyof typeof categoryConfig].label}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>

                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                       <SelectTrigger className="w-[140px] h-9 text-xs">
                          <SelectValue placeholder="Severity" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="all">All Severities</SelectItem>
                          {Object.keys(severityConfig).map(k => (
                             <SelectItem key={k} value={k}>{severityConfig[k as keyof typeof severityConfig].label}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-muted/30 text-muted-foreground border-b uppercase text-[10px] font-black tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Actor & Operation</th>
                          <th className="px-6 py-4">Metadata</th>
                          <th className="px-6 py-4">Context</th>
                          <th className="px-6 py-4 text-right">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y relative">
                       {isLoading && logs.length === 0 ? (
                           Array.from({ length: 8 }).map((_, i) => (
                             <tr key={i} className="animate-pulse">
                                <td colSpan={4} className="px-6 py-8"><Skeleton className="h-8 w-full opacity-20" /></td>
                             </tr>
                           ))
                       ) : logs.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-20 text-center text-muted-foreground italic">
                                 <History className="h-12 w-12 mx-auto mb-4 opacity-5" />
                                 No audit logs recorded for this configuration.
                              </td>
                           </tr>
                       ) : (
                          logs.map((log) => {
                             const config = categoryConfig[log.category];
                             const status = statusConfig[log.status];
                             const severity = severityConfig[log.severity];
                             const DeviceIcon = getDeviceIcon(log.details.userAgent);

                             return (
                               <Dialog key={log.id}>
                                 <DialogTrigger asChild>
                                   <tr className="group hover:bg-muted/5 transition-all cursor-pointer">
                                      <td className="px-6 py-5">
                                         <div className="flex items-center gap-4">
                                            <Avatar className="h-9 w-9 rounded-xl border border-border shadow-sm shrink-0">
                                               <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                  {log.user.name.charAt(0)}
                                               </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                               <span className="font-bold text-foreground text-[13px] group-hover:text-primary transition-colors truncate max-w-[280px]">
                                                  {log.action}
                                               </span>
                                               <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                  {log.user.email} · {log.user.id.slice(0, 8)}
                                               </span>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5">
                                         <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                               <config.icon className={cn("h-3 w-3", config.color)} />
                                               <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">{config.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                               <DeviceIcon className="h-3 w-3" />
                                               <span className="text-[10px] font-mono">{log.details.ip}</span>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5">
                                         <Badge className={cn("rounded-full px-3 text-[10px] font-black tracking-tighter h-6", status.bg, status.color)}>
                                            <status.icon className="h-3 w-3 mr-1.5" /> {status.label}
                                         </Badge>
                                      </td>
                                      <td className="px-6 py-5 text-right">
                                         <div className="flex flex-col items-end">
                                            <span className="text-[11px] font-bold text-foreground/80 tabular-nums">{format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}</span>
                                            <span className="text-[9px] text-muted-foreground font-medium opacity-40 uppercase tracking-tighter mt-0.5">GMT {format(new Date(log.timestamp), "x")}</span>
                                         </div>
                                      </td>
                                   </tr>
                                 </DialogTrigger>
                                 <DialogContent className="max-w-2xl border-border/50 shadow-2xl overflow-hidden p-0">
                                    <div className="bg-muted/10 p-6 border-b">
                                       <DialogHeader>
                                          <div className="flex items-center gap-3 mb-2">
                                             <Badge className={cn("px-2.5 h-6 font-black uppercase text-[10px] tracking-widest", status.bg, status.color)}>{status.label}</Badge>
                                             <div className="flex items-center gap-1.5 text-rose-600">
                                                <severity.icon className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{severity.label}</span>
                                             </div>
                                          </div>
                                          <DialogTitle className="text-xl font-black tracking-tight">{log.action}</DialogTitle>
                                          <DialogDescription className="font-mono text-[10px] opacity-60">TRACE_ID: {log.id}</DialogDescription>
                                       </DialogHeader>
                                    </div>
                                    
                                    <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                       <div className="grid grid-cols-2 gap-8">
                                          <DetailItem label="Identity Origin" value={log.user.email} sub={`ID: ${log.user.id}`} icon={User} />
                                          <DetailItem label="Network Context" value={log.details.ip} sub={log.details.userAgent} icon={Globe} />
                                          <DetailItem label="Target Resource" value={log.details.resource || 'Global Workspace'} sub="Primary scope" icon={LayoutGrid} />
                                          <DetailItem label="Timestamp" value={format(new Date(log.timestamp), "PPPP")} sub={format(new Date(log.timestamp), "HH:mm:ss.SSS (xxx)")} icon={Clock} />
                                       </div>

                                       <div className="space-y-4">
                                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                             <History className="h-4 w-4" /> Observed Lifecycle
                                          </h4>
                                          <div className="p-4 rounded-xl border bg-muted/20 space-y-4 font-mono text-xs">
                                             {log.changes ? Object.entries(log.changes).map(([field, delta]: any) => (
                                                <div key={field} className="grid grid-cols-1 md:grid-cols-12 gap-3 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                                                   <span className="md:col-span-3 font-black text-primary opacity-60 uppercase tracking-tighter text-[10px]">{field}</span>
                                                   <div className="md:col-span-9 flex flex-wrap items-center gap-2">
                                                      <span className="px-2 py-0.5 rounded bg-rose-500/5 text-rose-600 line-through decoration-rose-600/30">{String(delta.old)}</span>
                                                      <ArrowRight className="h-3 w-3 opacity-30" />
                                                      <span className="px-2 py-0.5 rounded bg-emerald-500/5 text-emerald-600 font-bold">{String(delta.new)}</span>
                                                   </div>
                                                </div>
                                             )) : (
                                                <p className="text-muted-foreground italic text-[11px] font-sans">No complex property changes were detected for this interaction.</p>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </DialogContent>
                               </Dialog>
                             );
                          })
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Pagination Controller */}
              <div className="px-6 py-6 border-t flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/5">
                 <div className="flex items-center gap-4">
                   <p className="text-xs text-muted-foreground font-medium">
                     Viewing <span className="font-bold text-foreground">{logs.length}</span> of <span className="font-bold text-foreground">{total}</span> events
                   </p>
                   <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-20 h-7 text-[10px] font-bold border-0 bg-transparent shadow-none hover:bg-muted/10 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / pg</SelectItem>
                      <SelectItem value="25">25 / pg</SelectItem>
                      <SelectItem value="50">50 / pg</SelectItem>
                      <SelectItem value="100">100 / pg</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1 || isLoading} onClick={() => setPage(p => p - 1)}>
                       <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-8 px-4 flex items-center justify-center rounded-lg border bg-background text-[11px] font-bold">
                       PAGE {page}
                    </div>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={logs.length < pageSize || isLoading} onClick={() => setPage(p => p + 1)}>
                       <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PremiumStatCard({ label, value, sub, icon: Icon, color = "text-primary", bg = "bg-primary/5" }: any) {
  return (
    <Card className="border bg-card/60 backdrop-blur-xl shadow-sm relative overflow-hidden group transition-all hover:bg-card">
       <div className={cn("absolute right-0 top-0 h-24 w-24 -mr-6 -mt-6 opacity-5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-500", color)}>
          <Icon className="h-full w-full" />
       </div>
       <CardContent className="p-6">
          <div className="flex flex-col gap-4">
             <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-border/50 bg-background", color)}>
                <Icon className="h-5 w-5" />
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{label}</p>
                <h2 className="text-2xl font-black tracking-tight tabular-nums">{value}</h2>
                <p className="text-[11px] text-muted-foreground/80 font-medium whitespace-nowrap">{sub}</p>
             </div>
          </div>
       </CardContent>
    </Card>
  );
}

function DetailItem({ label, value, sub, icon: Icon }: any) {
  return (
    <div className="space-y-2 group">
       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 transition-colors group-hover:text-primary">
          <Icon className="h-3 w-3" /> {label}
       </div>
       <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground break-all">{value}</p>
          <p className="text-[11px] text-muted-foreground max-w-full truncate">{sub}</p>
       </div>
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
    )
}

function ChevronLeft({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
    )
}
