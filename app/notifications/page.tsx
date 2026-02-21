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
  CheckCircle2,
  XOctagon,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/axios";
import { useGlobalContext } from "@/hooks/useUser";

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

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
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
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

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
    type: "email" as "email" | "slack" | "teams" | "webhook",
    name: "",
    config: {
      email: "",
      webhookUrl: "",
      slackChannel: "",
      teamsWebhook: "",
    },
  });

  const [selectedAlert, setSelectedAlert] = useState<NotificationAlert | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const { selectedWorkspace } = useGlobalContext();

  // Load all data
  useEffect(() => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const wsParam = selectedWorkspace ? `?workspaceId=${selectedWorkspace.id}` : "";

        const [alertsRes, rulesRes, channelsRes] = await Promise.all([
          apiClient.get(`/api/notifications`),
          apiClient.get(`/api/notification-rules${wsParam}`),
          apiClient.get(`/api/notification-channels${wsParam}`),
        ]);

        // Map alerts
        const fetchedAlerts: NotificationAlert[] = (alertsRes.data.notifications || []).map((n: any) => ({
          id: n.id,
          ruleId: "system",
          ruleName: "System Notification",
          title: n.taskTitle || "Notification",
          message: n.message || n.description,
          severity: (n.status as any) || "info",
          type: "system_error",
          timestamp: n.createdAt,
          read: n.read,
          channels: [],
          project: n.taskTitle?.includes("Project") ? "System" : undefined,
          user: n.userEmail,
        }));
        setAlerts(fetchedAlerts);

        // Map rules
        const fetchedRules: NotificationRule[] = (rulesRes.data.rules || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          enabled: r.enabled,
          triggers: r.triggers || [],
          channels: r.channels || [],
          conditions: r.conditions || {},
          createdBy: r.createdBy,
          createdAt: r.createdAt,
          lastTriggered: r.lastTriggered,
        }));
        setRules(fetchedRules);

        // Map channels
        const fetchedChannels: NotificationChannel[] = (channelsRes.data.channels || []).map((c: any) => ({
          id: c.id,
          type: c.type,
          name: c.name,
          enabled: c.enabled,
          config: c.config || {},
          createdAt: c.createdAt,
        }));
        setChannels(fetchedChannels);
      } catch (error) {
        console.error("Failed to load notifications data", error);
        setNotification({ type: "error", message: "Failed to load notifications data" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, session, selectedWorkspace]);

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

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.triggers.length) return;

    setIsCreatingRule(true);
    try {
      if (editingRuleId) {
        const res = await apiClient.patch("/api/notification-rules", {
          ...newRule,
          id: editingRuleId,
        });
        setRules(rules.map(r => r.id === editingRuleId ? { ...r, ...newRule } : r));
        setNotification({ type: "success", message: "Rule updated successfully" });
      } else {
        const res = await apiClient.post("/api/notification-rules", {
          ...newRule,
          workspaceId: selectedWorkspace?.id,
        });
        const created = res.data.rule;
        setRules([{ ...created, conditions: created.conditions || {} }, ...rules]);
        setNotification({ type: "success", message: "Notification rule created successfully" });
      }

      setNewRule({
        name: "",
        description: "",
        triggers: [],
        channels: [],
        conditions: { projects: [], branches: [], environments: [], severity: [] },
      });
      setIsCreateRuleOpen(false);
      setEditingRuleId(null);
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: editingRuleId ? "Failed to update rule" : "Failed to create rule" });
    } finally {
      setIsCreatingRule(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name) return;

    setIsCreatingChannel(true);
    try {
      if (editingChannelId) {
        const res = await apiClient.patch("/api/notification-channels", {
          ...newChannel,
          id: editingChannelId,
        });
        setChannels(channels.map(c => c.id === editingChannelId ? { ...c, ...newChannel } : c));
        setNotification({ type: "success", message: "Channel updated successfully" });
      } else {
        const res = await apiClient.post("/api/notification-channels", {
          ...newChannel,
          workspaceId: selectedWorkspace?.id,
        });
        const created = res.data.channel;
        setChannels([{ ...created, config: created.config || {} }, ...channels]);
        setNotification({ type: "success", message: "Notification channel created successfully" });
      }

      setNewChannel({
        type: "email",
        name: "",
        config: { email: "", webhookUrl: "", slackChannel: "", teamsWebhook: "" },
      });
      setIsCreateChannelOpen(false);
      setEditingChannelId(null);
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: editingChannelId ? "Failed to update channel" : "Failed to create channel" });
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    // Optimistic update
    setRules(rules.map((r) => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    try {
      await apiClient.patch("/api/notification-rules", { id: ruleId, enabled: !rule.enabled });
      setNotification({ type: "success", message: "Rule updated successfully" });
    } catch {
      setRules(rules.map((r) => r.id === ruleId ? { ...r, enabled: rule.enabled } : r));
      setNotification({ type: "error", message: "Failed to update rule" });
    }
  };

  const handleToggleChannel = async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;
    setChannels(channels.map((c) => c.id === channelId ? { ...c, enabled: !c.enabled } : c));
    try {
      await apiClient.patch("/api/notification-channels", { id: channelId, enabled: !channel.enabled });
      setNotification({ type: "success", message: "Channel updated successfully" });
    } catch {
      setChannels(channels.map((c) => c.id === channelId ? { ...c, enabled: channel.enabled } : c));
      setNotification({ type: "error", message: "Failed to update channel" });
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    setAlerts(alerts.map((alert) => alert.id === alertId ? { ...alert, read: true } : alert));
    try {
      await apiClient.patch("/api/notifications", { id: alertId, read: true });
    } catch (error) {
      console.error("Failed to mark as read", error);
      setNotification({ type: "error", message: "Failed to update status" });
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== alertId));
    setNotification({ type: "success", message: "Alert deleted successfully" });
  };

  const handleDeleteRule = async (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId));
    try {
      await apiClient.delete(`/api/notification-rules?id=${ruleId}`);
      setNotification({ type: "success", message: "Rule deleted successfully" });
    } catch {
      setNotification({ type: "error", message: "Failed to delete rule" });
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    setChannels(channels.filter((channel) => channel.id !== channelId));
    try {
      await apiClient.delete(`/api/notification-channels?id=${channelId}`);
      setNotification({ type: "success", message: "Channel deleted successfully" });
    } catch {
      setNotification({ type: "error", message: "Failed to delete channel" });
    }
  };

  const handleTestChannel = async (channel: any) => {
    const webhookUrl = channel.config?.webhookUrl;
    if (!webhookUrl) {
      setNotification({ type: "error", message: "No webhook URL configured for this channel" });
      return;
    }
    try {
      setNotification({ type: "success", message: `Sending test message to ${channel.name}...` });
      const res = await apiClient.post("/api/notification-channels/test", {
        webhookUrl,
        type: channel.type,
      });
      setNotification({ type: "success", message: `Test message sent to ${channel.name}! Check Slack.` });
    } catch (err: any) {
      setNotification({ type: "error", message: err?.response?.data?.error || "Test failed" });
    }
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
    try {
      const resp = await apiClient.get("/api/team/invite");
      setTeamInvites(resp.data.invites || []);
    } catch (err) {
      console.error("Failed to load team invites", err);
    }
  };

  const handleAcceptInvite = async (teamId: string) => {
    setAcceptingId(teamId);
    try {
      await apiClient.post(`/api/team/invite/accept`, { teamId, status: "active" });
      setNotification({ type: "success", message: "Invite accepted successfully" });
      getTeamInvites();
    } catch {
      setNotification({ type: "error", message: "Failed to accept invite" });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineInvite = async (teamId: string) => {
    setDecliningId(teamId);
    try {
      await apiClient.post(`/api/team/invite/accept`, { teamId, status: "decline" });
      setNotification({ type: "success", message: "Invite declined successfully" });
      getTeamInvites();
    } catch {
      setNotification({ type: "error", message: "Failed to decline invite" });
    } finally {
      setDecliningId(null);
    }
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
                  <div key={i} className="flex items-center justify-between p-4 border rounded">
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
        {/* Toast Notification */}
        {notification && (
          <Alert
            className={`${notification.type === "error" ? "border-destructive" : "border-green-500"
              } animate-in slide-in-from-top-2 duration-300`}
          >
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Manage alerts, rules, and notification channels</p>
          </div>
          <div className="flex gap-2">
            {/* Add Channel Dialog */}
            <Dialog open={isCreateChannelOpen} onOpenChange={(open) => {
              setIsCreateChannelOpen(open);
              if (!open) {
                setEditingChannelId(null);
                setNewChannel({
                  type: "email",
                  name: "",
                  config: { email: "", webhookUrl: "", slackChannel: "", teamsWebhook: "" },
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={() => setEditingChannelId(null)}>
                  <Plus className="h-4 w-4" />
                  Add Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingChannelId ? "Edit Notification Channel" : "Create Notification Channel"}</DialogTitle>
                  <DialogDescription>{editingChannelId ? "Update existing notification channel" : "Add a new channel to receive notifications"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel-type">Channel Type</Label>
                    <Select
                      value={newChannel.type}
                      onValueChange={(value) => setNewChannel({ ...newChannel, type: value as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
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
                        onChange={(e) => setNewChannel({ ...newChannel, config: { ...newChannel.config, email: e.target.value } })}
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
                        onChange={(e) => setNewChannel({ ...newChannel, config: { ...newChannel.config, slackChannel: e.target.value } })}
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
                        onChange={(e) => setNewChannel({ ...newChannel, config: { ...newChannel.config, teamsWebhook: e.target.value } })}
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
                        onChange={(e) => setNewChannel({ ...newChannel, config: { ...newChannel.config, webhookUrl: e.target.value } })}
                      />
                    </div>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateChannelOpen(false)} className="w-full sm:w-auto" disabled={isCreatingChannel}>Cancel</Button>
                    <Button onClick={handleCreateChannel} className="w-full sm:w-auto" disabled={isCreatingChannel}>
                      {isCreatingChannel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingChannelId ? "Save Channel" : "Create Channel"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            {/* Custom View Details Modal */}
            {isViewDetailsOpen && selectedAlert && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsViewDetailsOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pr-8">
                      {getTypeIcon(selectedAlert.type)}
                      <span className="font-semibold text-lg">{selectedAlert.title}</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Message</Label>
                      <div className="text-sm bg-muted p-3 rounded-md max-h-40 overflow-y-auto">{selectedAlert.message}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Severity</Label>
                        <div><Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge></div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Date</Label>
                        <div className="text-sm">{formatDate(selectedAlert.timestamp)}</div>
                      </div>
                      {selectedAlert.project && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Project</Label>
                          <div className="text-sm truncate" title={selectedAlert.project}>{selectedAlert.project}</div>
                        </div>
                      )}
                      {selectedAlert.branch && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Branch</Label>
                          <div className="text-sm truncate" title={selectedAlert.branch}>{selectedAlert.branch}</div>
                        </div>
                      )}
                      {selectedAlert.user && (
                        <div className="space-y-1">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">User</Label>
                          <div className="text-sm truncate" title={selectedAlert.user}>{selectedAlert.user}</div>
                        </div>
                      )}
                    </div>

                    {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Metadata</Label>
                        <div className="bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                          <pre className="text-xs">{JSON.stringify(selectedAlert.metadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Rule Dialog */}
            <Dialog open={isCreateRuleOpen} onOpenChange={(open) => {
              setIsCreateRuleOpen(open);
              if (!open) {
                setEditingRuleId(null);
                setNewRule({
                  name: "",
                  description: "",
                  triggers: [],
                  channels: [],
                  conditions: { projects: [], branches: [], environments: [], severity: [] },
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={() => setEditingRuleId(null)}>
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRuleId ? "Edit Notification Rule" : "Create Notification Rule"}</DialogTitle>
                  <DialogDescription>{editingRuleId ? "Update automation rules" : "Set up automated alerts for specific events and conditions"}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      placeholder="e.g., Production Secret Changes"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe when this rule should trigger"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["secret_change", "rotation_failed", "suspicious_activity", "access_denied", "system_error"].map((trigger) => (
                        <div key={trigger} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={trigger}
                            checked={newRule.triggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRule({ ...newRule, triggers: [...newRule.triggers, trigger] });
                              } else {
                                setNewRule({ ...newRule, triggers: newRule.triggers.filter((t) => t !== trigger) });
                              }
                            }}
                          />
                          <Label htmlFor={trigger} className="text-sm capitalize">{trigger.replace(/_/g, " ")}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Channels</Label>
                    {channels.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No channels configured yet. Create a channel first.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {channels.map((channel) => (
                          <div key={channel.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={channel.id}
                              checked={newRule.channels.includes(channel.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRule({ ...newRule, channels: [...newRule.channels, channel.id] });
                                } else {
                                  setNewRule({ ...newRule, channels: newRule.channels.filter((c) => c !== channel.id) });
                                }
                              }}
                            />
                            <Label htmlFor={channel.id} className="text-sm flex items-center gap-2">
                              {getChannelIcon(channel.type)}
                              {channel.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Severity Levels</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["info", "warning", "error", "critical"].map((severity) => (
                        <div key={severity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={severity}
                            checked={newRule.conditions.severity?.includes(severity)}
                            onChange={(e) => {
                              const currentSeverity = newRule.conditions.severity || [];
                              if (e.target.checked) {
                                setNewRule({ ...newRule, conditions: { ...newRule.conditions, severity: [...currentSeverity, severity] } });
                              } else {
                                setNewRule({ ...newRule, conditions: { ...newRule.conditions, severity: currentSeverity.filter((s) => s !== severity) } });
                              }
                            }}
                          />
                          <Label htmlFor={severity} className="text-sm capitalize">{severity}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)} className="w-full sm:w-auto" disabled={isCreatingRule}>Cancel</Button>
                    <Button onClick={handleCreateRule} className="w-full sm:w-auto" disabled={isCreatingRule}>
                      {isCreatingRule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingRuleId ? "Save Rule" : "Create Rule"}
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
                <div className="text-sm font-medium text-muted-foreground">Total Alerts</div>
              </div>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="text-sm font-medium text-muted-foreground">Unread</div>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.unreadAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div className="text-sm font-medium text-muted-foreground">Critical</div>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium text-muted-foreground">Active Rules</div>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.activeRules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-muted-foreground">Channels</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeChannels}</div>
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
            <TabsTrigger value="alerts">
              Recent Alerts
              {stats.unreadAlerts > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 text-white">
                  {stats.unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules">Notification Rules</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="invites">
              Team Invites
              {teamInvites.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                  {teamInvites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Recent Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>View and manage recent notification alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className={`${!alert.read ? "border-l-4 border-l-primary" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="flex-shrink-0 mt-1">{getTypeIcon(alert.type)}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{alert.title}</h4>
                                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                  {!alert.read && (
                                    <Badge variant="secondary" className="text-xs">New</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{formatDate(alert.timestamp)}</span>
                                  {alert.project && <span>Project: {alert.project}</span>}
                                  {alert.branch && <span>Branch: {alert.branch}</span>}
                                  {alert.user && <span>User: {alert.user}</span>}
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {!alert.read && (
                                  <DropdownMenuItem onClick={() => handleMarkAsRead(alert.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setSelectedAlert(alert);
                                  setIsViewDetailsOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <div className="text-muted-foreground">
                      {searchQuery ? "No alerts found matching your search." : "No alerts yet. You're all caught up!"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Rules</CardTitle>
                <CardDescription>Manage automated notification rules and triggers</CardDescription>
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
                          <TableHead>Created By</TableHead>
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
                                <div className="text-sm text-muted-foreground">{rule.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.triggers.map((trigger) => (
                                  <Badge key={trigger} variant="outline" className="text-xs">
                                    {trigger.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {rule.channels.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">None</span>
                                ) : (
                                  rule.channels.map((channelId) => {
                                    const channel = channels.find((c) => c.id === channelId);
                                    return channel ? (
                                      <Badge key={channelId} variant="secondary" className="text-xs flex items-center gap-1">
                                        {getChannelIcon(channel.type)}
                                        {channel.name}
                                      </Badge>
                                    ) : null;
                                  })
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{rule.createdBy}</TableCell>
                            <TableCell>
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={() => handleToggleRule(rule.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setEditingRuleId(rule.id);
                                    setNewRule({
                                      name: rule.name,
                                      description: rule.description,
                                      triggers: rule.triggers,
                                      channels: rule.channels,
                                      conditions: rule.conditions || { projects: [], branches: [], environments: [], severity: [] },
                                    });
                                    setIsCreateRuleOpen(true);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Rule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteRule(rule.id)} className="text-destructive">
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
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <div className="text-muted-foreground mb-4">
                      {searchQuery ? "No rules found matching your search." : "No notification rules configured yet."}
                    </div>
                    {!searchQuery && (
                      <Button onClick={() => setIsCreateRuleOpen(true)}>Create your first rule</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Manage notification delivery channels</CardDescription>
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
                                <span className="font-medium">{channel.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{channel.type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {channel.type === "email" && channel.config.email}
                              {channel.type === "slack" && channel.config.slackChannel}
                              {channel.type === "teams" && "Teams Webhook"}
                              {channel.type === "webhook" && "Custom Webhook"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(channel.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={channel.enabled}
                                onCheckedChange={() => handleToggleChannel(channel.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setEditingChannelId(channel.id);
                                    setNewChannel({
                                      type: channel.type,
                                      name: channel.name,
                                      config: channel.config || { email: "", webhookUrl: "", slackChannel: "", teamsWebhook: "" },
                                    });
                                    setIsCreateChannelOpen(true);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Channel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTestChannel(channel)}>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Test Channel
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteChannel(channel.id)} className="text-destructive">
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
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <div className="text-muted-foreground mb-4">No notification channels configured yet.</div>
                    <Button onClick={() => setIsCreateChannelOpen(true)}>Create your first channel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Invites Tab */}
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Invites</CardTitle>
                <CardDescription>Pending invitations to join teams in your workspaces.</CardDescription>
              </CardHeader>
              <CardContent>
                {teamInvites.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teamInvites.map((invite: any) => (
                      <Card key={invite.id} className="p-4 shadow-md rounded-2xl border">
                        <div className="flex items-center gap-3">
                          <img
                            src={invite.user?.image || `https://avatar.vercel.sh/${invite.user?.email}.png`}
                            alt={invite.user?.name || "User"}
                            className="w-12 h-12 rounded-full border"
                          />
                          <div>
                            <h3 className="text-lg font-semibold">{invite.user?.name || "Unknown"}</h3>
                            <p className="text-sm text-gray-500">{invite.user?.email}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Team:</span>
                            <span className={`px-2 py-1 text-sm rounded-lg text-white ${invite.team?.teamColor || "bg-gray-500"}`}>
                              {invite.team?.name || "Unknown Team"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Role:</span>
                            <span className="capitalize">{invite.role}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <Badge variant="secondary" className="capitalize">{invite.status}</Badge>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleAcceptInvite(invite.teamId)}
                            disabled={acceptingId === invite.teamId || decliningId === invite.teamId}
                          >
                            {acceptingId === invite.teamId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 gap-1"
                            onClick={() => handleDeclineInvite(invite.teamId)}
                            disabled={acceptingId === invite.teamId || decliningId === invite.teamId}
                          >
                            {decliningId === invite.teamId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XOctagon className="h-4 w-4" />}
                            Decline
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <div className="text-muted-foreground">No pending team invites.</div>
                    <p className="text-sm text-muted-foreground mt-1">When someone invites you to a team, it will appear here.</p>
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
