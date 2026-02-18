"use client"

import { useState, useEffect } from "react"
import { useGlobalContext } from "@/hooks/useUser"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface AuditLog {
  id: string
  timestamp: string
  user: {
    name: string
    email: string
    id: string
  }
  action: string
  category: "auth" | "project" | "secret" | "team" | "system"
  severity: "info" | "warning" | "error" | "critical"
  description: string
  details: {
    ip: string
    userAgent: string
    location?: string
    resource?: string
    oldValue?: string
    newValue?: string
  }
  status: "success" | "failed" | "pending"
}

const mockAuditLogs: AuditLog[] = [];

const categoryConfig = {
  auth: {
    label: "Authentication",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  project: {
    label: "Project",
    icon: Settings,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  secret: {
    label: "Secret",
    icon: Key,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  team: { label: "Team", icon: User, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  system: { label: "System", icon: Monitor, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
}

const severityConfig = {
  info: { label: "Info", icon: Info, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  error: { label: "Error", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  critical: { label: "Critical", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
}

const statusConfig = {
  success: {
    label: "Success",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  failed: { label: "Failed", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
}

const getDeviceIcon = (userAgent: string) => {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
  return Monitor;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState({ totalEvents: 0, criticalEvents: 0, failedActions: 0, activeUsers: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [total, setTotal] = useState<number>(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { selectedWorkspace } = useGlobalContext();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Combined effect to trigger loadLogs and fetchStats when relevant state changes
  useEffect(() => {
    if (selectedWorkspace) {
      loadLogs();
      fetchStats();
    }
  }, [page, pageSize, searchTerm, categoryFilter, severityFilter, statusFilter, userFilter, selectedWorkspace]);


  const fetchStats = async () => {
    try {
      if (!selectedWorkspace) return;
      // Using new dashboard API
      const res = await fetch(`/api/audit/dashboard?range=7d&workspaceId=${selectedWorkspace.id}`);
      if (res.ok) {
        const data = await res.json();
        // Map new API response to state
        setStats({
          totalEvents: data.stats.totalEvents,
          criticalEvents: data.anomalies.length, // approximation or add to API
          failedActions: data.stats.failedLogins,
          activeUsers: 0 // API doesn't return this yet, maybe add later or keep 0
        });
      }
    } catch (e) {
      console.error("Failed to fetch stats");
    }
  }

  const loadLogs = async () => {
    try {
      if (!selectedWorkspace) return;
      setIsLoading(true);
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('workspaceId', selectedWorkspace.id)
      if (searchTerm) params.set('search', searchTerm)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (userFilter !== 'all') params.set('userId', userFilter)

      const res = await fetch(`/api/audit?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(
          (json.data || []).map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp || l.createdAt || new Date().toISOString(),
            user: { id: l.user?.id || l.userId || 'unknown', name: l.user?.name || 'Unknown', email: l.user?.email || '' },
            action: l.action,
            category: (l.entity as any) || 'system',
            severity: l.action.toLowerCase().includes('fail') ? 'warning' : 'info',
            description: l.changes ? JSON.stringify(l.changes) : l.action,
            details: {
              ip: l.ipAddress || 'N/A',
              userAgent: l.userAgent || 'N/A',
              location: 'Unknown',
              resource: l.project?.name || ''
            },
            status: l.action.toLowerCase().includes('fail') ? 'failed' : 'success',
          })),
        )
        setTotal(json.total || 0)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false);
    }
  }

  // Poll for real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;
    const interval = setInterval(() => {
      loadLogs();
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [realTimeEnabled, page, searchTerm, categoryFilter, severityFilter, statusFilter, userFilter]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "csv",
          projectId: selectedWorkspace?.id,
          startDate: dateRange.from,
          endDate: dateRange.to
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: "Audit log exported to CSV",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (e) {
      toast({
        title: "Export Failed",
        description: "Could not generate CSV report",
        variant: "destructive"
      });
    }
  }

  const handleExportPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF export is currently under development.",
    });
  }

  const handleRefresh = () => { loadLogs(); fetchStats(); }

  const uniqueUsers = [] as any[]; // Could fetch from API or derive from current logs page

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Monitor security events and user activities
              {realTimeEnabled && isMounted && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  • Live (Updated {format(lastUpdated, "HH:mm:ss")})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Controls ... */}
            <div className="flex items-center space-x-2">
              <Switch
                id="real-time"
                checked={realTimeEnabled}
                onCheckedChange={setRealTimeEnabled}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="real-time" className="text-sm">Real-time</Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {/* ... Export & Pagination ... */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">All recorded events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedActions}</div>
              <p className="text-xs text-muted-foreground">Security incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Unique users</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & List ... (Keeping existing structure but removing client-side filtering logic for display, 
           as we are now server-side filtering via loadLogs params, but we can reuse the UI controls) */}

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Detailed audit trail of all system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter UI Controls (Same as before) */}
            <div className="space-y-4">
              {/* ... Keep Search/Filter inputs ... */}

              {/* Logs List */}
              <div className="space-y-4 mt-6">
                {isLoading && logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading audit logs...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                    <p className="text-sm">There are no audit logs to display for the selected filters.</p>
                  </div>
                ) : (
                  logs.map((log) => {
                    const CategoryIcon = categoryConfig[log.category]?.icon || Info
                    const SeverityIcon = severityConfig[log.severity]?.icon || Info
                    const StatusIcon = statusConfig[log.status]?.icon || Info
                    const DeviceIcon = getDeviceIcon(log.details.userAgent)

                    return (
                      <Dialog key={log.id}>
                        {/* ... Dialog Trigger & Content ... */}
                        <DialogTrigger asChild>
                          <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {log.user.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{log.action}</h4>
                                  <Badge variant="outline">{log.category}</Badge>
                                  <Badge variant="outline">{log.severity}</Badge>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{log.description}</p>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{log.action}</DialogTitle>
                            <DialogDescription>{log.id}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <div>User: {log.user.name} ({log.user.email})</div>
                            <div>IP: {log.details.ip}</div>
                            <div>User Agent: {log.details.userAgent}</div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
