"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  Key, 
  User, 
  Activity, 
  AlertTriangle, 
  History, 
  Calendar,
  Lock,
  Unlock,
  Ban,
  RefreshCcw,
  Search,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalContext } from "@/hooks/useUser";
import apiClient from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AccessRequest {
    id: string;
    userId: string;
    user: { email: string; name: string };
    secretId?: string;
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
    const [historyRequests, setHistoryRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const { selectedWorkspace, workspaceRole } = useGlobalContext();

    const isAdmin = useMemo(() => 
        workspaceRole === "owner" || workspaceRole === "admin", 
    [workspaceRole]);

    const fetchRequests = async () => {
        if (!selectedWorkspace) return;
        setLoading(true);
        try {
            const workspaceId = selectedWorkspace.id;

            // Fetch my requests
            const myRes = await apiClient.get(`/api/access/list?mode=my&workspaceId=${workspaceId}`);
            setMyRequests(myRes.data);

            if (isAdmin) {
                // Fetch pending
                const pendingRes = await apiClient.get(`/api/access/list?mode=pending&workspaceId=${workspaceId}`);
                setPendingRequests(pendingRes.data);

                // Fetch history
                const historyRes = await apiClient.get(`/api/access/list?mode=history&workspaceId=${workspaceId}`);
                setHistoryRequests(historyRes.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch requests", error);
            toast({
                title: "Fetch Error",
                description: "Failed to load access requests. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [selectedWorkspace, workspaceRole]);

    const handleDecision = async (requestId: string, decision: "approved" | "rejected" | "revoked") => {
        try {
            await apiClient.post("/api/access/approve", { requestId, decision });
            toast({
                title: `Request ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
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

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "approved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "rejected": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
            case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "revoked": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
            case "expired": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
            default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
        }
    };

    const stats = useMemo(() => {
        return [
            { label: "Pending", value: pendingRequests.length, icon: Clock, color: "text-amber-500" },
            { label: "Active", value: historyRequests.filter(r => r.status === "approved" && (!r.expiresAt || new Date(r.expiresAt) > new Date())).length, icon: Unlock, color: "text-emerald-500" },
            { label: "Total Handled", value: historyRequests.length, icon: History, color: "text-blue-500" },
        ];
    }, [pendingRequests, historyRequests]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const filteredRequests = (list: AccessRequest[]) => {
        if (!searchQuery) return list;
        const query = searchQuery.toLowerCase();
        return list.filter(r => 
            r.user.name.toLowerCase().includes(query) || 
            r.user.email.toLowerCase().includes(query) || 
            r.reason.toLowerCase().includes(query) ||
            r.secret?.key.toLowerCase().includes(query)
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
                            Access Requests
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage Just-in-Time access and audit secret request lifecycle.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={fetchRequests}
                            variant="outline"
                            className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10"
                            disabled={loading}
                        >
                            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                            {loading ? 'Processing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                {isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, idx) => (
                            <Card key={idx} className="bg-card/40 backdrop-blur-md border-white/5 ring-1 ring-white/10 overflow-hidden group hover:ring-white/20 transition-all duration-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                            <h3 className="text-3xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                                        </div>
                                        <div className={cn("p-3 rounded-xl bg-white/5 ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Tabs defaultValue="my-requests" className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-1">
                        <TabsList className="bg-white/5 p-1 ring-1 ring-white/5">
                            <TabsTrigger value="my-requests" className="data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">My Requests</TabsTrigger>
                            {isAdmin && (
                                <>
                                    <TabsTrigger value="approvals" className="relative data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                                        Approvals
                                        {pendingRequests.length > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-[#0a0a0a]">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Full History</TabsTrigger>
                                </>
                            )}
                        </TabsList>

                        <div className="relative w-full md:w-72 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                            <Input 
                                placeholder="Search requests..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/5 ring-1 ring-white/5 focus-visible:ring-blue-500/50 transition-all duration-300 bg-card/60 backdrop-blur-md"
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <TabsContent key="my-requests" value="my-requests" className="outline-none focus:outline-none">
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                                <RequestTable 
                                    requests={filteredRequests(myRequests)} 
                                    viewType="my" 
                                    onAction={handleDecision}
                                />
                            </motion.div>
                        </TabsContent>

                        {isAdmin && (
                            <TabsContent key="approvals" value="approvals">
                                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                    <RequestTable 
                                        requests={filteredRequests(pendingRequests)} 
                                        viewType="pending"
                                        onAction={handleDecision}
                                    />
                                </motion.div>
                            </TabsContent>
                        )}
                        
                        {isAdmin && (
                            <TabsContent key="history" value="history">
                                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                    <RequestTable 
                                        requests={filteredRequests(historyRequests)} 
                                        viewType="history"
                                        onAction={handleDecision}
                                    />
                                </motion.div>
                            </TabsContent>
                        )}
                    </AnimatePresence>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}

function RequestTable({ 
    requests, 
    viewType,
    onAction 
}: { 
    requests: AccessRequest[], 
    viewType: "my" | "pending" | "history",
    onAction: (id: string, decision: any) => void
}) {
    if (requests.length === 0) {
        return (
            <Card className="bg-card/40 backdrop-blur-md border-white/5 ring-1 ring-white/10 py-20">
                <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10 mb-4 opacity-50">
                        {viewType === "pending" ? <Check className="h-8 w-8 text-emerald-500" /> : <Activity className="h-8 w-8 text-blue-500" />}
                    </div>
                    <h3 className="text-xl font-semibold text-white/80">No requests found</h3>
                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                        {viewType === "pending" ? "You're all caught up! No requests require your approval." : "Everything looks quiet here. No access request logs matching your filter."}
                    </p>
                </div>
            </Card>
        );
    }

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    };

    return (
        <Card className="bg-card/40 backdrop-blur-md border-white/5 ring-1 ring-white/10 overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        {viewType !== "my" && <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[180px]">User</TableHead>}
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Resource & Purpose</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[120px]">Duration</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[150px]">Time</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-[120px]">Status</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req, idx) => (
                        <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                            {viewType !== "my" && (
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg ring-1 ring-white/20">
                                            {req.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-sm truncate">{req.user.name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate">{req.user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                            )}
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {req.secret ? (
                                            <>
                                                <Key className="h-3 w-3 text-blue-400" />
                                                <span className="text-sm font-semibold text-white/90">{req.secret.key}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-3 w-3 text-emerald-400" />
                                                <span className="text-sm font-semibold text-white/90">Project: {req.projectId?.substring(0, 8)}...</span>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 italic">"{req.reason}"</p>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-white/5 border-white/5 text-[10px] py-0 px-2 font-mono">
                                    {formatDuration(req.duration)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(req.requestedAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className={cn("text-[10px] px-2 py-0 h-5 border shadow-sm capitalize font-medium", getStatusBadgeStyles(req.status))}>
                                    {req.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    {viewType === "pending" && (
                                        <>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => onAction(req.id, "approved")}
                                                className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => onAction(req.id, "rejected")}
                                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {viewType === "history" && req.status === "approved" && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => onAction(req.id, "revoked")}
                                            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5"
                                        >
                                            <Ban className="h-3.5 w-3.5" />
                                            Revoke
                                        </Button>
                                    )}
                                    {viewType === "my" && req.status === "approved" && (
                                        <div className="text-[10px] text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            <Unlock className="h-3 w-3" /> Active
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

function getStatusBadgeStyles(status: string) {
    switch (status) {
        case "approved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5";
        case "rejected": return "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5";
        case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5 pulse";
        case "revoked": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        case "expired": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
        default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
}
