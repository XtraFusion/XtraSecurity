"use client";

import { useEffect, useState, useMemo } from "react";
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
  Shield,
  Code,
  Calendar,
  Trash2,
  Edit3,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Lock,
  Globe,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamController } from "@/util/TeamContoller";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import apiClient from "@/lib/axios";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string;
  members: any[];
  createdAt: string;
  teamProjects: any[];
  createdBy: string;
  teamColor: string;
  isPrivate: boolean;
}

const TeamsPage = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
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

  const canManageTeams = true; // Rely strictly on backend authorization

  const filteredTeams = useMemo(() => {
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const fetchTeamList = async () => {
    if (!selectedWorkspace) {
        setIsLoading(false);
        return;
    }
    try {
      setIsLoading(true);
      const teamList = await TeamController.getTeams(selectedWorkspace.id);
      setTeams(teamList || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({ title: "Fetch failed", description: "Could not load teams.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamList();
  }, [selectedWorkspace]);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({ title: "Validation Error", description: "Team name is required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: newTeam.name,
        description: newTeam.description,
        teamColor: newTeam.color,
        workspaceId: selectedWorkspace?.id
      };

      const teamUserRes = await TeamController.createTeam(payload as any);

      if (teamUserRes?.id) {
        setTeams([teamUserRes, ...teams]);
        setNewTeam({ name: "", description: "", color: "bg-blue-500" });
        setCreateDialogOpen(false);
        router.push(`/teams/${teamUserRes.id}`);
        toast({ title: "Success", description: `Team ${payload.name} created successfully.` });
      }
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.response?.data?.error || "Failed to create team.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteDialog.team) return;
    try {
      await apiClient.delete("/api/team", { data: { teamId: deleteDialog.team.id } });
      setTeams(teams.filter((team) => team.id !== deleteDialog.team!.id));
      setDeleteDialog({ open: false });
      toast({ title: "Team deleted", description: `${deleteDialog.team.name} removed.` });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
    }
  };

  const colorOptions = [
    "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-indigo-500", "bg-cyan-500", "bg-zinc-500",
  ];

  const stats = useMemo(() => [
    { label: "Total Teams", value: teams.length, icon: Users },
    { label: "Total Members", value: teams.reduce((acc, t) => acc + (t.members?.length || 0), 0), icon: Shield },
    { label: "Active Projects", value: teams.reduce((acc, t) => acc + (t.teamProjects?.length || 0), 0), icon: Code },
    { label: "Private Teams", value: teams.filter(t => t.isPrivate).length, icon: Lock },
  ], [teams]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-8 animate-pulse">
           <div className="h-10 bg-muted/20 w-48 rounded" />
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted/10 rounded-lg" />)}
           </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspace members and collaborative units.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {canManageTeams && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Create a new team to manage access to shared projects.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        placeholder="e.g. Development Team"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-description">Description (Optional)</Label>
                      <Textarea
                        id="team-description"
                        placeholder="Purpose of this team"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewTeam({ ...newTeam, color })}
                            className={cn(
                              "w-8 h-8 rounded-md transition-all border",
                              color,
                              newTeam.color === color ? "ring-2 ring-primary ring-offset-2 scale-105" : "border-transparent opacity-80"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTeam} disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Collection */}
        <AnimatePresence mode="wait">
          {filteredTeams.length > 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"
              )}
            >
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  viewMode={viewMode}
                  canManage={canManageTeams}
                  onDelete={() => setDeleteDialog({ open: true, team })}
                  onNavigate={() => router.push(`/teams/${team.id}`)}
                />
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/5 text-center">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No teams found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                No teams match your search or you haven't created any teams yet.
              </p>
              {canManageTeams && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-6" variant="outline">
                   <Plus className="mr-2 h-4 w-4" /> Create First Team
                </Button>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Global Delete Confirm */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold">{deleteDialog.team?.name}</span>? 
                This will remove all member associations and access to shared projects.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive hover:bg-destructive/90">
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

const TeamCard = ({ team, viewMode, canManage, onDelete, onNavigate }: { 
  team: Team, 
  viewMode: "grid" | "list", 
  canManage: boolean, 
  onDelete: () => void,
  onNavigate: () => void
}) => {
  return (
    <Card
      className={cn(
        "group cursor-pointer hover:border-primary/40 transition-colors",
        viewMode === "list" ? "flex flex-row items-center justify-between p-4" : "flex flex-col rounded-xl overflow-hidden"
      )}
      onClick={onNavigate}
    >
      <div className={cn(
        "flex flex-1",
        viewMode === "list" ? "items-center" : "flex-col"
      )}>
        <CardHeader className={cn(viewMode === "list" ? "p-0 flex-1" : "p-6")}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center rounded-lg text-white font-bold",
                team.teamColor || "bg-blue-500",
                viewMode === "list" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm"
              )}>
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <CardTitle className={cn("font-semibold", viewMode === "list" ? "text-base" : "text-lg")}>
                  {team.name}
                </CardTitle>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                   {team.isPrivate ? (
                     <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                   ) : (
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Public</span>
                   )}
                   <span className="flex items-center gap-1">
                     <Users className="h-3 w-3" /> {team.members?.length || 0}
                   </span>
                </div>
              </div>
            </div>

            {canManage && (
              <div onClick={e => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                       <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onNavigate}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          {viewMode === "grid" && (
            <CardDescription className="line-clamp-2 mt-4 text-sm min-h-[2.5rem]">
              {team.description || "No description provided."}
            </CardDescription>
          )}
        </CardHeader>

        {viewMode === "grid" && (
          <CardFooter className="px-6 py-4 border-t bg-muted/5 mt-auto flex justify-between items-center">
            <div className="flex -space-x-2">
              {team.members?.slice(0, 3).map((m, i) => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden">
                   {m.name?.[0]?.toUpperCase() || <Shield className="h-3 w-3" />}
                </div>
              ))}
              {team.members?.length > 3 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                  +{team.members.length - 3}
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

export default TeamsPage;
