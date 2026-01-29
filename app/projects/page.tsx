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
import { Plus, Search, Folder, ChevronRight } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "next-auth/react";
import { ProjectController } from "@/util/ProjectController";
import { Project } from "@/util/Interface";
import { UserContext } from "@/hooks/useUser";


export default function ProjectsPage() {
  const router = useRouter();
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error("useUser must be used within a UserProvider");
  }
  const { user, fetchUser, selectedWorkspace } = userContext;

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;
    setIsCreateModalOpen(true);

    const project: Project = {
      id: Date.now().toString(),
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
    ProjectController.createProject(project);

    setProjects([project, ...projects]);
    setNewProject({ name: "", description: "" });
    setIsCreateModalOpen(false);
  };
  useEffect(() => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const loadProjects = async () => {
      // In a real app, fetch projects from the API

      const response = await fetch("/api/project");
      const data = await response.json();
      setProjects(data);
      setIsLoading(false);
    };

    loadProjects();
  }, [router]);

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-full max-w-md animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              A list of all your projects.
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New Projects
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to manage environment variables and secrets.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Enter project name"
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
                    placeholder="Enter project description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    className="w-full sm:w-auto"
                  >
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow duration-300 flex flex-col cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Folder className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{project?.secrets?.length} secrets</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href={`/projects/${project.id}`}>
                      View Project
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No projects found.</p>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to manage environment variables and
                    secrets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name"
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
                      placeholder="Enter project description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      className="w-full sm:w-auto"
                    >
                      Create Project
                    </Button>
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
