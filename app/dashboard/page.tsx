"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Calendar, GitBranch, Key, MoreHorizontal } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardSkeleton } from "@/components/loading-skeleton"
import { getCurrentUser, isAuthenticated } from "@/lib/auth"
import type { User } from "@/lib/auth"

interface Project {
  id: string
  name: string
  description: string
  secretsCount: number
  lastUpdated: string
  activeBranches: string[]
  status: "active" | "inactive" | "archived"
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Production API",
    description: "Main production environment for our API services",
    secretsCount: 24,
    lastUpdated: "2024-01-15T10:30:00Z",
    activeBranches: ["main", "staging"],
    status: "active",
  },
  {
    id: "2",
    name: "Frontend App",
    description: "React application environment variables",
    secretsCount: 12,
    lastUpdated: "2024-01-14T16:45:00Z",
    activeBranches: ["main", "dev", "feature/auth"],
    status: "active",
  },
  {
    id: "3",
    name: "Database Cluster",
    description: "Database connection strings and credentials",
    secretsCount: 8,
    lastUpdated: "2024-01-13T09:15:00Z",
    activeBranches: ["main"],
    status: "active",
  },
  {
    id: "4",
    name: "Legacy System",
    description: "Old system being phased out",
    secretsCount: 45,
    lastUpdated: "2024-01-10T14:20:00Z",
    activeBranches: ["main", "maintenance"],
    status: "archived",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
  
    if (!isAuthenticated()) {
      router.push("/login")
      return;
    }

    const currentUser = getCurrentUser()
    setUser(currentUser)

    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setProjects(mockProjects)
      setIsLoading(false)
    }

    loadData()
  }, [router])

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      secretsCount: 0,
      lastUpdated: new Date().toISOString(),
      activeBranches: ["main"],
      status: "active",
    }

    setProjects([project, ...projects])
    setNewProject({ name: "", description: "" })
    setIsCreateModalOpen(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (!user || isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {user.name}</h1>
            <p className="text-muted-foreground mt-1">Manage your environment variables and secrets</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to manage environment variables and secrets.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Enter project name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Enter project description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} className="w-full sm:w-auto">
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{filteredProjects.length} projects</span>
            <span>{filteredProjects.reduce((acc, p) => acc + p.secretsCount, 0)} total secrets</span>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle more options
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2 text-sm">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Key className="h-4 w-4" />
                    <span>{project.secretsCount} secrets</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    <span>{project.activeBranches.length} branches</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {formatDate(project.lastUpdated)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.activeBranches.slice(0, 3).map((branch) => (
                    <Badge key={branch} variant="secondary" className="text-xs">
                      {branch}
                    </Badge>
                  ))}
                  {project.activeBranches.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.activeBranches.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchQuery ? "No projects found matching your search." : "No projects yet."}
            </div>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                Create your first project
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
