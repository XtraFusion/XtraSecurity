"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Trash2,
    Key,
    Bot,
    Terminal,
    RefreshCw,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface AgentAccount {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    createdAt: string;
    isAgent: boolean;
    _count: {
        apiKeys: number;
    };
}

interface ApiKey {
    id: string;
    label: string;
    keyMask?: string;
    lastUsed: string | null;
    createdAt: string;
    expiresAt: string | null;
}

export function AgentsTab() {
    const { id: projectId } = useParams();
    const { toast } = useToast();

    const [agents, setAgents] = useState<AgentAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Keys List State
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [agentKeys, setAgentKeys] = useState<ApiKey[]>([]);
    const [isViewKeysOpen, setIsViewKeysOpen] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, [projectId]);

    const fetchAgents = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`/api/projects/${projectId}/service-accounts?type=agent`);
            setAgents(res.data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load agents", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (agentId: string) => {
        if (!confirm("Are you sure? This will instantly revoke all access for this AI Agent.")) return;
        try {
            await axios.delete(`/api/projects/${projectId}/service-accounts/${agentId}`);
            toast({ title: "Revoked", description: "AI Agent Context has been destroyed." });
            fetchAgents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to revoke agent", variant: "destructive" });
        }
    };

    const viewKeys = async (agentId: string) => {
        setSelectedAgentId(agentId);
        try {
            const res = await axios.get(`/api/projects/${projectId}/service-accounts/${agentId}/keys`);
            setAgentKeys(res.data);
            setIsViewKeysOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load keys", variant: "destructive" });
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!selectedAgentId) return;
        try {
            await axios.delete(`/api/projects/${projectId}/service-accounts/${selectedAgentId}/keys/${keyId}`);
            toast({ title: "Success", description: "Agent Token revoked" });
            // Refresh keys
            viewKeys(selectedAgentId);
            fetchAgents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to revoke key", variant: "destructive" });
        }
    };

    return (
        <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-xl border-b border-primary/10">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Bot className="w-6 h-6 text-primary" />
                            AI Agent Contexts
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Monitor and manage ephemeral Zero-Knowledge contexts issued to autonomous AI Agents (like Cursor, XtraDevPilot, etc).
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAgents} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Alert className="mb-6 bg-blue-500/10 border-blue-500/20 text-blue-500">
                    <Terminal className="w-4 h-4" />
                    <AlertDescription>
                        <strong>Note:</strong> Agent contexts are strictly generated via the CLI using <code className="bg-background px-1.5 py-0.5 rounded border ml-1">xtra agent spawn</code>. They cannot be created manually here to ensure cryptographic custody remains on the developer's machine.
                    </AlertDescription>
                </Alert>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agent / Intent</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Active Tokens</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    No active AI Agent Contexts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            agents.map(agent => (
                                <TableRow key={agent.id}>
                                    <TableCell>
                                        <div className="font-medium text-primary">{agent.name}</div>
                                        <div className="text-sm text-muted-foreground">{agent.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {agent.permissions.map(p => (
                                                <Badge key={p} variant="secondary" className="text-xs">
                                                    {p}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={agent._count.apiKeys > 0 ? "default" : "secondary"}>
                                            {agent._count.apiKeys} Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(agent.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => viewKeys(agent.id)}>
                                            <Key className="w-4 h-4 mr-2" />
                                            Tokens
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(agent.id)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Destroy
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* View Keys Dialog */}
                <Dialog open={isViewKeysOpen} onOpenChange={setIsViewKeysOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Ephemeral Agent Tokens</DialogTitle>
                            <DialogDescription>
                                Active short-lived tokens assigned to this agent context.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agentKeys.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                            No active tokens. The agent token may have already expired.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    agentKeys.map(k => {
                                        const isExpired = k.expiresAt ? new Date(k.expiresAt).getTime() < Date.now() : false;
                                        
                                        return (
                                            <TableRow key={k.id}>
                                                <TableCell>
                                                    <div className="font-medium">{k.label}</div>
                                                    <div className="text-xs font-mono text-muted-foreground">{k.keyMask}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {isExpired ? (
                                                        <Badge variant="destructive">Expired</Badge>
                                                    ) : k.expiresAt ? (
                                                        <div className="flex items-center text-orange-500 text-sm">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {new Date(k.expiresAt).toLocaleTimeString()}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="secondary">Never</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(k.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm" 
                                                        onClick={() => handleRevokeKey(k.id)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
