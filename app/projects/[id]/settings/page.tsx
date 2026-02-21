"use client";

import { useEffect, useState } from 'react';
import {
  Trash2,
  UserPlus,
  Building2,
  AlertTriangle,
  Check,
  X,
  GitBranch,
  Lock,
  Unlock,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { ProjectController } from '@/util/ProjectController';
import { BranchController } from '@/util/BranchController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AccessLevel, SecurityLevel, IpRestriction } from '@/util/ProjectController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';
import { ServiceAccountsTab } from './service-accounts-tab';
import { WebhooksTab } from './webhooks-tab';

interface Team {
  id: string;
  name: string;
  description: string;
  teamColor: string;
}

interface Branch {
  id: string;
  name: string;
  description: string;
  versionNo: string;
}

interface TeamProject {
  id: string;
  teamId: string;
  projectId: string;
  team: Team;
}

interface Project {
  id: string;
  name: string;
  description: string;
  branches: string[];
  secrets: Record<string, Secret[]>;
  owner?: string;
  workspace?: string;
  teamMembers?: string[];
  securityLevel?: SecurityLevel;
  accessControl?: AccessLevel;
  auditLogging?: boolean;
  twoFactorRequired?: boolean;
  created_at?: string;
  updated_at?: string;
  lastSecurityAudit?: string;
  isBlocked?: boolean;
  // Security settings
  passwordMinLength?: number;
  passwordRequireSpecialChars?: boolean;
  passwordRequireNumbers?: boolean;
  passwordExpiryDays?: number;
  ipRestrictions?: IpRestriction[];
  currentUserRole?: string;
}

interface Secret {
  id: string;
  key: string;
  value: string;
  description: string;
  environment_type: "development" | "staging" | "production";
  lastUpdated: string;
  updatedBy?: string;
  version: number;
  permission: string[];
  expiryDate: Date;
  rotationPolicy: string;
  type: string;
}

export default function ProjectSettings() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [projectTeams, setProjectTeams] = useState<TeamProject[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [isLoading, setIsLoading] = useState({
    teams: false,
    createBranch: false,
    deleteBranch: false,
    clearBranch: false,
    clearProject: false,
    blockProject: false,
    deleteProject: false
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsPageLoading(true);
    try {
      // Get project data
      const [projectData, branchesData, teamsRes, projectTeamsRes] = await Promise.all([
        ProjectController.fetchProjects(id as string),
        BranchController.fetchBranches(id as string),
        axios.get('/api/team'),
        axios.get(`/api/project/${id}/teams`)
      ]);

      setProject(projectData);

      // Redirect if not owner/admin
      if (projectData && ['developer', 'viewer'].includes(projectData.currentUserRole)) {
        router.push(`/projects/${id}`);
        toast({
          title: "Access Denied",
          description: "You do not have permission to view project settings",
          variant: "destructive"
        });
        return;
      }

      setBranches(branchesData);
      setTeams(teamsRes.data);
      setProjectTeams(projectTeamsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsPageLoading(false);
    }
  };

  // Handle branch operations
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.trim()) return;

    setIsLoading(prev => ({ ...prev, createBranch: true }));
    try {
      const branchData = {
        name: newBranch.trim(),
        description: "",
        projectId: id as string,
        versionNo: "1.0",
        permissions: [],
        createdBy: "" // This will be set by the server from the session
      };

      const result = await BranchController.createBranch(branchData);
      if (result) {
        setNewBranch('');
        toast({
          title: "Success",
          description: "Branch created successfully",
        });
        await fetchData();
      } else {
        throw new Error("Failed to create branch");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create branch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, createBranch: false }));
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    setIsLoading(prev => ({ ...prev, deleteBranch: true }));
    try {
      const result = await BranchController.deleteBranch(branchId);
      if (result) {
        toast({
          title: "Success",
          description: "Branch deleted successfully",
        });
        await fetchData();
      } else {
        throw new Error("Failed to delete branch");
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete branch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, deleteBranch: false }));
    }
  };

  const handleClearBranch = async (branchId: string) => {
    setIsLoading(prev => ({ ...prev, clearBranch: true }));
    try {
      const result = await BranchController.clearBranch(branchId);
      if (result) {
        toast({
          title: "Success",
          description: "Branch cleared successfully",
        });
        await fetchData();
      } else {
        throw new Error("Failed to clear branch");
      }
    } catch (error) {
      console.error("Error clearing branch:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear branch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, clearBranch: false }));
    }
  };

  // Handle project operations
  const handleClearProject = async () => {
    setIsLoading(prev => ({ ...prev, clearProject: true }));
    try {
      await ProjectController.clearProject(id as string);
      toast({
        title: "Success",
        description: "Project cleared successfully",
      });
      await fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to clear project";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, clearProject: false }));
    }
  };

  const handleToggleProjectBlock = async () => {
    setIsLoading(prev => ({ ...prev, blockProject: true }));
    try {
      await ProjectController.toggleProjectBlock(id as string);
      toast({
        title: "Success",
        description: project?.isBlocked ? "Project unblocked" : "Project blocked",
      });
      await fetchData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to toggle project block";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, blockProject: false }));
    }
  };

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmText !== project.name) return;

    setIsLoading(prev => ({ ...prev, deleteProject: true }));
    try {
      await ProjectController.deleteProject(id as string);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      router.push('/projects');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to delete project";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, deleteProject: false }));
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const addTeamToProject = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedTeam || isLoading.teams) return;

    setIsLoading(prev => ({ ...prev, teams: true }));
    try {
      const response = await axios.post(`/api/project/${id}/teams`, {
        teamId: selectedTeam
      });

      if (response.data) {
        setProjectTeams(prev => [...prev, response.data]);
        setSelectedTeam('');
        toast({
          title: "Success",
          description: "Team added to project successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.response?.data?.error || "Failed to add team to project",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, teams: false }));
    }
  };

  const removeTeamFromProject = async (teamProjectId: string) => {
    setIsLoading(prev => ({ ...prev, teams: true }));
    try {
      await axios.delete(`/api/project/${id}/teams/${teamProjectId}`);

      toast({
        title: "Success",
        description: "Team removed from project successfully",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team from project",
        variant: "destructive"
      });
    } finally {
      setIsLoading(prev => ({ ...prev, teams: false }));
    }
  };

  if (isPageLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage settings for "{project?.name}"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={project?.isBlocked ? "destructive" : "outline"}
            onClick={handleToggleProjectBlock}
            disabled={isLoading.blockProject}
          >
            {project?.isBlocked ? (
              <><Lock className="w-4 h-4 mr-2" /> Blocked</>
            ) : (
              <><Unlock className="w-4 h-4 mr-2" /> Unblocked</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="service-accounts">Service Accounts</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="clear">Clear Data</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Add or remove teams from this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select
                  value={selectedTeam}
                  onValueChange={(value) => {
                    if (value === 'create_new_team') {
                      router.push('/teams');
                      return;
                    }
                    setSelectedTeam(value);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => !projectTeams.some(pt => pt.teamId === team.id))
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    <div className="border-t my-1" />
                    <SelectItem value="create_new_team" className="font-medium text-primary cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Team
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={addTeamToProject}
                  disabled={isLoading.teams || !selectedTeam}
                >
                  {isLoading.teams ? "Adding..." : "Add Team"}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTeams.map(teamProject => (
                    <TableRow key={teamProject.id}>
                      <TableCell>{teamProject.team.name}</TableCell>
                      <TableCell>{teamProject.team.description}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTeamFromProject(teamProject.id)}
                          disabled={isLoading.teams}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle>Branch Management</CardTitle>
              <CardDescription>Create, delete, or clear branches in your project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBranch} className="flex gap-2 mb-4">
                <Input
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="Enter new branch name"
                  disabled={isLoading.createBranch}
                />
                <Button
                  type="submit"
                  disabled={isLoading.createBranch || !newBranch.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Branch
                </Button>
              </form>

              <div className="space-y-2">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      <span>{branch.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearBranch(branch.id)}
                        disabled={isLoading.clearBranch}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch.id)}
                        disabled={isLoading.deleteBranch}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage project access and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Access Level</h3>
                  <Select
                    value={project?.accessControl}
                    onValueChange={(value: 'private' | 'team' | 'public') => {
                      if (!project) return;
                      ProjectController.updateAccessLevel(id as string, value)
                        .then(() => {
                          toast({
                            title: "Success",
                            description: "Access level updated successfully",
                          });
                          fetchData();
                        })
                        .catch((error) => {
                          const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update access level";
                          toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                          });
                        });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only owner)</SelectItem>
                      <SelectItem value="team">Team (All team members)</SelectItem>
                      <SelectItem value="public">Public (Anyone with link)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Security Level</h3>
                  <Select
                    value={project?.securityLevel}
                    onValueChange={(value: 'low' | 'medium' | 'high') => {
                      if (!project) return;
                      ProjectController.updateSecurityLevel(id as string, value)
                        .then(() => {
                          toast({
                            title: "Success",
                            description: "Security level updated successfully",
                          });
                          fetchData();
                        })
                        .catch((error) => {
                          const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update security level";
                          toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                          });
                        });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select security level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Basic protection)</SelectItem>
                      <SelectItem value="medium">Medium (Enhanced security)</SelectItem>
                      <SelectItem value="high">High (Maximum security)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security requirements for the project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Two-Factor Authentication</label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all project members
                    </p>
                  </div>
                  <Switch
                    checked={project?.twoFactorRequired}
                    onCheckedChange={(checked) => {
                      ProjectController.updateSecuritySettings(id as string, {
                        twoFactorRequired: checked
                      })
                        .then(() => {
                          toast({
                            title: "Success",
                            description: "2FA requirement updated",
                          });
                          fetchData();
                        })
                        .catch((error) => {
                          const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update 2FA requirement";
                          toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                          });
                        });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Requirements</label>
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="special-chars"
                        checked={project?.passwordRequireSpecialChars}
                        onCheckedChange={(checked) => {
                          ProjectController.updateSecuritySettings(id as string, {
                            passwordRequireSpecialChars: checked as boolean
                          })
                            .then(() => {
                              toast({
                                title: "Success",
                                description: "Password requirements updated",
                              });
                              fetchData();
                            })
                            .catch((error) => {
                              const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update password requirements";
                              toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                              });
                            });
                        }}
                      />
                      <label
                        htmlFor="special-chars"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Require special characters
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="numbers"
                        checked={project?.passwordRequireNumbers}
                        onCheckedChange={(checked) => {
                          ProjectController.updateSecuritySettings(id as string, {
                            passwordRequireNumbers: checked as boolean
                          })
                            .then(() => {
                              toast({
                                title: "Success",
                                description: "Password requirements updated",
                              });
                              fetchData();
                            })
                            .catch((error) => {
                              const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update password requirements";
                              toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                              });
                            });
                        }}
                      />
                      <label
                        htmlFor="numbers"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Require numbers
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Restrictions</label>
                  <div className="space-y-2">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const ip = formData.get('ip') as string;
                      const description = formData.get('description') as string;

                      ProjectController.addIpRestriction(id as string, { ip, description })
                        .then(() => {
                          toast({
                            title: "Success",
                            description: "IP restriction added",
                          });
                          fetchData();
                          e.currentTarget.reset();
                        })
                        .catch((error) => {
                          const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to add IP restriction";
                          toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                          });
                        });
                    }} className="flex gap-2">
                      <Input
                        name="ip"
                        placeholder="IP address or range"
                        className="flex-1"
                      />
                      <Input
                        name="description"
                        placeholder="Description"
                        className="flex-1"
                      />
                      <Button type="submit">Add</Button>
                    </form>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address/Range</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project?.ipRestrictions?.map((restriction) => (
                          <TableRow key={restriction.ip}>
                            <TableCell>{restriction.ip}</TableCell>
                            <TableCell>{restriction.description}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  ProjectController.removeIpRestriction(id as string, restriction.ip)
                                    .then(() => {
                                      toast({
                                        title: "Success",
                                        description: "IP restriction removed",
                                      });
                                      fetchData();
                                    })
                                    .catch((error) => {
                                      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to remove IP restriction";
                                      toast({
                                        title: "Error",
                                        description: errorMsg,
                                        variant: "destructive"
                                      });
                                    });
                                }}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clear">
          <Card>
            <CardHeader>
              <CardTitle>Clear Project Data</CardTitle>
              <CardDescription>Remove all data while keeping the project structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleClearProject}
                disabled={isLoading.clearProject}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear All Project Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will remove all secrets and data from all branches while keeping the project structure intact.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect your project</CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Confirm Project Deletion</span>
                  </div>

                  <p className="text-sm text-red-700">
                    Type "{project?.name}" to confirm deletion:
                  </p>

                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-red-300"
                    disabled={isLoading.deleteProject}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteProject}
                      disabled={isLoading.deleteProject || deleteConfirmText !== project?.name}
                    >
                      {isLoading.deleteProject ? 'Deleting...' : 'Delete Project'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      disabled={isLoading.deleteProject}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-accounts">
          <ServiceAccountsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <WebhooksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}