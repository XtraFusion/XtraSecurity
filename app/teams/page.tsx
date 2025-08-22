"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "developer" | "viewer"
  status: "active" | "pending" | "inactive"
  joinedAt: string
  lastActive: string
  projects: number
  invitedBy?: string
  department?: string
  location?: string
}

const currentUser = {
  id: "1",
  role: "owner" as const, // This would come from auth context in real app
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@company.com",
    role: "owner",
    status: "active",
    joinedAt: "2024-01-15",
    lastActive: "2024-01-20",
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
    lastActive: "2024-01-20",
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
    lastActive: "2024-01-19",
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
]

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    description: "Full system access and billing management",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    description: "Full project access and team management",
  },
  developer: {
    label: "Developer",
    icon: Code,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    description: "Read/write access to projects and secrets",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    description: "Read-only access to projects",
  },
}

const statusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    icon: UserX,
  },
}

const canInviteMembers = (userRole: string) => {
  return userRole === "owner" || userRole === "admin"
}

const canEditMember = (userRole: string, targetMemberRole: string) => {
  if (userRole === "owner") return true
  if (userRole === "admin" && targetMemberRole !== "owner") return true
  return false
}

const canRemoveMember = (userRole: string, targetMemberRole: string) => {
  if (userRole === "owner" && targetMemberRole !== "owner") return true
  if (userRole === "admin" && targetMemberRole !== "owner" && targetMemberRole !== "admin") return true
  return false
}

export default function TeamsPage() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "viewer" as TeamMember["role"],
    message: "",
    department: "",
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "remove" | "role-change"
    member?: TeamMember
    newRole?: TeamMember["role"]
  }>({
    open: false,
    type: "remove",
  })

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInviteMember = () => {
    if (!canInviteMembers(currentUser.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to invite team members",
        variant: "destructive",
      })
      return
    }

    if (!inviteForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      })
      return
    }

    // Check if email already exists
    if (members.some((member) => member.email === inviteForm.email)) {
      toast({
        title: "Error",
        description: "This email is already associated with a team member",
        variant: "destructive",
      })
      return
    }

    // Simulate API call
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteForm.email.split("@")[0],
      email: inviteForm.email,
      role: inviteForm.role,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0],
      lastActive: "Never",
      projects: 0,
      invitedBy: members.find((m) => m.id === currentUser.id)?.name,
      department: inviteForm.department,
    }

    setMembers([...members, newMember])
    setInviteForm({ email: "", role: "viewer", message: "", department: "" })
    setInviteDialogOpen(false)

    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteForm.email}`,
    })
  }

  const handleRoleChangeRequest = (memberId: string, newRole: TeamMember["role"]) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    if (!canEditMember(currentUser.role, member.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to change this member's role",
        variant: "destructive",
      })
      return
    }

    setConfirmDialog({
      open: true,
      type: "role-change",
      member,
      newRole,
    })
  }

  const handleRoleChange = () => {
    if (!confirmDialog.member || !confirmDialog.newRole) return

    setMembers(
      members.map((member) =>
        member.id === confirmDialog.member!.id ? { ...member, role: confirmDialog.newRole! } : member,
      ),
    )

    setConfirmDialog({ open: false, type: "remove" })

    toast({
      title: "Role updated",
      description: `${confirmDialog.member.name}'s role has been updated to ${roleConfig[confirmDialog.newRole].label}`,
    })
  }

  const handleRemoveMemberRequest = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    if (!canRemoveMember(currentUser.role, member.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to remove this member",
        variant: "destructive",
      })
      return
    }

    setConfirmDialog({
      open: true,
      type: "remove",
      member,
    })
  }

  const handleRemoveMember = () => {
    if (!confirmDialog.member) return

    setMembers(members.filter((member) => member.id !== confirmDialog.member!.id))
    setConfirmDialog({ open: false, type: "remove" })

    toast({
      title: "Member removed",
      description: `${confirmDialog.member.name} has been removed from the team`,
    })
  }

  const handleResendInvitation = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    toast({
      title: "Invitation resent",
      description: `Invitation resent to ${member.email}`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
          </div>
          {canInviteMembers(currentUser.role) && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>Send an invitation to join your team</DialogDescription>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.filter((m) => m.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((members.filter((m) => m.status === "active").length / members.length) * 100)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.filter((m) => m.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === "admin" || m.role === "owner").length}
              </div>
              <p className="text-xs text-muted-foreground">With full access</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your team members and their permissions</CardDescription>
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
                const RoleIcon = roleConfig[member.role].icon
                const StatusIcon = statusConfig[member.status].icon
                const canEdit = canEditMember(currentUser.role, member.role)
                const canRemove = canRemoveMember(currentUser.role, member.role)

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
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
                )
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

        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {confirmDialog.type === "remove" ? "Remove Team Member" : "Change Member Role"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.type === "remove" ? (
                  <>
                    Are you sure you want to remove <strong>{confirmDialog.member?.name}</strong> from the team? This
                    action cannot be undone and they will lose access to all projects immediately.
                  </>
                ) : (
                  <>
                    Are you sure you want to change <strong>{confirmDialog.member?.name}</strong>'s role to{" "}
                    <strong>{confirmDialog.newRole && roleConfig[confirmDialog.newRole].label}</strong>?
                    {confirmDialog.newRole && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
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
    </DashboardLayout>
  )
}
