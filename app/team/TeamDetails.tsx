"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UserPlus,
  MoreHorizontal,
  Mail,
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
  Sparkles,
  Activity,
  ChevronRight,
  Filter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "developer" | "viewer" | "guest";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  lastActive: string;
  projects: number;
  invitedBy?: string;
  department?: string;
  location?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  isPrivate: boolean;
  createdAt: string;
  projects: number;
}

const currentUser = {
  id: "1",
  role: "owner" as const,
  name: "John Doe",
};

const mockTeams: Record<string, Team> = {
  "1": {
    id: "1",
    name: "Engineering",
    description: "Core development team responsible for product architecture and implementation",
    color: "bg-blue-500",
    isPrivate: false,
    createdAt: "2024-01-15",
    projects: 8,
  },
  "2": {
    id: "2",
    name: "Design System",
    description: "UI/UX designers working on design consistency and user experience",
    color: "bg-purple-500",
    isPrivate: false,
    createdAt: "2024-01-18",
    projects: 4,
  },
  "3": {
    id: "3",
    name: "DevOps & Infrastructure",
    description: "Managing deployment pipelines, monitoring, and cloud infrastructure",
    color: "bg-green-500",
    isPrivate: true,
    createdAt: "2024-01-20",
    projects: 6,
  },
};

const mockTeamMembers: Record<string, TeamMember[]> = {
  "1": [
    {
      id: "1",
      name: "John Doe",
      email: "john@company.com",
      role: "owner",
      status: "active",
      joinedAt: "2024-01-15",
      lastActive: "2 hours ago",
      projects: 12,
      department: "Engineering",
      location: "San Francisco, CA",
    },
    {
      id: "2",
      name: "Sarah Wilson",
      email: "sarah@company.com",
      role: "admin",
      status: "active",
      joinedAt: "2024-01-18",
      lastActive: "1 day ago",
      projects: 8,
      invitedBy: "John Doe",
      department: "DevOps",
      location: "New York, NY",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@company.com",
      role: "developer",
      status: "active",
      joinedAt: "2024-01-20",
      lastActive: "3 hours ago",
      projects: 5,
      invitedBy: "Sarah Wilson",
      department: "Frontend",
      location: "Austin, TX",
    },
    {
      id: "4",
      name: "Emily Chen",
      email: "emily@company.com",
      role: "viewer",
      status: "pending",
      joinedAt: "2024-01-22",
      lastActive: "Never",
      projects: 0,
      invitedBy: "John Doe",
      department: "QA",
      location: "Seattle, WA",
    },
  ],
  "2": [
    {
      id: "5",
      name: "Alex Rivera",
      email: "alex@company.com",
      role: "admin",
      status: "active",
      joinedAt: "2024-01-16",
      lastActive: "1 hour ago",
      projects: 6,
      department: "Design",
      location: "Los Angeles, CA",
    },
    {
      id: "6",
      name: "Jordan Smith",
      email: "jordan@company.com",
      role: "developer",
      status: "active",
      joinedAt: "2024-01-19",
      lastActive: "30 minutes ago",
      projects: 4,
      invitedBy: "Alex Rivera",
      department: "UX Research",
      location: "Chicago, IL",
    },
  ],
  "3": [
    {
      id: "7",
      name: "Sam Taylor",
      email: "sam@company.com",
      role: "admin",
      status: "active",
      joinedAt: "2024-01-17",
      lastActive: "45 minutes ago",
      projects: 7,
      department: "DevOps",
      location: "Portland, OR",
    },
  ],
};

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Full team access and management privileges",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    description: "Full project access and team member management",
  },
  developer: {
    label: "Developer",
    icon: Code,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Read/write access to dev/staging, read-only for production",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-muted text-muted-foreground border-muted",
    description: "Read-only access to team projects and resources",
  },
  guest: {
    label: "Guest",
    icon: Clock,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    description: "Temporary access via JIT approval only",
  },
};

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    color: "bg-muted text-muted-foreground border-muted",
    icon: UserX,
  },
};

const canInviteMembers = (userRole: string) => {
  return userRole === "owner" || userRole === "admin";
};

const canEditMember = (userRole: string, targetMemberRole: string) => {
  if (userRole === "owner") return true;
  if (userRole === "admin" && targetMemberRole !== "owner") return true;
  return false;
};

const canRemoveMember = (userRole: string, targetMemberRole: string) => {
  if (userRole === "owner" && targetMemberRole !== "owner") return true;
  if (userRole === "admin" && targetMemberRole !== "owner" && targetMemberRole !== "admin") return true;
  return false;
};

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const team = teamId ? mockTeams[teamId] : null;
  const [members, setMembers] = useState<TeamMember[]>(teamId ? mockTeamMembers[teamId] || [] : []);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "viewer" as TeamMember["role"],
    message: "",
    department: "",
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "remove" | "role-change";
    member?: TeamMember;
    newRole?: TeamMember["role"];
  }>({
    open: false,
    type: "remove",
  });

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team not found</h1>
          <Link href="/teams">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInviteMember = () => {
    if (!canInviteMembers(currentUser.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to invite team members",
        variant: "destructive",
      });
      return;
    }

    if (!inviteForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (members.some((member) => member.email === inviteForm.email)) {
      toast({
        title: "Error",
        description: "This email is already associated with a team member",
        variant: "destructive",
      });
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteForm.email.split("@")[0],
      email: inviteForm.email,
      role: inviteForm.role,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0],
      lastActive: "Never",
      projects: 0,
      invitedBy: currentUser.name,
      department: inviteForm.department,
    };

    setMembers([...members, newMember]);
    setInviteForm({ email: "", role: "viewer", message: "", department: "" });
    setInviteDialogOpen(false);

    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteForm.email}`,
    });
  };

  const handleRoleChangeRequest = (memberId: string, newRole: TeamMember["role"]) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (!canEditMember(currentUser.role, member.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to change this member's role",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      type: "role-change",
      member,
      newRole,
    });
  };

  const handleRoleChange = async () => {
    if (!confirmDialog.member || !confirmDialog.newRole) return;

    try {
      // API Call simulation
      // await fetch("/api/team/role", ...);

      // Update local state
      setMembers(
        members.map((member) =>
          member.id === confirmDialog.member!.id ? { ...member, role: confirmDialog.newRole! } : member
        )
      );

      setConfirmDialog({ open: false, type: "remove" });

      toast({
        title: "Role updated",
        description: `${confirmDialog.member.name}'s role has been updated to ${roleConfig[confirmDialog.newRole].label}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMemberRequest = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (!canRemoveMember(currentUser.role, member.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to remove this member",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({
      open: true,
      type: "remove",
      member,
    });
  };

  const handleRemoveMember = () => {
    if (!confirmDialog.member) return;

    setMembers(members.filter((member) => member.id !== confirmDialog.member!.id));
    setConfirmDialog({ open: false, type: "remove" });

    toast({
      title: "Member removed",
      description: `${confirmDialog.member.name} has been removed from the team`,
    });
  };

  const handleResendInvitation = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    toast({
      title: "Invitation resent",
      description: `Invitation resent to ${member.email}`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">

      {/* Header */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Link href="/teams" className="hover:text-foreground transition-colors">Teams</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{team.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${team.color} text-white font-bold text-2xl shadow-lg`}>
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
                  {team.isPrivate && (
                    <Badge variant="secondary" className="h-6">Private</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl text-lg">{team.description}</p>

                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {team.projects} projects
                  </div>
                </div>
              </div>
            </div>

            {canInviteMembers(currentUser.role) && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-md">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>Send an invitation to join {team.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(value: TeamMember["role"]) => setInviteForm({ ...inviteForm, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                          <SelectItem value="developer">Developer - Read/Write access</SelectItem>
                          {currentUser.role === "owner" && (
                            <SelectItem value="admin">Admin - Full access</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Input
                        id="department"
                        placeholder="Engineering, Marketing, etc."
                        value={inviteForm.department}
                        onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Personal Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Welcome to our team!"
                        value={inviteForm.message}
                        onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteMember}>Send Invitation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Team size</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invites</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Mail className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === "admin" || m.role === "owner").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">With full access</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Team Members</h2>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[150px] h-9">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] h-9">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-border/60 overflow-hidden">
            <div className="divide-y divide-border/50">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const RoleIcon = roleConfig[member.role].icon;
                  // const StatusIcon = statusConfig[member.status].icon;
                  const canEdit = canEditMember(currentUser.role, member.role);
                  const canRemove = canRemoveMember(currentUser.role, member.role);

                  return (
                    <div key={member.id} className="group p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{member.name}</span>
                            <Badge variant="outline" className={`h-5 text-[10px] px-1.5 ${roleConfig[member.role].color}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleConfig[member.role].label}
                            </Badge>
                            {member.status !== 'active' && (
                              <Badge variant="outline" className={`h-5 text-[10px] px-1.5 ${statusConfig[member.status].color}`}>
                                {statusConfig[member.status].label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>{member.email}</span>
                            {member.department && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span>{member.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 text-sm text-muted-foreground">
                        <div className="flex flex-col md:items-end">
                          <span className="text-xs">Joined</span>
                          <span className="font-medium text-foreground">{new Date(member.joinedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="hidden md:flex flex-col md:items-end w-24">
                          <span className="text-xs">Last Active</span>
                          <span className="font-medium text-foreground">{member.lastActive}</span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {member.status === "pending" && canInviteMembers(currentUser.role) && (
                              <DropdownMenuItem onClick={() => handleResendInvitation(member.id)}>
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canEdit && (
                              <>
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                {Object.entries(roleConfig).map(([role, config]) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleRoleChangeRequest(member.id, role as TeamMember["role"])}
                                    disabled={member.role === role || (role === "owner" && currentUser.role !== "owner")}
                                  >
                                    <config.icon className="mr-2 h-4 w-4" />
                                    {config.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canRemove && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleRemoveMemberRequest(member.id)}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Remove from Team
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No members found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Delete/Change Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.type === "remove" ? "Remove Team Member" : "Change User Role"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.type === "remove" ? (
                  <>
                    Are you sure you want to remove <strong>{confirmDialog.member?.name}</strong> from the team?
                    They will lose access to all team projects and resources.
                  </>
                ) : (
                  <>
                    Are you sure you want to change <strong>{confirmDialog.member?.name}</strong>'s role to <strong>{confirmDialog.newRole && roleConfig[confirmDialog.newRole].label}</strong>?
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDialog.type === "remove" ? handleRemoveMember : handleRoleChange}
                className={confirmDialog.type === "remove" ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {confirmDialog.type === "remove" ? "Remove Member" : "Update Role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default TeamDetail;