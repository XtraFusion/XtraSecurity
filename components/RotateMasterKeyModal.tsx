"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, RefreshCw, AlertCircle, Check, Loader2, Download, Copy, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import {
  deriveProjectKey,
  decryptSecretValue,
  encryptSecretValueWebCrypto,
  generateRecoveryMnemonic,
  validateProjectPassphrase,
  downloadRecoveryKit,
  createVaultSentinelWebCrypto,
  verifyVaultSentinel
} from "@/lib/crypto/e2ee";
import { useGlobalContext } from "@/hooks/useUser";

interface RotateMasterKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  initialNewPassphrase?: string;
  initialScope?: "project" | "workspace";
  currentVaultPassphrase?: string;
  isUnlockedViaWorkspace?: boolean;
  isDedicatedProjectKey?: boolean;
  onSuccess: (newPassphrase: string, scope?: "project" | "workspace") => void;
}

export function RotateMasterKeyModal({
  isOpen,
  onClose,
  projectId,
  projectName = "this project",
  initialNewPassphrase = "",
  initialScope = "project",
  currentVaultPassphrase = "",
  isUnlockedViaWorkspace = false,
  isDedicatedProjectKey = false,
  onSuccess
}: RotateMasterKeyModalProps) {
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState(initialNewPassphrase);
  const [confirmPassphrase, setConfirmPassphrase] = useState(initialNewPassphrase);
  const [targetScope, setTargetScope] = useState<"project" | "workspace">(initialScope);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [autoDownloaded, setAutoDownloaded] = useState<boolean>(false);
  const [lastDownloadedKey, setLastDownloadedKey] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const { selectedWorkspace } = useGlobalContext();

  // Sync initial state on modal open
  React.useEffect(() => {
    if (isOpen) {
      if (initialNewPassphrase) {
        setNewPassphrase(initialNewPassphrase);
        setConfirmPassphrase(initialNewPassphrase);
      }
      if (initialScope) {
        setTargetScope(initialScope);
      }
      if (currentVaultPassphrase) {
        setCurrentPassphrase(currentVaultPassphrase);
      }
      setError(null);
      setProgress(null);
    }
  }, [isOpen, initialNewPassphrase, initialScope, currentVaultPassphrase]);

  const handleGenerate = () => {
    const result = generateRecoveryMnemonic();
    setNewPassphrase(result.mnemonic);
    setConfirmPassphrase(result.mnemonic);

    downloadRecoveryKit({
      passphrase: result.mnemonic,
      projectName,
      projectId,
      workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
      scope: targetScope
    });
    setAutoDownloaded(true);
    setLastDownloadedKey(result.mnemonic);
  };

  const handleNewPassphrasePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text")?.trim();
    if (pasted && pasted.length >= 6) {
      setNewPassphrase(pasted);
      setConfirmPassphrase(pasted);
      downloadRecoveryKit({
        passphrase: pasted,
        projectName,
        projectId,
        workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
        scope: targetScope
      });
      setAutoDownloaded(true);
      setLastDownloadedKey(pasted);
    }
  };

  /**
   * Core rotation execution routine
   */
  const executeRotate = async (currPass: string, newPass: string, scope: "project" | "workspace") => {
    setError(null);
    setProgress(null);

    const activeCurrent = currPass.trim();
    const activeNew = newPass.trim();

    if (!activeCurrent || !activeNew) {
      setError("Please fill in both current and new passphrases.");
      return;
    }

    setIsRotating(true);
    setProgress("Deriving cryptographic keys...");

    try {
      const oldKey = deriveProjectKey(projectId, activeCurrent);
      const newKey = deriveProjectKey(projectId, activeNew);

      // 1. Check existing sentinel if stored locally or in DB
      if (typeof window !== "undefined") {
        const localSentinelStr = localStorage.getItem(`xtra_vault_sentinel_${projectId}`);
        if (localSentinelStr) {
          try {
            const parsedSentinel = JSON.parse(localSentinelStr);
            if (!verifyVaultSentinel(parsedSentinel, oldKey)) {
              throw new Error("Authentication tag mismatch. The current master passphrase entered is incorrect.");
            }
          } catch (sentinelErr: any) {
            if (sentinelErr.message && sentinelErr.message.includes("Authentication tag")) {
              throw sentinelErr;
            }
          }
        }
      }

      setProgress("Fetching project secrets...");
      const res = await axios.get(`/api/secret?projectId=${projectId}`);
      const rawSecrets = Array.isArray(res.data) ? res.data : (res.data.data || []);

      // Generate new cryptographic sentinel for project
      const newSentinelPayload = await createVaultSentinelWebCrypto(newKey);

      const updates: Array<{ id: string; value: string[]; history: any[] }> = [];

      // Filter out system sentinel secrets from user updates
      const userSecrets = rawSecrets.filter((s: any) => s.key !== "__xtra_vault_sentinel__");

      if (userSecrets.length > 0) {
        setProgress(`Re-encrypting ${userSecrets.length} secrets and audit trail...`);

        for (const secret of userSecrets) {
          let val = secret.value;
          if (Array.isArray(val) && val.length > 0) val = val[0];

          // Decrypt current value
          let plainValue = "";
          if (typeof val === "string" && val.startsWith("{")) {
            try {
              const parsed = JSON.parse(val);
              if (parsed.ciphertext && parsed.iv) {
                if (!validateProjectPassphrase(parsed, oldKey)) {
                  throw new Error(`Authentication tag mismatch on secret '${secret.key}'. The current passphrase is incorrect.`);
                }
                plainValue = decryptSecretValue(parsed, oldKey);
              } else {
                plainValue = val;
              }
            } catch (e: any) {
              throw new Error(`Failed to decrypt secret '${secret.key}': ${e.message}`);
            }
          } else {
            plainValue = val;
          }

          // Encrypt with new key
          let newValueStr = plainValue;
          if (plainValue !== undefined && plainValue !== null) {
            const newEnc = await encryptSecretValueWebCrypto(plainValue, newKey);
            newValueStr = JSON.stringify(newEnc);
          }

          // Decrypt and re-encrypt history
          const newHistory = [];
          if (Array.isArray(secret.history)) {
            for (const hist of secret.history) {
              let hVal = hist.value;
              if (Array.isArray(hVal) && hVal.length > 0) hVal = hVal[0];

              let hPlain = "";
              if (typeof hVal === "string" && hVal.startsWith("{")) {
                try {
                  const hParsed = JSON.parse(hVal);
                  if (hParsed.ciphertext && hParsed.iv) {
                    hPlain = decryptSecretValue(hParsed, oldKey);
                  } else {
                    hPlain = hVal;
                  }
                } catch (_) {
                  hPlain = hVal;
                }
              } else {
                hPlain = hVal;
              }

              let newHStr = hPlain;
              if (hPlain && typeof hPlain === "string" && !hPlain.startsWith("{") && !hPlain.startsWith("[")) {
                const newHEnc = await encryptSecretValueWebCrypto(hPlain, newKey);
                newHStr = JSON.stringify(newHEnc);
              } else {
                newHStr = hPlain;
              }

              newHistory.push({
                ...hist,
                value: [newHStr]
              });
            }
          }

          updates.push({
            id: secret.id,
            value: [newValueStr],
            history: newHistory
          });
        }
      }

      setProgress("Saving rotated secrets and cryptographic sentinel to the cloud...");
      await axios.post("/api/secret/rotate", {
        projectId,
        updates,
        sentinel: newSentinelPayload,
        targetScope: scope
      });

      setProgress("Rotation successful!");

      // Auto-download recovery kit for the new passphrase if not already downloaded
      if (lastDownloadedKey !== activeNew) {
        downloadRecoveryKit({
          passphrase: activeNew,
          projectName,
          projectId,
          workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
          scope
        });
        setAutoDownloaded(true);
        setLastDownloadedKey(activeNew);
      }

      // Save sentinel to storage
      if (typeof window !== "undefined") {
        localStorage.setItem(`xtra_vault_sentinel_${projectId}`, JSON.stringify(newSentinelPayload));
      }

      persistRotatedKey(activeNew, scope);

      onSuccess(activeNew, scope);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to rotate master key.");
    } finally {
      setIsRotating(false);
    }
  };

  /**
   * "Once key is generated, auto rotate":
   * Generates a new 24-word phrase, downloads recovery kit, and immediately triggers rotation!
   */
  const handleGenerateAndAutoRotate = async () => {
    const activeCurrent = (currentPassphrase || currentVaultPassphrase).trim();
    if (!activeCurrent) {
      setError("Please enter your Current Master Passphrase first to decrypt existing secrets before auto-rotating.");
      return;
    }

    const result = generateRecoveryMnemonic();
    setNewPassphrase(result.mnemonic);
    setConfirmPassphrase(result.mnemonic);

    downloadRecoveryKit({
      passphrase: result.mnemonic,
      projectName,
      projectId,
      workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
      scope: targetScope
    });
    setAutoDownloaded(true);
    setLastDownloadedKey(result.mnemonic);

    if (!currentPassphrase && currentVaultPassphrase) {
      setCurrentPassphrase(currentVaultPassphrase);
    }

    await executeRotate(activeCurrent, result.mnemonic, targetScope);
  };

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassphrase || !newPassphrase || !confirmPassphrase) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setError("New passphrases do not match.");
      return;
    }

    await executeRotate(currentPassphrase, newPassphrase, targetScope);
  };

  const persistRotatedKey = (pass: string, scope: "project" | "workspace") => {
    if (typeof window === "undefined") return;

    const wsId = selectedWorkspace?.id || selectedWorkspace?.value;

    if (scope === "workspace") {
      if (wsId) {
        sessionStorage.setItem(`xtra_ws_vault_${wsId}`, pass);
        sessionStorage.setItem("xtra_global_vault_passphrase", pass);
        if (rememberDevice) {
          localStorage.setItem(`xtra_ws_vault_${wsId}`, pass);
          localStorage.setItem("xtra_global_vault_passphrase", pass);
        } else {
          localStorage.removeItem(`xtra_ws_vault_${wsId}`);
          localStorage.removeItem("xtra_global_vault_passphrase");
        }
      }
      // Remove project-specific override so this project tracks workspace master key
      sessionStorage.removeItem(`xtra_vault_${projectId}`);
      localStorage.removeItem(`xtra_vault_${projectId}`);
      localStorage.setItem(`xtra_vault_scope_${projectId}`, "workspace");
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { workspaceId: wsId, scope: "workspace" } }));
    } else {
      // Save dedicated project-specific key (isolated)
      sessionStorage.setItem(`xtra_vault_${projectId}`, pass);
      localStorage.setItem(`xtra_vault_scope_${projectId}`, "project");
      if (rememberDevice) {
        localStorage.setItem(`xtra_vault_${projectId}`, pass);
      } else {
        localStorage.removeItem(`xtra_vault_${projectId}`);
      }
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { projectId, scope: "project" } }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Rotate Master Passphrase & Scope
          </DialogTitle>
          <DialogDescription>
            This action decrypts all secrets in {projectName} and re-encrypts them with your new master passphrase.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Current State Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          {isUnlockedViaWorkspace && (
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-blue-900 dark:text-blue-200 w-full">
              <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="font-semibold">Currently using: Workspace Master Key</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select <strong>Project Only (Isolated)</strong> below to decouple this project with an independent passphrase.
                </p>
              </div>
            </div>
          )}

          {isDedicatedProjectKey && (
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-2 text-purple-900 dark:text-purple-200 w-full">
              <Key className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="font-semibold">Currently using: Dedicated Project Key</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This project has an isolated key separate from other workspace projects. Select <strong>Workspace Master</strong> to unify it with the workspace.
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleRotate} className="space-y-4 py-2">
          {/* Current Passphrase Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Current Master Passphrase</Label>
              {currentVaultPassphrase && currentPassphrase !== currentVaultPassphrase && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPassphrase(currentVaultPassphrase)}
                  className="h-5 text-[11px] px-1.5 text-primary hover:text-primary hover:bg-primary/10"
                >
                  Use Active Session Key
                </Button>
              )}
            </div>
            <Input
              type="password"
              placeholder="Enter current passphrase to decrypt existing secrets..."
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              required
              className="font-mono text-sm"
              autoFocus={!currentVaultPassphrase}
            />
          </div>

          {/* New Passphrase Field with Instant Auto-Rotate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label className="text-xs font-semibold">New Master Passphrase or Mnemonic</Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="h-6 text-xs px-2 text-primary font-medium hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Generate secure 24-word phrase"
                >
                  <Key className="h-3 w-3 mr-1" /> Generate Phrase
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateAndAutoRotate}
                  disabled={isRotating}
                  className="h-6 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                  title="Generate key and immediately auto-rotate secrets in one click"
                >
                  <Zap className="h-3 w-3 mr-1" /> Generate & Auto-Rotate
                </Button>
              </div>
            </div>
            <Input
              type="password"
              placeholder="Enter, paste, or click 'Generate & Auto-Rotate'..."
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              onPaste={handleNewPassphrasePaste}
              required
              className="font-mono text-sm"
            />
          </div>

          {newPassphrase && (
            <div className="p-2.5 bg-muted/40 border border-border/80 rounded-lg space-y-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recovery Kit {autoDownloaded ? "Auto-Downloaded (.txt)" : "Ready"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(newPassphrase);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      downloadRecoveryKit({
                        passphrase: newPassphrase,
                        projectName,
                        projectId,
                        workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
                        scope: targetScope
                      });
                      setAutoDownloaded(true);
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> Download (.txt)
                  </Button>
                </div>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground break-all bg-background/90 p-2 rounded border border-border/50 select-all">
                {newPassphrase}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Confirm New Passphrase</Label>
            <Input
              type="password"
              placeholder="Confirm new passphrase..."
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              required
              className="font-mono text-sm"
            />
          </div>

          {/* Key Scope Selection: Option to change from workspace level key to project level key or vice versa */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Passphrase Scope (Switch Level)</Label>
              <span className="text-[11px] text-muted-foreground">
                Target: <strong>{targetScope === "project" ? "Dedicated Project Key" : "Workspace Master Key"}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  targetScope === "project"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    value="project"
                    checked={targetScope === "project"}
                    onChange={() => setTargetScope("project")}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    <span>Project Only (Isolated)</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1.5 ml-5 leading-normal">
                  Decouples this project with an independent passphrase. Other workspace projects remain unaffected.
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  targetScope === "workspace"
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    value="workspace"
                    checked={targetScope === "workspace"}
                    onChange={() => setTargetScope("workspace")}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    <span>Workspace Master</span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1.5 ml-5 leading-normal">
                  Unifies this project under the Workspace Master Key shared across all projects in this workspace.
                </span>
              </label>
            </div>

            {/* Scope Transition Notice */}
            {isUnlockedViaWorkspace && targetScope === "project" && (
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-md text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-2 mt-1">
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span>Converting: This decouples this project from the workspace master key to an isolated key.</span>
              </div>
            )}

            {isDedicatedProjectKey && targetScope === "workspace" && (
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2 mt-1">
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                <span>Converting: This removes the dedicated project key and adopts the Workspace Master Key.</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="rotate-remember-device"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="rotate-remember-device" className="text-[11px] text-muted-foreground cursor-pointer select-none">
              Remember on this device across browser sessions
            </label>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isRotating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isRotating} className="bg-primary hover:bg-primary/90">
              {isRotating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress || "Rotating..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Rotate & Re-encrypt
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
