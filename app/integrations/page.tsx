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
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  GitBranch,
  Container,
  Zap,
  Activity,
  Clock,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
// import { isAuthenticated } from "@/lib/auth"

interface CICDIntegration {
  id: string
  name: string
  type: "github-actions" | "jenkins" | "kubernetes" | "docker" | "gitlab-ci" | "azure-devops"
  enabled: boolean
  status: "connected" | "disconnected" | "error" | "pending"
  config: {
    url?: string
    token?: string
    namespace?: string
    repository?: string
    branch?: string
    webhookUrl?: string
  }
  secretsInjection: {
    enabled: boolean
    method: "env-vars" | "files" | "vault" | "k8s-secrets"
    projects: string[]
    branches: string[]
  }
  lastSync: string
  createdBy: string
  createdAt: string
}

interface PipelineRun {
  id: string
  integrationId: string
  integrationName: string
  project: string
  branch: string
  status: "running" | "success" | "failed" | "cancelled"
  startedAt: string
  completedAt?: string
  duration?: number
  secretsInjected: number
  logs?: string[]
  triggeredBy: string
}

interface SecretInjectionRule {
  id: string
  name: string
  integrationId: string
  integrationName: string
  enabled: boolean
  projects: string[]
  branches: string[]
  secrets: string[]
  method: "env-vars" | "files" | "vault" | "k8s-secrets"
  config: {
    prefix?: string
    filePath?: string
    namespace?: string
  }
  createdAt: string
}

const mockIntegrations: CICDIntegration[] = [
  {
    id: "1",
    name: "Production GitHub Actions",
    type: "github-actions",
    enabled: true,
    status: "connected",
    config: {
      repository: "company/production-api",
      branch: "main",
      token: "ghp_****",
      webhookUrl: "https://api.github.com/repos/company/production-api/hooks",
    },
    secretsInjection: {
      enabled: true,
      method: "env-vars",
      projects: ["prod-api", "analytics"],
      branches: ["main", "staging"],
    },
    lastSync: "2024-01-15T10:30:00Z",
    createdBy: "admin@example.com",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jenkins Build Server",
    type: "jenkins",
    enabled: true,
    status: "connected",
    config: {
      url: "https://jenkins.company.com",
      token: "jenkins_****",
    },
    secretsInjection: {
      enabled: true,
      method: "env-vars",
      projects: ["legacy-app"],
      branches: ["main", "develop"],
    },
    lastSync: "2024-01-15T09:45:00Z",
    createdBy: "devops@example.com",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Kubernetes Cluster",
    type: "kubernetes",
    enabled: false,
    status: "error",
    config: {
      url: "https://k8s.company.com",
      namespace: "production",
      token: "k8s_****",
    },
    secretsInjection: {
      enabled: false,
      method: "k8s-secrets",
      projects: ["microservices"],
      branches: ["main"],
    },
    lastSync: "2024-01-14T16:20:00Z",
    createdBy: "k8s-admin@example.com",
    createdAt: "2024-01-03T00:00:00Z",
  },
]

const mockPipelineRuns: PipelineRun[] = [
  {
    id: "1",
    integrationId: "1",
    integrationName: "Production GitHub Actions",
    project: "Production API",
    branch: "main",
    status: "success",
    startedAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:35:00Z",
    duration: 300000,
    secretsInjected: 5,
    triggeredBy: "admin@example.com",
    logs: [
      "Starting pipeline execution...",
      "Injecting secrets for Production API",
      "DATABASE_URL injected as environment variable",
      "API_SECRET_KEY injected as environment variable",
      "REDIS_URL injected as environment variable",
      "Pipeline completed successfully",
    ],
  },
  {
    id: "2",
    integrationId: "2",
    integrationName: "Jenkins Build Server",
    project: "Legacy App",
    branch: "develop",
    status: "failed",
    startedAt: "2024-01-15T09:45:00Z",
    completedAt: "2024-01-15T09:50:00Z",
    duration: 300000,
    secretsInjected: 0,
    triggeredBy: "dev@example.com",
    logs: [
      "Starting Jenkins build...",
      "Error: Failed to authenticate with secret management system",
      "Build failed due to missing secrets",
    ],
  },
  {
    id: "3",
    integrationId: "1",
    integrationName: "Production GitHub Actions",
    project: "Analytics Service",
    branch: "staging",
    status: "running",
    startedAt: "2024-01-15T11:00:00Z",
    secretsInjected: 3,
    triggeredBy: "analytics@example.com",
    logs: [
      "Starting pipeline execution...",
      "Injecting secrets for Analytics Service",
      "DATABASE_URL injected as environment variable",
      "Currently running tests...",
    ],
  },
]

const mockInjectionRules: SecretInjectionRule[] = [
  {
    id: "1",
    name: "Production API Secrets",
    integrationId: "1",
    integrationName: "Production GitHub Actions",
    enabled: true,
    projects: ["prod-api"],
    branches: ["main"],
    secrets: ["DATABASE_URL", "API_SECRET_KEY", "REDIS_URL"],
    method: "env-vars",
    config: {
      prefix: "PROD_",
    },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Staging Environment",
    integrationId: "1",
    integrationName: "Production GitHub Actions",
    enabled: true,
    projects: ["prod-api", "analytics"],
    branches: ["staging"],
    secrets: ["DATABASE_URL", "CACHE_URL"],
    method: "files",
    config: {
      filePath: "/app/.env",
    },
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "K8s Production Secrets",
    integrationId: "3",
    integrationName: "Kubernetes Cluster",
    enabled: false,
    projects: ["microservices"],
    branches: ["main"],
    secrets: ["DATABASE_URL", "API_SECRET_KEY"],
    method: "k8s-secrets",
    config: {
      namespace: "production",
    },
    createdAt: "2024-01-03T00:00:00Z",
  },
]

export default function IntegrationsPage() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<CICDIntegration[]>(mockIntegrations)
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>(mockPipelineRuns)
  const [injectionRules, setInjectionRules] = useState<SecretInjectionRule[]>(mockInjectionRules)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("integrations")
  const [isCreateIntegrationOpen, setIsCreateIntegrationOpen] = useState(false)
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  type IntegrationType = "github-actions" | "jenkins" | "kubernetes" | "docker" | "gitlab-ci" | "azure-devops"
  type InjectionMethod = "env-vars" | "files" | "vault" | "k8s-secrets"

  const [newIntegration, setNewIntegration] = useState<{
    name: string
    type: IntegrationType
    config: Record<string, any>
    secretsInjection: { method: InjectionMethod; projects: string[]; branches: string[] }
  }>({
    name: "",
    type: "github-actions",
    config: {
      url: "",
      token: "",
      repository: "",
      branch: "main",
      namespace: "",
    },
    secretsInjection: {
      method: "env-vars",
      projects: [] as string[],
      branches: ["main"] as string[],
    },
  })

  const [newRule, setNewRule] = useState<{
    name: string
    integrationId: string
    projects: string[]
    branches: string[]
    secrets: string[]
    method: InjectionMethod
    config: { prefix?: string; filePath?: string; namespace?: string }
  }>({
    name: "",
    integrationId: "",
    projects: [] as string[],
    branches: [] as string[],
    secrets: [] as string[],
    method: "env-vars",
    config: {
      prefix: "",
      filePath: "",
      namespace: "",
    },
  })

  useEffect(() => {
    // if (!isAuthenticated()) {
    //   router.push("/login")
    //   return
    // }

    const loadData = async () => {
      try {
        const res = await fetch('/api/integrations')
        if (res.ok) {
          const json = await res.json()
          const items = (json.integrations || []).map((it: any) => ({
            id: it.id,
            name: it.name,
            type: it.type === 'github' ? 'github-actions' : it.type,
            enabled: it.enabled,
            status: it.status === 'connected' ? 'connected' : it.status || 'disconnected',
            config: it.config || {},
            secretsInjection: it.secretsInjection || { enabled: false, method: 'env-vars', projects: [], branches: [] },
            lastSync: it.updatedAt || it.createdAt || new Date().toISOString(),
            createdBy: it.createdBy || '',
            createdAt: it.createdAt || new Date().toISOString(),
          }))
          setIntegrations(items)
        } else {
          console.error('Failed to load integrations')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const filteredIntegrations = integrations.filter(
    (integration) =>
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredPipelineRuns = pipelineRuns.filter(
    (run) =>
      run.integrationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.branch.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredInjectionRules = injectionRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.integrationName.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "disconnected":
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "error":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "pending":
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "github-actions":
        return <GitBranch className="h-4 w-4" />
      case "jenkins":
        return <Settings className="h-4 w-4" />
      case "kubernetes":
        return <Container className="h-4 w-4" />
      case "docker":
        return <Container className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "pending":
      case "running":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleCreateIntegration = () => {
    if (!newIntegration.name) return
    // call backend API to create integration
    ;(async () => {
      try {
        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newIntegration.name,
            type: newIntegration.type === 'github-actions' ? 'github' : newIntegration.type,
            config: newIntegration.config,
          }),
        })
        if (res.ok) {
          const json = await res.json()
          setIntegrations([...integrations, { ...(json.integration as any), secretsInjection: { enabled: true, ...newIntegration.secretsInjection }, lastSync: new Date().toISOString(), createdBy: json.integration.createdBy || 'you' }])
          setNotification({ type: 'success', message: 'Integration created successfully' })
          setIsCreateIntegrationOpen(false)
          setNewIntegration({
            name: '',
            type: 'github-actions',
            config: { url: '', token: '', repository: '', branch: 'main', namespace: '' },
            secretsInjection: { method: 'env-vars', projects: [], branches: ['main'] },
          })
        } else {
          const err = await res.json()
          setNotification({ type: 'error', message: err?.error || 'Failed to create integration' })
        }
      } catch (err) {
        console.error(err)
        setNotification({ type: 'error', message: 'Failed to create integration' })
      }
    })()
  }

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.integrationId || !newRule.secrets.length) return

    const integration = integrations.find((i) => i.id === newRule.integrationId)
    const rule: SecretInjectionRule = {
      id: Date.now().toString(),
      name: newRule.name,
      integrationId: newRule.integrationId,
      integrationName: integration?.name || "Unknown",
      enabled: true,
      projects: newRule.projects,
      branches: newRule.branches,
      secrets: newRule.secrets,
      method: newRule.method,
      config: newRule.config,
      createdAt: new Date().toISOString(),
    }

    setInjectionRules([...injectionRules, rule])
    setNewRule({
      name: "",
      integrationId: "",
      projects: [],
      branches: [],
      secrets: [],
      method: "env-vars",
      config: {
        prefix: "",
        filePath: "",
        namespace: "",
      },
    })
    setIsCreateRuleOpen(false)
    setNotification({ type: "success", message: "Injection rule created successfully" })
  }

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === integrationId ? { ...integration, enabled: !integration.enabled } : integration,
      ),
    )
    setNotification({ type: "success", message: "Integration updated successfully" })
  }

  const handleToggleRule = (ruleId: string) => {
    setInjectionRules(injectionRules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
    setNotification({ type: "success", message: "Rule updated successfully" })
  }

  const handleDeleteIntegration = (integrationId: string) => {
    ;(async () => {
      try {
        const res = await fetch(`/api/integrations?id=${integrationId}`, { method: 'DELETE' })
        if (res.ok) {
          setIntegrations(integrations.filter((integration) => integration.id !== integrationId))
          setNotification({ type: 'success', message: 'Integration deleted successfully' })
        } else {
          setNotification({ type: 'error', message: 'Failed to delete integration' })
        }
      } catch (err) {
        console.error(err)
        setNotification({ type: 'error', message: 'Failed to delete integration' })
      }
    })()
  }

  const handleTestIntegration = async (provider: string, config: any) => {
    try {
      const res = await fetch('/api/integrations/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, config }) })
      if (res.ok) {
        const json = await res.json()
        if (json.ok) setNotification({ type: 'success', message: 'Connection successful' })
        else setNotification({ type: 'error', message: json.error || 'Connection failed' })
      } else {
        setNotification({ type: 'error', message: 'Connection failed' })
      }
    } catch (err) {
      console.error(err)
      setNotification({ type: 'error', message: 'Connection failed' })
    }
  }

  const handleDeleteRule = (ruleId: string) => {
    setInjectionRules(injectionRules.filter((rule) => rule.id !== ruleId))
    setNotification({ type: "success", message: "Rule deleted successfully" })
  }

  const stats = {
    totalIntegrations: integrations.length,
    connectedIntegrations: integrations.filter((i) => i.status === "connected").length,
    activeRules: injectionRules.filter((r) => r.enabled).length,
    recentRuns: pipelineRuns.length,
    successfulRuns: pipelineRuns.filter((r) => r.status === "success").length,
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">CI/CD Integrations</h1>
            <p className="text-muted-foreground">Manage CI/CD pipelines and secret injection configurations</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Injection Rule</DialogTitle>
                  <DialogDescription>Configure how secrets are injected into your CI/CD pipelines</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      placeholder="e.g., Production API Secrets"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integration">Integration</Label>
                    <Select
                      value={newRule.integrationId}
                      onValueChange={(value) => setNewRule({ ...newRule, integrationId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select integration" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations
                          .filter((i) => i.enabled)
                          .map((integration) => (
                            <SelectItem key={integration.id} value={integration.id}>
                              {integration.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injection-method">Injection Method</Label>
                    <Select
                      value={newRule.method}
                      onValueChange={(value) => setNewRule({ ...newRule, method: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="env-vars">Environment Variables</SelectItem>
                        <SelectItem value="files">Files</SelectItem>
                        <SelectItem value="vault">HashiCorp Vault</SelectItem>
                        <SelectItem value="k8s-secrets">Kubernetes Secrets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Projects</Label>
                    <Input
                      placeholder="Enter project names (comma-separated)"
                      value={newRule.projects.join(", ")}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          projects: e.target.value
                            .split(",")
                            .map((p) => p.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branches</Label>
                    <Input
                      placeholder="Enter branch names (comma-separated)"
                      value={newRule.branches.join(", ")}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          branches: e.target.value
                            .split(",")
                            .map((b) => b.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secrets</Label>
                    <Input
                      placeholder="Enter secret keys (comma-separated)"
                      value={newRule.secrets.join(", ")}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          secrets: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                  {newRule.method === "env-vars" && (
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Environment Variable Prefix</Label>
                      <Input
                        id="prefix"
                        placeholder="e.g., PROD_"
                        value={newRule.config.prefix}
                        onChange={(e) =>
                          setNewRule({ ...newRule, config: { ...newRule.config, prefix: e.target.value } })
                        }
                      />
                    </div>
                  )}
                  {newRule.method === "files" && (
                    <div className="space-y-2">
                      <Label htmlFor="file-path">File Path</Label>
                      <Input
                        id="file-path"
                        placeholder="e.g., /app/.env"
                        value={newRule.config.filePath}
                        onChange={(e) =>
                          setNewRule({ ...newRule, config: { ...newRule.config, filePath: e.target.value } })
                        }
                      />
                    </div>
                  )}
                  {newRule.method === "k8s-secrets" && (
                    <div className="space-y-2">
                      <Label htmlFor="namespace">Kubernetes Namespace</Label>
                      <Input
                        id="namespace"
                        placeholder="e.g., production"
                        value={newRule.config.namespace}
                        onChange={(e) =>
                          setNewRule({ ...newRule, config: { ...newRule.config, namespace: e.target.value } })
                        }
                      />
                    </div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRule} className="w-full sm:w-auto">
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateIntegrationOpen} onOpenChange={setIsCreateIntegrationOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create CI/CD Integration</DialogTitle>
                  <DialogDescription>Connect your CI/CD pipeline to enable secret injection</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="integration-name">Integration Name</Label>
                    <Input
                      id="integration-name"
                      placeholder="e.g., Production GitHub Actions"
                      value={newIntegration.name}
                      onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integration-type">Integration Type</Label>
                    <Select
                      value={newIntegration.type}
                      onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github-actions">GitHub Actions</SelectItem>
                        <SelectItem value="jenkins">Jenkins</SelectItem>
                        <SelectItem value="kubernetes">Kubernetes</SelectItem>
                        <SelectItem value="docker">Docker</SelectItem>
                        <SelectItem value="gitlab-ci">GitLab CI</SelectItem>
                        <SelectItem value="azure-devops">Azure DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newIntegration.type === "jenkins" || newIntegration.type === "kubernetes") && (
                    <div className="space-y-2">
                      <Label htmlFor="url">Server URL</Label>
                      <Input
                        id="url"
                        placeholder="https://jenkins.company.com"
                        value={newIntegration.config.url}
                        onChange={(e) =>
                          setNewIntegration({
                            ...newIntegration,
                            config: { ...newIntegration.config, url: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}
                  {newIntegration.type === "github-actions" && (
                    <div className="space-y-2">
                      <Label htmlFor="repository">Repository</Label>
                      <Input
                        id="repository"
                        placeholder="owner/repository"
                        value={newIntegration.config.repository}
                        onChange={(e) =>
                          setNewIntegration({
                            ...newIntegration,
                            config: { ...newIntegration.config, repository: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}
                  {newIntegration.type === "kubernetes" && (
                    <div className="space-y-2">
                      <Label htmlFor="namespace">Namespace</Label>
                      <Input
                        id="namespace"
                        placeholder="production"
                        value={newIntegration.config.namespace}
                        onChange={(e) =>
                          setNewIntegration({
                            ...newIntegration,
                            config: { ...newIntegration.config, namespace: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="token">Access Token</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="Enter access token"
                      value={newIntegration.config.token}
                      onChange={(e) =>
                        setNewIntegration({
                          ...newIntegration,
                          config: { ...newIntegration.config, token: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injection-method">Default Injection Method</Label>
                    <Select
                      value={newIntegration.secretsInjection.method}
                      onValueChange={(value) =>
                        setNewIntegration({
                          ...newIntegration,
                          secretsInjection: { ...newIntegration.secretsInjection, method: value as any },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="env-vars">Environment Variables</SelectItem>
                        <SelectItem value="files">Files</SelectItem>
                        <SelectItem value="vault">HashiCorp Vault</SelectItem>
                        <SelectItem value="k8s-secrets">Kubernetes Secrets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateIntegrationOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateIntegration} className="w-full sm:w-auto">
                      Create Integration
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Integrations</div>
              </div>
              <div className="text-2xl font-bold">{stats.totalIntegrations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Connected</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.connectedIntegrations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-muted-foreground">Active Rules</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeRules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium text-muted-foreground">Recent Runs</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.recentRuns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Successful</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.successfulRuns}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations, runs, and rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="runs">Pipeline Runs</TabsTrigger>
            <TabsTrigger value="rules">Injection Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CI/CD Integrations</CardTitle>
                <CardDescription>Manage your CI/CD pipeline integrations</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredIntegrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Integration</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Secrets Injection</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIntegrations.map((integration) => (
                          <TableRow key={integration.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{integration.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {integration.config.repository ||
                                    integration.config.url ||
                                    integration.config.namespace}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(integration.type)}
                                <span className="capitalize">{integration.type.replace("-", " ")}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(integration.status)}>
                                {getStatusIcon(integration.status)}
                                <span className="ml-1 capitalize">{integration.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={integration.secretsInjection.enabled}
                                    onCheckedChange={() => {
                                      /* Handle toggle */
                                    }}
                                    size="sm"
                                  />
                                  <span className="text-sm capitalize">
                                    {integration.secretsInjection.method.replace("-", " ")}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {integration.secretsInjection.projects.length} projects
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(integration.lastSync)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={integration.enabled}
                                  onCheckedChange={() => handleToggleIntegration(integration.id)}
                                />
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
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Integration
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleTestIntegration(
                                          integration.type?.toString().startsWith("github") ? "github" : integration.type,
                                          integration.config,
                                        )
                                      }
                                    >
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Test Connection
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Logs
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteIntegration(integration.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "No integrations found matching your search."
                        : "No CI/CD integrations configured yet."}
                    </div>
                    {!searchQuery && (
                      <Button onClick={() => setIsCreateIntegrationOpen(true)}>Create your first integration</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="runs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Runs</CardTitle>
                <CardDescription>Monitor CI/CD pipeline executions and secret injections</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPipelineRuns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pipeline</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Secrets</TableHead>
                          <TableHead>Triggered By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPipelineRuns.map((run) => (
                          <TableRow key={run.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{run.integrationName}</div>
                                <div className="text-sm text-muted-foreground">{run.branch}</div>
                              </div>
                            </TableCell>
                            <TableCell>{run.project}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(run.status)}>
                                {getStatusIcon(run.status)}
                                <span className="ml-1 capitalize">{run.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {run.duration
                                ? formatDuration(run.duration)
                                : run.status === "running"
                                  ? "Running..."
                                  : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-blue-600" />
                                <span className="text-sm">{run.secretsInjected}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{run.triggeredBy}</TableCell>
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
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Logs
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open in CI/CD
                                  </DropdownMenuItem>
                                  {run.status === "running" && (
                                    <DropdownMenuItem className="text-destructive">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Run
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
                      {searchQuery ? "No pipeline runs found matching your search." : "No pipeline runs available yet."}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Secret Injection Rules</CardTitle>
                <CardDescription>Configure how secrets are injected into your CI/CD pipelines</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredInjectionRules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Integration</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Projects</TableHead>
                          <TableHead>Secrets</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInjectionRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Branches: {rule.branches.join(", ")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{rule.integrationName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {rule.method.replace("-", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.projects.slice(0, 2).map((project) => (
                                  <Badge key={project} variant="secondary" className="text-xs">
                                    {project}
                                  </Badge>
                                ))}
                                {rule.projects.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{rule.projects.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-blue-600" />
                                <span className="text-sm">{rule.secrets.length}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch checked={rule.enabled} onCheckedChange={() => handleToggleRule(rule.id)} />
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
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Rule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Rule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Rule
                                  </DropdownMenuItem>
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
                    <div className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "No injection rules found matching your search."
                        : "No injection rules configured yet."}
                    </div>
                    {!searchQuery && <Button onClick={() => setIsCreateRuleOpen(true)}>Create your first rule</Button>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
