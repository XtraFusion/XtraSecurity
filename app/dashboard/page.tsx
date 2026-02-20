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
  GitBranch,
  Key,
  Shield,
  Activity,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { useSession } from "next-auth/react";
import { UserContext } from "@/hooks/useUser";
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
      router.push("/login"); // Fixed: router.push instead of return
    }
  }, [status, session, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedWorkspace) return;

      setIsLoading(true);

      try {
        // Parallel Fetching
        const [projectsList, statsRes, logsRes] = await Promise.all([
          ProjectController.fetchProjects(undefined, selectedWorkspace.id),
          fetch(`/api/audit/stats?workspaceId=${selectedWorkspace.id}`).then(r => r.ok ? r.json() : { totalEvents: 0, activeUsers: 0, failedActions: 0 }),
          fetch(`/api/audit?pageSize=5&workspaceId=${selectedWorkspace.id}`).then(r => r.ok ? r.json() : { data: [] })
        ]);

        setProjects(projectsList || []);
        setDashboardStats(statsRes);
        setRecentLogs(logsRes.data || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedWorkspace) {
      loadData();
    }
  }, [selectedWorkspace, isCreateModalOpen]); // Removed router from deps to avoid loop

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
      id: "", // Server assigns ID
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
      toast.success("Project created successfully");
      // Refetch handled by dependency on isCreateModalOpen? No, actually loadData depends on it, but let's be explicit if needed. 
      // Actually loadData depends on isCreateModalOpen, so it will refetch.
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
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
      <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Overview of your security posture and projects for <span className="font-semibold text-foreground">{selectedWorkspace?.label}</span>.
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activity (24h)
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Actions recorded in this workspace
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Interacted in the last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className={`shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${dashboardStats.failedActions > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Security Incidents
              </CardTitle>
              <div className={`p-2 rounded-full ${dashboardStats.failedActions > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {dashboardStats.failedActions > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <Shield className="h-4 w-4 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${dashboardStats.failedActions > 0 ? 'text-red-600' : 'text-foreground'}`}>
                {dashboardStats.failedActions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Failed authentication or access attempts
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Main Content: Projects */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
                <p className="text-sm text-muted-foreground">Quick access to your most active projects</p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.slice(0, 6).map((project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-card/50"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold truncate">{project.name}</CardTitle>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider h-5">
                            {project.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">
                          {project.description || "No description provided."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                          <Key className="h-3 w-3" />
                          {new Set(project.secrets?.map((s: any) => s.key)).size || 0}
                        </span>
                        <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                          <GitBranch className="h-3 w-3" />
                          {project.branches?.length || 0}
                        </span>
                      </div>
                      <span className="opacity-70 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border/50 rounded-xl bg-muted/5 text-center">
                <div className="p-4 bg-muted/20 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No projects found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Get started by creating your first project to manage secrets and access securely.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </div>
            )}

            {filteredProjects.length > 6 && (
              <div className="flex justify-center pt-4">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => router.push('/projects')}>
                  View All Projects <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Activity */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Activity Feed</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => router.push('/audit')}>View All</Button>
            </div>

            <Card className="border-none shadow-none bg-transparent pl-0 pt-0">
              <CardContent className="p-0 space-y-6">
                {recentLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-8 text-center border rounded-xl bg-card border-dashed">
                    No recent activity available
                  </div>
                ) : (
                  <div className="relative border-l border-border/50 ml-4 space-y-8 py-2">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background ring-4 ring-background 
                          ${log.action.toLowerCase().includes("fail") ? "bg-red-500" :
                            log.action.toLowerCase().includes("create") ? "bg-green-500" :
                              log.action.toLowerCase().includes("delete") ? "bg-orange-500" : "bg-primary"}`}
                        />

                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-none text-foreground">
                            {log.action}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">{log.user?.name || "System"}</span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="pt-1">
                            {log.action.toLowerCase().includes("fail") && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Failed</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
