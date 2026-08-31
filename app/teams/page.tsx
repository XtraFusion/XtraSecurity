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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Users,
  Shield,
  Code,
  Lock,
  LayoutGrid,
  List,
  Loader2,
  Folder
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TeamController } from "@/util/TeamContoller";
import { PremiumTeamCard } from "@/components/teams/PremiumTeamCard";
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

  const canManageTeams = true;

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

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteTeam = async () => {
    if (!deleteDialog.team) return;
    setIsDeleting(true);
    try {
      await apiClient.delete("/api/team", { data: { teamId: deleteDialog.team.id } });
      setTeams(teams.filter((team) => team.id !== deleteDialog.team!.id));
      setDeleteDialog({ open: false });
      toast({ title: "Team deleted", description: `${deleteDialog.team.name} removed.` });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete team.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const colorOptions = [
    "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-indigo-500", "bg-cyan-500", "bg-zinc-500",
  ];

  const stats = useMemo(() => [
    { label: "Total Teams", value: teams.length, icon: Users },
    { label: "Total Members", value: teams.reduce((acc, t) => acc + (t.members?.length || 0), 0), icon: Shield },
    { label: "Assigned Projects", value: teams.reduce((acc, t) => acc + (t.teamProjects?.length || 0), 0), icon: Code },
    { label: "Private Units", value: teams.filter(t => t.isPrivate).length, icon: Lock },
  ], [teams]);

  if (isLoading && teams.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-72 max-w-full" />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Skeleton className="h-10 w-full md:w-64" />
              <Skeleton className="h-10 w-24 hidden md:block" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col h-[220px]">
                <CardHeader className="pb-4">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <Skeleton className="h-4 w-32" />
                </CardContent>
                <CardFooter className="pt-0 border-t bg-muted/5 py-3 mt-auto flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-16" />
                </CardFooter>
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

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground text-lg">
              Manage workspace members, roles, and collaborative units.
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

            {canManageTeams && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> New Team
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
                        placeholder="Purpose of this team..."
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        rows={3}
                        className="resize-none"
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

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-border/60 hover:border-primary/50 transition-all duration-300 bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</h3>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/40 text-muted-foreground">
                  <stat.icon className="h-5 w-5" />
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
                viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"
              )}
            >
              {filteredTeams.map((team) => (
                <PremiumTeamCard
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
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-muted/5 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="p-6 bg-muted/30 rounded-full mb-6 relative">
                <Users className="h-10 w-10 text-muted-foreground" />
                <Plus className="h-5 w-5 absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                No teams match your search or you haven't created any teams yet.
              </p>
              {canManageTeams && (
                <Button onClick={() => setCreateDialogOpen(true)} className="shadow-lg">
                  <Plus className="mr-2 h-5 w-5" /> Create First Team
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
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteTeam();
                }} 
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;
