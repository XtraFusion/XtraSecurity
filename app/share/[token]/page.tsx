"use client";

import React, { useEffect, useState } from "react";
import { Key, Clock, Eye, AlertTriangle, CheckCircle, Shield } from "lucide-react";

export default function SharePage({ params }: { params: { token: string } }) {
    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        fetch(`/api/secret/share?token=${params.token}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.error) {
                    setError(d.error);
                    setState("error");
                } else {
                    setData(d);
                    setState("success");
                }
            })
            .catch(() => {
                setError("Failed to load secret");
                setState("error");
            });
    }, [params.token]);

    const envColors: Record<string, string> = {
        development: "bg-blue-500/10 text-blue-600",
        staging: "bg-amber-500/10 text-amber-600",
        production: "bg-red-500/10 text-red-600",
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                        <Shield className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">XtraSecurity</h1>
                    <p className="text-slate-400 text-sm mt-1">Secure Secret Share</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    {state === "loading" && (
                        <div className="flex flex-col items-center py-8 gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            <p className="text-slate-400 text-sm">Loading secret...</p>
                        </div>
                    )}

                    {state === "error" && (
                        <div className="flex flex-col items-center py-8 gap-4 text-center">
                            <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-7 w-7 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-white font-semibold text-lg">Link Unavailable</h2>
                                <p className="text-slate-400 text-sm mt-1">{error}</p>
                            </div>
                            <div className="text-xs text-slate-500 mt-2 bg-slate-800/50 rounded-lg p-3 w-full text-left">
                                This link may have expired, been revoked, or already reached its view limit.
                            </div>
                        </div>
                    )}

                    {state === "success" && data && (
                        <div className="space-y-5">
                            {/* Key Info */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Key className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <code className="text-white font-mono font-semibold text-lg">{data.key}</code>
                                        {data.label && <p className="text-slate-400 text-xs mt-0.5">{data.label}</p>}
                                    </div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${envColors[data.environmentType] || "bg-slate-700 text-slate-300"}`}>
                                    {data.environmentType}
                                </span>
                            </div>

                            {/* Secret Value */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Secret Value</span>
                                    <button
                                        onClick={() => setRevealed((p) => !p)}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        {revealed ? "Hide" : "Reveal"}
                                    </button>
                                </div>
                                <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 font-mono text-sm break-all">
                                    {revealed ? (
                                        <span className="text-emerald-400">{data.value}</span>
                                    ) : (
                                        <span className="text-slate-600 select-none">{"•".repeat(Math.min(data.value.length, 40))}</span>
                                    )}
                                </div>
                                {revealed && (
                                    <button
                                        onClick={() => navigator.clipboard?.writeText(data.value)}
                                        className="w-full text-xs py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        Copy to clipboard
                                    </button>
                                )}
                            </div>

                            {/* Meta info */}
                            <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-4">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>View {data.viewCount}{data.maxViews ? ` / ${data.maxViews}` : ""}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Expires {new Date(data.expiresAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Shared securely via <span className="text-primary">XtraSecurity</span>
                </p>
            </div>
        </div>
    );
}
