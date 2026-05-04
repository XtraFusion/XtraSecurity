"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  Eye,
  Code,
  Crown,
  Calendar,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserX,
  ArrowLeft,
  Activity,
  Loader2,
  Lock,
  ChevronRight,
  History,
  Trash2,
  Mail,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  name: string;
  teamId: string;
  email: string;
  role: "owner" | "admin" | "developer" | "viewer";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  lastActive?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
  teamColor: string;
  isPrivate: boolean;
  createdAt: string;
  members: TeamMember[];
}

const roleLabel = {
  owner: { label: "Owner", icon: Crown, color: "bg-amber-500/10 text-amber-600 border-amber-600/20" },
  admin: { label: "Admin", icon: Shield, color: "bg-blue-600/10 text-blue-600 border-blue-600/20" },
  developer: { label: "Developer", icon: Code, color: "bg-indigo-600/10 text-indigo-600 border-indigo-600/20" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-zinc-500/10 text-zinc-600 border-zinc-600/20" },
};

const TeamDetailPage = () => {
  const { id: teamId } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentUserRole, setCurrentUserRole] = useState<string>("viewer");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "viewer" as TeamMember["role"],
  });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "remove" | "role-change";
    member?: TeamMember;
    newRole?: TeamMember["role"];
  }>({ open: false, type: "remove" });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.custom-dropdown-container') && !(e.target as Element).closest('.dropdown-trigger-btn')) {
        setActiveDropdown(null);
      }
    };
    
    const handleScroll = () => setActiveDropdown(null);

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const fetchTeamDetails = async () => {
    try {
      setIsLoading(true);
      const resp = await apiClient.get(`/api/team/${teamId}`);
      setTeam(resp.data);
      
      const sessionUserId = session?.user?.id;
      const myMembership = resp.data.members.find(
        (m: any) => (m.user?.id || m.userId) === sessionUserId
      );
      setCurrentUserRole(myMembership?.role || "viewer");
    } catch (error) {
      console.error("Error fetching team:", error);
      toast({ title: "Fetch failed", description: "Could not load team details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (teamId && session?.user?.id) {
      fetchTeamDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, session?.user?.id]);

  const filteredMembers = useMemo(() => {
    if (!team) return [];
    
    let membersList = team.members.filter((m) => {
      const name = m.user?.name || m.name || "";
      const email = m.user?.email || m.email || "";
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (currentUserRole === 'viewer') {
      const sessionUserId = session?.user?.id;
      membersList = membersList.filter(m => 
        m.role === 'admin' || 
        m.role === 'owner' || 
        (m.user?.id || (m as any).userId) === sessionUserId
      );
    }

    return membersList;
  }, [team, searchTerm, currentUserRole, session?.user?.id]);

  const handleInviteMember = async () => {
    setIsInviting(true);
    try {
      await apiClient.post("/api/team/invite", {
        member: { teamId, email: inviteForm.email, role: inviteForm.role }
      });
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "viewer" });
      fetchTeamDetails();
      toast({ title: "Success", description: `Invitation sent to ${inviteForm.email}` });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.response?.data?.error || "Failed to invite member",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!confirmDialog.member || !confirmDialog.newRole) return;
    try {
      await apiClient.put("/api/team/role", { 
        memberId: confirmDialog.member.id, 
        newRole: confirmDialog.newRole 
      });
      fetchTeamDetails();
      setConfirmDialog({ open: false, type: "remove" });
      toast({ title: "Role updated" });
    } catch (error: any) {
      toast({ title: "Update failed", description: "Could not modify role.", variant: "destructive" });
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmDialog.member) return;
    try {
      await apiClient.delete("/api/team/remove", { data: { memberId: confirmDialog.member.id } });
      fetchTeamDetails();
      setConfirmDialog({ open: false, type: "remove" });
      toast({ title: "Member removed" });
    } catch (error: any) {
      toast({ title: "Remove failed", variant: "destructive" });
    }
  };

  const handleUpdateTeam = async (data: Partial<Team>) => {
    try {
        await apiClient.put("/api/team", { teamId, ...data });
        setTeam(prev => prev ? { ...prev, ...data } : null);
        toast({ title: "Team updated" });
    } catch (e) {
        toast({ title: "Error", variant: "destructive" });
    }
  }

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete("/api/team", { data: { teamId } });
      router.push("/teams");
      toast({ title: "Team deleted" });
    } catch (error: any) {
      setIsDeleting(false);
      toast({ title: "Decline failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <Skeleton className="h-10 w-[300px] mb-6" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }
  if (!team) return <DashboardLayout><div className="p-8">Team not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/teams" className="hover:text-foreground transition-colors">Teams</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{team.name}</span>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
                <div className={cn(
                    "h-16 w-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm",
                    team.teamColor || "bg-blue-600"
                )}>
                    {team.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                        {team.isPrivate ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 rounded-full"><Lock className="h-3 w-3" /> Private Team</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-full"><Globe className="h-3 w-3" /> Public Team</Badge>
                        )}
                        <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {team.members.length} members</span>
                    </div>
                </div>
            </div>

            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <div className="flex items-center gap-3">
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 px-4">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite to Team</DialogTitle>
                      <DialogDescription>Add a new member and assign their initial role.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input 
                              placeholder="user@example.com"
                              value={inviteForm.email}
                              onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                          />
                      </div>
                      <div className="space-y-2">
                              <Label>Team Role</Label>
                              <Select 
                                  value={inviteForm.role} 
                                  onValueChange={(val: any) => setInviteForm({...inviteForm, role: val})}
                              >
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="viewer">Viewer</SelectItem>
                                      <SelectItem value="developer">Developer</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                              </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleInviteMember} disabled={isInviting}>
                          {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="members" className="w-full">
            <TabsList className="bg-muted/50 p-1 mb-6">
                <TabsTrigger value="members" className="px-6 rounded-md">Members</TabsTrigger>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                    <TabsTrigger value="settings" className="px-6 rounded-md">Settings</TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="members" className="space-y-6">
                <Card className="border">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Members List</CardTitle>
                            <CardDescription>Directly manage roles and team access for each user.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 bg-background"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-muted/30 text-muted-foreground border-b uppercase text-[10px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y border-b">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-muted/5 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border">
                                                        <AvatarFallback className="bg-muted text-[10px] font-bold transition-transform group-hover:scale-105">
                                                            {(member?.user?.name || member.name || "U").charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{member?.user?.name || member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member?.user?.email || member.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className={cn("px-2 py-0 h-6 font-medium border flex w-fit items-center gap-1.5", roleLabel[member.role].color)}>
                                                    {(() => {
                                                        const Icon = roleLabel[member.role].icon;
                                                        return <Icon className="h-3 w-3" />;
                                                    })()}
                                                    {roleLabel[member.role].label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", member.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-400")} />
                                                    <span className="text-xs capitalize">{member.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(member.joinedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                                                    <div className="relative inline-block">
                                                        <Button 
                                                          variant="ghost" 
                                                          size="icon" 
                                                          className="h-8 w-8 dropdown-trigger-btn"
                                                          onClick={(e) => {
                                                            if (activeDropdown === member.id) {
                                                              setActiveDropdown(null);
                                                            } else {
                                                              const rect = e.currentTarget.getBoundingClientRect();
                                                              setDropdownPos({
                                                                top: rect.bottom + 4,
                                                                right: window.innerWidth - rect.right
                                                              });
                                                              setActiveDropdown(member.id);
                                                            }
                                                          }}
                                                        >
                                                            <MoreVertical className="h-4 w-4 pointer-events-none" />
                                                        </Button>
                                                        
                                                        {activeDropdown === member.id && (
                                                            <div 
                                                              className="fixed w-48 rounded-md border border-border bg-popover shadow-xl z-[9999] overflow-hidden text-left p-1 animate-in fade-in zoom-in duration-100 custom-dropdown-container"
                                                              style={{ top: dropdownPos.top, right: dropdownPos.right }}
                                                            >
                                                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Manage Role</div>
                                                                <button 
                                                                    className={cn("w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors", member.role === 'admin' ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground")}
                                                                    disabled={member.role === 'admin'}
                                                                    onClick={() => { setConfirmDialog({ open: true, type: 'role-change', member, newRole: 'admin' }); setActiveDropdown(null); }}
                                                                >Admin</button>
                                                                <button 
                                                                    className={cn("w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors", member.role === 'developer' ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground")}
                                                                    disabled={member.role === 'developer'}
                                                                    onClick={() => { setConfirmDialog({ open: true, type: 'role-change', member, newRole: 'developer' }); setActiveDropdown(null); }}
                                                                >Developer</button>
                                                                <button 
                                                                    className={cn("w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors", member.role === 'viewer' ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground")}
                                                                    disabled={member.role === 'viewer'}
                                                                    onClick={() => { setConfirmDialog({ open: true, type: 'role-change', member, newRole: 'viewer' }); setActiveDropdown(null); }}
                                                                >Viewer</button>
                                                                <div className="h-px bg-border my-1" />
                                                                <button 
                                                                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors text-destructive hover:bg-destructive/10"
                                                                    onClick={() => { setConfirmDialog({ open: true, type: 'remove', member }); setActiveDropdown(null); }}
                                                                >Remove from Team</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredMembers.length === 0 && (
                                <div className="py-20 text-center opacity-70">
                                    <p className="text-muted-foreground">No members found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Team Name</Label>
                            <div className="flex gap-3">
                                <Input defaultValue={team.name} className="max-w-md" />
                                <Button variant="outline" onClick={() => handleUpdateTeam({ name: team.name })}>Update</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Description</Label>
                             <Textarea defaultValue={team.description} className="max-w-xl" />
                             <Button variant="outline" className="mt-2" onClick={() => handleUpdateTeam({ description: team.description })}>Update</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-destructive/20 bg-destructive/5 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                        <CardDescription>Irreversible actions for this team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">Delete Team</p>
                                <p className="text-xs text-muted-foreground mt-1 text-balance">Once you delete a team, there is no going back. All access links will be severed.</p>
                            </div>
                            <Button variant="destructive" onClick={() => setConfirmDialog({ open: true, type: 'remove', member: { id: 'team', name: team.name } as any })}>Delete Team</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Global Confirmation Flow */}
        <AlertDialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog({...confirmDialog, open})}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                {confirmDialog.type === "remove" ? (confirmDialog.member?.id === 'team' ? "Delete Team?" : "Remove Member?") : "Update Role?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                 {confirmDialog.type === "remove" ? (
                     confirmDialog.member?.id === 'team' ? 
                     `Are you sure you want to delete ${confirmDialog.member?.name}? This action is terminal.` :
                     `Are you sure you want to remove ${confirmDialog.member?.user?.name || confirmDialog.member?.name || "this user"}? They will lose all access to team resources immediately.`
                 ) : (
                     `Update role for ${confirmDialog.member?.user?.name || confirmDialog.member?.name || "this user"} to ${confirmDialog.newRole}?`
                 )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                    if (confirmDialog.member?.id === 'team') {
                        handleDeleteTeam();
                    } else {
                        confirmDialog.type === 'remove' ? handleRemoveMember() : handleRoleUpdate();
                    }
                }}
                className={cn(confirmDialog.type === 'remove' ? "bg-destructive text-white" : "bg-primary")}
              >
                 Confirm Action
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
};

export default TeamDetailPage;
