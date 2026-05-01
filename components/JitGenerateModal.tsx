"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Shield,
    Copy,
    Check,
    Loader2,
    Link as LinkIcon,
    Terminal,
    Key,
    GitBranch,
    X,
    Clock,
    Eye,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import axios from "axios";

interface Branch {
    id: string;
    name: string;
}

interface Secret {
    id: string;
    key: string;
    environmentType: string;
}

interface JitGenerateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    branches: Branch[];
    secrets: Secret[];
    currentBranchId?: string;
    currentEnv?: string;
}

export function JitGenerateModal({
    open,
    onOpenChange,
    projectId,
    branches,
    secrets,
    currentBranchId,
    currentEnv,
}: JitGenerateModalProps) {
    const [branchId, setBranchId] = useState<string>(currentBranchId || "all");
    const [environment, setEnvironment] = useState<string>(currentEnv || "all");
    const [selectedSecretIds, setSelectedSecretIds] = useState<Set<string>>(new Set());
    const [duration, setDuration] = useState("60");
    const [label, setLabel] = useState("");
    const [maxUses, setMaxUses] = useState("1");
    const [expiresInHours, setExpiresInHours] = useState("24");

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<{
        url: string;
        cliCommand: string;
        token: string;
        expiresAt: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedCli, setCopiedCli] = useState(false);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            // Reset state if needed when opening
            if (!result) {
                setBranchId(currentBranchId || "all");
                setEnvironment(currentEnv || "all");
            }
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [open, currentBranchId, currentEnv, result]);

    const filteredSecrets =
        environment === "all"
            ? secrets
            : secrets.filter((s) => s.environmentType === environment);

    const toggleSecret = (id: string) => {
        setSelectedSecretIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const body: any = {
                projectId,
                duration: parseInt(duration),
                maxUses: parseInt(maxUses),
                expiresInHours: parseInt(expiresInHours),
            };
            if (branchId !== "all") body.branchId = branchId;
            if (environment !== "all") body.environment = environment;
            if (selectedSecretIds.size > 0) body.secretIds = Array.from(selectedSecretIds);
            if (label.trim()) body.label = label.trim();

            const res = await axios.post("/api/jit/generate", body);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate JIT link");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, type: "url" | "cli") => {
        await navigator.clipboard.writeText(text);
        if (type === "url") {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } else {
            setCopiedCli(true);
            setTimeout(() => setCopiedCli(false), 2000);
        }
    };

    const handleClose = () => {
        setResult(null);
        setError(null);
        setSelectedSecretIds(new Set());
        setLabel("");
        onOpenChange(false);
    };

    if (!open) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold">JIT Access Link</h3>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Just-In-Time Security
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {!result ? (
                            <div className="space-y-6">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Create a shareable link that allows another developer to request
                                    temporary read-only access. Approval is required by an admin or owner.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Branch Scope */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <GitBranch className="h-3 w-3" /> Branch
                                        </Label>
                                        <Select value={branchId} onValueChange={setBranchId}>
                                            <SelectTrigger className="bg-card/50">
                                                <SelectValue placeholder="All branches" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Branches</SelectItem>
                                                {branches.map((b) => (
                                                    <SelectItem key={b.id} value={b.id}>
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Environment Scope */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Environment</Label>
                                        <Select value={environment} onValueChange={(v) => { setEnvironment(v); setSelectedSecretIds(new Set()); }}>
                                            <SelectTrigger className="bg-card/50">
                                                <SelectValue placeholder="All environments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Environments</SelectItem>
                                                <SelectItem value="production">Production</SelectItem>
                                                <SelectItem value="staging">Staging</SelectItem>
                                                <SelectItem value="development">Development</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Secrets Scope */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Key className="h-3 w-3" /> Secrets Range
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] uppercase font-bold text-primary hover:text-primary/80"
                                            onClick={() => {
                                                if (selectedSecretIds.size === filteredSecrets.length && filteredSecrets.length > 0) {
                                                    setSelectedSecretIds(new Set());
                                                } else {
                                                    setSelectedSecretIds(new Set(filteredSecrets.map((s) => s.id)));
                                                }
                                            }}
                                        >
                                            {selectedSecretIds.size === filteredSecrets.length && filteredSecrets.length > 0
                                                ? "Deselect All"
                                                : "Select All"}
                                        </Button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-1 bg-muted/20 custom-scrollbar">
                                        {filteredSecrets.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <AlertCircle className="h-5 w-5 text-muted-foreground/50 mb-2" />
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                                    No secrets found in this scope
                                                </p>
                                            </div>
                                        ) : (
                                            filteredSecrets.map((s) => (
                                                <label
                                                    key={s.id}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${selectedSecretIds.has(s.id)
                                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                                                        : "hover:bg-muted/50 border border-transparent"
                                                        }`}
                                                >
                                                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${selectedSecretIds.has(s.id) ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                                        {selectedSecretIds.has(s.id) && <Check className="h-3 w-3 text-white" />}
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={selectedSecretIds.has(s.id)}
                                                            onChange={() => toggleSecret(s.id)}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-[11px] font-bold truncate flex-1">{s.key}</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 opacity-60">
                                                        {s.environmentType}
                                                    </Badge>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {selectedSecretIds.size === 0 ? "All secrets in scope will be accessible" : `${selectedSecretIds.size} secret(s) selected`}
                                        </p>
                                    </div>
                                </div>

                                {/* Limits Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> Access Duration (min)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={1440}
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="bg-card/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Eye className="h-3 w-3" /> Usage Limit
                                        </Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={maxUses}
                                            onChange={(e) => setMaxUses(e.target.value)}
                                            className="bg-card/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Link Expiry */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Expiry</Label>
                                        <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                                            <SelectTrigger className="bg-card/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 hour</SelectItem>
                                                <SelectItem value="6">6 hours</SelectItem>
                                                <SelectItem value="12">12 hours</SelectItem>
                                                <SelectItem value="24">24 hours</SelectItem>
                                                <SelectItem value="48">48 hours</SelectItem>
                                                <SelectItem value="72">72 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Label */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Label</Label>
                                        <Input
                                            placeholder='e.g. "Hotfix deployment"'
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            className="bg-card/50"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-xs font-bold flex items-center gap-3"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            /* Result view */
                            <div className="space-y-8 py-4">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <motion.div 
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-inner"
                                    >
                                        <Check className="h-10 w-10 text-emerald-500" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-foreground">JIT Link Active</h3>
                                    <p className="text-sm text-muted-foreground mt-2 max-w-[300px]">
                                        Share this link with the developer. Access will require manual approval from an administrator.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Web URL */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <LinkIcon className="h-3 w-3" /> Shareable Portal URL
                                        </Label>
                                        <div className="flex items-center gap-2 group">
                                            <div className="flex-1 bg-muted/50 border rounded-2xl px-4 py-3 font-mono text-xs break-all min-h-[50px] flex items-center text-foreground/80 group-hover:border-primary/30 transition-colors">
                                                {result.url}
                                            </div>
                                            <Button
                                                variant={copiedUrl ? "default" : "outline"}
                                                size="icon"
                                                className="h-[50px] w-12 rounded-2xl shrink-0 active:scale-95 transition-transform"
                                                onClick={() => copyToClipboard(result.url, "url")}
                                            >
                                                {copiedUrl ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* CLI Command */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                                            <Terminal className="h-3 w-3" /> Terminal Injected Command
                                        </Label>
                                        <div className="flex items-center gap-2 group">
                                            <div className="flex-1 font-mono text-xs bg-zinc-950 text-emerald-400 p-4 rounded-2xl border border-zinc-800 overflow-x-auto custom-scrollbar shadow-2xl">
                                                <span className="text-zinc-600 mr-2">$</span>
                                                {result.cliCommand}
                                            </div>
                                            <Button
                                                variant={copiedCli ? "default" : "outline"}
                                                size="icon"
                                                className="h-full min-h-[50px] w-12 rounded-2xl shrink-0 active:scale-95 transition-transform"
                                                onClick={() => copyToClipboard(result.cliCommand, "cli")}
                                            >
                                                {copiedCli ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link Expiry</span>
                                        <span className="text-xs font-bold text-foreground">{new Date(result.expiresAt).toLocaleString()}</span>
                                    </div>
                                    <div className="h-8 w-[1px] bg-border/50" />
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Session Limit</span>
                                        <span className="text-xs font-bold text-foreground">{duration} Minutes</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
                        {!result ? (
                            <>
                                <Button variant="ghost" onClick={handleClose} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleGenerate} 
                                    disabled={generating} 
                                    className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 font-bold"
                                >
                                    {generating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Shield className="h-4 w-4" />
                                    )}
                                    {generating ? "Generating Security Link..." : "Generate JIT Link"}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleClose} className="w-full h-11 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-transform">
                                Done
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof document !== "undefined" 
        ? createPortal(modalContent, document.body) 
        : null;
}
