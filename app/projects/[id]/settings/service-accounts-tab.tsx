"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Trash2,
    Plus,
    Key,
    Copy,
    Check,
    Shield,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import axios from '@/lib/axios';

interface ServiceAccount {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    createdAt: string;
    _count: {
        apiKeys: number;
    };
}

interface ApiKey {
    id: string;
    label: string;
    lastUsed: string | null;
    createdAt: string;
    expiresAt: string | null;
}

export function ServiceAccountsTab() {
    const { id: projectId } = useParams();
    const { toast } = useToast();

    const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Data for new SA
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<{ key: string, id: string } | null>(null);

    // Keys List State
    const [selectedSaId, setSelectedSaId] = useState<string | null>(null);
    const [saKeys, setSaKeys] = useState<ApiKey[]>([]);
    const [isViewKeysOpen, setIsViewKeysOpen] = useState(false);

    const PERMISSIONS = [
        { id: "read:secrets", label: "Read Secrets" },
        { id: "write:secrets", label: "Write Secrets" },
        { id: "rotate:secrets", label: "Rotate Secrets" },
    ];

    useEffect(() => {
        fetchServiceAccounts();
    }, [projectId]);

    const fetchServiceAccounts = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`/api/projects/${projectId}/service-accounts`);
            setServiceAccounts(res.data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load service accounts", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName) return;
        try {
            setIsCreating(true);
            await axios.post(`/api/projects/${projectId}/service-accounts`, {
                name: newName,
                description: newDescription,
                permissions: selectedPermissions
            });

            toast({ title: "Success", description: "Service Account created" });
            setIsCreateOpen(false);
            setNewName("");
            setNewDescription("");
            setSelectedPermissions([]);
            fetchServiceAccounts();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to create service account", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (saId: string) => {
        if (!confirm("Are you sure? This will delete all associated API keys.")) return;
        try {
            await axios.delete(`/api/projects/${projectId}/service-accounts/${saId}`);
            toast({ title: "Deleted", description: "Service Account removed" });
            fetchServiceAccounts();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        }
    };

    const generateKey = async (saId: string) => {
        try {
            const res = await axios.post(`/api/projects/${projectId}/service-accounts/${saId}/keys`, {
                label: "Generated via UI"
            });
            setGeneratedKey(res.data);
            setIsKeyDialogOpen(true);
            fetchServiceAccounts(); // Update count
        } catch (error) {
            toast({ title: "Error", description: "Failed to generate key", variant: "destructive" });
        }
    };

    const viewKeys = async (saId: string) => {
        setSelectedSaId(saId);
        try {
            const res = await axios.get(`/api/projects/${projectId}/service-accounts/${saId}/keys`);
            setSaKeys(res.data);
            setIsViewKeysOpen(true);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load keys", variant: "destructive" });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "API Key copied to clipboard" });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Service Accounts</CardTitle>
                        <CardDescription>Manage machine-to-machine access for this project.</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Create Service Account
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>API Keys</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {serviceAccounts.map((sa) => (
                                <TableRow key={sa.id}>
                                    <TableCell>
                                        <div className="font-medium">{sa.name}</div>
                                        <div className="text-xs text-muted-foreground">{sa.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {sa.permissions.map(p => (
                                                <span key={p} className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{p}</span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{sa._count.apiKeys}</TableCell>
                                    <TableCell>{new Date(sa.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => viewKeys(sa.id)}>
                                                <Key className="h-4 w-4 mr-2" /> Keys
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(sa.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {serviceAccounts.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No service accounts found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create SA Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Service Account</DialogTitle>
                        <DialogDescription>Create a new identity for automated access.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="e.g. CI/CD Pipeline" value={newName} onChange={e => setNewName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input id="desc" placeholder="Allowed to read secrets..." value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Permissions</Label>
                            <div className="flex gap-4">
                                {PERMISSIONS.map(perm => (
                                    <div key={perm.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={perm.id}
                                            checked={selectedPermissions.includes(perm.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedPermissions([...selectedPermissions, perm.id]);
                                                else setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                                            }}
                                        />
                                        <Label htmlFor={perm.id}>{perm.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating || !newName}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Generated Key Dialog */}
            <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>API Key Generated</DialogTitle>
                        <DialogDescription className="text-destructive">
                            This key will only be shown ONCE. Copy it now.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-muted rounded-md border flex items-center justify-between gap-2">
                        <code className="text-sm break-all font-mono">{generatedKey?.key}</code>
                        <Button size="sm" variant="ghost" onClick={() => generatedKey && copyToClipboard(generatedKey.key)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsKeyDialogOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Keys Dialog */}
            <Dialog open={isViewKeysOpen} onOpenChange={setIsViewKeysOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Manage API Keys</DialogTitle>
                        <DialogDescription>Active keys for this service account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button onClick={() => { setIsViewKeysOpen(false); selectedSaId && generateKey(selectedSaId); }} className="w-full">
                            <Plus className="h-4 w-4 mr-2" /> Generate New Key
                        </Button>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Used</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {saKeys.map(key => (
                                    <TableRow key={key.id}>
                                        <TableCell>{key.label}</TableCell>
                                        <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}</TableCell>
                                    </TableRow>
                                ))}
                                {saKeys.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No active keys.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
