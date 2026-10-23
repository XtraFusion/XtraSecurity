"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, RefreshCw, AlertCircle, Check, Loader2, Download, Copy, CheckCircle2, ShieldCheck, Zap, Eye, EyeOff, ArrowRight } from "lucide-react";
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

export interface RotateMasterKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  mode?: "rotate" | "switch_scope";
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
  mode = "rotate",
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
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);

  const { selectedWorkspace } = useGlobalContext();

  // Sync initial state on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialNewPassphrase) {
        setNewPassphrase(initialNewPassphrase);
        setConfirmPassphrase(initialNewPassphrase);
      } else {
        setNewPassphrase("");
        setConfirmPassphrase("");
      }
      if (initialScope) {
        setTargetScope(initialScope);
      }
      if (currentVaultPassphrase) {
        setCurrentPassphrase(currentVaultPassphrase);
      } else {
        setCurrentPassphrase("");
      }
      setError(null);
      setProgress(null);
      setGeneratedMnemonic(null);
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    }
  }, [isOpen, initialNewPassphrase, initialScope, currentVaultPassphrase]);

  // Generates 24-word phrase without auto-downloading immediately to avoid annoying file spam
  const handleGenerate = () => {
    const result = generateRecoveryMnemonic();
    setNewPassphrase(result.mnemonic);
    setConfirmPassphrase(result.mnemonic);
    setGeneratedMnemonic(result.mnemonic);
    setError(null);
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

    if (activeNew !== confirmPassphrase.trim()) {
      setError("The confirmation passphrase does not match.");
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

      // Download recovery kit ONCE upon successful completion
      downloadRecoveryKit({
        passphrase: activeNew,
        projectName,
        projectId,
        workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
        scope
      });

      // Save sentinel to storage
      if (typeof window !== "undefined") {
        localStorage.setItem(`xtra_vault_sentinel_${projectId}`, JSON.stringify(newSentinelPayload));
      }

      persistRotatedKey(activeNew, scope);

      onSuccess(activeNew, scope);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to process encryption key rotation.");
    } finally {
      setIsRotating(false);
    }
  };

  const handleRotateSubmit = async (e: React.FormEvent) => {
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

  const isScopeSwitch = mode === "switch_scope";
  const isTargetingWorkspace = targetScope === "workspace";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {isScopeSwitch ? (
              isTargetingWorkspace ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                  Switch to Workspace Master Key
                </>
              ) : (
                <>
                  <Key className="h-5 w-5 text-purple-500 shrink-0" />
                  Switch to Dedicated Project Key
                </>
              )
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-primary shrink-0" />
                Rotate Master Key
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isScopeSwitch ? (
              isTargetingWorkspace ? (
                `Re-encrypt secrets in ${projectName} under the Workspace Master Key to share access with workspace members.`
              ) : (
                `Decouple ${projectName} with an isolated key. Only users with this dedicated key will be able to decrypt.`
              )
            ) : (
              `Re-encrypt all secrets in ${projectName} with a brand new master passphrase.`
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Current State / Transition Banner */}
        {isScopeSwitch ? (
          <div className="p-3 bg-muted/50 rounded-lg border border-border/70 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-muted-foreground">Scope Conversion:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                {isDedicatedProjectKey ? "Project Key" : "Workspace Master"}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                {isTargetingWorkspace ? "Workspace Master" : "Dedicated Project Key"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isTargetingWorkspace
                ? "This project will adopt the shared workspace key. Enter your current project passphrase and target workspace key below."
                : "This project will be decoupled from the workspace key. Generate or enter an isolated project key below."}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-muted/40 border border-border/60 rounded-lg text-xs">
            {isDedicatedProjectKey ? (
              <>
                <Key className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-muted-foreground">Current Scope:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">Dedicated Project Key (Isolated)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">Current Scope:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Workspace Master Key</span>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleRotateSubmit} className="space-y-3.5 py-1">
          {/* Current Passphrase Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                {isScopeSwitch && !isDedicatedProjectKey ? "Current Workspace Passphrase" : "Current Master Passphrase"}
              </Label>
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
            <div className="relative">
              <Input
                type={showCurrentPass ? "text" : "password"}
                placeholder="Enter current passphrase to decrypt..."
                value={currentPassphrase}
                onChange={(e) => setCurrentPassphrase(e.target.value)}
                required
                className="font-mono text-xs pr-9"
                autoFocus={!currentVaultPassphrase}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showCurrentPass ? "Hide passphrase" : "Show passphrase"}
              >
                {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* New Passphrase Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                {isScopeSwitch && isTargetingWorkspace ? "Target Workspace Master Passphrase" : "New Master Passphrase"}
              </Label>
              {(!isScopeSwitch || !isTargetingWorkspace) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="h-5 text-xs px-2 text-primary font-medium hover:text-primary hover:bg-primary/10"
                  title="Generate a secure 24-word recovery phrase"
                >
                  <Key className="h-3 w-3 mr-1" /> Generate Key
                </Button>
              )}
            </div>
            <div className="relative">
              <Input
                type={showNewPass ? "text" : "password"}
                placeholder={isScopeSwitch && isTargetingWorkspace ? "Enter workspace master key..." : "Enter or click 'Generate Key'..."}
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                required
                className="font-mono text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showNewPass ? "Hide passphrase" : "Show passphrase"}
              >
                {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Generated phrase preview (if user generated one) */}
          {generatedMnemonic && newPassphrase === generatedMnemonic && (
            <div className="p-2.5 bg-muted/60 border border-border/80 rounded-lg space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Key Generated (Recovery Kit will download on rotate)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-5 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
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
                    className="h-5 text-[11px] px-1.5 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      downloadRecoveryKit({
                        passphrase: newPassphrase,
                        projectName,
                        projectId,
                        workspaceName: selectedWorkspace?.name || selectedWorkspace?.value || "Workspace",
                        scope: targetScope
                      });
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                </div>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground break-all bg-background/90 p-1.5 rounded border border-border/40 select-all">
                {newPassphrase}
              </p>
            </div>
          )}

          {/* Confirm Passphrase Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Confirm Passphrase</Label>
            <div className="relative">
              <Input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm passphrase..."
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                required
                className="font-mono text-xs pr-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPass ? "Hide passphrase" : "Show passphrase"}
              >
                {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
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

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isRotating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isRotating} className="bg-primary hover:bg-primary/90">
              {isRotating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  {progress || "Re-encrypting..."}
                </>
              ) : isScopeSwitch ? (
                isTargetingWorkspace ? (
                  <>
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Convert to Workspace Key
                  </>
                ) : (
                  <>
                    <Key className="mr-1.5 h-3.5 w-3.5" />
                    Convert to Dedicated Key
                  </>
                )
              ) : (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
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
