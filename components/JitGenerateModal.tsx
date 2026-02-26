"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Shield,
    Copy,
    Check,
    Loader2,
    Link as LinkIcon,
    Terminal,
    Key,
    GitBranch,
} from "lucide-react";
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

    // Filter secrets by selected env
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

    const handleClose = (val: boolean) => {
        if (!val) {
            // Reset state on close
            setResult(null);
            setError(null);
            setSelectedSecretIds(new Set());
            setLabel("");
        }
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-amber-500" />
                        Generate JIT Access Link
                    </DialogTitle>
                    <DialogDescription>
                        Create a shareable link that allows another developer to request
                        temporary read-only access. Approval is required by an admin or owner.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4 py-2">
                        {/* Branch Scope */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <GitBranch className="h-3.5 w-3.5" /> Branch
                            </Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
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
                            <Label>Environment</Label>
                            <Select value={environment} onValueChange={(v) => { setEnvironment(v); setSelectedSecretIds(new Set()); }}>
                                <SelectTrigger>
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

                        {/* Secrets Scope */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Key className="h-3.5 w-3.5" /> Secrets
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {selectedSecretIds.size === 0
                                        ? "All in scope"
                                        : `${selectedSecretIds.size} selected`}
                                </span>
                            </Label>
                            <div className="flex items-center justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2"
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
                            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 bg-muted/20">
                                {filteredSecrets.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                        No secrets in this scope
                                    </p>
                                ) : (
                                    filteredSecrets.map((s) => (
                                        <label
                                            key={s.id}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${selectedSecretIds.has(s.id)
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={selectedSecretIds.has(s.id)}
                                                onChange={() => toggleSecret(s.id)}
                                            />
                                            <span className="font-mono text-xs">{s.key}</span>
                                            <Badge variant="outline" className="ml-auto text-[10px] h-5">
                                                {s.environmentType}
                                            </Badge>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Access Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Uses</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Link Expiry */}
                        <div className="space-y-2">
                            <Label>Link Expires In (hours)</Label>
                            <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                                <SelectTrigger>
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
                            <Label>Label (optional)</Label>
                            <Input
                                placeholder='e.g. "Deploy hotfix", "New hire onboarding"'
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button variant="outline" onClick={() => handleClose(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                                {generating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Shield className="h-4 w-4" />
                                )}
                                {generating ? "Generating..." : "Generate Link"}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    /* Result view */
                    <div className="space-y-4 py-2">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center p-3 bg-green-500/10 rounded-full mb-3">
                                <Check className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="font-semibold">JIT Link Generated!</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Share this link with the developer. Access requires admin approval.
                            </p>
                        </div>

                        {/* Web URL */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <LinkIcon className="h-3 w-3" /> Shareable URL
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={result.url}
                                    className="font-mono text-xs bg-muted/30"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => copyToClipboard(result.url, "url")}
                                >
                                    {copiedUrl ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* CLI Command */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Terminal className="h-3 w-3" /> CLI Command
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 font-mono text-xs bg-zinc-900 text-green-400 px-3 py-2.5 rounded-lg border border-border/50 overflow-x-auto">
                                    $ {result.cliCommand}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => copyToClipboard(result.cliCommand, "cli")}
                                >
                                    {copiedCli ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center pt-2">
                            Link expires:{" "}
                            <span className="font-medium">
                                {new Date(result.expiresAt).toLocaleString()}
                            </span>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => handleClose(false)} className="w-full">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
