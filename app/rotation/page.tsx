"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search,
  RotateCcw,
  Clock,
  Settings,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Zap,
  Info,
  Loader2,
  Plus,
  Trash2,
  X,
  HelpCircle,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useSession } from "next-auth/react"
import { useGlobalContext } from "@/hooks/useUser"

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
  status: "success" | "failed"
  oldValue: string
  newValue: string
  rotatedBy: string
  rotatedAt: string
  duration: number
  errorMessage?: string
  rollbackAvailable: boolean
}

export default function SecretRotationPage() {
  const { data: session } = useSession()
  const { selectedWorkspace } = useGlobalContext()

  const [schedules, setSchedules] = useState<RotationSchedule[]>([])
  const [history, setHistory] = useState<RotationHistory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("schedules")
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rotatingSecrets, setRotatingSecrets] = useState<Set<string>>(new Set())
  const [togglingSchedules, setTogglingSchedules] = useState<Set<string>>(new Set())
  const [deletingSchedules, setDeletingSchedules] = useState<Set<string>>(new Set())
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)

  // ── Create form state ──────────────────────────
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [projectSecrets, setProjectSecrets] = useState<any[]>([])
  const [loadingSecrets, setLoadingSecrets] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    secretKey: "",
    projectId: "",
    branch: "main",
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "quarterly" | "custom",
    customDays: 30,
    rotationMethod: "auto-generate" as "auto-generate" | "webhook" | "manual",
    webhookUrl: "",
  })

  // ── Confirm rotate dialog (inline) ─────────────
  const [confirmRotate, setConfirmRotate] = useState<RotationSchedule | null>(null)

  // ── Prevent infinite re-fetch on tab switch ────
  const hasFetched = useRef(false)

  const fetchData = useCallback(async () => {
    if (!selectedWorkspace?.id) return
    try {
      setIsLoading(true)
      const [schedRes, histRes, projRes] = await Promise.all([
        fetch(`/api/rotation/schedules?workspaceId=${selectedWorkspace.id}`),
        fetch(`/api/rotation/history?workspaceId=${selectedWorkspace.id}`),
        fetch(`/api/project?workspaceId=${selectedWorkspace.id}`),
      ])
      if (schedRes.ok) setSchedules(await schedRes.json())
      if (histRes.ok) setHistory(await histRes.json())
      if (projRes.ok) setProjects(await projRes.json())
    } catch (e) {
      console.error("Failed to fetch rotation data", e)
      setNotification({ type: "error", message: "Failed to load data" })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session && selectedWorkspace?.id && !hasFetched.current) {
      hasFetched.current = true
      fetchData()
    }
  }, [session, selectedWorkspace?.id, fetchData])

  // ── Fetch secrets when project changes ─────────
  useEffect(() => {
    if (!newSchedule.projectId) { setProjectSecrets([]); return }
    setLoadingSecrets(true)
    fetch(`/api/secret?projectId=${newSchedule.projectId}`)
      .then(res => res.json())
      .then(data => {
        const secrets = Array.isArray(data) ? data : (data?.secrets || data?.data || [])
        setProjectSecrets(secrets)
      })
      .catch(() => setProjectSecrets([]))
      .finally(() => setLoadingSecrets(false))
  }, [newSchedule.projectId])

  // ── Auto-dismiss notifications ─────────────────
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // ── Helpers ────────────────────────────────────
  const filteredSchedules = schedules.filter(
    (s) => s.secretKey.toLowerCase().includes(searchQuery.toLowerCase()) || s.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredHistory = history.filter(
    (h) => h.secretKey.toLowerCase().includes(searchQuery.toLowerCase()) || h.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Pending"
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const getNextRotationStatus = (nextRotation: string) => {
    const diffDays = Math.ceil((new Date(nextRotation).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { text: "Overdue", color: "text-red-600 dark:text-red-400", urgent: true }
    if (diffDays === 0) return { text: "Today", color: "text-amber-600 dark:text-amber-400", urgent: true }
    if (diffDays === 1) return { text: "Tomorrow", color: "text-amber-600 dark:text-amber-400", urgent: false }
    if (diffDays <= 7) return { text: `${diffDays} days`, color: "text-blue-600 dark:text-blue-400", urgent: false }
    return { text: `${diffDays} days`, color: "text-muted-foreground", urgent: false }
  }

  const getFrequencyLabel = (freq: string, days?: number) => {
    if (freq === "custom" && days) return `Every ${days}d`
    return freq.charAt(0).toUpperCase() + freq.slice(1)
  }

  const stats = {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter((s) => s.enabled).length,
    overdueRotations: schedules.filter((s) => new Date(s.nextRotation) < new Date()).length,
    successfulRotations: history.filter((h) => h.status === "success").length,
    failedRotations: history.filter((h) => h.status === "failed").length,
  }

  // ── Actions ────────────────────────────────────
  const handleCreateSchedule = async () => {
    if (!newSchedule.secretKey || !newSchedule.projectId) return
    const selectedSecret = projectSecrets.find(s => s.key === newSchedule.secretKey)
    if (!selectedSecret) {
      setNotification({ type: "error", message: "Please select a valid secret" })
      return
    }
    setIsCreatingSchedule(true)
    try {
      const payload = {
        secretId: selectedSecret.id,
        secretKey: newSchedule.secretKey,
        projectId: newSchedule.projectId,
        branch: newSchedule.branch,
        frequency: newSchedule.frequency,
        customDays: newSchedule.frequency === "custom" ? newSchedule.customDays : undefined,
        rotationMethod: newSchedule.rotationMethod,
        webhookUrl: newSchedule.rotationMethod === "webhook" ? newSchedule.webhookUrl : undefined,
      }
      const res = await fetch("/api/rotation/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json(); setNotification({ type: "error", message: err.error }); return }
      const created = await res.json()
      setSchedules([created, ...schedules])
      setNewSchedule({ secretKey: "", projectId: "", branch: "main", frequency: "monthly", customDays: 30, rotationMethod: "auto-generate", webhookUrl: "" })
      setShowCreatePanel(false)
      setNotification({ type: "success", message: "Rotation schedule created" })
    } catch (e) {
      setNotification({ type: "error", message: "Failed to create schedule" })
    } finally {
      setIsCreatingSchedule(false)
    }
  }

  const handleToggleSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule) return
    setTogglingSchedules(prev => new Set([...prev, scheduleId]))
    try {
      const res = await fetch("/api/rotation/schedules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: scheduleId, enabled: !schedule.enabled }) })
      if (!res.ok) throw new Error("Failed")
      setSchedules(schedules.map(s => s.id === scheduleId ? { ...s, enabled: !s.enabled } : s))
    } catch {
      setNotification({ type: "error", message: "Failed to update schedule" })
    } finally {
      setTogglingSchedules(prev => {
        const next = new Set(prev)
        next.delete(scheduleId)
        return next
      })
    }
  }

  const handleRotateNow = async (schedule: RotationSchedule) => {
    setRotatingSecrets(new Set([...rotatingSecrets, schedule.id]))
    setConfirmRotate(null)
    try {
      const res = await fetch("/api/rotation/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: schedule.id }) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      const histRes = await fetch("/api/rotation/history")
      if (histRes.ok) setHistory(await histRes.json())
      setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, lastRotation: new Date().toISOString() } : s))
      setNotification({ type: "success", message: `${schedule.secretKey} rotated successfully` })
    } catch (e: any) {
      setNotification({ type: "error", message: e.message || "Rotation failed" })
    } finally {
      setRotatingSecrets(new Set([...rotatingSecrets].filter(id => id !== schedule.id)))
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    setDeletingSchedules(prev => new Set([...prev, scheduleId]))
    try {
      const res = await fetch(`/api/rotation/schedules?id=${scheduleId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setSchedules(schedules.filter(s => s.id !== scheduleId))
      setNotification({ type: "success", message: "Schedule deleted" })
    } catch {
      setNotification({ type: "error", message: "Failed to delete schedule" })
    } finally {
      setDeletingSchedules(prev => {
        const next = new Set(prev)
        next.delete(scheduleId)
        return next
      })
    }
  }

  // ── Loading skeleton ──────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl space-y-8">
          <div className="space-y-2"><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-72" /></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="rounded-lg border p-4 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-10" /></div>)}
          </div>
          <Skeleton className="h-9 w-64" />
          <div className="rounded-lg border">
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Unique branches from secrets ──────────────
  const secretBranches = [...new Set(projectSecrets.map((s: any) => s.branch?.name).filter(Boolean))]
  if (secretBranches.length === 0) secretBranches.push("main")

  return (
    <TooltipProvider delayDuration={200}>
      <DashboardLayout>
        <div className="max-w-5xl space-y-6">
          {/* Notification */}
          {notification && (
            <Alert className={`${notification.type === "error" ? "border-red-500/50 text-red-700 dark:text-red-400" : "border-green-500/50 text-green-700 dark:text-green-400"}`}>
              <AlertDescription className="flex items-center gap-2">
                {notification.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {notification.message}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Header ──────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Secret Rotation</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage automatic rotation schedules and audit history.</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => { hasFetched.current = false; fetchData() }} className="gap-1.5 h-8 text-xs">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Re-fetch schedules and history from the server</TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={() => setShowCreatePanel(!showCreatePanel)} className="gap-1.5 h-8 text-xs">
                {showCreatePanel ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {showCreatePanel ? "Close" : "Create Schedule"}
              </Button>
            </div>
          </div>

          {/* ── Inline Create Panel (replaces Dialog) ── */}
          {showCreatePanel && (
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold">Create Rotation Schedule</p>
                <p className="text-xs text-muted-foreground mt-0.5">Set up automated secret rotation for a specific secret.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Project</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[220px]">Select the project that contains the secret you want to rotate.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={newSchedule.projectId} onValueChange={(v) => setNewSchedule({ ...newSchedule, projectId: v, secretKey: "", branch: "main" })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Secret Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Secret Key</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[220px]">The specific secret that will be automatically rotated on the schedule.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={newSchedule.secretKey}
                    onValueChange={(v) => {
                      const s = projectSecrets.find((s: any) => s.key === v)
                      setNewSchedule({ ...newSchedule, secretKey: v, branch: s?.branch?.name || "main" })
                    }}
                    disabled={!newSchedule.projectId || loadingSecrets}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={loadingSecrets ? "Loading secrets..." : !newSchedule.projectId ? "Select a project first" : projectSecrets.length === 0 ? "No secrets found" : "Select a secret"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projectSecrets.length > 0 ? projectSecrets.map((s: any) => (
                        <SelectItem key={s.id} value={s.key}>
                          {s.key} <span className="text-muted-foreground ml-1">({s.branch?.name || "Global"})</span>
                        </SelectItem>
                      )) : (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                          {loadingSecrets ? "Loading..." : "No secrets in this project"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Branch</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[220px]">The branch/environment context. Auto-filled when you select a secret.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={newSchedule.branch} onValueChange={(v) => setNewSchedule({ ...newSchedule, branch: v })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {secretBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      {!secretBranches.includes("main") && <SelectItem value="main">main</SelectItem>}
                      {!secretBranches.includes("staging") && <SelectItem value="staging">staging</SelectItem>}
                      {!secretBranches.includes("dev") && <SelectItem value="dev">dev</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Rotation Frequency</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[240px]">How often the secret is rotated. Daily=1d, Weekly=7d, Monthly=30d, Quarterly=90d. Use Custom for a specific interval.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={newSchedule.frequency} onValueChange={(v) => setNewSchedule({ ...newSchedule, frequency: v as any })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (every 24h)</SelectItem>
                      <SelectItem value="weekly">Weekly (every 7d)</SelectItem>
                      <SelectItem value="monthly">Monthly (every 30d)</SelectItem>
                      <SelectItem value="quarterly">Quarterly (every 90d)</SelectItem>
                      <SelectItem value="custom">Custom interval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Days */}
                {newSchedule.frequency === "custom" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Custom Days</Label>
                    <Input type="number" min="1" max="365" className="h-9 text-xs" value={newSchedule.customDays}
                      onChange={(e) => setNewSchedule({ ...newSchedule, customDays: Number.parseInt(e.target.value) || 30 })} />
                  </div>
                )}

                {/* Rotation Method */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs font-medium">Rotation Method</Label>
                    <Tooltip><TooltipTrigger><HelpCircle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-[260px]">
                        <strong>Auto Generate</strong> — system creates a new random value.<br/>
                        <strong>Webhook</strong> — calls your endpoint to get a new value.<br/>
                        <strong>Manual</strong> — sends a reminder, you rotate manually.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={newSchedule.rotationMethod} onValueChange={(v) => setNewSchedule({ ...newSchedule, rotationMethod: v as any })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto-generate">Auto Generate</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Webhook URL */}
                {newSchedule.rotationMethod === "webhook" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">Webhook URL</Label>
                    <Input className="h-9 text-xs" placeholder="https://api.example.com/rotate"
                      value={newSchedule.webhookUrl} onChange={(e) => setNewSchedule({ ...newSchedule, webhookUrl: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setShowCreatePanel(false)} className="h-8 text-xs">Cancel</Button>
                <Button size="sm" onClick={handleCreateSchedule} disabled={!newSchedule.secretKey || !newSchedule.projectId || isCreatingSchedule} className="h-8 text-xs">
                  {isCreatingSchedule && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Create Schedule
                </Button>
              </div>
            </div>
          )}

          {/* ── Stats ───────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total" value={stats.totalSchedules} icon={<Settings className="h-3 w-3" />} tooltip="Total number of rotation schedules configured" />
            <StatCard label="Active" value={stats.activeSchedules} icon={<Play className="h-3 w-3 text-green-500" />} accent="text-green-600 dark:text-green-400" tooltip="Schedules currently enabled and running" />
            <StatCard label="Overdue" value={stats.overdueRotations} icon={<AlertTriangle className="h-3 w-3 text-red-500" />} accent={stats.overdueRotations > 0 ? "text-red-600 dark:text-red-400" : undefined} tooltip="Secrets past their scheduled rotation date" />
            <StatCard label="Successful" value={stats.successfulRotations} icon={<CheckCircle className="h-3 w-3 text-green-500" />} accent="text-green-600 dark:text-green-400" tooltip="Total successful rotations in history" />
            <StatCard label="Failed" value={stats.failedRotations} icon={<XCircle className="h-3 w-3 text-red-500" />} accent={stats.failedRotations > 0 ? "text-red-600 dark:text-red-400" : undefined} tooltip="Total failed rotations — review and retry" />
          </div>

          {/* ── Search ──────────────────────────── */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by secret or project..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>

          {/* ── Tabs ────────────────────────────── */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* ── Schedules Tab ─────────────────── */}
            <TabsContent value="schedules" className="space-y-4">
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Rotation Schedules</p>
                    <p className="text-xs text-muted-foreground">Automated secret rotation configurations.</p>
                  </div>
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[260px]">Each schedule automatically rotates a secret at the configured interval. Toggle the switch to pause/resume. Use the actions column to rotate immediately or delete.</TooltipContent>
                  </Tooltip>
                </div>

                {filteredSchedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Secret <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>The secret key and its branch/environment</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs">Project</TableHead>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Frequency <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>How often this secret is automatically rotated</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Next Rotation <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>When the next automatic rotation is scheduled</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Method <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>How the new secret value is generated: auto, webhook callback, or manual</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSchedules.map((schedule) => {
                          const nextStatus = getNextRotationStatus(schedule.nextRotation)
                          const isRotating = rotatingSecrets.has(schedule.id)
                          return (
                            <TableRow key={schedule.id}>
                              <TableCell>
                                <code className="text-[13px] font-medium">{schedule.secretKey}</code>
                                <p className="text-[11px] text-muted-foreground">{schedule.branch}</p>
                              </TableCell>
                              <TableCell className="text-[13px]">{schedule.projectName}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                  {getFrequencyLabel(schedule.frequency, schedule.customDays || undefined)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={`text-[13px] flex items-center gap-1 ${nextStatus.color}`}>
                                  {nextStatus.urgent && <AlertTriangle className="h-3 w-3" />}
                                  {nextStatus.text}
                                </span>
                                <p className="text-[11px] text-muted-foreground">{formatDate(schedule.nextRotation)}</p>
                              </TableCell>
                              <TableCell>
                                <span className="text-[13px] flex items-center gap-1 capitalize">
                                  <Zap className="h-3 w-3 opacity-50" />
                                  {schedule.rotationMethod.replace("-", " ")}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div><Switch checked={schedule.enabled} onCheckedChange={() => handleToggleSchedule(schedule.id)} disabled={isRotating || togglingSchedules.has(schedule.id)} /></div>
                                    </TooltipTrigger>
                                    <TooltipContent>{schedule.enabled ? "Click to pause schedule" : "Click to activate schedule"}</TooltipContent>
                                  </Tooltip>
                                  {(isRotating || togglingSchedules.has(schedule.id)) && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isRotating || togglingSchedules.has(schedule.id) || deletingSchedules.has(schedule.id)}
                                        onClick={() => setConfirmRotate(schedule)}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Rotate this secret immediately</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                                        disabled={isRotating || togglingSchedules.has(schedule.id) || deletingSchedules.has(schedule.id)}
                                        onClick={() => handleDeleteSchedule(schedule.id)}>
                                        {deletingSchedules.has(schedule.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete this rotation schedule</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <RotateCcw className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium">{searchQuery ? "No matching schedules" : "No rotation schedules"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">{searchQuery ? "Try a different search." : "Create a schedule to start rotating secrets automatically."}</p>
                    {!searchQuery && <Button size="sm" onClick={() => setShowCreatePanel(true)} className="text-xs gap-1.5"><Plus className="h-3 w-3" /> Create Schedule</Button>}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── History Tab ──────────────────── */}
            <TabsContent value="history" className="space-y-4">
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Rotation History</p>
                    <p className="text-xs text-muted-foreground">Audit log of all secret rotations.</p>
                  </div>
                  <Tooltip><TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[240px]">Complete record of every secret rotation — scheduled, manual, or emergency. Includes timing and success/failure status.</TooltipContent>
                  </Tooltip>
                </div>

                {filteredHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Secret</TableHead>
                          <TableHead className="text-xs">Project</TableHead>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Type <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>Scheduled = automatic, Manual = user-initiated, Emergency = forced rotation</TooltipContent>
                            </Tooltip>
                          </TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Rotated At</TableHead>
                          <TableHead className="text-xs">
                            <Tooltip><TooltipTrigger className="flex items-center gap-1">Duration <HelpCircle className="h-3 w-3 opacity-40" /></TooltipTrigger>
                              <TooltipContent>Time taken to complete the rotation operation</TooltipContent>
                            </Tooltip>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <code className="text-[13px] font-medium">{item.secretKey}</code>
                              <p className="text-[11px] text-muted-foreground">{item.branch}</p>
                            </TableCell>
                            <TableCell className="text-[13px]">{item.projectName}</TableCell>
                            <TableCell>
                              <span className="text-[13px] flex items-center gap-1 capitalize">
                                {item.rotationType === "scheduled" ? <Clock className="h-3 w-3 opacity-50" /> : <RefreshCw className="h-3 w-3 opacity-50" />}
                                {item.rotationType}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                item.status === "success" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}>
                                {item.status === "success" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {item.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-[13px]">{new Date(item.rotatedAt).toLocaleString()}</TableCell>
                            <TableCell className="text-[13px] tabular-nums">{item.duration}ms</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <Clock className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-medium">No rotation history</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Events will appear here after a rotation runs.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Inline Confirm Rotation (replaces Dialog) ── */}
        {confirmRotate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmRotate(null)}>
            <div className="bg-card border rounded-lg p-6 mx-4 max-w-md w-full shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Rotate secret now?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will immediately generate a new value for <code className="font-medium text-foreground">{confirmRotate.secretKey}</code> and update the database. If used in production, ensure your apps can handle the change.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmRotate(null)} className="h-8 text-xs">Cancel</Button>
                <Button size="sm" onClick={() => handleRotateNow(confirmRotate)} className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">Yes, Rotate</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </TooltipProvider>
  )
}

// ── Stat Card ───────────────────────────────────
function StatCard({ label, value, icon, accent, tooltip }: { label: string; value: number; icon: React.ReactNode; accent?: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-lg border bg-card p-4 cursor-default">
          <div className="flex items-center gap-1.5 mb-2">
            {icon}
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${accent || "text-foreground"}`}>{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
