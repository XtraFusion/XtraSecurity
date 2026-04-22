"use client"

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { Loader2, AlertTriangle, Shield, CheckCircle2, User as UserIcon, RefreshCw, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function AdminManageSubscriptions() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading: isAuthLoading } = useGlobalContext();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/subscriptions');
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data.users || []);
            setError("");
        } catch (err: any) {
            console.error(err);
            setError("Failed to load user subscriptions. Ensure you are an admin.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading && (!user || user.email !== 'salunkeom474@gmail.com')) {
            router.push('/');
        } else if (!isAuthLoading && user && user.email === 'salunkeom474@gmail.com') {
            fetchUsers();
        }
    }, [isAuthLoading, user, router]);

    const handleAction = async (userId: string, action: string) => {
        try {
            const res = await fetch('/api/admin/subscriptions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            });

            if (!res.ok) throw new Error("Failed to update subscription");

            toast({
                title: "Success",
                description: `Subscription updated successfully.`,
            });
            fetchUsers();
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Could not update subscription.",
                variant: "destructive"
            });
        }
    };

    if (isAuthLoading || (!user || user.email !== 'salunkeom474@gmail.com')) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-100px)] w-full flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Verifying authorization...</p>
            </div>
        );
    }

    if (loading && users.length === 0) return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)] w-full flex-col gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium text-destructive">{error}</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Subscriptions</h1>
                    <p className="text-muted-foreground mt-1">Administrate user plans, upgrade to pro, and renew access.</p>
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Subscriptions</CardTitle>
                    <CardDescription>All users and their current subscription status</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const sub = user.userSubscription;
                                const isPro = user.tier === 'pro' || sub?.plan === 'pro';
                                const isActive = sub?.status === 'active';
                                const isExpired = sub?.endDate ? new Date(sub.endDate) < new Date() : false;

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm flex items-center gap-1">
                                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                    {user.name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-xs font-normal">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}>
                                                {isPro ? "PRO" : "FREE"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-sm text-muted-foreground">
                                            {sub?.plan || 'None'}
                                        </TableCell>
                                        <TableCell>
                                            {isActive && !isExpired ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                                                </Badge>
                                            ) : sub ? (
                                                <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle className="mr-1 h-3 w-3" /> {isExpired ? 'Expired' : 'Inactive'}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-muted-foreground">
                                            {sub?.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'activate_pro')}>
                                                        <Shield className="mr-2 h-4 w-4 text-amber-500" />
                                                        Activate Pro
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'renew')}>
                                                        <RefreshCw className="mr-2 h-4 w-4 text-green-500" />
                                                        Renew 1 Year
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'deactivate')} className="text-destructive focus:text-destructive">
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Deactivate plan
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
