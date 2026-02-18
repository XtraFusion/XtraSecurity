"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccessRequest {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    secret?: {
        key: string;
    };
    project?: {
        name: string;
    };
    reason: string;
    duration: number;
    status: "pending" | "approved" | "rejected" | "expired";
    requestedAt: string;
    expiresAt?: string;
}

export function AccessRequestAdmin({ projectId }: { projectId: string }) {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/access-requests?projectId=${projectId}`);
            setRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [projectId]);

    const handleAction = async (id: string, action: "approved" | "rejected") => {
        try {
            await axios.patch(`/api/access-requests/${id}`, { status: action });
            toast({
                title: `Request ${action}`,
                description: `Successfully ${action} the access request.`,
            });
            fetchRequests(); // Refresh
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update request status.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            case "expired":
                return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Access Requests
                </CardTitle>
                <CardDescription>
                    Approve or reject temporary access requests for this project.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-4">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No access requests found via the backend.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={req.user.image} />
                                                <AvatarFallback>{req.user.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs">{req.user.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{req.user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {req.secret ? (
                                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                                                {req.secret.key}
                                            </span>
                                        ) : (
                                            <span className="font-medium text-xs">{req.project?.name} (Project)</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                        {req.reason}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(req.requestedAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs">
                                            <Clock className="h-3 w-3" />
                                            {req.duration}m
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === "pending" && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                    onClick={() => handleAction(req.id, "approved")}
                                                    title="Approve"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleAction(req.id, "rejected")}
                                                    title="Reject"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
