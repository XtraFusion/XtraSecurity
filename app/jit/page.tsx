"use client";

import { useState, useEffect, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Timer,
  ExternalLink,
  Loader2,
  ShieldQuestion,
  Lock,
  Unlock
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { UserContext } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { formatDate } from "@/util/formatDate";

export default function JitDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userContext = useContext(UserContext);
  const { selectedWorkspace } = userContext || {};

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!selectedWorkspace?.id) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/access-requests?workspaceId=${selectedWorkspace.id}`);
      setRequests(response.data);
    } catch (error) {
      console.error("Failed to fetch access requests:", error);
      toast.error("Failed to load access requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [selectedWorkspace?.id]);

  const handleAction = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await axios.patch(`/api/access-requests/${id}`, { status });
      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (error: any) {
      console.error(`Failed to ${status} request:`, error);
      toast.error(error.response?.data?.error || `Failed to process request`);
    } finally {
      setProcessingId(null);
    }
  };

  const getRemainingTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const activeSessions = requests.filter(r => r.status === "approved" && new Date(r.expiresAt) > new Date());
  const history = requests.filter(r => r.status !== "pending" && !activeSessions.includes(r));

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              JIT Access Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage temporary "Just-In-Time" access requests and security sessions.
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => fetchRequests()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                Refresh
             </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="pending" className="gap-2">
              Pending 
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* PENDING CONTENT */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Inbound Access Requests</CardTitle>
                <CardDescription>Review requests from team members needing temporary access to secrets.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requester</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <ShieldQuestion className="h-8 w-8 opacity-20" />
                            No pending requests found.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="font-medium">{request.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                          </TableCell>
                          <TableCell>
                            {request.secret ? (
                              <div className="flex items-center gap-2">
                                <Lock className="h-3 w-3" />
                                <span className="font-mono text-xs">{request.secret.key}</span>
                              </div>
                            ) : (
                              <Badge variant="outline">Project Access</Badge>
                            )}
                            <div className="text-[10px] text-muted-foreground">{request.project?.name}</div>
                          </TableCell>
                          <TableCell>{request.duration} min</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={request.reason}>
                            {request.reason}
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(request.requestedAt)}</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => handleAction(request.id, "rejected")}
                              disabled={processingId === request.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleAction(request.id, "approved")}
                              disabled={processingId === request.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVE CONTENT */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Temporary Sessions</CardTitle>
                <CardDescription>Users currently holding elevated permissions through JIT.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Unlock className="h-8 w-8 opacity-20" />
                            No active JIT sessions.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="font-medium">{session.user?.name}</div>
                          </TableCell>
                          <TableCell>
                             <span className="font-mono text-xs">{session.secret?.key || session.project?.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-none">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-primary">
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 animate-pulse" />
                              {getRemainingTime(session.expiresAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">System Admin</TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                             <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleAction(session.id, "revoked")}
                              disabled={processingId === session.id}
                             >
                               Revoke
                             </Button>
                             <Button size="sm" variant="ghost" className="h-8" onClick={() => router.push(`/projects/${session.projectId}`)}>
                                <ExternalLink className="h-3 w-3" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY CONTENT */}
          <TabsContent value="history">
             <Card>
              <CardHeader>
                <CardTitle>Request History</CardTitle>
                <CardDescription>Archive of processed access requests and expired sessions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Secret</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.slice(0, 10).map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-sm">{h.user?.name}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[150px]">{h.secret?.key || "Project"}</TableCell>
                        <TableCell>
                           <Badge variant={
                             h.status === 'approved' ? 'secondary' : 
                             h.status === 'rejected' ? 'destructive' : 'outline'
                           }>
                              {h.status === 'approved' ? 'Expired' : h.status}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{h.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(h.requestedAt).split(',')[0]}</TableCell>
                      </TableRow>
                    ))}
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
