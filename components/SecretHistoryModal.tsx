"use client";

import { useState, useCallback, useEffect } from "react";
import {
    History, RotateCcw, Eye, EyeOff, ChevronDown, ChevronRight,
    Clock, User, Tag, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryEntry {
    version: string;
    updatedAt: string;
    updatedBy: string;
    description?: string;
    value: string;
}

interface SecretHistoryData {
    currentVersion: string;
    history: HistoryEntry[];
}

interface SecretHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    env: string;
    secretKey: string;
    secretId?: string;
    onRollbackSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ─── Version Row ──────────────────────────────────────────────────────────────

function VersionRow({
    entry,
    prevEntry,
    isCurrent,
    onRollback,
    rolling,
}: {
    entry: HistoryEntry;
    prevEntry?: HistoryEntry;
    isCurrent: boolean;
    onRollback: (version: string) => void;
    rolling: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const hasChanged = prevEntry && entry.value !== prevEntry.value;

    return (
        <div
            className={`rounded-lg border transition-all ${isCurrent
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border bg-card/50 hover:bg-card/80"
                }`}
        >
            {/* Header row */}
            <div className="flex items-center gap-3 p-3">
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                    {expanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                </button>

                {/* Version badge */}
                <div className="flex flex-col items-center">
                    <Badge
                        variant={isCurrent ? "default" : "outline"}
                        className="font-mono text-[10px] h-5 px-1.5 shrink-0"
                    >
                        v{entry.version}
                    </Badge>
                </div>

                {isCurrent && (
                    <Badge className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
                        Current
                    </Badge>
                )}

                {/* Meta */}
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 opacity-70" />
                        {fmtDate(entry.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 opacity-70" />
                        {entry.updatedBy}
                    </span>
                    {entry.description && (
                        <span className="flex items-center gap-1 italic truncate max-w-[200px]">
                            <Tag className="h-3.5 w-3.5 opacity-70" />
                            {entry.description}
                        </span>
                    )}
                </div>

                {/* Rollback button */}
                {!isCurrent && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRollback(entry.version)}
                        disabled={rolling}
                        className="h-8 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {rolling ? "Restoring…" : "Rollback"}
                    </Button>
                )}
            </div>

            {/* Expanded Content (Diff View) */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Value Change
                        </span>
                        <button
                            onClick={() => setRevealed((v) => !v)}
                            className="text-[10px] flex items-center gap-1 text-primary hover:underline"
                        >
                            {revealed ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Reveal</>}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {/* If we have a previous version, show the diff */}
                        {prevEntry && hasChanged ? (
                            <div className="space-y-2">
                                <div className="rounded border border-red-500/20 bg-red-500/5 p-2 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40" />
                                    <span className="text-[9px] font-bold text-red-600/70 absolute right-2 top-1">REMOVED</span>
                                    <code className="block text-xs font-mono text-red-700/80 line-through decoration-red-500/50">
                                        {revealed ? prevEntry.value : "••••••••••••••••"}
                                    </code>
                                </div>
                                <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/40" />
                                    <span className="text-[9px] font-bold text-emerald-600/70 absolute right-2 top-1">ADDED</span>
                                    <code className="block text-xs font-mono text-emerald-700">
                                        {revealed ? entry.value : "••••••••••••••••"}
                                    </code>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded border border-border bg-muted p-3">
                                <code className="block text-xs font-mono break-all whitespace-pre-wrap">
                                    {revealed ? entry.value || "(empty)" : "••••••••••••••••"}
                                </code>
                                {!prevEntry && (
                                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                                        Initial version creation.
                                    </p>
                                )}
                                {prevEntry && !hasChanged && (
                                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                                        Value remained the same (only metadata changed).
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SecretHistoryModal({
    open,
    onOpenChange,
    projectId,
    env,
    secretKey,
    secretId,
    onRollbackSuccess,
}: SecretHistoryModalProps) {
    const { toast } = useToast();
    const [data, setData] = useState<SecretHistoryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [rollingBack, setRollingBack] = useState<string | null>(null);
    const [confirmVersion, setConfirmVersion] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!open || !secretKey) return;
        setLoading(true);
        setData(null);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/envs/${env}/secrets/${encodeURIComponent(secretKey)}/history`
            );
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("History fetch failed:", res.status, errData);
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const resData = await res.json();
            setData(resData);
        } catch (e: any) {
            console.error("History fetch error:", e);
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [open, projectId, env, secretKey, toast]);

    // Fetch when modal opens
    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open, fetchHistory]);

    const handleRollback = async (version: string) => {
        if (confirmVersion !== version) {
            setConfirmVersion(version);
            return;
        }
        setRollingBack(version);
        setConfirmVersion(null);
        try {
            const res = await fetch(
                "/api/secret/rollback",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        secretId: secretId,
                        targetVersion: version,
                        changeReason: `Rollback to v${version} via History Console`
                    }),
                }
            );
            if (!res.ok) throw new Error((await res.json()).error);
            const result = await res.json();
            toast({
                title: "Rollback successful",
                description: `Secret rolled back to v${version} (now v${result.version})`,
            });
            onRollbackSuccess?.();
            onOpenChange(false);
        } catch (e: any) {
            toast({ title: "Rollback failed", description: e.message, variant: "destructive" });
        } finally {
            setRollingBack(null);
        }
    };

    const historyEntries = data?.history ?? [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                            <DialogTitle className="text-lg font-semibold font-mono leading-none tracking-tight">
                                {secretKey}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Version history · {env} environment
                                {data && ` · Current: v${data.currentVersion}`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Confirm rollback banner */}
                {confirmVersion && (
                    <div className="flex items-center gap-3 mx-6 mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm shrink-0">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="flex-1">
                            Click <strong>Rollback</strong> again on v{confirmVersion} to confirm. This will create a new version.
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setConfirmVersion(null)}
                            className="h-6 w-6 p-0"
                        >
                            <AlertTriangle className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-2 p-6">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : historyEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                            <History className="h-10 w-10 opacity-20" />
                            <p className="text-sm">No version history yet. History is recorded on every update.</p>
                        </div>
                    ) : (
                        historyEntries.map((entry, idx) => (
                            <VersionRow
                                key={`${entry.version}-${entry.updatedAt}`}
                                entry={entry}
                                prevEntry={historyEntries[idx + 1]}
                                isCurrent={idx === 0}
                                onRollback={handleRollback}
                                rolling={rollingBack === entry.version}
                            />
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
