"use client";
import { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Users,
  Settings,
  MoreHorizontal,
  Crown,
  Shield,
  Code,
  Eye,
  Calendar,
  Trash2,
  Edit3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
// import teamsHeroImage from "@/assets/teams-hero.jpg";
import Link from "next/link";
import { TeamController } from "@/util/TeamContoller";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useGlobalContext } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Team {
  id: string;
  name: string;
  description: string;
  members: [];
  createdAt: string;
  teamProjects: any;
  createdBy: string;
  teamColor: string;
  isPrivate: boolean;
  recentActivity: string;
  projects: number;
}

const currentUser = {
  id: "1",
  role: "owner" as const,
  name: "John Doe",
};



const Teams = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [totalCreatedTeams, setTotalCreatedTeams] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    team?: Team;
  }>({ open: false });
  const [isLoading, setIsLoading] = useState(true);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
  });

  const { selectedWorkspace, user } = useGlobalContext();
  const userTier = (user?.tier || "free") as Tier;
  const teamLimit = DAILY_LIMITS[userTier].maxTeams;
  const isLimitReached = totalCreatedTeams >= teamLimit;

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  // User is admin if they have admin role in ANY team in this workspace
  const isWorkspaceAdmin = teams.some(t => t.members?.some((m: any) => m.userId === user?.id && m.role === 'admin'));
  const canManageTeams = isWorkspaceOwner || isWorkspaceAdmin;

  useEffect(() => {
    if (selectedWorkspace) {
      FetchTeamList();
    }
  }, [selectedWorkspace])

  // Fetch total teams created by user for limit check
  useEffect(() => {
    const fetchTotalTeams = async () => {
      try {
        const response = await TeamController.getTeams(); // All teams
        // Filter locally for teams created by current user
        // Alternatively, update API to return this count
        const createdTeams = response.filter((t: any) => t.createdBy === user?.id);
        setTotalCreatedTeams(createdTeams.length);
      } catch (error) {
        console.error("Error fetching all teams:", error);
      }
    };
    if (user?.id) {
      fetchTotalTeams();
    }
  }, [user?.id]);

  const handleCreateTeam = async () => {
    if (!canManageTeams) {
      toast({ title: "Permission Denied", description: "Only admins can create teams", variant: "destructive" });
      return;
    }
    if (isLimitReached) {
      toast({
        title: "Limit reached",
        description: `You have reached the limit of ${teamLimit} teams for your ${userTier} plan.`,
        variant: "destructive",
      });
      return;
    }
    if (!newTeam.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkspace) {
      toast({ title: "Error", description: "No workspace selected", variant: "destructive" });
      return;
    }

    try {
      const team: any = {
        name: newTeam.name,
        description: newTeam.description,
        teamColor: newTeam.color,
        roles: ["admin"],
        workspaceId: selectedWorkspace.id
      };

      const teamUserRes = await TeamController.createTeam(team);

      if (teamUserRes?.id) {
        setTotalCreatedTeams(prev => prev + 1);
        router.push(`/teams/${teamUserRes.id}`)
        setTeams([teamUserRes, ...teams]);
        setNewTeam({ name: "", description: "", color: "bg-blue-500" });
        setCreateDialogOpen(false);

        toast({
          title: "Team created",
          description: `${team.name} has been created successfully`,
        });
      }
    } catch (error: any) {
      console.error("Create team error:", error);
      toast({
        title: "Error creating team",
        description: error.response?.data?.error || "Failed to create team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const FetchTeamList = async () => {
    try {
      setIsLoading(true);
      if (selectedWorkspace) {
        const teamList = await TeamController.getTeams(selectedWorkspace.id);
        setTeams(teamList);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  }
  const handleDeleteTeam = () => {
    if (!canManageTeams) return;
    if (!deleteDialog.team) return;

    setTeams(teams.filter((team) => team.id !== deleteDialog.team!.id));
    setDeleteDialog({ open: false });

    toast({
      title: "Team deleted",
      description: `${deleteDialog.team.name} has been deleted`,
    });
  };

  const colorOptions = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background">
          {/* Hero Section Skeleton */}
          <div className="relative overflow-hidden rounded-xl border border-border/50">
            <div className="relative bg-gradient-hero/10 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center">
                  <div className="h-8 bg-muted rounded w-64 mx-auto mb-6 animate-pulse"></div>
                  <div className="h-16 bg-muted rounded w-96 mx-auto mb-6 animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-2xl mx-auto mb-8 animate-pulse"></div>
                  <div className="h-12 bg-muted rounded w-40 mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Teams Grid Skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
                      <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl border border-border/50">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          // style={{ backgroundImage: `url(${teamsHeroImage})` }}
          />
          <div className="relative bg-gradient-hero/10 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Team Collaboration Platform
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-foreground">
                  Manage Your Teams
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Create, organize, and collaborate with multiple teams.
                  Streamline your workflow with role-based access and seamless
                  project management.
                </p>
                <div className="flex flex-col items-center gap-4">
                  {isLimitReached && (
                    <Alert variant="destructive" className="max-w-md bg-destructive/10 border-destructive/20 text-destructive mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Team Limit Reached</AlertTitle>
                      <AlertDescription>
                        You've reached your limit of {teamLimit} team{teamLimit > 1 ? 's' : ''}.
                        <Link href="/subscription" className="ml-1 font-bold underline">Upgrade to Pro</Link> to create up to 10 teams.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Usage: {totalCreatedTeams} / {teamLimit} teams
                    </div>
                    <Progress value={(totalCreatedTeams / teamLimit) * 100} className="w-32 h-2" />
                  </div>

                  {canManageTeams && (
                    <Dialog
                      open={createDialogOpen}
                      onOpenChange={setCreateDialogOpen}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button
                                size="lg"
                                className="gap-2"
                                disabled={isLimitReached}
                              >
                                <Plus className="h-5 w-5" />
                                Create New Team
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          {isLimitReached && (
                            <TooltipContent>
                              <p>Upgrade to Pro to create more teams</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Team</DialogTitle>
                          <DialogDescription>
                            Set up a new team to collaborate with your colleagues
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="team-name">Team Name</Label>
                            <Input
                              id="team-name"
                              placeholder="e.g., Engineering, Design, Marketing"
                              value={newTeam.name}
                              onChange={(e) =>
                                setNewTeam({ ...newTeam, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="team-description">Description</Label>
                            <Textarea
                              id="team-description"
                              placeholder="What does this team work on?"
                              value={newTeam.description}
                              onChange={(e) =>
                                setNewTeam({
                                  ...newTeam,
                                  description: e.target.value,
                                })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Team Color</Label>
                            <div className="flex gap-2">
                              {colorOptions.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewTeam({ ...newTeam, color })}
                                  className={`w-8 h-8 rounded-full ${color} border-2 ${newTeam.color === color
                                    ? "border-primary"
                                    : "border-transparent"
                                    } transition-colors`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleCreateTeam}>Create Team</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {teams.length}
              </div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {/* {teams.reduce((acc, team) => acc + team.members.length, 0)} */}
              </div>
              <p className="text-xs text-muted-foreground">Across all teams</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
              <Code className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {/* {teams.reduce((acc, team) => acc + team.projects, 0)} */}
              </div>
              <p className="text-xs text-muted-foreground">In development</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Private Teams
              </CardTitle>
              <Eye className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {/* {teams.filter((team) => team.isPrivate).length} */}
              </div>
              <p className="text-xs text-muted-foreground">Restricted access</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Your Teams</CardTitle>
            <CardDescription>
              Manage all your teams and their members in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-gradient-card border-primary/20 hover:shadow-card transition-all duration-300 group"
                >
                  <CardHeader className="space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${team.teamColor}`} />
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {team.name}
                          </CardTitle>

                        </div>
                      </div>
                      {canManageTeams && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({ open: true, team })
                              }
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {team.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{team?.members?.length} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span>{team?.teamProjects?.length} projects</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </div>
                      <span>Active {team.recentActivity}</span>
                    </div>

                    <Link href={`/teams/${team.id}`}>
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Manage Team
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTeams.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Create your first team to get started"}
                </p>
                {!searchTerm && canManageTeams && (
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{deleteDialog.team?.name}</strong>? This action cannot be
                undone and all team data will be permanently lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTeam}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>);
};

export default Teams;
