import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "developer" | "viewer";
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
    color: "bg-warning/10 text-warning border-warning/20",
    description: "Full team access and management privileges",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-destructive/10 text-destructive border-destructive/20",
    description: "Full project access and team member management",
  },
  developer: {
    label: "Developer",
    icon: Code,
    color: "bg-info/10 text-info border-info/20",
    description: "Read/write access to projects and development resources",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-muted/50 text-muted-foreground border-muted",
    description: "Read-only access to team projects and resources",
  },
};

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    color: "bg-muted/50 text-muted-foreground border-muted",
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

  const handleRoleChange = () => {
    if (!confirmDialog.member || !confirmDialog.newRole) return;

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-card border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/teams">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Teams
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${team.color}`} />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  {team.name}
                </h1>
                <p className="text-muted-foreground mt-1">{team.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    {team.projects} projects
                  </div>
                  {team.isPrivate && (
                    <Badge variant="secondary">
                      Private Team
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {canInviteMembers(currentUser.role) && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>Send an invitation to join {team.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
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
                          <SelectItem value="viewer">
                            <div className="flex flex-col items-start">
                              <span>Viewer</span>
                              <span className="text-xs text-muted-foreground">Read-only access</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="developer">
                            <div className="flex flex-col items-start">
                              <span>Developer</span>
                              <span className="text-xs text-muted-foreground">Read/write access</span>
                            </div>
                          </SelectItem>
                          {currentUser.role === "owner" && (
                            <SelectItem value="admin">
                              <div className="flex flex-col items-start">
                                <span>Admin</span>
                                <span className="text-xs text-muted-foreground">Full project access</span>
                              </div>
                            </SelectItem>
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
                      />
                    </div>
                  </div>
                  <DialogFooter>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{members.length}</div>
              <p className="text-xs text-muted-foreground">Team size</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {members.filter((m) => m.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((members.filter((m) => m.status === "active").length / members.length) * 100)}% of team
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {members.filter((m) => m.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {members.filter((m) => m.role === "admin" || m.role === "owner").length}
              </div>
              <p className="text-xs text-muted-foreground">With admin access</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Manage team members, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {filteredMembers.map((member) => {
                const RoleIcon = roleConfig[member.role].icon;
                const StatusIcon = statusConfig[member.status].icon;
                const canEdit = canEditMember(currentUser.role, member.role);
                const canRemove = canRemoveMember(currentUser.role, member.role);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-primary/20 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge variant="outline" className={roleConfig[member.role].color}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig[member.role].label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig[member.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[member.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                          <span>Last active: {member.lastActive}</span>
                          <span>{member.projects} projects</span>
                          {member.department && <span>• {member.department}</span>}
                          {member.invitedBy && <span>• Invited by {member.invitedBy}</span>}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
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
                            className="text-destructive"
                            onClick={() => handleRemoveMemberRequest(member.id)}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No members found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {confirmDialog.type === "remove" ? "Remove Team Member" : "Change Member Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "remove" ? (
                <>
                  Are you sure you want to remove <strong>{confirmDialog.member?.name}</strong> from{" "}
                  <strong>{team.name}</strong>? This action cannot be undone and they will lose access to all team
                  projects immediately.
                </>
              ) : (
                <>
                  Are you sure you want to change <strong>{confirmDialog.member?.name}</strong>'s role to{" "}
                  <strong>{confirmDialog.newRole && roleConfig[confirmDialog.newRole].label}</strong>?
                  {confirmDialog.newRole && (
                    <div className="mt-2 p-3 bg-muted/50 rounded border border-primary/20 text-sm">
                      {roleConfig[confirmDialog.newRole].description}
                    </div>
                  )}
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
              {confirmDialog.type === "remove" ? "Remove Member" : "Change Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamDetail;