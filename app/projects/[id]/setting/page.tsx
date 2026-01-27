"use client";

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  UserPlus,
  Building2,
  AlertTriangle,
  Check,
  X,
  Shield,
  Activity,
  Home,
  ChevronRight,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectController } from '@/util/ProjectController';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  securityLevel?: 'low' | 'medium' | 'high';
  auditLogging?: boolean;
}

interface TransferUserData {
  email: string;
}

interface TransferWorkspaceData {
  workspaceId: string;
}

// Mock API functions - replace with actual API calls
const projectAPI = {
  transferToUser: async (projectId: string, data: TransferUserData): Promise<void> => {
    console.log('Transferring project to user:', data.email);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  transferToWorkspace: async (projectId: string, data: TransferWorkspaceData): Promise<void> => {
    console.log('Transferring project to workspace:', data.workspaceId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

export default function ProjectSettings() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [transferUserEmail, setTransferUserEmail] = useState('');
  const [isTransferringUser, setIsTransferringUser] = useState(false);

  const [transferWorkspaceId, setTransferWorkspaceId] = useState('');
  const [isTransferringWorkspace, setIsTransferringWorkspace] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback States
  const [notification, setNotification] = useState<{ type: "default" | "destructive" | "success"; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const projects = await ProjectController.fetchProjects(id as string);
      if (Array.isArray(projects) && projects.length > 0) {
        setProject(projects[0]); // Adjust based on actual API response structure
        setNewName(projects[0].name);
      } else {
        // Fallback or error handling if project not found
        setProject(projects as any);
        setNewName((projects as any).name);
      }
    } catch (error) {
      console.error("Failed to load project", error);
      setNotification({ type: "destructive", message: "Failed to load project details" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleTransferToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !transferUserEmail.trim()) return;

    setIsTransferringUser(true);
    try {
      // Use ProjectController or direct API
      // Since ProjectController.updateProject takes generic project data, we can try using it or axios direct
      // Let's use controller but we might need to cast or direct axios 
      // Plan was to use Controller.update but let's stick to what we implemented in backend
      await ProjectController.updateProject(project.id, { newOwnerEmail: transferUserEmail.trim() } as any);

      setNotification({ type: "success", message: `Project ownership transferred to ${transferUserEmail}` });
      setTransferUserEmail('');
      router.push('/projects'); // Redirect as we might lose access
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to transfer project";
      setNotification({ type: "destructive", message: msg });
    } finally {
      setIsTransferringUser(false);
    }
  };

  const handleRename = async () => {
    if (!project || !newName.trim() || newName === project.name) return;

    setIsRenaming(true);
    try {
      await ProjectController.updateProject(project.id, { name: newName.trim() } as any);
      setNotification({ type: "success", message: "Project renamed successfully" });
      // Update local state
      setProject({ ...project, name: newName.trim() });
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to rename project";
      setNotification({ type: "destructive", message: msg });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleTransferToWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !transferWorkspaceId.trim()) return;

    setIsTransferringWorkspace(true);
    try {
      await ProjectController.updateProject(project.id, { targetWorkspaceId: transferWorkspaceId.trim() } as any);

      setNotification({ type: "success", message: `Project moved to workspace ${transferWorkspaceId}` });
      setTransferWorkspaceId('');
      router.push('/projects'); // Redirect as it moved
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to transfer project";
      setNotification({ type: "destructive", message: msg });
    } finally {
      setIsTransferringWorkspace(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmText !== project.name) return;

    setIsDeleting(true);
    try {
      await ProjectController.deleteProject(project.id);
      setNotification({ type: "success", message: "Project deleted successfully" });
      router.push('/projects');
    } catch (error) {
      setNotification({ type: "destructive", message: "Failed to delete project" });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert variant={notification.type === 'destructive' ? 'destructive' : 'default'} className={notification.type === 'success' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}>
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{notification.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/projects')}>Projects</span>
          <ChevronRight className="h-4 w-4" />
          <span className="hover:text-foreground cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>{project.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Settings</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage security, access control, and danger zone for {project.name}
          </p>
        </div>

        <Separator />

        <div className="grid gap-8">
          {/* General Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                General Information
              </CardTitle>
              <CardDescription>
                Overview of your project configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Project Name"
                    />
                    <Button
                      onClick={handleRename}
                      disabled={isRenaming || !newName || newName === project.name}
                      size="sm"
                    >
                      {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Project ID</Label>
                  <div className="p-2.5 rounded-md bg-muted/50 border text-sm font-mono text-muted-foreground truncate">
                    {project.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm">
                  <Shield className={`h-4 w-4 ${project.securityLevel === 'high' ? 'text-emerald-500' :
                    project.securityLevel === 'medium' ? 'text-amber-500' : 'text-red-500'
                    }`} />
                  <span className="text-muted-foreground">Security Level:</span>
                  <span className="font-medium capitalize">{project.securityLevel || 'Low'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm">
                  <Activity className={`h-4 w-4 ${project.auditLogging ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <span className="text-muted-foreground">Audit Logging:</span>
                  <span className="font-medium">{project.auditLogging ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transfer to User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  Transfer Ownership
                </CardTitle>
                <CardDescription>
                  Transfer this project to another user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransferToUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Recipient Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={transferUserEmail}
                      onChange={(e) => setTransferUserEmail(e.target.value)}
                      disabled={isTransferringUser}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isTransferringUser || !transferUserEmail}
                  >
                    {isTransferringUser ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      'Transfer Project'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transfer to Workspace */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  Move to Workspace
                </CardTitle>
                <CardDescription>
                  Move project to another workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransferToWorkspace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-id">Workspace ID / Name</Label>
                    <Input
                      id="workspace-id"
                      placeholder="workspace_123"
                      value={transferWorkspaceId}
                      onChange={(e) => setTransferWorkspaceId(e.target.value)}
                      disabled={isTransferringWorkspace}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    disabled={isTransferringWorkspace || !transferWorkspaceId}
                  >
                    {isTransferringWorkspace ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Moving...
                      </>
                    ) : (
                      'Move Project'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border border-red-100 dark:border-red-900/20 bg-background">
                <div className="space-y-1">
                  <h4 className="font-medium">Delete Project</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this project and all of its data.
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                ) : (
                  <div className="w-full md:w-auto flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-2">
                      <Label className="text-red-600 text-xs uppercase font-bold">
                        Type "{project.name}" to confirm
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={project.name}
                          className="md:w-64"
                        />
                        <Button
                          variant="destructive"
                          disabled={isDeleting || deleteConfirmText !== project.name}
                          onClick={handleDeleteProject}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}