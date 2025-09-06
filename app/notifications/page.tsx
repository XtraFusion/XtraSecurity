"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Bell,
  Plus,
  Settings,
  Mail,
  MessageSquare,
  Webhook,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  Zap,
  Shield,
  Activity,
  Users,
  Key,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import axios from "axios";

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: string[];
  channels: string[];
  conditions: {
    projects?: string[];
    branches?: string[];
    environments?: string[];
    severity?: string[];
  };
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
}

interface NotificationChannel {
  id: string;
  type: "email" | "slack" | "teams" | "webhook";
  name: string;
  enabled: boolean;
  config: {
    email?: string;
    webhookUrl?: string;
    slackChannel?: string;
    teamsWebhook?: string;
  };
  createdAt: string;
}

interface NotificationAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  type:
    | "secret_change"
    | "rotation_failed"
    | "suspicious_activity"
    | "access_denied"
    | "system_error";
  project?: string;
  branch?: string;
  user?: string;
  timestamp: string;
  read: boolean;
  channels: string[];
  metadata?: Record<string, any>;
}

const mockRules: NotificationRule[] = [
  {
    id: "1",
    name: "Production Secret Changes",
    description: "Alert when secrets are modified in production environments",
    enabled: true,
    triggers: ["secret_change", "secret_rotation"],
    channels: ["email-1", "slack-1"],
    conditions: {
      environments: ["production"],
      severity: ["warning", "error", "critical"],
    },
    createdBy: "admin@example.com",
    createdAt: "2024-01-01T00:00:00Z",
    lastTriggered: "2024-01-15T10:30:00Z",
  },
];

const mockChannels: NotificationChannel[] = [
  {
    id: "email-1",
    type: "email",
    name: "Admin Email",
    enabled: true,
    config: {
      email: "admin@example.com",
    },
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const mockAlerts: NotificationAlert[] = [
  {
    id: "1",
    ruleId: "1",
    ruleName: "Production Secret Changes",
    title: "Secret Modified in Production",
    message: "DATABASE_URL was updated in Production API (main branch)",
    severity: "warning",
    type: "secret_change",
    project: "Production API",
    branch: "main",
    user: "admin@example.com",
    timestamp: "2024-01-15T10:30:00Z",
    read: false,
    channels: ["email-1", "slack-1"],
    metadata: {
      secretKey: "DATABASE_URL",
      oldValue: "postgresql://...",
      newValue: "postgresql://...",
    },
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [rules, setRules] = useState<NotificationRule[]>(mockRules);
  const [channels, setChannels] = useState<NotificationChannel[]>(mockChannels);
  const [alerts, setAlerts] = useState<NotificationAlert[]>(mockAlerts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("alerts");
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teamInvites, setTeamInvites] = useState([]);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    triggers: [] as string[],
    channels: [] as string[],
    conditions: {
      projects: [] as string[],
      branches: [] as string[],
      environments: [] as string[],
      severity: [] as string[],
    },
  });

  const [newChannel, setNewChannel] = useState({
    type: "email" as const,
    name: "",
    config: {
      email: "",
      webhookUrl: "",
      slackChannel: "",
      teamsWebhook: "",
    },
  });

  useEffect(() => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.project?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "secret_change":
        return <Key className="h-4 w-4" />;
      case "rotation_failed":
        return <XCircle className="h-4 w-4" />;
      case "suspicious_activity":
        return <Shield className="h-4 w-4" />;
      case "access_denied":
        return <AlertTriangle className="h-4 w-4" />;
      case "system_error":
        return <Activity className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "slack":
        return <MessageSquare className="h-4 w-4" />;
      case "teams":
        return <Users className="h-4 w-4" />;
      case "webhook":
        return <Webhook className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.triggers.length || !newRule.channels.length)
      return;

    const rule: NotificationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      description: newRule.description,
      enabled: true,
      triggers: newRule.triggers,
      channels: newRule.channels,
      conditions: newRule.conditions,
      createdBy: "admin@example.com",
      createdAt: new Date().toISOString(),
    };

    setRules([...rules, rule]);
    setNewRule({
      name: "",
      description: "",
      triggers: [],
      channels: [],
      conditions: {
        projects: [],
        branches: [],
        environments: [],
        severity: [],
      },
    });
    setIsCreateRuleOpen(false);
    setNotification({
      type: "success",
      message: "Notification rule created successfully",
    });
  };

  const handleCreateChannel = () => {
    if (!newChannel.name) return;

    const channel: NotificationChannel = {
      id: `${newChannel.type}-${Date.now()}`,
      type: newChannel.type,
      name: newChannel.name,
      enabled: true,
      config: newChannel.config,
      createdAt: new Date().toISOString(),
    };

    setChannels([...channels, channel]);
    setNewChannel({
      type: "email",
      name: "",
      config: {
        email: "",
        webhookUrl: "",
        slackChannel: "",
        teamsWebhook: "",
      },
    });
    setIsCreateChannelOpen(false);
    setNotification({
      type: "success",
      message: "Notification channel created successfully",
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    setNotification({ type: "success", message: "Rule updated successfully" });
  };

  const handleToggleChannel = (channelId: string) => {
    setChannels(
      channels.map((channel) =>
        channel.id === channelId
          ? { ...channel, enabled: !channel.enabled }
          : channel
      )
    );
    setNotification({
      type: "success",
      message: "Channel updated successfully",
    });
  };

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
    setNotification({ type: "success", message: "Alert deleted successfully" });
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId));
    setNotification({ type: "success", message: "Rule deleted successfully" });
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(channels.filter((channel) => channel.id !== channelId));
    setNotification({
      type: "success",
      message: "Channel deleted successfully",
    });
  };

  const stats = {
    totalAlerts: alerts.length,
    unreadAlerts: alerts.filter((a) => !a.read).length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    activeRules: rules.filter((r) => r.enabled).length,
    activeChannels: channels.filter((c) => c.enabled).length,
  };

  useEffect(() => {
    getTeamInvites();
  }, []);
  const getTeamInvites = async () => {
    const resp = await axios.get("/api/team/invite");
    console.log(resp.data.invites);
    setTeamInvites(resp.data.invites);
  };

  const handleAcceptInvite = async (inviteId: string) => {
    await axios.post(`/api/team/invite/accept`, {
      teamId: inviteId,
      status: "active",
    });
    setNotification({
      type: "success",
      message: "Invite accepted successfully",
    });
    getTeamInvites();
  };

  const handleDeclineInvite = async (inviteId: string) => {
    await axios.post(`/api/team/invite/accept`, {
      teamId: inviteId,
      status: "decline",
    });
    setNotification({
      type: "success",
      message: "Invite declined successfully",
    });
    getTeamInvites();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse mb-2"></div>
                  <div className="h-8 bg-muted rounded w-12 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded"
                  >
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <Alert
            className={`${
              notification.type === "error"
                ? "border-destructive"
                : "border-green-500"
            } animate-in slide-in-from-top-2 duration-300`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Manage alerts, rules, and notification channels
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog
              open={isCreateChannelOpen}
              onOpenChange={setIsCreateChannelOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Add Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Notification Channel</DialogTitle>
                  <DialogDescription>
                    Add a new channel to receive notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel-type">Channel Type</Label>
                    <Select
                      value={newChannel.type}
                      onValueChange={(value) =>
                        setNewChannel({ ...newChannel, type: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel-name">Channel Name</Label>
                    <Input
                      id="channel-name"
                      placeholder="e.g., Security Team Email"
                      value={newChannel.name}
                      onChange={(e) =>
                        setNewChannel({ ...newChannel, name: e.target.value })
                      }
                    />
                  </div>
                  {newChannel.type === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={newChannel.config.email}
                        onChange={(e) =>
                          setNewChannel({
                            ...newChannel,
                            config: {
                              ...newChannel.config,
                              email: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                  {newChannel.type === "slack" && (
                    <div className="space-y-2">
                      <Label htmlFor="slack-channel">Slack Channel</Label>
                      <Input
                        id="slack-channel"
                        placeholder="#security-alerts"
                        value={newChannel.config.slackChannel}
                        onChange={(e) =>
                          setNewChannel({
                            ...newChannel,
                            config: {
                              ...newChannel.config,
                              slackChannel: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                  {newChannel.type === "teams" && (
                    <div className="space-y-2">
                      <Label htmlFor="teams-webhook">Teams Webhook URL</Label>
                      <Input
                        id="teams-webhook"
                        placeholder="https://outlook.office.com/webhook/..."
                        value={newChannel.config.teamsWebhook}
                        onChange={(e) =>
                          setNewChannel({
                            ...newChannel,
                            config: {
                              ...newChannel.config,
                              teamsWebhook: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                  {newChannel.type === "webhook" && (
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://api.example.com/webhook"
                        value={newChannel.config.webhookUrl}
                        onChange={(e) =>
                          setNewChannel({
                            ...newChannel,
                            config: {
                              ...newChannel.config,
                              webhookUrl: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateChannelOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateChannel}
                      className="w-full sm:w-auto"
                    >
                      Create Channel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Notification Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated alerts for specific events and conditions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      placeholder="e.g., Production Secret Changes"
                      value={newRule.name}
                      onChange={(e) =>
                        setNewRule({ ...newRule, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe when this rule should trigger"
                      value={newRule.description}
                      onChange={(e) =>
                        setNewRule({ ...newRule, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "secret_change",
                        "rotation_failed",
                        "suspicious_activity",
                        "access_denied",
                        "system_error",
                      ].map((trigger) => (
                        <div
                          key={trigger}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={trigger}
                            checked={newRule.triggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRule({
                                  ...newRule,
                                  triggers: [...newRule.triggers, trigger],
                                });
                              } else {
                                setNewRule({
                                  ...newRule,
                                  triggers: newRule.triggers.filter(
                                    (t) => t !== trigger
                                  ),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={trigger}
                            className="text-sm capitalize"
                          >
                            {trigger.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Channels</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {channels.map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={channel.id}
                            checked={newRule.channels.includes(channel.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRule({
                                  ...newRule,
                                  channels: [...newRule.channels, channel.id],
                                });
                              } else {
                                setNewRule({
                                  ...newRule,
                                  channels: newRule.channels.filter(
                                    (c) => c !== channel.id
                                  ),
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={channel.id}
                            className="text-sm flex items-center gap-2"
                          >
                            {getChannelIcon(channel.type)}
                            {channel.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity Levels</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["info", "warning", "error", "critical"].map(
                        (severity) => (
                          <div
                            key={severity}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={severity}
                              checked={newRule.conditions.severity?.includes(
                                severity
                              )}
                              onChange={(e) => {
                                const currentSeverity =
                                  newRule.conditions.severity || [];
                                if (e.target.checked) {
                                  setNewRule({
                                    ...newRule,
                                    conditions: {
                                      ...newRule.conditions,
                                      severity: [...currentSeverity, severity],
                                    },
                                  });
                                } else {
                                  setNewRule({
                                    ...newRule,
                                    conditions: {
                                      ...newRule.conditions,
                                      severity: currentSeverity.filter(
                                        (s) => s !== severity
                                      ),
                                    },
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={severity}
                              className="text-sm capitalize"
                            >
                              {severity}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateRuleOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRule}
                      className="w-full sm:w-auto"
                    >
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">
                  Total Alerts
                </div>
              </div>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="text-sm font-medium text-muted-foreground">
                  Unread
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.unreadAlerts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm font-medium text-muted-foreground">
                  Critical
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalAlerts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">
                  Active Rules
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeRules}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-muted-foreground">
                  Channels
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.activeChannels}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts, rules, and channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
            <TabsTrigger value="rules">Notification Rules</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="invites">Team Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  View and manage recent notification alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className={`${
                          !alert.read ? "border-l-4 border-l-primary" : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="flex-shrink-0 mt-1">
                                {getTypeIcon(alert.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">
                                    {alert.title}
                                  </h4>
                                  <Badge
                                    className={getSeverityColor(alert.severity)}
                                  >
                                    {alert.severity}
                                  </Badge>
                                  {!alert.read && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {alert.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{formatDate(alert.timestamp)}</span>
                                  {alert.project && (
                                    <span>Project: {alert.project}</span>
                                  )}
                                  {alert.branch && (
                                    <span>Branch: {alert.branch}</span>
                                  )}
                                  {alert.user && (
                                    <span>User: {alert.user}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!alert.read && (
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsRead(alert.id)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAlert(alert.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchQuery
                        ? "No alerts found matching your search."
                        : "No alerts available."}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Rules</CardTitle>
                <CardDescription>
                  Manage automated notification rules and triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rule Name</TableHead>
                          <TableHead>Triggers</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead>Last Triggered</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{rule.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {rule.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.triggers.map((trigger) => (
                                  <Badge
                                    key={trigger}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {trigger.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.channels.map((channelId) => {
                                  const channel = channels.find(
                                    (c) => c.id === channelId
                                  );
                                  return channel ? (
                                    <Badge
                                      key={channelId}
                                      variant="secondary"
                                      className="text-xs flex items-center gap-1"
                                    >
                                      {getChannelIcon(channel.type)}
                                      {channel.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {rule.lastTriggered
                                ? formatDate(rule.lastTriggered)
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={() =>
                                  handleToggleRule(rule.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Rule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Test Rule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Rule
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "No rules found matching your search."
                        : "No notification rules configured yet."}
                    </div>
                    {!searchQuery && (
                      <Button onClick={() => setIsCreateRuleOpen(true)}>
                        Create your first rule
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Manage notification delivery channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {channels.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Configuration</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channels.map((channel) => (
                          <TableRow key={channel.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getChannelIcon(channel.type)}
                                <span className="font-medium">
                                  {channel.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {channel.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {channel.type === "email" && channel.config.email}
                              {channel.type === "slack" &&
                                channel.config.slackChannel}
                              {channel.type === "teams" && "Teams Webhook"}
                              {channel.type === "webhook" && "Custom Webhook"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(channel.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={channel.enabled}
                                onCheckedChange={() =>
                                  handleToggleChannel(channel.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Channel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Test Channel
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteChannel(channel.id)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Channel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      No notification channels configured yet.
                    </div>
                    <Button onClick={() => setIsCreateChannelOpen(true)}>
                      Create your first channel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Invites</CardTitle>
                <CardDescription>
                  Manage your team invites here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamInvites.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teamInvites.map((invite: any) => (
                      <Card
                        key={invite.id}
                        className="p-4 shadow-md rounded-2xl border"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={invite.user.image}
                            alt={invite.user.name}
                            className="w-12 h-12 rounded-full border"
                          />
                          <div>
                            <h3 className="text-lg font-semibold">
                              {invite.user.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {invite.user.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Team:</span>
                            <span
                              className={`px-2 py-1 text-sm rounded-lg text-white ${invite.team.teamColor}`}
                            >
                              {invite.team.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Role:</span>
                            <span className="capitalize">{invite.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className="capitalize">{invite.status}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAcceptInvite(invite.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDeclineInvite(invite.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      No pending invites.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
