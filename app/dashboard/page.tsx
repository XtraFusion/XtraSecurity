"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Calendar,
  GitBranch,
  Key,
  MoreHorizontal,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { getCurrentUser } from "@/lib/auth";

import type { User } from "@/lib/auth";
import { useSession } from "next-auth/react";
import { UserContext } from "@/hooks/useUser";
import axios from "axios";
import { ProjectController } from "@/util/ProjectController";
import { Project } from "@/util/Interface";
import { formatDate } from "@/util/formatDate";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error("useUser must be used within a UserProvider");
  }
  const { user, fetchUser, selectedWorkspace } = userContext;
  useEffect(() => {
    fetchUser();
  }, [status, session]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard State
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ totalEvents: 0, activeUsers: 0, failedActions: 0 });

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!session?.user?.email && status != "loading") {
      router.push("/login");
      return;
    }
  }, [status, session]);

  useEffect(() => {
    const loadData = async () => {

      setIsLoading(true);

      // Parallel Fetching
      const [projectsList, statsRes, logsRes] = await Promise.all([
        ProjectController.fetchProjects(undefined, selectedWorkspace.id), // Fetch projects for selected workspace only
        fetch(`/api/audit/stats?workspaceId=${selectedWorkspace.id}`).then(r => r.ok ? r.json() : { totalEvents: 0, activeUsers: 0, failedActions: 0 }),
        fetch(`/api/audit?pageSize=5&workspaceId=${selectedWorkspace.id}`).then(r => r.ok ? r.json() : { data: [] })
      ]);

      setProjects(projectsList);
      setDashboardStats(statsRes);
      setRecentLogs(logsRes.data || []);

      setIsLoading(false);
    };

    if (selectedWorkspace) {
      loadData();
    }
  }, [router, isCreateModalOpen, selectedWorkspace]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      name: newProject.name,
      description: newProject.description,
      workspaceId: selectedWorkspace.id,
      status: "active",
      id: "", // Will be set by server
      branches: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      securityLevel: "low",
      accessControl: "private",
      isBlocked: false,
      auditLogging: false,
      lastSecurityAudit: null,
      twoFactorRequired: false,
      passwordMinLength: 8,
      passwordRequireSpecialChars: false,
      passwordRequireNumbers: false,
      passwordExpiryDays: 90,
      ipRestrictions: [],
    };

    try {
      await ProjectController.createProject(project);
      setNewProject({ name: "", description: "" });
      setIsCreateModalOpen(false);
      // Trigger refetch by toggling modal state
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!user || isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Overview of your security posture and projects.
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <Plus className="mr-2 h-5 w-5" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Initialize a secure environment for your secrets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g. Acme Backend"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Brief description of the project..."
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>Create Project</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Activity (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Actions recorded across system</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{dashboardStats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Interacted in last 24h</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{dashboardStats.failedActions}</div>
              <p className="text-xs text-muted-foreground mt-1">Failed authentication attempts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Your Projects</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold truncate pr-4">{project.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wider font-bold">
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[40px] pt-1">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50 mt-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> {new Set(project.secrets?.map((s: any) => s.key)).size || 0}</span>
                        <span className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> {project.branches?.length || 0}</span>
                      </div>
                      <span className="text-xs opacity-70">Updated {formatDate(project.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
              )}
            </div>

            {filteredProjects.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                <p className="text-muted-foreground mb-4">No projects found.</p>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
              </div>
            )}
          </div>

          {/* Right Column: Activity Feed */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            <Card className="h-full border-none shadow-none bg-transparent pl-0 pt-0">
              <CardContent className="p-0 space-y-4">
                {recentLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-card">No recent activity</div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
                      <div className={`p-2 rounded-full h-fit shrink-0 ${log.action.includes("Fail") ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {log.user?.name || "System"} • {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                        <div className="pt-1">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {log.action.includes("Fail") ? "Failed" : "Success"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => router.push('/audit')}>View Full Audit Log</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
