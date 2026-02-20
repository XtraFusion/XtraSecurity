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
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Shield,
  Code,
  Eye,
  Calendar,
  Trash2,
  Edit3,
  ArrowRight,
  ShieldCheck,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  List,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { TeamController } from "@/util/TeamContoller";
import { useRouter } from "next/navigation";
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
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { selectedWorkspace, user } = useGlobalContext();
  const userTier = (user?.tier || "free") as Tier;
  const teamLimit = DAILY_LIMITS[userTier].maxTeams;
  // const isLimitReached = totalCreatedTeams >= teamLimit;
  const isLimitReached = false; // Temporarily disable limit for UX testing

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  // User is admin if they have admin role in ANY team in this workspace
  const isWorkspaceAdmin = teams.some(t => t.members?.some((m: any) => m.userId === user?.id && m.role === 'admin'));
  const canManageTeams = isWorkspaceOwner || isWorkspaceAdmin || true; // Relax permissions for now

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

    setIsCreating(true);
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
        setTeams([teamUserRes, ...teams]);
        setNewTeam({ name: "", description: "", color: "bg-blue-500" });
        setCreateDialogOpen(false);
        router.push(`/teams/${teamUserRes.id}`)

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
    } finally {
      setIsCreating(false);
    }
  };

  const FetchTeamList = async () => {
    try {
      setIsLoading(true);
      if (selectedWorkspace) {
        const teamList = await TeamController.getTeams(selectedWorkspace.id);
        setTeams(teamList || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  }
  const handleDeleteTeam = async () => {
    // if (!canManageTeams) return;
    if (!deleteDialog.team) return;

    try {
      await axios.delete("/api/team", { data: { teamId: deleteDialog.team.id } });
      setTeams(teams.filter((team) => team.id !== deleteDialog.team!.id));
      setDeleteDialog({ open: false });

      toast({
        title: "Team deleted",
        description: `${deleteDialog.team.name} has been deleted`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete team", variant: "destructive" });
    }
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
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground text-lg">
              Manage your organization's teams and members.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            <Dialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="h-10 shadow-md">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
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
                      className="resize-none"
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
                            } transition-all hover:scale-110`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teams.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active in workspace
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <Shield className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all teams</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Projects
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Code className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams.reduce((acc, team) => acc + (team.projects || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In development</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Private Teams
              </CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Eye className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams.filter((team) => team.isPrivate).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Restricted access</p>
            </CardContent>
          </Card>
        </div>

        {/* Teams List */}
        {filteredTeams.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {filteredTeams.map((team) => (
              <Card
                key={team.id}
                className={`group transition-all duration-300 border-border/60 hover:border-primary/50 cursor-pointer overflow-hidden relative bg-card ${viewMode === "list" ? "flex flex-row items-center justify-between" : "flex flex-col hover:-translate-y-1 hover:shadow-xl"
                  }`}
                onClick={() => router.push(`/teams/${team.id}`)}
              >
                {viewMode === "grid" && (
                  <div className={`absolute top-0 left-0 w-full h-1 ${team.teamColor} opacity-70`} />
                )}

                <CardHeader className={viewMode === "list" ? "flex-1 pb-6" : "pb-4"}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${team.teamColor} bg-opacity-20 text-white font-bold text-sm`}>
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">{team.name}</CardTitle>
                          {team.isPrivate && <Badge variant="secondary" className="text-[10px] h-5 mt-1">Private</Badge>}
                        </div>
                      </div>

                      <CardDescription className="line-clamp-2 text-sm pt-2">
                        {team.description || "No description provided."}
                      </CardDescription>
                    </div>

                    {canManageTeams && viewMode === "grid" && (
                      <div onClick={(e) => e.stopPropagation()}>
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
                            <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}`)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Manage Team
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
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className={viewMode === "list" ? "flex items-center gap-8 py-0" : "pb-4"}>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {team.members?.slice(0, 3).map((m: any, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-[10px] bg-primary/20">{m.name?.substring(0, 1)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {(team.members?.length || 0) > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs">{team.members?.length || 0} Members</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className={`${viewMode === "list" ? "py-0 justify-end" : "pt-0 border-t bg-muted/5 py-3 mt-auto"}`}>
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(team.createdAt).toLocaleDateString()}
                    </span>

                    <span className="flex items-center gap-1">
                      <Code className="h-3 w-3" /> {team.projects || 0} Projects
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-muted/5 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-muted/30 rounded-full mb-6 relative">
              <Users className="h-10 w-10 text-muted-foreground" />
              <Plus className="h-5 w-5 absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Create your first team to collaborate with others.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </div>
        )}

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
