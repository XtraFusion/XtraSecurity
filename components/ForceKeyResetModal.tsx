"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Key,
  Copy,
  Download,
  Check,
  Loader2,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  generateRecoveryMnemonic,
  downloadRecoveryKit,
  createWorkspaceVaultSentinel,
} from "@/lib/crypto/e2ee";
import { useWorkspaceVault, STORAGE_PREFIX } from "@/hooks/useWorkspaceVault";
import axios from "axios";

export interface ForceKeyResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  onSuccess?: (newPassphrase: string) => void;
}

export function ForceKeyResetModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onSuccess,
}: ForceKeyResetModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPhrase, setGeneratedPhrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { unlockWorkspace } = useWorkspaceVault();

  const handleClose = () => {
    if (isLoading) return;
    setConfirmInput("");
    setError(null);
    setGeneratedPhrase(null);
    setCopied(false);
    onClose();
  };

  const handleCopy = () => {
    if (!generatedPhrase) return;
    navigator.clipboard.writeText(generatedPhrase);
    setCopied(true);
    toast({ title: "Copied!", description: "24-word recovery phrase copied to clipboard." });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadKit = () => {
    if (!generatedPhrase) return;
    downloadRecoveryKit({
      passphrase: generatedPhrase,
      workspaceName: workspaceName || "Workspace",
      scope: "workspace",
    });
    toast({ title: "Downloaded", description: "Recovery kit (.txt) saved to your device." });
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim().toUpperCase() !== "RESET" && confirmInput.trim() !== workspaceName) {
      setError(`Please type "RESET" or "${workspaceName}" to confirm.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Generate fresh 24-word recovery phrase for the workspace
      const mnemonicData = generateRecoveryMnemonic();
      const newKey = mnemonicData.mnemonic;

      // 2. Create cryptographic workspace sentinel with the new key
      const newSentinelPayload = createWorkspaceVaultSentinel(workspaceId, newKey);

      // 3. Call backend endpoint to wipe workspace data and update sentinel
      const res = await axios.post("/api/workspace/force-reset", {
        workspaceId,
        confirmation: "CONFIRM_FORCE_RESET",
        newVaultSentinel: JSON.stringify(newSentinelPayload),
      });

      const purgedProjectIds: string[] = res.data?.purgedProjectIds || [];

      // 4. Clean up old local storage / session storage for wiped projects
      if (typeof window !== "undefined") {
        purgedProjectIds.forEach((pId) => {
          sessionStorage.removeItem(`xtra_vault_${pId}`);
          localStorage.removeItem(`xtra_vault_${pId}`);
          localStorage.removeItem(`xtra_vault_sentinel_${pId}`);
          localStorage.removeItem(`xtra_vault_scope_${pId}`);
          sessionStorage.removeItem(`xtra_vault_locked_${pId}`);
        });

        // 5. Store the new Workspace Master Key
        sessionStorage.setItem(`${STORAGE_PREFIX.WORKSPACE}${workspaceId}`, newKey);
        localStorage.setItem(`${STORAGE_PREFIX.WORKSPACE}${workspaceId}`, newKey);
        sessionStorage.setItem(STORAGE_PREFIX.GLOBAL, newKey);
        localStorage.setItem(STORAGE_PREFIX.GLOBAL, newKey);

        unlockWorkspace(newKey, true);
        window.dispatchEvent(
          new CustomEvent("xtra-vault-change", {
            detail: { workspaceId, scope: "workspace", forceReset: true },
          })
        );
      }

      // 6. Auto-download recovery kit file
      downloadRecoveryKit({
        passphrase: newKey,
        workspaceName: workspaceName || "Workspace",
        scope: "workspace",
      });

      // 7. Transition modal to Success State with generated key
      setGeneratedPhrase(newKey);
      toast({
        title: "Workspace Reset & New Key Generated",
        description: "All old data wiped. Your new 24-word recovery kit has been downloaded (.txt).",
      });

      if (onSuccess) {
        onSuccess(newKey);
      }
    } catch (err: any) {
      console.error("Force reset failed:", err);
      const msg = err.response?.data?.error || err.message || "Failed to force reset workspace.";
      setError(msg);
      toast({ title: "Reset Failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmed =
    confirmInput.trim().toUpperCase() === "RESET" || confirmInput.trim() === workspaceName;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!generatedPhrase ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    Force Reset Workspace Vault
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Permanent Zero-Knowledge Master Key Reset & Data Wipe
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs leading-relaxed font-medium">
                  <strong>CRITICAL WARNING:</strong> This action cannot be undone. Because XtraSecurity uses
                  Strict Zero-Knowledge encryption, resetting the master key will permanently delete all
                  existing projects, branches, and encrypted secrets in <strong>{workspaceName || "this workspace"}</strong>.
                </AlertDescription>
              </Alert>

              <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>All projects and secrets in this workspace will be deleted immediately.</li>
                  <li>A brand-new 24-word Zero-Knowledge master recovery key will be generated.</li>
                  <li>Your workspace vault will be unlocked with the new key right away.</li>
                  <li>A new recovery kit file (<code className="text-primary font-mono">.txt</code>) will download automatically.</li>
                </ul>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Label htmlFor="reset-confirm" className="text-xs font-semibold">
                  Type <span className="font-mono text-destructive select-all font-bold">RESET</span> or{" "}
                  <span className="font-mono text-foreground font-bold select-all">{workspaceName}</span> to confirm:
                </Label>
                <Input
                  id="reset-confirm"
                  placeholder={`Type RESET to confirm`}
                  value={confirmInput}
                  onChange={(e) => {
                    setConfirmInput(e.target.value);
                    setError(null);
                  }}
                  className="font-mono text-xs"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!isConfirmed || isLoading}
                onClick={handleExecuteReset}
                className="font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Wiping & Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Wipe All Data & Generate New Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    New Master Key Generated
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Your workspace has been reset and is now unlocked with your new key.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 text-xs">
                <p className="font-semibold mb-1">Recovery kit auto-downloaded (.txt)</p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Store this phrase in a secure password manager. If lost, nobody can decrypt secrets you encrypt with this key.
                </p>
              </div>

              <div className="p-3.5 bg-muted/60 rounded-xl border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> Your New 24-Word Recovery Phrase:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy}>
                      {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-primary" onClick={handleDownloadKit}>
                      <Download className="h-3 w-3 mr-1" /> Download (.txt)
                    </Button>
                  </div>
                </div>
                <div className="font-mono text-xs p-3 bg-background rounded-lg border text-foreground leading-relaxed break-all select-all">
                  {generatedPhrase}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90 font-semibold"
                onClick={() => {
                  handleClose();
                  window.location.reload();
                }}
              >
                Done & Reload Workspace
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
