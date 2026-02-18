"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Plus, Trash2, Zap, CheckCircle, XCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";

const ALL_EVENTS = [
    { value: "secret.created", label: "Secret Created", color: "bg-green-500/10 text-green-600 border-green-500/30" },
    { value: "secret.updated", label: "Secret Updated", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
    { value: "secret.deleted", label: "Secret Deleted", color: "bg-red-500/10 text-red-600 border-red-500/30" },
    { value: "rotation.success", label: "Rotation Success", color: "bg-green-500/10 text-green-600 border-green-500/30" },
    { value: "rotation.failed", label: "Rotation Failed", color: "bg-red-500/10 text-red-600 border-red-500/30" },
    { value: "member.added", label: "Member Added", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
    { value: "member.removed", label: "Member Removed", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
];

interface Webhook {
    id: string;
    url: string;
    events: string[];
    active: boolean;
    createdAt: string;
}

function maskUrl(url: string) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.hostname}/…${url.slice(-8)}`;
    } catch {
        return url.slice(0, 20) + "…";
    }
}

export function WebhooksTab() {
    const { id: projectId } = useParams<{ id: string }>();
    const { toast } = useToast();

    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUrl, setNewUrl] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchWebhooks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/webhooks`);
            const data = await res.json();
            setWebhooks(data.webhooks ?? data ?? []);
        } catch {
            toast({ title: "Error", description: "Failed to load webhooks", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

    const toggleEvent = (ev: string) => {
        setSelectedEvents((prev) =>
            prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
        );
    };

    const handleAdd = async () => {
        if (!newUrl.trim() || selectedEvents.length === 0) {
            toast({ title: "Validation", description: "Enter a URL and select at least one event", variant: "destructive" });
            return;
        }
        setAdding(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/webhooks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: newUrl.trim(), events: selectedEvents }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            toast({ title: "Webhook added", description: "Notifications will be sent to this URL" });
            setNewUrl("");
            setSelectedEvents([]);
            fetchWebhooks();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setAdding(false);
        }
    };

    const handleTest = async (webhook: Webhook) => {
        setTestingId(webhook.id);
        try {
            const res = await fetch(`/api/projects/${projectId}/webhooks/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: webhook.url }),
            });
            const data = await res.json();
            if (data.ok) {
                toast({ title: "Test sent ✅", description: "Check your Slack/Discord channel" });
            } else {
                toast({ title: "Test failed", description: data.error ?? `HTTP ${data.status}`, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setTestingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/projects/${projectId}/webhooks?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error((await res.json()).error);
            toast({ title: "Webhook removed" });
            fetchWebhooks();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggle = async (webhook: Webhook) => {
        try {
            await fetch(`/api/projects/${projectId}/webhooks`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: webhook.id, active: !webhook.active }),
            });
            fetchWebhooks();
        } catch {
            toast({ title: "Error", description: "Failed to toggle webhook", variant: "destructive" });
        }
    };

    const eventMeta = (value: string) => ALL_EVENTS.find((e) => e.value === value);

    return (
        <div className="space-y-6">
            {/* Add Webhook */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <CardTitle>Add Webhook</CardTitle>
                    </div>
                    <CardDescription>
                        Send real-time alerts to Slack or Discord when events occur in this project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Webhook URL</label>
                        <Input
                            placeholder="https://hooks.slack.com/… or https://discord.com/api/webhooks/…"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Events to subscribe</label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_EVENTS.map((ev) => (
                                <button
                                    key={ev.value}
                                    type="button"
                                    onClick={() => toggleEvent(ev.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedEvents.includes(ev.value)
                                            ? ev.color + " ring-2 ring-offset-1 ring-primary/40"
                                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                        }`}
                                >
                                    {ev.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleAdd} disabled={adding} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {adding ? "Adding…" : "Add Webhook"}
                    </Button>
                </CardContent>
            </Card>

            {/* Existing Webhooks */}
            <Card>
                <CardHeader>
                    <CardTitle>Configured Webhooks</CardTitle>
                    <CardDescription>
                        {webhooks.length === 0
                            ? "No webhooks configured yet"
                            : `${webhooks.length} webhook${webhooks.length > 1 ? "s" : ""} configured`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                            <Bell className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Add a webhook above to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {webhooks.map((wh) => (
                                <div
                                    key={wh.id}
                                    className={`p-4 rounded-lg border transition-colors ${wh.active ? "border-border bg-muted/20" : "border-border/40 bg-muted/5 opacity-60"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                {wh.active
                                                    ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                    : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                <code className="text-xs font-mono text-muted-foreground truncate">
                                                    {maskUrl(wh.url)}
                                                </code>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {wh.events.map((ev) => {
                                                    const meta = eventMeta(ev);
                                                    return (
                                                        <Badge
                                                            key={ev}
                                                            variant="outline"
                                                            className={`text-xs ${meta?.color ?? ""}`}
                                                        >
                                                            {meta?.label ?? ev}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggle(wh)}
                                                title={wh.active ? "Disable" : "Enable"}
                                            >
                                                {wh.active
                                                    ? <ToggleRight className="h-4 w-4 text-green-500" />
                                                    : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTest(wh)}
                                                disabled={testingId === wh.id || !wh.active}
                                                className="gap-1"
                                            >
                                                <Zap className="h-3 w-3" />
                                                {testingId === wh.id ? "Sending…" : "Test"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(wh.id)}
                                                disabled={deletingId === wh.id}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
