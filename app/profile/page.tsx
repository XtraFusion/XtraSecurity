"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useGlobalContext } from "@/hooks/useUser";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, Key, Loader2, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  label: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user, selectedWorkspace, loading: userLoading } = useGlobalContext();

  useEffect(() => {
    if (selectedWorkspace) {
      fetchKeys();
    }
  }, [selectedWorkspace]);

  const fetchKeys = async () => {
    try {
      if (!selectedWorkspace) return;
      const response = await axios.get(`/api/auth/api-keys?workspaceId=${selectedWorkspace.id}`);
      setKeys(response.data);
    } catch (error) {
      // toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/auth/api-keys/${id}`);
      setKeys(keys.filter((k) => k.id !== id));
      toast.success("API Key revoked");
    } catch (error) {
      toast.error("Failed to revoke key");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newKeyLabel) {
      toast.error("Please enter a label");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post("/api/auth/api-keys", {
        label: newKeyLabel,
        workspaceId: selectedWorkspace?.id
      });
      const newKey = response.data;
      setGeneratedKey(newKey.key); // Show full key
      setKeys([...keys, { ...newKey, key: `...${newKey.key.slice(-4)}` }]); // Add masked to list
      setNewKeyLabel("");
      toast.success("API Key generated");
    } catch (error) {
      toast.error("Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
  const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="p-4 rounded-full bg-destructive/10">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground max-w-md text-center">
            You do not have permission to view this profile. This page is restricted to workspace admins and owners.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">Manage your account and access keys.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row gap-6 pb-4 border-b border-border/50">
                <UserAvatar
                  name={user?.name || session?.user?.name}
                  image={user?.image || session?.user?.image}
                  tier={user?.tier || (session?.user as any)?.tier}
                  size="lg"
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">{user?.name || session?.user?.name || "User"}</h3>
                  <p className="text-muted-foreground">{user?.email || session?.user?.email}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={user?.name || session?.user?.name || ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={user?.email || session?.user?.email || ""} disabled />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Current Plan</Label>
                  {userLoading && (
                    <Badge variant="outline" className="animate-pulse flex items-center gap-1 text-[10px] h-5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Syncing...
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input value={(user?.tier || (session?.user as any)?.tier || "free").toUpperCase()} className="w-full" disabled />
                  <Button variant="outline" onClick={() => router.push('/subscription')}>Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Access Keys</CardTitle>
                <CardDescription>Manage keys access for the CLI and API.</CardDescription>
              </div>
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!!generatedKey} onClick={() => setGeneratedKey(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Generate New Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Access Key</DialogTitle>
                    <DialogDescription>
                      Create a new key to access the XtraSync CLI.
                    </DialogDescription>
                  </DialogHeader>

                  {!generatedKey ? (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                          id="label"
                          placeholder="My Laptop CLI"
                          value={newKeyLabel}
                          onChange={(e) => setNewKeyLabel(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-muted rounded-md text-sm font-mono break-all relative group border border-amber-500/50 bg-amber-500/10">
                        <p className="text-amber-600 font-bold mb-2">Build secure. authentication required.</p>
                        <div className="flex items-center justify-between gap-2">
                          <span>{generatedKey}</span>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-red-500 font-medium">
                        Make sure to copy this key now. You won't be able to see it again!
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    {!generatedKey ? (
                      <Button onClick={handleCreate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                      </Button>
                    ) : (
                      <Button onClick={() => setIsGenerateOpen(false)}>Done</Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No access keys found.
                      </TableCell>
                    </TableRow>
                  )}
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                          {key.label}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{key.key}</TableCell>
                      <TableCell>{format(new Date(key.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {key.lastUsed ? format(new Date(key.lastUsed), "MMM d, HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(key.id)}
                          disabled={deletingId === key.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          {deletingId === key.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
