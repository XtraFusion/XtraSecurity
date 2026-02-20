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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface AccessReview {
    userId: string;
    name: string;
    email: string;
    roles: { role: string; project: string }[];
    lastLogin: string;
    status: "pending_review" | "approved" | "revoked";
}

export default function AccessReviewsPage() {
    const [reviews, setReviews] = useState<AccessReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch("/api/access-reviews");
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
            toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const startReviewCycle = async () => {
        try {
            const res = await fetch("/api/access-reviews", { method: "POST" });
            if (res.ok) {
                toast({ title: "Review Cycle Started", description: "Audit logs updated." });
                fetchReviews();
            } else {
                throw new Error("Failed to start cycle");
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to start cycle", variant: "destructive" });
        }
    }

    const handleAction = async (userId: string, action: "approve" | "revoke") => {
        try {
            const res = await fetch("/api/access-reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, decision: action })
            });

            if (res.ok) {
                // Optimistic update or refetch
                setReviews(prev => prev.map(r =>
                    r.userId === userId ? { ...r, status: action === "approve" ? "approved" : "revoked" } : r
                ));
                toast({
                    title: action === "approve" ? "Access Approved" : "Access Revoked",
                    description: `User access has been ${action}d.`
                });
            } else {
                throw new Error("Failed to submit review");
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Access Reviews</h1>
                        <p className="text-muted-foreground">
                            Periodically review and certify user access permissions.
                        </p>
                    </div>
                    <Button onClick={startReviewCycle}>Start New Cycle</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Reviews</CardTitle>
                        <CardDescription>Users requiring access confirmation for the current quarter.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : reviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">No pending reviews.</TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.map((review) => (
                                        <TableRow key={review.userId}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{review.name}</span>
                                                    <span className="text-xs text-muted-foreground">{review.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {review.roles.map((r, i) => (
                                                        <Badge key={i} variant="secondary" className="text-xs">
                                                            {r.role} ({r.project})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {review.lastLogin ? format(new Date(review.lastLogin), "MMM d, yyyy") : "Never"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    review.status === "approved" ? "default" :
                                                        review.status === "revoked" ? "destructive" : "outline"
                                                }>
                                                    {review.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {review.status === "revoked" && <XCircle className="w-3 h-3 mr-1" />}
                                                    {review.status === "pending_review" && <Clock className="w-3 h-3 mr-1" />}
                                                    {review.status.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {review.status === "pending_review" && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleAction(review.userId, "approve")}>
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleAction(review.userId, "revoke")}>
                                                            Revoke
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
