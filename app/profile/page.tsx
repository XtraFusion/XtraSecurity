"use client"

import type React from "react"

import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Plus,
  MapPin,
  Clock,
  Smartphone,
  Monitor,
  Globe,
  Upload,
  QrCode,
  Shield,
  Download,
  RefreshCw,
  Camera,
  CheckCircle,
  AlertTriangle,
  Bell,
  Mail,
  Settings,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { useTheme } from "next-themes"

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  lastUsed: string
  status: "active" | "inactive"
}

interface SecuritySession {
  id: string
  device: string
  location: string
  ip: string
  lastActive: string
  current: boolean
  browser: string
  os: string
}

const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production API",
    key: "sk_live_1234567890abcdef",
    permissions: ["read", "write"],
    createdAt: "2024-01-15",
    lastUsed: "2024-01-22",
    status: "active",
  },
  {
    id: "2",
    name: "Development API",
    key: "sk_test_abcdef1234567890",
    permissions: ["read"],
    createdAt: "2024-01-10",
    lastUsed: "2024-01-20",
    status: "active",
  },
]

const mockSessions: SecuritySession[] = [
  {
    id: "1",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    os: "macOS Sonoma",
    location: "San Francisco, CA",
    ip: "192.168.1.100",
    lastActive: "2024-01-22T10:30:00Z",
    current: true,
  },
  {
    id: "2",
    device: "iPhone 15 Pro",
    browser: "Safari 17.0",
    os: "iOS 17.2",
    location: "San Francisco, CA",
    ip: "192.168.1.101",
    lastActive: "2024-01-21T15:20:00Z",
    current: false,
  },
  {
    id: "3",
    device: "Windows Desktop",
    browser: "Edge 120.0",
    os: "Windows 11",
    location: "New York, NY",
    ip: "203.0.113.42",
    lastActive: "2024-01-20T09:15:00Z",
    current: false,
  },
]

export default function ProfilePage() {
  const user = getCurrentUser()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys)
  const [sessions, setSessions] = useState<SecuritySession[]>(mockSessions)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false)
  const [changePasswordDialog, setChangePasswordDialog] = useState(false)
  const [twoFactorDialog, setTwoFactorDialog] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles",
    company: "",
    website: "",
    phone: "",
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    securityAlerts: true,
    projectUpdates: false,
    teamInvites: true,
    weeklyDigest: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "24",
    loginNotifications: true,
    suspiciousActivityAlerts: true,
    passwordlessLogin: false,
  })

  // API Key form
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
    permissions: [] as string[],
    expiresIn: "never",
  })

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 1MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpdate = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    })
  }

  const handleCreateApiKey = () => {
    if (!apiKeyForm.name) {
      toast({
        title: "Error",
        description: "API key name is required",
        variant: "destructive",
      })
      return
    }

    const newApiKey: ApiKey = {
      id: Date.now().toString(),
      name: apiKeyForm.name,
      key: `sk_${Math.random().toString(36).substring(2, 15)}`,
      permissions: apiKeyForm.permissions,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    }

    setApiKeys([...apiKeys, newApiKey])
    setApiKeyForm({ name: "", permissions: [], expiresIn: "never" })
    setNewApiKeyDialog(false)

    toast({
      title: "API key created",
      description: "Your new API key has been created successfully",
    })
  }

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== keyId))
    toast({
      title: "API key deleted",
      description: "The API key has been deleted successfully",
    })
  }

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((session) => session.id !== sessionId))
    toast({
      title: "Session revoked",
      description: "The session has been revoked successfully",
    })
  }

  const handleRevokeAllSessions = () => {
    setSessions(sessions.filter((session) => session.current))
    toast({
      title: "All sessions revoked",
      description: "All other sessions have been revoked successfully",
    })
  }

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setChangePasswordDialog(false)
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully",
    })
  }

  const handleEnable2FA = () => {
    setSecuritySettings({ ...securitySettings, twoFactorEnabled: true })
    setTwoFactorDialog(false)
    toast({
      title: "2FA enabled",
      description: "Two-factor authentication has been enabled successfully",
    })
  }

  const handleDisable2FA = () => {
    setSecuritySettings({ ...securitySettings, twoFactorEnabled: false })
    toast({
      title: "2FA disabled",
      description: "Two-factor authentication has been disabled",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 8).toUpperCase())
    return codes
  }

  const [backupCodes] = useState(generateBackupCodes())

  const downloadBackupCodes = () => {
    const content = `Backup Codes for ${user?.email}\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\nKeep these codes safe and secure. Each code can only be used once.`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {profileImage ? (
                        <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {profileForm.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                    {profileImage && (
                      <Button variant="ghost" size="sm" onClick={() => setProfileImage(null)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileForm.timezone}
                      onValueChange={(value) => setProfileForm({ ...profileForm, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australian Eastern Time (AET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">{profileForm.bio.length}/500 characters</p>
                </div>

                <Button onClick={handleProfileUpdate}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>Enter your current password and choose a new one</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                        <p className="text-sm text-muted-foreground">Must be at least 8 characters long</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setChangePasswordDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword}>Change Password</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      Enable 2FA
                      {securitySettings.twoFactorEnabled && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app to generate verification codes
                    </p>
                  </div>
                  {!securitySettings.twoFactorEnabled ? (
                    <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Shield className="h-4 w-4 mr-2" />
                          Enable 2FA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                          <DialogDescription>Scan the QR code with your authenticator app</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="p-4 bg-white rounded-lg">
                              <QrCode className="h-32 w-32 text-black" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Manual Entry Key</Label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 p-2 bg-muted rounded text-sm">JBSWY3DPEHPK3PXP</code>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard("JBSWY3DPEHPK3PXP")}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="verification-code">Verification Code</Label>
                            <Input id="verification-code" placeholder="Enter 6-digit code" maxLength={6} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTwoFactorDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleEnable2FA}>Enable 2FA</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" onClick={handleDisable2FA}>
                      Disable 2FA
                    </Button>
                  )}
                </div>
                {securitySettings.twoFactorEnabled && (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">Backup Codes</p>
                        <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Save these codes in a safe place. You can use them to access your account if you lose your
                        authenticator device.
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {backupCodes.slice(0, 4).map((code, i) => (
                          <div key={i} className="p-2 bg-background rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate New Codes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions across devices</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                  Revoke All Others
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {session.device.includes("iPhone") || session.device.includes("Mobile") ? (
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {session.device}
                            {session.current && <Badge variant="secondary">Current Session</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.browser} • {session.os}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ip}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(session.lastActive).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm" onClick={() => handleRevokeSession(session.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Preferences</CardTitle>
                <CardDescription>Configure additional security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Login Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, loginNotifications: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Suspicious Activity Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert me of unusual account activity</p>
                  </div>
                  <Switch
                    checked={securitySettings.suspiciousActivityAlerts}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, suspiciousActivityAlerts: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Select
                    value={securitySettings.sessionTimeout}
                    onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API keys for programmatic access</CardDescription>
                </div>
                <Dialog open={newApiKeyDialog} onOpenChange={setNewApiKeyDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>Create a new API key for programmatic access</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-name">Name</Label>
                        <Input
                          id="api-name"
                          placeholder="Production API"
                          value={apiKeyForm.name}
                          onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expires In</Label>
                        <Select
                          value={apiKeyForm.expiresIn}
                          onValueChange={(value) => setApiKeyForm({ ...apiKeyForm, expiresIn: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="read"
                              checked={apiKeyForm.permissions.includes("read")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: [...apiKeyForm.permissions, "read"],
                                  })
                                } else {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: apiKeyForm.permissions.filter((p) => p !== "read"),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="read">Read access to projects and secrets</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="write"
                              checked={apiKeyForm.permissions.includes("write")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: [...apiKeyForm.permissions, "write"],
                                  })
                                } else {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: apiKeyForm.permissions.filter((p) => p !== "write"),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="write">Write access to create and modify secrets</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="admin"
                              checked={apiKeyForm.permissions.includes("admin")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: [...apiKeyForm.permissions, "admin"],
                                  })
                                } else {
                                  setApiKeyForm({
                                    ...apiKeyForm,
                                    permissions: apiKeyForm.permissions.filter((p) => p !== "admin"),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="admin">Admin access to manage projects and teams</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewApiKeyDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateApiKey}>Create Key</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{apiKey.name}</p>
                          <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>{apiKey.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {showApiKey === apiKey.id ? apiKey.key : "sk_" + "•".repeat(20)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          >
                            {showApiKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Permissions: {apiKey.permissions.join(", ")}</span>
                          <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                          <span>Last used: {apiKey.lastUsed}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the API key and revoke access
                              for any applications using it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteApiKey(apiKey.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you want to receive and how</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">Text message alerts for critical events</p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Event Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Security Alerts
                        </p>
                        <p className="text-sm text-muted-foreground">Login attempts, password changes, etc.</p>
                      </div>
                      <Switch
                        checked={notifications.securityAlerts}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, securityAlerts: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Project Updates
                        </p>
                        <p className="text-sm text-muted-foreground">Changes to projects and secrets</p>
                      </div>
                      <Switch
                        checked={notifications.projectUpdates}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, projectUpdates: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Team Invites</p>
                        <p className="text-sm text-muted-foreground">Invitations to join teams</p>
                      </div>
                      <Switch
                        checked={notifications.teamInvites}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, teamInvites: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-muted-foreground">Weekly summary of activity</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyDigest}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Product updates and tips</p>
                      </div>
                      <Switch
                        checked={notifications.marketingEmails}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data
                        from our servers including all projects, secrets, and team memberships.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
