"use client";

import { useState, useCallback } from "react";
import {
    History, RotateCcw, Eye, EyeOff, ChevronDown, ChevronRight,
    Clock, User, Tag, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
    onClose: () => void;
    projectId: string;
    env: string;
    secretKey: string;
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
    isCurrent,
    onRollback,
    rolling,
}: {
    entry: HistoryEntry;
    isCurrent: boolean;
    onRollback: (version: string) => void;
    rolling: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [revealed, setRevealed] = useState(false);

    return (
        <div
            className={`rounded-lg border transition-colors ${isCurrent
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
        >
            {/* Header row */}
            <div className="flex items-center gap-3 p-3">
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                </button>

                {/* Version badge */}
                <Badge
                    variant={isCurrent ? "default" : "secondary"}
                    className="font-mono text-xs shrink-0"
                >
                    v{entry.version}
                </Badge>

                {isCurrent && (
                    <Badge className="text-xs bg-green-500/20 text-green-600 border-green-500/30 shrink-0">
                        Current
                    </Badge>
                )}

                {/* Meta */}
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmtDate(entry.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.updatedBy}
                    </span>
                    {entry.description && (
                        <span className="flex items-center gap-1 italic">
                            <Tag className="h-3 w-3" />
                            {entry.description}
                        </span>
                    )}
                </div>

                {/* Rollback button */}
                {!isCurrent && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRollback(entry.version)}
                        disabled={rolling}
                        className="gap-1 shrink-0 text-xs"
                    >
                        <RotateCcw className="h-3 w-3" />
                        {rolling ? "Rolling back…" : "Rollback"}
                    </Button>
                )}
            </div>

            {/* Expanded value */}
            {expanded && (
                <div className="px-4 pb-3 border-t border-border/50 pt-3">
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted rounded px-3 py-2 text-xs font-mono break-all">
                            {revealed ? entry.value || "(empty)" : "••••••••••••••••"}
                        </code>
                        <button
                            onClick={() => setRevealed((v) => !v)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                            title={revealed ? "Hide value" : "Reveal value"}
                        >
                            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SecretHistoryModal({
    open,
    onClose,
    projectId,
    env,
    secretKey,
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
            if (!res.ok) throw new Error((await res.json()).error);
            setData(await res.json());
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [open, projectId, env, secretKey]);

    // Fetch when modal opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) fetchHistory();
        else onClose();
    };

    const handleRollback = async (version: string) => {
        if (confirmVersion !== version) {
            setConfirmVersion(version);
            return;
        }
        setRollingBack(version);
        setConfirmVersion(null);
        try {
            const res = await fetch(
                `/api/projects/${projectId}/envs/${env}/secrets/${encodeURIComponent(secretKey)}/history`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ version }),
                }
            );
            if (!res.ok) throw new Error((await res.json()).error);
            const result = await res.json();
            toast({
                title: "Rollback successful",
                description: `Secret rolled back to v${version} (now v${result.version})`,
            });
            onRollbackSuccess?.();
            onClose();
        } catch (e: any) {
            toast({ title: "Rollback failed", description: e.message, variant: "destructive" });
        } finally {
            setRollingBack(null);
        }
    };

    // All versions newest-first: current on top, then history
    const allVersions: (HistoryEntry & { isCurrent: boolean })[] = data
        ? [
            { ...data.history[0] ?? { version: data.currentVersion, updatedAt: "", updatedBy: "", value: "" }, isCurrent: true },
            ...data.history.slice(1).map((h) => ({ ...h, isCurrent: false })),
        ]
        : [];

    // Simpler: just show history array as-is (newest first from API)
    const historyEntries = data?.history ?? [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="font-mono">{secretKey}</DialogTitle>
                            <DialogDescription>
                                Version history · {env} environment
                                {data && ` · Current: v${data.currentVersion}`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Confirm rollback banner */}
                {confirmVersion && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="flex-1">
                            Click <strong>Rollback</strong> again on v{confirmVersion} to confirm. This will create a new version.
                        </span>
                        <button onClick={() => setConfirmVersion(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
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
                                key={entry.version}
                                entry={entry}
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
