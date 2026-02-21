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
  History as HistoryIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Zap,
  Timer,
  Activity,
  Loader2
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useSession } from "next-auth/react"

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
  createdAt: string
}

interface RotationHistory {
  id: string
  secretId: string
  secretKey: string
  projectName: string
  branch: string
  rotationType: "scheduled" | "manual" | "emergency"
  status: "success" | "failed" // | "in-progress"
  oldValue: string
  newValue: string
  rotatedBy: string
  rotatedAt: string
  duration: number // in milliseconds
  errorMessage?: string
  rollbackAvailable: boolean
}

export default function SecretRotationPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [schedules, setSchedules] = useState<RotationSchedule[]>([]) // Empty init
  const [history, setHistory] = useState<RotationHistory[]>([]) // Empty init
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("schedules")
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false)
  const [isRotateNowOpen, setIsRotateNowOpen] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<RotationSchedule | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rotatingSecrets, setRotatingSecrets] = useState<Set<string>>(new Set())

  const [newSchedule, setNewSchedule] = useState<{
    secretKey: string;
    projectId: string;
    branch: string;
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "custom";
    customDays: number;
    rotationMethod: "auto-generate" | "webhook" | "manual";
    webhookUrl: string;
  }>({
    secretKey: "",
    projectId: "",
    branch: "main",
    frequency: "monthly",
    customDays: 30,
    rotationMethod: "auto-generate",
    webhookUrl: "",
  })

  const [projectSecrets, setProjectSecrets] = useState<any[]>([]);

  // Fetch secrets when a project is selected
  useEffect(() => {
    if (newSchedule.projectId) {
      fetch(`/api/secret?projectId=${newSchedule.projectId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProjectSecrets(data);
          } else {
            setProjectSecrets([]);
          }
        })
        .catch(err => console.error("Failed to load project secrets", err));
    } else {
      setProjectSecrets([]);
    }
  }, [newSchedule.projectId]);

  // Projects list for dropdown (Mock for passed in props, or fetch)
  // Ideally we fetch projects here too, but for now we can rely on manual entry or simple list
  // Optimization: Fetch projects to populate dropdown
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch
      const [schedRes, histRes, projRes] = await Promise.all([
        fetch("/api/rotation/schedules"),
        fetch("/api/rotation/history"),
        fetch("/api/project") // Fetch all accessible projects
      ]);

      if (schedRes.ok) setSchedules(await schedRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (projRes.ok) setProjects(await projRes.json());

    } catch (e) {
      console.error("Failed to fetch rotation data", e);
      setNotification({ type: "error", message: "Failed to load data" });
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // ... (helper functions getStatusColor, getFrequencyColor, getRotationTypeIcon same as before)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getFrequencyColor = (frequency: string) => {
    // ... (same implementation)
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }

  const getRotationTypeIcon = (type: string) => {
    // ... (same implementation)
    return <Clock className="h-4 w-4" />
  }

  const handleCreateSchedule = async () => {
    if (!newSchedule.secretKey || !newSchedule.projectId) return

    const selectedSecret = projectSecrets.find(s => s.key === newSchedule.secretKey);
    if (!selectedSecret) {
      setNotification({ type: "error", message: "Please select a valid secret" });
      return;
    }

    try {
      const res = await fetch("/api/rotation/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSchedule, secretId: selectedSecret.id })
      });

      if (!res.ok) {
        const err = await res.json();
        setNotification({ type: "error", message: err.error });
        return;
      }

      const created = await res.json();
      setSchedules([created, ...schedules]);

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
    } catch (e) {
      setNotification({ type: "error", message: "Failed to create schedule" });
    }
  }

  const handleToggleSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    try {
      const res = await fetch("/api/rotation/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, enabled: !schedule.enabled })
      });

      if (!res.ok) throw new Error("Failed to update schedule");

      setSchedules(
        schedules.map((s) =>
          s.id === scheduleId ? { ...s, enabled: !s.enabled } : s,
        ),
      );
      setNotification({ type: "success", message: "Schedule updated successfully" });
    } catch (e) {
      setNotification({ type: "error", message: "Failed to update schedule status" });
    }
  }

  const handleRotateNow = async (schedule: RotationSchedule) => {
    setRotatingSecrets(new Set([...rotatingSecrets, schedule.id]))
    setIsRotateNowOpen(false)

    try {
      const res = await fetch("/api/rotation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: schedule.id })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const result = await res.json();

      // Refresh history
      const histRes = await fetch("/api/rotation/history");
      if (histRes.ok) setHistory(await histRes.json());

      // Update schedule last rotation time locally or refetch
      setSchedules(schedules.map(s =>
        s.id === schedule.id ? { ...s, lastRotation: new Date().toISOString() } : s
      ));

      setNotification({ type: "success", message: `${schedule.secretKey} rotated successfully` })

    } catch (e: any) {
      setNotification({ type: "error", message: e.message || "Rotation failed" })
    } finally {
      setRotatingSecrets(new Set([...rotatingSecrets].filter((id) => id !== schedule.id)))
    }
  }

  const handleRollback = (historyItem: RotationHistory) => {
    setNotification({ type: "error", message: "Rollback not yet implemented via API" });
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/rotation/schedules?id=${scheduleId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete schedule");

      setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId));
      setNotification({ type: "success", message: "Schedule deleted successfully" });
    } catch (e) {
      setNotification({ type: "error", message: "Failed to delete schedule" });
    }
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

  // Optimized stats calculation
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
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            className={`${notification.type === "error" ? "border-destructive text-destructive" : "border-green-500 text-green-700"} animate-in slide-in-from-top-2 duration-300`}
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
                  <Label htmlFor="project-id">Project</Label>
                  <Select
                    value={newSchedule.projectId}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <Select
                    value={newSchedule.secretKey}
                    onValueChange={(value) => {
                      const selectedSecret = projectSecrets.find(s => s.key === value);
                      setNewSchedule({
                        ...newSchedule,
                        secretKey: value,
                        branch: selectedSecret?.branch?.name || "main"
                      });
                    }}
                    disabled={!newSchedule.projectId || projectSecrets.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!newSchedule.projectId ? "Select a project first" : "Select a secret to rotate"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectSecrets.map((s: any) => (
                        <SelectItem key={s.id} value={s.key}>{s.key} ({s.branch?.name || "Global"})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select from the project's existing secrets.</p>
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
                {/* ... (Existing Custom Days and Webhook inputs) ... */}
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
                      <SelectItem value="auto-generate">Auto Generate (Simulated)</SelectItem>
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
          {/* ... Other stats cards ... */}
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
                                  <Zap className="h-3 w-3" />
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
                <CardDescription>Audit log of all secret rotations</CardDescription>
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
                          <TableHead>Rotated At</TableHead>
                          <TableHead>Duration</TableHead>
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
                              <div className="flex items-center gap-1 capitalize">
                                {item.rotationType === "scheduled" ? <Clock className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                                {item.rotationType}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.status)} variant="outline">
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(item.rotatedAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {item.duration}ms
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No rotation history found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Rotation Dialog */}
      <Dialog open={isRotateNowOpen} onOpenChange={setIsRotateNowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Secret Now?</DialogTitle>
            <DialogDescription>
              This will immediately generate a new value for <strong>{selectedSecret?.secretKey}</strong> and update the database.
              If this secret is used in production, ensure your applications can handle the change or fetching the new value.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsRotateNowOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedSecret && handleRotateNow(selectedSecret)}>Yes, Rotate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
