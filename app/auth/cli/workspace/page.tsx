"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Loader2, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspaceSelectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    const callbackUrl = searchParams.get("callbackUrl");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=" + encodeURIComponent(window.location.href));
        }
        if (status === "authenticated") {
            fetchWorkspaces();
        }
    }, [status, router]);

    const fetchWorkspaces = async () => {
        try {
            const res = await axios.get("/api/workspace");
            if (res.status === 200) {
                setWorkspaces(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectWorkspace = async (workspaceId: string) => {
        if (!callbackUrl) return;
        setIsRedirecting(true);

        const selectedWorkspace = workspaces.find(w => w.id === workspaceId);
        const workspaceName = selectedWorkspace ? selectedWorkspace.name : "Workspace";

        try {
            // 1. Get the CLI callback URL with token
            const res = await axios.post("/api/auth/cli/sso/complete", {
                workspaceId,
                workspaceName,
                callbackUrl
            });

            if (res.data.redirectUrl) {
                // 2. Ping the CLI server directly from the browser
                // We use no-cors to avoid CORS errors since we just need to hit the endpoint (fire and forget)
                try {
                    await fetch(res.data.redirectUrl, { mode: 'no-cors' });
                } catch (fetchError) {
                    console.warn("CLI ping failed (CLI might have already exited or blocked):", fetchError);
                    // We continue anyway, as the CLI might have received it
                }

                // 3. Show Success UI
                setIsSuccess(true);
                setIsRedirecting(false);

                // Attempt to close window after short delay
                setTimeout(() => {
                    window.close();
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to complete SSO", error);
            setIsRedirecting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
                <Card className="w-full max-w-md shadow-xl border-success/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl text-green-700 dark:text-green-400">Login Successful</CardTitle>
                        <CardDescription>
                            You have successfully authenticated with the CLI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-muted-foreground">
                            You can now close this tab and return to your terminal.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => window.close()}
                        >
                            Close Tab
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isRedirecting) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Connecting to CLI...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Select Workspace</CardTitle>
                    <CardDescription>
                        Choose a workspace to access from the CLI.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => handleSelectWorkspace(ws.id)}
                                className="group flex items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                            >
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={`https://avatar.vercel.sh/${ws.id}.png`}
                                        alt={ws.name}
                                        className="h-8 w-8 rounded-full grayscale group-hover:grayscale-0 transition-all"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-foreground">{ws.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {ws.subscriptionPlan === "free" ? "Free Plan" : "Pro Plan"}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
                            </button>
                        ))}
                        {workspaces.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                                No workspaces found. Please create one first.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
