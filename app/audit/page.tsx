"use client"

import { useState, useEffect } from "react"
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

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-01-22T10:30:00Z",
    user: { name: "John Doe", email: "john@company.com", id: "1" },
    action: "Secret Updated",
    category: "secret",
    severity: "info",
    description: "Updated DATABASE_URL in production environment",
    details: {
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "San Francisco, CA",
      resource: "project-1/production/DATABASE_URL",
    },
    status: "success",
  },
  {
    id: "2",
    timestamp: "2024-01-22T09:15:00Z",
    user: { name: "Sarah Wilson", email: "sarah@company.com", id: "2" },
    action: "Failed Login Attempt",
    category: "auth",
    severity: "warning",
    description: "Multiple failed login attempts detected",
    details: {
      ip: "203.0.113.42",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      location: "Unknown",
    },
    status: "failed",
  },
  {
    id: "3",
    timestamp: "2024-01-22T08:45:00Z",
    user: { name: "Mike Johnson", email: "mike@company.com", id: "3" },
    action: "Project Created",
    category: "project",
    severity: "info",
    description: "Created new project 'Mobile App Backend'",
    details: {
      ip: "192.168.1.105",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      location: "New York, NY",
      resource: "project-5",
    },
    status: "success",
  },
  {
    id: "4",
    timestamp: "2024-01-22T07:20:00Z",
    user: { name: "Emily Chen", email: "emily@company.com", id: "4" },
    action: "Team Member Invited",
    category: "team",
    severity: "info",
    description: "Invited new team member with developer role",
    details: {
      ip: "192.168.1.110",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "Seattle, WA",
      resource: "team/invite/developer@newcompany.com",
    },
    status: "success",
  },
  {
    id: "5",
    timestamp: "2024-01-21T23:30:00Z",
    user: { name: "System", email: "system@company.com", id: "system" },
    action: "Backup Completed",
    category: "system",
    severity: "info",
    description: "Daily backup completed successfully",
    details: {
      ip: "127.0.0.1",
      userAgent: "System/1.0",
      resource: "backup/daily/2024-01-21",
    },
    status: "success",
  },
  {
    id: "6",
    timestamp: "2024-01-21T18:45:00Z",
    user: { name: "John Doe", email: "john@company.com", id: "1" },
    action: "Secret Access",
    category: "secret",
    severity: "info",
    description: "Accessed API_KEY in staging environment",
    details: {
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "San Francisco, CA",
      resource: "project-2/staging/API_KEY",
    },
    status: "success",
  },
]

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

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    if (!realTimeEnabled) return

    const interval = setInterval(() => {
      // Simulate new log entries
      const shouldAddLog = Math.random() > 0.8 // 20% chance every 5 seconds
      if (shouldAddLog) {
        const newLog: AuditLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user: { name: "Live User", email: "live@company.com", id: "live" },
          action: "Real-time Event",
          category: "system",
          severity: "info",
          description: "Live system event detected",
          details: {
            ip: "192.168.1.200",
            userAgent: "System/Live",
            location: "Server",
          },
          status: "success",
        }
        setLogs((prev) => [newLog, ...prev])
        setLastUpdated(new Date())
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [realTimeEnabled])

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp)
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    const matchesUser = userFilter === "all" || log.user.id === userFilter
    const matchesDateRange =
      (!dateRange.from || logDate >= dateRange.from) && (!dateRange.to || logDate <= dateRange.to)
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus && matchesUser && matchesDateRange
  })

  const handleExportCSV = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Category", "Severity", "Status", "Description", "IP Address", "Location"].join(
        ",",
      ),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.user.name,
          log.action,
          log.category,
          log.severity,
          log.status,
          `"${log.description}"`,
          log.details.ip,
          log.details.location || "Unknown",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "CSV Export completed",
      description: `${filteredLogs.length} audit logs exported successfully`,
    })
  }

  const handleExportPDF = () => {
    // Simulate PDF generation
    toast({
      title: "PDF Export started",
      description: "Your PDF report is being generated and will be downloaded shortly",
    })

    // In a real app, this would call a PDF generation service
    setTimeout(() => {
      toast({
        title: "PDF Export completed",
        description: `${filteredLogs.length} audit logs exported to PDF successfully`,
      })
    }, 2000)
  }

  const handleRefresh = () => {
    setLastUpdated(new Date())
    toast({
      title: "Logs refreshed",
      description: "Audit logs have been updated with the latest data",
    })
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      return Smartphone
    }
    return Monitor
  }

  const uniqueUsers = Array.from(new Set(logs.map((log) => log.user.id))).map((id) => {
    const user = logs.find((log) => log.user.id === id)?.user
    return { id, name: user?.name || "Unknown", email: user?.email || "" }
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Monitor security events and user activities
              {realTimeEnabled && (
                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                  • Live (Updated {format(lastUpdated, "HH:mm:ss")})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="real-time"
                checked={realTimeEnabled}
                onCheckedChange={setRealTimeEnabled}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="real-time" className="text-sm">
                Real-time
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredLogs.length !== logs.length ? `of ${logs.length} total` : "Last 24 hours"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredLogs.filter((l) => l.severity === "critical" || l.severity === "error").length}
              </div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs.filter((l) => l.status === "failed").length}</div>
              <p className="text-xs text-muted-foreground">Security incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(filteredLogs.map((l) => l.user.id)).size}</div>
              <p className="text-xs text-muted-foreground">Unique users</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Detailed audit trail of all system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by action, description, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[240px] justify-start text-left font-normal bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm ||
                categoryFilter !== "all" ||
                severityFilter !== "all" ||
                statusFilter !== "all" ||
                userFilter !== "all" ||
                dateRange.from) && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredLogs.length} of {logs.length} logs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setCategoryFilter("all")
                      setSeverityFilter("all")
                      setStatusFilter("all")
                      setUserFilter("all")
                      setDateRange({})
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>

            {/* Logs List */}
            <div className="space-y-4 mt-6">
              {filteredLogs.map((log) => {
                const CategoryIcon = categoryConfig[log.category].icon
                const SeverityIcon = severityConfig[log.severity].icon
                const StatusIcon = statusConfig[log.status].icon
                const DeviceIcon = getDeviceIcon(log.details.userAgent)

                return (
                  <Dialog key={log.id}>
                    <DialogTrigger asChild>
                      <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {log.user.name === "System"
                              ? "SYS"
                              : log.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{log.action}</h4>
                              <Badge variant="outline" className={categoryConfig[log.category].color}>
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {categoryConfig[log.category].label}
                              </Badge>
                              <Badge variant="outline" className={severityConfig[log.severity].color}>
                                <SeverityIcon className="h-3 w-3 mr-1" />
                                {severityConfig[log.severity].label}
                              </Badge>
                              <Badge variant="outline" className={statusConfig[log.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[log.status].label}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.details.ip}
                            </span>
                            {log.details.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {log.details.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <DeviceIcon className="h-3 w-3" />
                              Device
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CategoryIcon className="h-5 w-5" />
                          {log.action}
                        </DialogTitle>
                        <DialogDescription>{log.description}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">User</Label>
                            <p className="text-sm text-muted-foreground">
                              {log.user.name} ({log.user.email})
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Timestamp</Label>
                            <p className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">IP Address</Label>
                            <p className="text-sm text-muted-foreground">{log.details.ip}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Location</Label>
                            <p className="text-sm text-muted-foreground">{log.details.location || "Unknown"}</p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium">User Agent</Label>
                          <p className="text-sm text-muted-foreground break-all">{log.details.userAgent}</p>
                        </div>
                        {log.details.resource && (
                          <div>
                            <Label className="text-sm font-medium">Resource</Label>
                            <p className="text-sm text-muted-foreground">{log.details.resource}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Badge className={categoryConfig[log.category].color}>
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categoryConfig[log.category].label}
                          </Badge>
                          <Badge className={severityConfig[log.severity].color}>
                            <SeverityIcon className="h-3 w-3 mr-1" />
                            {severityConfig[log.severity].label}
                          </Badge>
                          <Badge className={statusConfig[log.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[log.status].label}
                          </Badge>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No logs found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
