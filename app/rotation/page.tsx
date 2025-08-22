"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  RotateCcw,
  Clock,
  Settings,
  Play,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Zap,
  Shield,
  Timer,
  Activity,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { isAuthenticated } from "@/lib/auth"

interface RotationSchedule {
  id: string
  secretId: string
  secretKey: string
  projectId: string
  projectName: string
  branch: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "custom"
  customDays?: number
  enabled: boolean
  nextRotation: string
  lastRotation?: string
  rotationMethod: "auto-generate" | "webhook" | "manual"
  webhookUrl?: string
  createdBy: string
  createdAt: string
}

interface RotationHistory {
  id: string
  secretId: string
  secretKey: string
  projectName: string
  branch: string
  rotationType: "scheduled" | "manual" | "emergency"
  status: "success" | "failed" | "in-progress"
  oldValue: string
  newValue: string
  rotatedBy: string
  rotatedAt: string
  duration: number // in milliseconds
  errorMessage?: string
  rollbackAvailable: boolean
}

const mockSchedules: RotationSchedule[] = [
  {
    id: "1",
    secretId: "secret-1",
    secretKey: "DATABASE_URL",
    projectId: "proj-1",
    projectName: "Production API",
    branch: "main",
    frequency: "monthly",
    enabled: true,
    nextRotation: "2024-02-15T10:00:00Z",
    lastRotation: "2024-01-15T10:00:00Z",
    rotationMethod: "auto-generate",
    createdBy: "admin@example.com",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    secretId: "secret-2",
    secretKey: "API_SECRET_KEY",
    projectId: "proj-1",
    projectName: "Production API",
    branch: "main",
    frequency: "weekly",
    enabled: true,
    nextRotation: "2024-01-22T10:00:00Z",
    lastRotation: "2024-01-15T10:00:00Z",
    rotationMethod: "webhook",
    webhookUrl: "https://api.example.com/rotate-key",
    createdBy: "admin@example.com",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    secretId: "secret-3",
    secretKey: "REDIS_PASSWORD",
    projectId: "proj-2",
    projectName: "Analytics Service",
    branch: "main",
    frequency: "quarterly",
    enabled: false,
    nextRotation: "2024-04-01T10:00:00Z",
    rotationMethod: "manual",
    createdBy: "dev@example.com",
    createdAt: "2024-01-05T00:00:00Z",
  },
]

const mockHistory: RotationHistory[] = [
  {
    id: "1",
    secretId: "secret-1",
    secretKey: "DATABASE_URL",
    projectName: "Production API",
    branch: "main",
    rotationType: "scheduled",
    status: "success",
    oldValue: "postgresql://user:pass@localhost:5432/prod_old",
    newValue: "postgresql://user:pass@localhost:5432/prod_new",
    rotatedBy: "system",
    rotatedAt: "2024-01-15T10:00:00Z",
    duration: 2340,
    rollbackAvailable: true,
  },
  {
    id: "2",
    secretId: "secret-2",
    secretKey: "API_SECRET_KEY",
    projectName: "Production API",
    branch: "main",
    rotationType: "manual",
    status: "success",
    oldValue: "sk_live_old123",
    newValue: "sk_live_new456",
    rotatedBy: "admin@example.com",
    rotatedAt: "2024-01-14T16:30:00Z",
    duration: 1200,
    rollbackAvailable: true,
  },
  {
    id: "3",
    secretId: "secret-4",
    secretKey: "STRIPE_SECRET",
    projectName: "Payment Service",
    branch: "main",
    rotationType: "emergency",
    status: "failed",
    oldValue: "sk_live_emergency",
    newValue: "",
    rotatedBy: "admin@example.com",
    rotatedAt: "2024-01-13T14:20:00Z",
    duration: 5000,
    errorMessage: "Webhook endpoint returned 500 error",
    rollbackAvailable: false,
  },
]

export default function SecretRotationPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<RotationSchedule[]>(mockSchedules)
  const [history, setHistory] = useState<RotationHistory[]>(mockHistory)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("schedules")
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false)
  const [isRotateNowOpen, setIsRotateNowOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<RotationSchedule | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rotatingSecrets, setRotatingSecrets] = useState<Set<string>>(new Set())

  const [newSchedule, setNewSchedule] = useState({
    secretKey: "",
    projectId: "",
    branch: "main",
    frequency: "monthly" as const,
    customDays: 30,
    rotationMethod: "auto-generate" as const,
    webhookUrl: "",
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setIsLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.secretKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredHistory = history.filter(
    (item) =>
      item.secretKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "weekly":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "monthly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "quarterly":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getRotationTypeIcon = (type: string) => {
    switch (type) {
      case "scheduled":
        return <Clock className="h-4 w-4" />
      case "manual":
        return <RefreshCw className="h-4 w-4" />
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const handleCreateSchedule = () => {
    if (!newSchedule.secretKey || !newSchedule.projectId) return

    const schedule: RotationSchedule = {
      id: Date.now().toString(),
      secretId: `secret-${Date.now()}`,
      secretKey: newSchedule.secretKey,
      projectId: newSchedule.projectId,
      projectName: "New Project", // This would come from project lookup
      branch: newSchedule.branch,
      frequency: newSchedule.frequency,
      customDays: newSchedule.frequency === "custom" ? newSchedule.customDays : undefined,
      enabled: true,
      nextRotation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      rotationMethod: newSchedule.rotationMethod,
      webhookUrl: newSchedule.rotationMethod === "webhook" ? newSchedule.webhookUrl : undefined,
      createdBy: "admin@example.com",
      createdAt: new Date().toISOString(),
    }

    setSchedules([...schedules, schedule])
    setNewSchedule({
      secretKey: "",
      projectId: "",
      branch: "main",
      frequency: "monthly",
      customDays: 30,
      rotationMethod: "auto-generate",
      webhookUrl: "",
    })
    setIsCreateScheduleOpen(false)
    setNotification({ type: "success", message: "Rotation schedule created successfully" })
  }

  const handleToggleSchedule = (scheduleId: string) => {
    setSchedules(
      schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, enabled: !schedule.enabled } : schedule,
      ),
    )
    setNotification({ type: "success", message: "Schedule updated successfully" })
  }

  const handleRotateNow = async (schedule: RotationSchedule) => {
    setRotatingSecrets(new Set([...rotatingSecrets, schedule.id]))
    setIsRotateNowOpen(false)

    // Simulate rotation process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newHistoryItem: RotationHistory = {
      id: Date.now().toString(),
      secretId: schedule.secretId,
      secretKey: schedule.secretKey,
      projectName: schedule.projectName,
      branch: schedule.branch,
      rotationType: "manual",
      status: "success",
      oldValue: "old_secret_value",
      newValue: "new_secret_value_" + Date.now(),
      rotatedBy: "admin@example.com",
      rotatedAt: new Date().toISOString(),
      duration: 3000,
      rollbackAvailable: true,
    }

    setHistory([newHistoryItem, ...history])
    setRotatingSecrets(new Set([...rotatingSecrets].filter((id) => id !== schedule.id)))
    setNotification({ type: "success", message: `${schedule.secretKey} rotated successfully` })
  }

  const handleRollback = (historyItem: RotationHistory) => {
    const newHistoryItem: RotationHistory = {
      id: Date.now().toString(),
      secretId: historyItem.secretId,
      secretKey: historyItem.secretKey,
      projectName: historyItem.projectName,
      branch: historyItem.branch,
      rotationType: "manual",
      status: "success",
      oldValue: historyItem.newValue,
      newValue: historyItem.oldValue,
      rotatedBy: "admin@example.com",
      rotatedAt: new Date().toISOString(),
      duration: 1500,
      rollbackAvailable: true,
    }

    setHistory([newHistoryItem, ...history])
    setNotification({ type: "success", message: `${historyItem.secretKey} rolled back successfully` })
  }

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId))
    setNotification({ type: "success", message: "Schedule deleted successfully" })
  }

  const getNextRotationStatus = (nextRotation: string) => {
    const now = new Date()
    const next = new Date(nextRotation)
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600", urgent: true }
    if (diffDays === 0) return { text: "Today", color: "text-orange-600", urgent: true }
    if (diffDays === 1) return { text: "Tomorrow", color: "text-yellow-600", urgent: false }
    if (diffDays <= 7) return { text: `${diffDays} days`, color: "text-blue-600", urgent: false }
    return { text: `${diffDays} days`, color: "text-muted-foreground", urgent: false }
  }

  const stats = {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter((s) => s.enabled).length,
    overdueRotations: schedules.filter((s) => new Date(s.nextRotation) < new Date()).length,
    successfulRotations: history.filter((h) => h.status === "success").length,
    failedRotations: history.filter((h) => h.status === "failed").length,
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse mb-2"></div>
                  <div className="h-8 bg-muted rounded w-12 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded">
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <Alert
            className={`${notification.type === "error" ? "border-destructive" : "border-green-500"} animate-in slide-in-from-top-2 duration-300`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Secret Rotation</h1>
            <p className="text-muted-foreground">Manage automatic secret rotation schedules and history</p>
          </div>
          <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Rotation Schedule</DialogTitle>
                <DialogDescription>Set up automatic rotation for a secret</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <Input
                    id="secret-key"
                    placeholder="e.g., DATABASE_URL"
                    value={newSchedule.secretKey}
                    onChange={(e) => setNewSchedule({ ...newSchedule, secretKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-id">Project</Label>
                  <Select
                    value={newSchedule.projectId}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proj-1">Production API</SelectItem>
                      <SelectItem value="proj-2">Analytics Service</SelectItem>
                      <SelectItem value="proj-3">Payment Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={newSchedule.branch}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, branch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">main</SelectItem>
                      <SelectItem value="staging">staging</SelectItem>
                      <SelectItem value="dev">dev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Rotation Frequency</Label>
                  <Select
                    value={newSchedule.frequency}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newSchedule.frequency === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-days">Custom Days</Label>
                    <Input
                      id="custom-days"
                      type="number"
                      min="1"
                      max="365"
                      value={newSchedule.customDays}
                      onChange={(e) => setNewSchedule({ ...newSchedule, customDays: Number.parseInt(e.target.value) })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="rotation-method">Rotation Method</Label>
                  <Select
                    value={newSchedule.rotationMethod}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, rotationMethod: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto-generate">Auto Generate</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newSchedule.rotationMethod === "webhook" && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://api.example.com/rotate"
                      value={newSchedule.webhookUrl}
                      onChange={(e) => setNewSchedule({ ...newSchedule, webhookUrl: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateScheduleOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedule} className="w-full sm:w-auto">
                    Create Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Total Schedules</div>
              </div>
              <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Active</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.activeSchedules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="text-sm font-medium text-muted-foreground">Overdue</div>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.overdueRotations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Successful</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.successfulRotations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm font-medium text-muted-foreground">Failed</div>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.failedRotations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schedules and history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="schedules">Rotation Schedules</TabsTrigger>
            <TabsTrigger value="history">Rotation History</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rotation Schedules</CardTitle>
                <CardDescription>Manage automatic secret rotation schedules</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSchedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Secret</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Next Rotation</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSchedules.map((schedule) => {
                          const nextStatus = getNextRotationStatus(schedule.nextRotation)
                          const isRotating = rotatingSecrets.has(schedule.id)
                          return (
                            <TableRow key={schedule.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-mono font-medium">{schedule.secretKey}</div>
                                  <div className="text-sm text-muted-foreground">{schedule.branch}</div>
                                </div>
                              </TableCell>
                              <TableCell>{schedule.projectName}</TableCell>
                              <TableCell>
                                <Badge className={getFrequencyColor(schedule.frequency)}>
                                  {schedule.frequency}
                                  {schedule.customDays && ` (${schedule.customDays}d)`}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className={`text-sm ${nextStatus.color}`}>
                                  {nextStatus.urgent && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                                  {nextStatus.text}
                                </div>
                                <div className="text-xs text-muted-foreground">{formatDate(schedule.nextRotation)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {schedule.rotationMethod === "auto-generate" && <Zap className="h-3 w-3" />}
                                  {schedule.rotationMethod === "webhook" && <RefreshCw className="h-3 w-3" />}
                                  {schedule.rotationMethod === "manual" && <Timer className="h-3 w-3" />}
                                  <span className="text-sm capitalize">
                                    {schedule.rotationMethod.replace("-", " ")}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={schedule.enabled}
                                    onCheckedChange={() => handleToggleSchedule(schedule.id)}
                                    disabled={isRotating}
                                  />
                                  {isRotating && (
                                    <div className="flex items-center gap-1">
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                      <span className="text-xs text-blue-600">Rotating...</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSecret(schedule)
                                        setIsRotateNowOpen(true)
                                      }}
                                      disabled={isRotating}
                                    >
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Rotate Now
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Edit Schedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <History className="mr-2 h-4 w-4" />
                                      View History
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Delete Schedule
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "No schedules found matching your search."
                        : "No rotation schedules configured yet."}
                    </div>
                    {!searchQuery && (
                      <Button onClick={() => setIsCreateScheduleOpen(true)}>Create your first schedule</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rotation History</CardTitle>
                <CardDescription>View past secret rotations and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Secret</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Rotated By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-mono font-medium">{item.secretKey}</div>
                                <div className="text-sm text-muted-foreground">{item.branch}</div>
                              </div>
                            </TableCell>
                            <TableCell>{item.projectName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRotationTypeIcon(item.rotationType)}
                                <span className="capitalize">{item.rotationType}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                                {item.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                                {item.status === "in-progress" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{(item.duration / 1000).toFixed(1)}s</TableCell>
                            <TableCell className="text-sm">{item.rotatedBy}</TableCell>
                            <TableCell className="text-sm">{formatDate(item.rotatedAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <History className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {item.rollbackAvailable && item.status === "success" && (
                                    <DropdownMenuItem onClick={() => handleRollback(item)}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Rollback
                                    </DropdownMenuItem>
                                  )}
                                  {item.errorMessage && (
                                    <DropdownMenuItem>
                                      <AlertTriangle className="mr-2 h-4 w-4" />
                                      View Error
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery ? "No history found matching your search." : "No rotation history available yet."}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rotate Now Dialog */}
        <Dialog open={isRotateNowOpen} onOpenChange={setIsRotateNowOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rotate Secret Now</DialogTitle>
              <DialogDescription>
                {selectedSecret && `Manually rotate ${selectedSecret.secretKey} in ${selectedSecret.projectName}`}
              </DialogDescription>
            </DialogHeader>
            {selectedSecret && (
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This will immediately rotate the secret and update all connected services. This action cannot be
                    undone automatically.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Secret:</strong> {selectedSecret.secretKey}
                  </div>
                  <div className="text-sm">
                    <strong>Project:</strong> {selectedSecret.projectName} ({selectedSecret.branch})
                  </div>
                  <div className="text-sm">
                    <strong>Method:</strong> {selectedSecret.rotationMethod.replace("-", " ")}
                  </div>
                  {selectedSecret.webhookUrl && (
                    <div className="text-sm">
                      <strong>Webhook:</strong> {selectedSecret.webhookUrl}
                    </div>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsRotateNowOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleRotateNow(selectedSecret)}
                    className="w-full sm:w-auto"
                    disabled={rotatingSecrets.has(selectedSecret.id)}
                  >
                    {rotatingSecrets.has(selectedSecret.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Rotating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Rotate Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
