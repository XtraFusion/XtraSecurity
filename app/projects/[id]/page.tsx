"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Search,
  Plus,
  GitBranch,
  MoreHorizontal,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  History,
  Copy,
  Check,
  ChevronRight,
  Home,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { isAuthenticated } from "@/lib/auth"
import Link from "next/link"

interface SecretVersion {
  version: number
  value: string
  description: string
  updatedBy: string
  updatedAt: string
  changeReason?: string
}

interface Secret {
  id: string
  key: string
  value: string
  description: string
  environment: "development" | "staging" | "production"
  lastUpdated: string
  updatedBy: string
  version: number
  versions?: SecretVersion[] // Added version history
}

interface Project {
  id: string
  name: string
  description: string
  branches: string[]
  secrets: Record<string, Secret[]> // branch -> secrets
}

const mockProject: Project = {
  id: "1",
  name: "Production API",
  description: "Main production environment for our API services",
  branches: ["main", "staging", "dev", "feature/auth"],
  secrets: {
    main: [
      {
        id: "1",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/prod",
        description: "Main database connection string",
        environment: "production",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "admin@example.com",
        version: 3,
        versions: [
          {
            version: 3,
            value: "postgresql://user:pass@localhost:5432/prod",
            description: "Main database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-15T10:30:00Z",
            changeReason: "Updated connection pool settings",
          },
          {
            version: 2,
            value: "postgresql://user:pass@localhost:5432/prod_v2",
            description: "Main database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-14T14:20:00Z",
            changeReason: "Migrated to new database server",
          },
          {
            version: 1,
            value: "postgresql://user:pass@localhost:5432/prod_old",
            description: "Main database connection string",
            updatedBy: "dev@example.com",
            updatedAt: "2024-01-10T09:15:00Z",
            changeReason: "Initial setup",
          },
        ],
      },
      {
        id: "2",
        key: "API_SECRET_KEY",
        value: "sk_live_abcd1234567890",
        description: "Secret key for API authentication",
        environment: "production",
        lastUpdated: "2024-01-14T16:45:00Z",
        updatedBy: "admin@example.com",
        version: 1,
        versions: [
          {
            version: 1,
            value: "sk_live_abcd1234567890",
            description: "Secret key for API authentication",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-14T16:45:00Z",
            changeReason: "Initial API key generation",
          },
        ],
      },
      {
        id: "3",
        key: "REDIS_URL",
        value: "redis://localhost:6379",
        description: "Redis cache connection",
        environment: "production",
        lastUpdated: "2024-01-13T09:15:00Z",
        updatedBy: "dev@example.com",
        version: 2,
        versions: [
          {
            version: 2,
            value: "redis://localhost:6379",
            description: "Redis cache connection",
            updatedBy: "dev@example.com",
            updatedAt: "2024-01-13T09:15:00Z",
            changeReason: "Updated cache settings",
          },
          {
            version: 1,
            value: "redis://localhost:6378",
            description: "Redis cache connection",
            updatedBy: "dev@example.com",
            updatedAt: "2024-01-12T08:00:00Z",
            changeReason: "Initial cache setup",
          },
        ],
      },
    ],
    staging: [
      {
        id: "4",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/staging",
        description: "Staging database connection string",
        environment: "staging",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "admin@example.com",
        version: 2,
        versions: [
          {
            version: 2,
            value: "postgresql://user:pass@localhost:5432/staging",
            description: "Staging database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-15T10:30:00Z",
            changeReason: "Updated connection pool settings",
          },
          {
            version: 1,
            value: "postgresql://user:pass@localhost:5432/staging_v1",
            description: "Staging database connection string",
            updatedBy: "admin@example.com",
            updatedAt: "2024-01-14T14:20:00Z",
            changeReason: "Initial staging setup",
          },
        ],
      },
    ],
    dev: [
      {
        id: "5",
        key: "DATABASE_URL",
        value: "postgresql://user:pass@localhost:5432/dev",
        description: "Development database connection string",
        environment: "development",
        lastUpdated: "2024-01-15T10:30:00Z",
        updatedBy: "dev@example.com",
        version: 1,
        versions: [
          {
            version: 1,
            value: "postgresql://user:pass@localhost:5432/dev",
            description: "Development database connection string",
            updatedBy: "dev@example.com",
            updatedAt: "2024-01-15T10:30:00Z",
            changeReason: "Initial development setup",
          },
        ],
      },
    ],
  },
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [selectedBranch, setSelectedBranch] = useState("main")
  const [newBranch, setNewBranch] = useState<any>("");
  const [compareResult, setCompareResult] = useState("");
  const [branches,setBranches]=useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)
  const [isAddSecretOpen, setIsAddSecretOpen] = useState(false)
  const [isEditSecretOpen, setIsEditSecretOpen] = useState(false)
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [newSecret, setNewSecret] = useState({
    key: "",
    value: "",
    description: "",
    environment: "development" as const,
  })
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historySecret, setHistorySecret] = useState<Secret | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadProject = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProject(mockProject)
      setIsLoading(false)
    }
    const handleCreate = () => {
    if (newBranch.trim() && !branches.includes(newBranch)) {
      setBranches([...branches, newBranch]);
      setNewBranch("");
    }
  };

  // Delete Branch
  const handleDelete = (branch:any) => {
    if (branch !== "main") {
      setBranches(branches.filter((b:any) => b !== branch));
    } else {
      alert("Main branch cannot be deleted!");
    }
  };

  // Compare Branches
  const handleCompare = (branch1:any, branch2:any) => {
    if (branch1 === branch2) {
      setCompareResult("Both branches are the same.");
    } else {
      setCompareResult(`Showing comparison between ${branch1} and ${branch2}.`);
    }
  };

    loadProject()
  }, [router, projectId])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const currentSecrets = project?.secrets[selectedBranch] || []
  const filteredSecrets = currentSecrets.filter(
    (secret) =>
      secret.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets)
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId)
    } else {
      newVisible.add(secretId)
    }
    setVisibleSecrets(newVisible)
  }

  const copyToClipboard = async (text: string, secretId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSecret(secretId)
      setTimeout(() => setCopiedSecret(null), 2000)
    } catch (err) {
      setNotification({ type: "error", message: "Failed to copy to clipboard" })
    }
  }

  const handleAddSecret = () => {
    if (!project || !newSecret.key.trim() || !newSecret.value.trim()) return

    const secret: Secret = {
      id: Date.now().toString(),
      key: newSecret.key,
      value: newSecret.value,
      description: newSecret.description,
      environment: newSecret.environment,
      lastUpdated: new Date().toISOString(),
      updatedBy: "admin@example.com",
      version: 1,
    }

    const updatedProject = {
      ...project,
      secrets: {
        ...project.secrets,
        [selectedBranch]: [...(project.secrets[selectedBranch] || []), secret],
      },
    }

    setProject(updatedProject)
    setNewSecret({ key: "", value: "", description: "", environment: "development" })
    setIsAddSecretOpen(false)
    setNotification({ type: "success", message: "Secret added successfully" })
  }

  const handleEditSecret = () => {
    if (!project || !editingSecret) return

    const updatedSecrets = project.secrets[selectedBranch].map((secret) =>
      secret.id === editingSecret.id
        ? {
            ...editingSecret,
            lastUpdated: new Date().toISOString(),
            version: secret.version + 1,
          }
        : secret,
    )

    const updatedProject = {
      ...project,
      secrets: {
        ...project.secrets,
        [selectedBranch]: updatedSecrets,
      },
    }

    setProject(updatedProject)
    setEditingSecret(null)
    setIsEditSecretOpen(false)
    setNotification({ type: "success", message: "Secret updated successfully" })
  }

  const handleDeleteSecret = (secretId: string) => {
    if (!project) return

    const updatedSecrets = project.secrets[selectedBranch].filter((secret) => secret.id !== secretId)
    const updatedProject = {
      ...project,
      secrets: {
        ...project.secrets,
        [selectedBranch]: updatedSecrets,
      },
    }

    setProject(updatedProject)
    setNotification({ type: "success", message: "Secret deleted successfully" })
  }

  const handleRollbackSecret = (secret: Secret, targetVersion: SecretVersion) => {
    if (!project) return

    const updatedSecret = {
      ...secret,
      value: targetVersion.value,
      description: targetVersion.description,
      lastUpdated: new Date().toISOString(),
      version: secret.version + 1,
      versions: [
        {
          version: secret.version + 1,
          value: targetVersion.value,
          description: targetVersion.description,
          updatedBy: "admin@example.com",
          updatedAt: new Date().toISOString(),
          changeReason: `Rolled back to version ${targetVersion.version}`,
        },
        ...(secret.versions || []),
      ],
    }

    const updatedSecrets = project.secrets[selectedBranch].map((s) => (s.id === secret.id ? updatedSecret : s))

    const updatedProject = {
      ...project,
      secrets: {
        ...project.secrets,
        [selectedBranch]: updatedSecrets,
      },
    }

    setProject(updatedProject)
    setIsHistoryModalOpen(false)
    setNotification({ type: "success", message: `Secret rolled back to version ${targetVersion.version}` })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case "production":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "staging":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "development":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>

          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Search skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-10 bg-muted rounded w-80 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>

          {/* Table skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded">
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-28 animate-pulse"></div>
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

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground">Project not found</div>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
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

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground overflow-x-auto">
          <Link href="/dashboard" className="hover:text-foreground flex items-center gap-1 whitespace-nowrap">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link href="/projects" className="hover:text-foreground whitespace-nowrap">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{project.name}</span>
        </nav>
        

        {/* Project Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {project.branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddSecretOpen} onOpenChange={setIsAddSecretOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Secret
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Secret</DialogTitle>
                  <DialogDescription>
                    Add a new environment variable or secret to {selectedBranch} branch.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secret-key">Key</Label>
                    <Input
                      id="secret-key"
                      placeholder="e.g., DATABASE_URL"
                      value={newSecret.key}
                      onChange={(e) => setNewSecret({ ...newSecret, key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret-value">Value</Label>
                    <Textarea
                      id="secret-value"
                      placeholder="Enter the secret value"
                      value={newSecret.value}
                      onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret-description">Description</Label>
                    <Input
                      id="secret-description"
                      placeholder="Brief description of this secret"
                      value={newSecret.description}
                      onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret-environment">Environment</Label>
                    <Select
                      value={newSecret.environment}
                      onValueChange={(value) => setNewSecret({ ...newSecret, environment: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddSecretOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleAddSecret} className="w-full sm:w-auto">
                      Add Secret
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search secrets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredSecrets.length} secrets in {selectedBranch}
            </span>
          </div>
        </div>

        {/* Secrets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables & Secrets</CardTitle>
            <CardDescription>Manage environment variables and secrets for the {selectedBranch} branch</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSecrets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Key</TableHead>
                      <TableHead className="min-w-[200px]">Value</TableHead>
                      <TableHead className="min-w-[120px]">Environment</TableHead>
                      <TableHead className="min-w-[150px]">Last Updated</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecrets.map((secret) => (
                      <TableRow key={secret.id} className="group">
                        <TableCell className="font-mono font-medium">{secret.key}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm max-w-xs truncate">
                              {visibleSecrets.has(secret.id) ? secret.value : "••••••••"}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSecretVisibility(secret.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {visibleSecrets.has(secret.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(secret.value, secret.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedSecret === secret.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEnvironmentColor(secret.environment)}>{secret.environment}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>
                            <div>{formatDate(secret.lastUpdated)}</div>
                            <div className="text-xs">by {secret.updatedBy}</div>
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
                                  setEditingSecret(secret)
                                  setIsEditSecretOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setHistorySecret(secret)
                                  setIsHistoryModalOpen(true)
                                }}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteSecret(secret.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
                  {searchQuery ? "No secrets found matching your search." : "No secrets in this branch yet."}
                </div>
                {!searchQuery && (
                  <Button onClick={() => setIsAddSecretOpen(true)} className="w-full sm:w-auto">
                    Add your first secret
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Secret Dialog */}
        <Dialog open={isEditSecretOpen} onOpenChange={setIsEditSecretOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Secret</DialogTitle>
              <DialogDescription>Update the secret value and description.</DialogDescription>
            </DialogHeader>
            {editingSecret && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-key">Key</Label>
                  <Input
                    id="edit-key"
                    value={editingSecret.key}
                    onChange={(e) => setEditingSecret({ ...editingSecret, key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-value">Value</Label>
                  <Textarea
                    id="edit-value"
                    value={editingSecret.value}
                    onChange={(e) => setEditingSecret({ ...editingSecret, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingSecret.description}
                    onChange={(e) => setEditingSecret({ ...editingSecret, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-environment">Environment</Label>
                  <Select
                    value={editingSecret.environment}
                    onValueChange={(value) => setEditingSecret({ ...editingSecret, environment: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditSecretOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleEditSecret} className="w-full sm:w-auto">
                    Update Secret
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Version History Dialog */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version History</DialogTitle>
              <DialogDescription>
                {historySecret && `View and manage version history for ${historySecret.key}`}
              </DialogDescription>
            </DialogHeader>
            {historySecret && historySecret.versions && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Current version: {historySecret.version} • {historySecret.versions.length} total versions
                </div>
                <div className="space-y-3">
                  {historySecret.versions.map((version, index) => (
                    <Card
                      key={version.version}
                      className={version.version === historySecret.version ? "border-primary" : ""}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={version.version === historySecret.version ? "default" : "secondary"}>
                              Version {version.version}
                            </Badge>
                            {version.version === historySecret.version && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(version.updatedAt)}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">Updated by: {version.updatedBy}</div>
                          {version.changeReason && (
                            <div className="text-muted-foreground mt-1">Reason: {version.changeReason}</div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">VALUE</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-muted px-2 py-1 rounded text-sm flex-1 break-all">
                              {visibleSecrets.has(`${historySecret.id}-v${version.version}`)
                                ? version.value
                                : "••••••••"}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const key = `${historySecret.id}-v${version.version}`
                                const newVisible = new Set(visibleSecrets)
                                if (newVisible.has(key)) {
                                  newVisible.delete(key)
                                } else {
                                  newVisible.add(key)
                                }
                                setVisibleSecrets(newVisible)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {visibleSecrets.has(`${historySecret.id}-v${version.version}`) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(version.value, `${historySecret.id}-v${version.version}`)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedSecret === `${historySecret.id}-v${version.version}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {version.description && (
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">DESCRIPTION</Label>
                            <div className="text-sm mt-1">{version.description}</div>
                          </div>
                        )}
                        {version.version !== historySecret.version && (
                          <div className="flex justify-end pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollbackSecret(historySecret, version)}
                              className="text-xs"
                            >
                              Rollback to this version
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
