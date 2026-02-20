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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Folder,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  List,
  MoreVertical,
  GitBranch,
  Key,
  Clock,
  ShieldOff,
  ShieldCheck
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { ProjectController } from "@/util/ProjectController";
import { Project } from "@/util/Interface";
import { UserContext } from "@/hooks/useUser";
import { toast } from "sonner"; // Assuming sonner is available based on dashboard usage

export default function ProjectsPage() {
  const router = useRouter();
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error("useUser must be used within a UserProvider");
  }
  const { user, fetchUser, selectedWorkspace } = userContext;
  const { data: session, status } = useSession();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await ProjectController.fetchProjects(undefined, selectedWorkspace?.id);
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.email && status !== "loading") {
      router.push("/login");
      return;
    }

    if (session?.user?.email && selectedWorkspace) {
      loadProjects();
    }
  }, [router, session, selectedWorkspace, status]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: "", // Will be set by server
      name: newProject.name,
      description: newProject.description,
      updatedAt: new Date(),
      workspaceId: selectedWorkspace.id,
      status: "active",
      createdAt: new Date(),
      userId: user?.id || "",
      accessControl: "private",
      securityLevel: "low",
      isBlocked: false,
      twoFactorRequired: false,
      passwordMinLength: 8,
      passwordRequireSpecialChars: false,
      passwordRequireNumbers: false,
      passwordExpiryDays: 90,
      ipRestrictions: [],
      auditLogging: false,
      lastSecurityAudit: null,
      branches: [],
      secrets: [],
    };

    try {
      await ProjectController.createProject(project); // Assuming this returns void or the created project?
      setNewProject({ name: "", description: "" });
      setIsCreateModalOpen(false);
      toast.success("Project created successfully");
      loadProjects(); // Reload to get the new project with correct ID
    } catch (e) {
      console.error("Error creating project", e);
      toast.error("Failed to create project");
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-12 bg-muted rounded w-full max-w-md animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-48">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground text-lg">
              Manage and monitor all your secure applications.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background/50"
              />
            </div>
            <div className="flex items-center border rounded-md bg-background/50 p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 shadow-md">
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to manage environment variables and secrets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g. Acme API"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Brief description of the project purpose..."
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      className="resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
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

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3" : "flex flex-col gap-4"}>
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={`group transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-card ${viewMode === "list" ? "flex flex-row items-center justify-between" : "flex flex-col hover:-translate-y-1 hover:shadow-xl"
                  }`}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {viewMode === "grid" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                <CardHeader className={viewMode === "list" ? "flex-1 pb-6" : "pb-4"}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-semibold truncate">{project.name}</CardTitle>
                        {project.status === 'archived' && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                      </div>
                      <CardDescription className="line-clamp-2 min-h-[40px] text-sm">
                        {project.description || "No description provided for this project."}
                      </CardDescription>
                    </div>
                    {viewMode === "grid" && (
                      <div className="p-2 bg-muted/40 rounded-full text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <Folder className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className={viewMode === "list" ? "flex items-center gap-8 py-0" : "pb-4"}>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Secrets Managed">
                      <Key className="h-3.5 w-3.5" />
                      <span>{new Set(project.secrets?.map((s: any) => s.key)).size || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Branches">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>{project.branches?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Security Level">
                      {project.securityLevel === 'high' ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                      <span className="capitalize">{project.securityLevel || 'Standard'}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className={`${viewMode === "list" ? "py-0 justify-end" : "pt-0 border-t bg-muted/5 py-3 mt-auto"}`}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Updated {formatDate(project.updatedAt)}
                    </span>

                    {viewMode === "grid" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 group/btn ml-auto">
                        Manage <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                    )}

                    {viewMode === "list" && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* Add logic */ }}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-muted/5 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-muted/30 rounded-full mb-6 relative">
              <Folder className="h-10 w-10 text-muted-foreground" />
              <Plus className="h-5 w-5 absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Create your first project to start managing secrets and environment variables securely.
            </p>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {/* Reusing content from header for consistency but conceptually should be valid component refactor if complicated */}
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to manage environment variables and secrets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name-empty">Project Name</Label>
                    <Input
                      id="project-name-empty"
                      placeholder="e.g. Acme API"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description-empty">Description</Label>
                    <Textarea
                      id="project-description-empty"
                      placeholder="Brief description of the project purpose..."
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                      className="resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
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
        )}
      </div>
    </DashboardLayout>
  );
}
