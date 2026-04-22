"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Search, X, Loader2, CheckCheck, ShieldAlert } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useGlobalContext } from "@/hooks/useUser";

interface AccessReview {
    userId: string;
    name: string;
    email: string;
    roles: { role: string; project: string }[];
    lastLogin: string;
    status: "pending_review" | "approved" | "revoked";
}

export default function AccessReviewsPage() {
    const { selectedWorkspace } = useGlobalContext();
    const [reviews, setReviews] = useState<AccessReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isBulkApproving, setIsBulkApproving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (selectedWorkspace?.id) {
            fetchReviews();
        } else {
            setLoading(false);
        }
    }, [selectedWorkspace]);

    const fetchReviews = async () => {
        if (!selectedWorkspace?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/access-reviews?workspaceId=${selectedWorkspace.id}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            } else {
                const err = await res.json();
                toast({ title: "Error", description: err.error || "Failed to load reviews", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
            toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startReviewCycle = async () => {
        if (!selectedWorkspace?.id) return;
        try {
            const res = await fetch("/api/access-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: selectedWorkspace.id })
            });
            if (res.ok) {
                toast({ title: "Review Cycle Started", description: "A new access review cycle has been initiated for this workspace." });
                fetchReviews();
            } else {
                throw new Error("Failed to start cycle");
            }
        } catch {
            toast({ title: "Error", description: "Failed to start review cycle", variant: "destructive" });
        }
    };

    const handleAction = async (userId: string, action: "approve" | "revoke") => {
        if (!selectedWorkspace?.id) return;
        setActionLoading(userId + action);
        try {
            const res = await fetch("/api/access-reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, decision: action, workspaceId: selectedWorkspace.id })
            });

            if (res.ok) {
                setReviews(prev => prev.map(r =>
                    r.userId === userId ? { ...r, status: action === "approve" ? "approved" : "revoked" } : r
                ));
                toast({
                    title: action === "approve" ? "Access Approved ✓" : "Access Revoked",
                    description: action === "approve"
                        ? "User's workspace access has been certified."
                        : "User has been removed from all teams and projects in this workspace.",
                    variant: action === "revoke" ? "destructive" : "default"
                });
            } else {
                const err = await res.json();
                throw new Error(err.error || "Failed to submit review");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReviews = reviews.filter((r) => {
        const matchesSearch = (r.name + " " + r.email).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = reviews.filter(r => r.status === "pending_review").length;
    const filteredPending = filteredReviews.filter(r => r.status === "pending_review").length;

    const handleApproveAll = async () => {
        if (!selectedWorkspace?.id) return;
        const pendingIds = filteredReviews.filter(r => r.status === "pending_review").map(r => r.userId);
        if (pendingIds.length === 0) return;
        setIsBulkApproving(true);

        setReviews(prev => prev.map(r => pendingIds.includes(r.userId) ? { ...r, status: "approved" } : r));

        try {
            await Promise.all(pendingIds.map(id => fetch("/api/access-reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id, decision: "approve", workspaceId: selectedWorkspace.id })
            })));
            toast({ title: "Bulk Approval Complete", description: `Approved ${pendingIds.length} users in workspace.` });
        } catch {
            toast({ title: "Error", description: "Failed to bulk approve", variant: "destructive" });
            fetchReviews();
        } finally {
            setIsBulkApproving(false);
        }
    };

    // Guard: no workspace selected
    if (!selectedWorkspace?.id && !loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                    <div className="p-4 rounded-full bg-muted/30">
                        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">No Workspace Selected</h2>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        Please select a workspace from the sidebar to conduct access reviews for its members.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Access Reviews</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review and certify user permissions for{" "}
                            <span className="font-medium text-foreground">{selectedWorkspace?.name}</span>.
                        </p>
                    </div>
                    <Button onClick={startReviewCycle} className="gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Start New Cycle
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Users", value: reviews.length, color: "text-foreground" },
                        { label: "Pending Review", value: pendingCount, color: "text-amber-500" },
                        { label: "Reviewed", value: reviews.length - pendingCount, color: "text-green-500" },
                    ].map(stat => (
                        <Card key={stat.label} className="border bg-card">
                            <CardContent className="p-5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Workspace Members
                                    {pendingCount > 0 && (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                            {pendingCount} Pending
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Only users with active roles in <strong>{selectedWorkspace?.name}</strong> are listed here.
                                </CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-8 h-9 text-xs"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {(["all", "pending_review", "approved", "revoked"] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`h-9 px-3 rounded-md border text-xs font-medium transition-colors ${statusFilter === status
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-background border-border hover:bg-muted"
                                                }`}
                                        >
                                            <span className="capitalize">{status === "all" ? "All" : status.replace("_", " ")}</span>
                                        </button>
                                    ))}
                                    {filteredPending > 0 && (
                                        <Button size="sm" variant="outline" className="h-9 text-xs ml-1" onClick={handleApproveAll} disabled={isBulkApproving}>
                                            {isBulkApproving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 mr-1.5" />}
                                            Approve All ({filteredPending})
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Last Active</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /><div className="h-3 w-40 bg-muted/60 animate-pulse rounded mt-1" /></TableCell>
                                            <TableCell><div className="flex gap-1"><div className="h-5 w-16 bg-muted animate-pulse rounded-full" /><div className="h-5 w-20 bg-muted animate-pulse rounded-full" /></div></TableCell>
                                            <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded-full" /></TableCell>
                                            <TableCell className="text-right"><div className="flex justify-end gap-2"><div className="h-7 w-20 bg-muted animate-pulse rounded" /><div className="h-7 w-16 bg-muted animate-pulse rounded" /></div></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredReviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center pt-8">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                {searchQuery || statusFilter !== "all" ? (
                                                    <>
                                                        <Search className="h-10 w-10 mb-3 opacity-20" />
                                                        <p className="font-medium text-foreground">No matches found</p>
                                                        <p className="text-sm mt-1">Adjust your search or filter.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-10 w-10 mb-3 opacity-20 text-green-500" />
                                                        <p className="font-medium text-foreground">No workspace members found</p>
                                                        <p className="text-sm mt-1">
                                                            Users will appear here once they join a team or project in this workspace.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReviews.map((review) => {
                                        const isActing = actionLoading?.startsWith(review.userId);
                                        return (
                                            <TableRow key={review.userId} className="group">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 text-sm">
                                                            {review.name?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{review.name}</span>
                                                            <span className="text-xs text-muted-foreground">{review.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {review.roles.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground italic">Team member only</span>
                                                        ) : review.roles.map((r, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs font-medium">
                                                                {r.role} <span className="text-muted-foreground ml-1 font-normal">({r.project})</span>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {review.lastLogin ? (
                                                        <span title={format(new Date(review.lastLogin), "PPPP p")}>
                                                            {formatDistanceToNow(new Date(review.lastLogin), { addSuffix: true })}
                                                        </span>
                                                    ) : (
                                                        <span className="italic">Never</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className="capitalize font-medium shadow-none gap-1"
                                                        variant={
                                                            review.status === "approved" ? "default" :
                                                                review.status === "revoked" ? "destructive" : "outline"
                                                        }
                                                    >
                                                        {review.status === "approved" && <CheckCircle className="w-3 h-3" />}
                                                        {review.status === "revoked" && <XCircle className="w-3 h-3" />}
                                                        {review.status === "pending_review" && <Clock className="w-3 h-3" />}
                                                        {review.status.replace("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        {review.status !== "approved" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 dark:border-green-900 dark:hover:bg-green-950"
                                                                onClick={() => handleAction(review.userId, "approve")}
                                                                disabled={isActing}
                                                            >
                                                                {isActing && actionLoading === review.userId + "approve"
                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                                                    : <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                }
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {review.status !== "revoked" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900 dark:hover:bg-red-950"
                                                                onClick={() => handleAction(review.userId, "revoke")}
                                                                disabled={isActing}
                                                            >
                                                                {isActing && actionLoading === review.userId + "revoke"
                                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                                                    : <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                }
                                                                Revoke
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
