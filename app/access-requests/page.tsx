"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Clock, ShieldAlert } from "lucide-react";
import axios from "axios";
import { useGlobalContext } from "@/hooks/useUser";

interface AccessRequest {
    id: string;
    user: { email: string; name: string };
    secret?: { key: string };
    projectId?: string;
    reason: string;
    duration: number;
    status: "pending" | "approved" | "rejected" | "expired" | "revoked";
    requestedAt: string;
    approvedAt?: string;
    expiresAt: string | null;
}

export default function AccessRequestsPage() {
    const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
    const [approvedRequests, setApprovedRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { selectedWorkspace } = useGlobalContext();

    const fetchRequests = async () => {
        setLoading(true);
        try {
            if (!selectedWorkspace) return;
            const workspaceId = selectedWorkspace.id;

            // Fetch my requests
            const myRes = await axios.get(`/api/access/list?mode=my&workspaceId=${workspaceId}`);
            setMyRequests(myRes.data);

            // Fetch pending (admin view - might fail if not admin, but we'll try)
            try {
                const pendingRes = await axios.get(`/api/access/list?mode=pending&workspaceId=${workspaceId}`);
                setPendingRequests(pendingRes.data);
            } catch (e) {
                // Ignore admin fetch error (likely 401/403 if normal user)
                setPendingRequests([]);
            }

            // Fetch approved requests
            try {
                const approvedRes = await axios.get(`/api/access/list?mode=approved&workspaceId=${workspaceId}`);
                setApprovedRequests(approvedRes.data);
            } catch (e) {
                setApprovedRequests([]);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWorkspace) {
            fetchRequests();
        }
    }, [selectedWorkspace]);

    const handleDecision = async (requestId: string, decision: "approved" | "rejected") => {
        try {
            await axios.post("/api/access/approve", { requestId, decision });
            toast({
                title: `Request ${decision}`,
                description: `Successfully ${decision} the access request.`,
                variant: decision === "approved" ? "default" : "destructive"
            });
            fetchRequests(); // Refresh
        } catch (error: any) {
            toast({
                title: "Operation failed",
                description: error.response?.data?.error || error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-500">Approved</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            case "pending": return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage Just-in-Time access to restricted secrets.
                        </p>
                    </div>
                    <Button
                        onClick={fetchRequests}
                        variant="outline"
                        disabled={loading}
                    >
                        <Clock className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                <Tabs defaultValue="my-requests" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                        <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
                        <TabsTrigger value="approved">Approved Requests</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my-requests">
                        <Card>
                            <CardHeader>
                                <CardTitle>My History</CardTitle>
                                <CardDescription>Requests you have made for temporary access.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Requested</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {myRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No requests found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            myRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell className="font-medium">
                                                        {req.secret ? (
                                                            <div className="flex items-center gap-2">
                                                                <KeyIcon className="h-4 w-4 text-primary" />
                                                                Secret: {req.secret.key}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <ShieldAlert className="h-4 w-4 text-orange-500" />
                                                                Project ID: {req.projectId?.substring(0, 8)}...
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{req.duration} mins</TableCell>
                                                    <TableCell>{req.reason}</TableCell>
                                                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="approvals">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Approvals</CardTitle>
                                <CardDescription>Requests requiring your review.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Requested</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No pending approvals.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{req.user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.secret ? `Secret: ${req.secret.key}` : `Project: ${req.projectId}`}
                                                    </TableCell>
                                                    <TableCell>{req.duration} mins</TableCell>
                                                    <TableCell>{req.reason}</TableCell>
                                                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" onClick={() => handleDecision(req.id, "approved")}>
                                                                <Check className="h-4 w-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleDecision(req.id, "rejected")}>
                                                                <X className="h-4 w-4 mr-1" /> Reject
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="approved">
                        <Card>
                            <CardHeader>
                                <CardTitle>Approved Requests</CardTitle>
                                <CardDescription>History of approved access requests.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Requested</TableHead>
                                            <TableHead>Approved</TableHead>
                                            <TableHead>Expires</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {approvedRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No approved requests found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            approvedRequests.map((req) => (
                                                <TableRow key={req.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{req.user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.secret ? `Secret: ${req.secret.key}` : `Project: ${req.projectId}`}
                                                    </TableCell>
                                                    <TableCell>{req.duration} mins</TableCell>
                                                    <TableCell>{req.reason}</TableCell>
                                                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {req.approvedAt ? new Date(req.approvedAt).toLocaleString() : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.expiresAt ? (
                                                            <span className={new Date(req.expiresAt) < new Date() ? 'text-red-500' : 'text-green-500'}>
                                                                {new Date(req.expiresAt).toLocaleString()}
                                                            </span>
                                                        ) : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function KeyIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" />
            <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
    )
}
