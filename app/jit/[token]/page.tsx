"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Shield, Clock, GitBranch, Key, Lock, CheckCircle,
    AlertTriangle, Loader2, User, ArrowLeft, Copy, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";

interface JitInfo {
    token: string;
    projectName: string;
    projectId: string;
    branchName: string | null;
    environment: string | null;
    secretKeys: string[];
    duration: number;
    label: string | null;
    accessLevel: string;
    expiresAt: string;
    maxUses: number;
    usedCount: number;
    createdBy: string;
    createdAt: string;
}

export default function JitClaimPage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();

    const [info, setInfo] = useState<JitInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await axios.get(`/api/jit/${token}`);
                setInfo(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || "Failed to load JIT link details");
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchInfo();
    }, [token]);

    const handleClaim = async () => {
        setClaiming(true);
        setError(null);
        try {
            const res = await axios.post("/api/jit/claim", { token });
            setSuccess(true);
            setRequestId(res.data.requestId);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to submit access request");
        } finally {
            setClaiming(false);
        }
    };

    const timeLeft = info ? Math.max(0, Math.floor((new Date(info.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading JIT access link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-4 py-12">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/projects">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />Back
                        </Button>
                    </Link>
                </div>

                {/* Error State */}
                {error && !info && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="flex flex-col items-center py-12 gap-4 text-center">
                            <AlertTriangle className="h-12 w-12 text-destructive opacity-60" />
                            <h2 className="text-xl font-bold text-destructive">Link Unavailable</h2>
                            <p className="text-muted-foreground max-w-sm">{error}</p>
                            <Link href="/projects">
                                <Button variant="outline" className="mt-4">Go to Projects</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Success State */}
                {success && (
                    <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="flex flex-col items-center py-12 gap-4 text-center">
                            <div className="p-4 bg-green-500/10 rounded-full">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold">Request Submitted!</h2>
                            <p className="text-muted-foreground max-w-sm">
                                Your request for <strong>read-only</strong> access has been submitted.
                                An admin or owner must approve it before access is granted.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Request ID: <code className="bg-muted px-2 py-0.5 rounded">{requestId}</code>
                            </p>
                            <Link href="/access-requests">
                                <Button className="mt-2 gap-2">
                                    <Clock className="h-4 w-4" />
                                    View My Requests
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* JIT Info + Claim */}
                {info && !success && (
                    <div className="space-y-6">
                        {/* Title Card */}
                        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3 text-amber-500 mb-2">
                                    <Shield className="h-5 w-5" />
                                    <span className="font-semibold text-sm uppercase tracking-wider">JIT Access Invitation</span>
                                </div>
                                <CardTitle className="text-2xl">
                                    {info.label || "Shared Access Link"}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Shared by <strong>{info.createdBy}</strong> for project <strong>{info.projectName}</strong>
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Scope Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Duration</span>
                                        </div>
                                        <p className="font-semibold">{info.duration} min</p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                            <Lock className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Access Level</span>
                                        </div>
                                        <p className="font-semibold capitalize">{info.accessLevel} Only</p>
                                    </div>
                                    {info.branchName && (
                                        <div className="p-3 rounded-lg border border-border bg-muted/30">
                                            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                                <GitBranch className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Branch</span>
                                            </div>
                                            <p className="font-semibold">{info.branchName}</p>
                                        </div>
                                    )}
                                    {info.environment && (
                                        <div className="p-3 rounded-lg border border-border bg-muted/30">
                                            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                                <Shield className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Environment</span>
                                            </div>
                                            <p className="font-semibold capitalize">{info.environment}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scoped Secrets */}
                                {info.secretKeys.length > 0 && (
                                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                            <Key className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Scoped Secrets ({info.secretKeys.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {info.secretKeys.map((key) => (
                                                <Badge key={key} variant="outline" className="font-mono text-xs">
                                                    {key}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Link Meta */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                                    <span>Expires in ~{timeLeft}h</span>
                                    <span>Uses: {info.usedCount}/{info.maxUses}</span>
                                </div>

                                {/* Error inline */}
                                {error && (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Claim Button */}
                                <Button
                                    onClick={handleClaim}
                                    disabled={claiming}
                                    className="w-full h-12 text-base gap-2"
                                    size="lg"
                                >
                                    {claiming ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Shield className="h-5 w-5" />
                                    )}
                                    {claiming ? "Submitting Request..." : "Request Read-Only Access"}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    This will create a pending access request that must be approved by an admin or project owner.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
