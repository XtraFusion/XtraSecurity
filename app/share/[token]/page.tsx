"use client";

import React, { useEffect, useState } from "react";
import { Key, Clock, Eye, AlertTriangle, CheckCircle, Copy, Share2, ShieldCheck, Lock, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

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
        development: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        staging: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        production: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-primary/30 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-lg relative z-10">
                {/* Header Logo */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center mb-10"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                        <div className="relative h-20 w-20 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-2xl">
                            <Image src="/apple-touch-icon.png" alt="XtraSecurity" width={60} height={60} className="rounded-lg" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white mt-6 tracking-tight">XtraSecurity</h1>
                    <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                        <Lock className="h-3 w-3 text-primary" />
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">End-to-End Encrypted Share</span>
                    </div>
                </motion.div>

                {/* Main Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                    <div className="p-8">
                        {state === "loading" && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-2xl bg-slate-800/50" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-1/3 bg-slate-800/50" />
                                        <Skeleton className="h-4 w-2/3 bg-slate-800/50" />
                                    </div>
                                </div>
                                <Skeleton className="h-[120px] w-full rounded-2xl bg-slate-800/50" />
                                <div className="flex gap-3">
                                    <Skeleton className="h-4 w-24 bg-slate-800/50" />
                                    <Skeleton className="h-4 w-24 bg-slate-800/50" />
                                </div>
                            </div>
                        )}

                        {state === "error" && (
                            <div className="flex flex-col items-center py-10 text-center">
                                <div className="h-20 w-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                                    <AlertTriangle className="h-10 w-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Access Denied</h2>
                                <p className="text-slate-400 mt-2 max-w-[280px]">{error}</p>
                                <div className="mt-8 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-xs text-slate-500 leading-relaxed text-left">
                                    This secure link is no longer active. It may have:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Reached its maximum view limit</li>
                                        <li>Expired naturally over time</li>
                                        <li>Been manually revoked by the owner</li>
                                    </ul>
                                </div>
                                <button 
                                    onClick={() => window.location.href = '/'}
                                    className="mt-8 text-primary font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                                >
                                    Visit XtraSecurity <ExternalLink className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {state === "success" && data && (
                            <div className="space-y-8">
                                {/* Top Meta */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                                            <Key className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Resource Name</h3>
                                            <code className="text-white font-mono font-bold text-xl">{data.key}</code>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${envColors[data.environmentType] || "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                        {data.environmentType}
                                    </div>
                                </div>

                                {data.label && (
                                    <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                        <p className="text-xs text-slate-400 leading-relaxed italic">"{data.label}"</p>
                                    </div>
                                )}

                                {/* Secret Value Box */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Encrypted Value</span>
                                        <button
                                            onClick={() => setRevealed((p) => !p)}
                                            className="text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                            {revealed ? <Lock className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            {revealed ? "Mask" : "Reveal"}
                                        </button>
                                    </div>
                                    
                                    <div className="relative group">
                                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-[1px]" />
                                        <div className="relative bg-[#020617]/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 font-mono text-base break-all min-h-[100px] flex items-center justify-center overflow-hidden">
                                            <AnimatePresence mode="wait">
                                                {revealed ? (
                                                    <motion.span 
                                                        key="revealed"
                                                        initial={{ filter: 'blur(10px)', opacity: 0 }}
                                                        animate={{ filter: 'blur(0px)', opacity: 1 }}
                                                        exit={{ filter: 'blur(10px)', opacity: 0 }}
                                                        className="text-emerald-400 text-center w-full"
                                                    >
                                                        {data.value}
                                                    </motion.span>
                                                ) : (
                                                    <motion.div 
                                                        key="masked"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex gap-1"
                                                    >
                                                        {[...Array(8)].map((_, i) => (
                                                            <div key={i} className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {revealed && (
                                        <button
                                            onClick={() => handleCopy(data.value)}
                                            className="w-full h-12 bg-white text-slate-950 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group active:scale-95"
                                        >
                                            <Copy className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            Copy Secret
                                        </button>
                                    )}
                                </div>

                                {/* Link Stats */}
                                <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Views</span>
                                            <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                                                <Eye className="h-3 w-3 text-slate-400" />
                                                <span>{data.viewCount}{data.maxViews ? ` / ${data.maxViews}` : ""}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expires In</span>
                                            <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                                                <Clock className="h-3 w-3 text-slate-400" />
                                                <span className="truncate max-w-[120px]">{new Date(data.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">Verified</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 flex flex-col items-center"
                >
                    <p className="text-slate-600 text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
                        Powered by <span className="text-slate-400">XtraSecurity Engine</span>
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="/" className="text-slate-500 hover:text-primary transition-colors">
                            <Share2 className="h-5 w-5" />
                        </a>
                        <div className="h-4 w-[1px] bg-slate-800" />
                        <button onClick={() => handleCopy(window.location.href)} className="text-slate-500 hover:text-primary transition-colors">
                            <Copy className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
