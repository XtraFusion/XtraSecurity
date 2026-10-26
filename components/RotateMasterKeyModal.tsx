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
  verifyVaultSentinel,
  createWorkspaceVaultSentinel,
  verifyWorkspaceVaultSentinel
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
  existingWorkspacePassphrase?: string;
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
  existingWorkspacePassphrase = "",
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
  const [wsKeyMode, setWsKeyMode] = useState<"existing" | "new">("existing");
  const [workspaceSentinel, setWorkspaceSentinel] = useState<string | null>(null);
  const [isCheckingWsSentinel, setIsCheckingWsSentinel] = useState<boolean>(false);
  const [hasAcknowledgedKeySaved, setHasAcknowledgedKeySaved] = useState<boolean>(false);

  const { selectedWorkspace, workspaceRole, user } = useGlobalContext();

  const isWorkspaceAdminOrOwner = React.useMemo(() => {
    const role = workspaceRole?.toLowerCase();
    if (role === "owner" || role === "admin") return true;
    if (selectedWorkspace?.createdBy && user?.id && String(selectedWorkspace.createdBy) === String(user.id)) return true;
    return false;
  }, [workspaceRole, selectedWorkspace, user]);

  // Fetch latest workspace sentinel on open to guarantee split-brain prevention
  useEffect(() => {
    if (isOpen) {
      setHasAcknowledgedKeySaved(false);
      const wsId = selectedWorkspace?.id || selectedWorkspace?.value;
      if (wsId) {
        if (selectedWorkspace.vaultSentinel) {
          setWorkspaceSentinel(selectedWorkspace.vaultSentinel);
        } else {
          setIsCheckingWsSentinel(true);
          axios.get(`/api/workspace?id=${wsId}`)
            .then((res) => {
              if (res.data?.vaultSentinel) {
                setWorkspaceSentinel(res.data.vaultSentinel);
              } else {
                setWorkspaceSentinel(null);
              }
            })
            .catch(() => setWorkspaceSentinel(null))
            .finally(() => setIsCheckingWsSentinel(false));
        }
      }
    }
  }, [isOpen, selectedWorkspace]);

  const hasWorkspaceSentinel = Boolean(workspaceSentinel);

  const sentinelValidationResult = React.useMemo(() => {
    if (mode !== "switch_scope" || targetScope !== "workspace" || !workspaceSentinel) return null;
    const clean = newPassphrase.trim();
    if (!clean) return null;
    const wsId = selectedWorkspace?.id || selectedWorkspace?.value;
    if (!wsId) return null;
    return verifyWorkspaceVaultSentinel(workspaceSentinel, wsId, clean);
  }, [mode, targetScope, workspaceSentinel, newPassphrase, selectedWorkspace]);

  // Sync initial state on modal open
  useEffect(() => {
    if (isOpen) {
      const isTargetingWs = initialScope === "workspace";
      const targetPass = (mode === "switch_scope" && isTargetingWs && existingWorkspacePassphrase)
        ? existingWorkspacePassphrase
        : (initialNewPassphrase || "");

      setNewPassphrase(targetPass);
      setConfirmPassphrase(targetPass);
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
  }, [isOpen, initialNewPassphrase, initialScope, currentVaultPassphrase, existingWorkspacePassphrase, mode]);

  // Generates 24-word phrase without auto-downloading immediately to avoid annoying file spam
  const handleGenerate = () => {
    if (mode === "switch_scope" && targetScope === "workspace" && hasWorkspaceSentinel) {
      return; // Strictly forbidden to generate a conflicting key over an established workspace sentinel
    }
    const result = generateRecoveryMnemonic();
    setNewPassphrase(result.mnemonic);
    setConfirmPassphrase(result.mnemonic);
    setGeneratedMnemonic(result.mnemonic);
    setHasAcknowledgedKeySaved(false);
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

    if (isScopeSwitch && scope === "workspace" && !isWorkspaceAdminOrOwner) {
      setError("Forbidden: Only Workspace Admins and Owners can switch a project to the Workspace Master Key.");
      return;
    }

    const wsId = selectedWorkspace?.id || selectedWorkspace?.value;

    // Cryptographic validation against workspace sentinel (preventing split-brain and typos)
    if (isScopeSwitch && scope === "workspace" && wsId && workspaceSentinel) {
      const matches = verifyWorkspaceVaultSentinel(workspaceSentinel, wsId, activeNew);
      if (!matches) {
        setError("Authentication tag mismatch. The entered passphrase does not match your workspace's established master key.");
        return;
      }
    }

    const isInitializing = !currentVaultPassphrase && !existingWorkspacePassphrase;

    if (!activeNew) {
      setError("Please fill in a new passphrase.");
      return;
    }

    if (!isInitializing && !activeCurrent) {
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
      const oldKey = activeCurrent ? deriveProjectKey(projectId, activeCurrent) : null;
      const newKey = deriveProjectKey(projectId, activeNew);

      // 1. Check existing sentinel if stored locally or in DB
      if (oldKey && typeof window !== "undefined") {
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

      let newWsSentinelPayload: any = null;
      if (isScopeSwitch && scope === "workspace" && wsId && !workspaceSentinel) {
        newWsSentinelPayload = createWorkspaceVaultSentinel(wsId, activeNew);
      }

      const updates: Array<{ id: string; value: string[]; history: any[] }> = [];

      // Filter out system sentinel secrets from user updates
      const userSecrets = rawSecrets.filter((s: any) => s.key !== "__xtra_vault_sentinel__");

      if (userSecrets.length > 0) {
        if (!oldKey) {
          throw new Error("Current master passphrase is required to decrypt existing secrets.");
        }
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
        workspaceSentinel: newWsSentinelPayload,
        targetScope: scope
      });

      if (newWsSentinelPayload && selectedWorkspace) {
        selectedWorkspace.vaultSentinel = JSON.stringify(newWsSentinelPayload);
        setWorkspaceSentinel(JSON.stringify(newWsSentinelPayload));
      }

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
  const isInitializing = !currentVaultPassphrase && !existingWorkspacePassphrase;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0">
        <DialogHeader className="space-y-1.5 min-w-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold min-w-0">
            {isScopeSwitch ? (
              isTargetingWorkspace ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="truncate">Switch to Workspace Master Key</span>
                </>
              ) : (
                <>
                  <Key className="h-5 w-5 text-purple-500 shrink-0" />
                  <span className="truncate">Switch to Dedicated Project Key</span>
                </>
              )
            ) : (
              <>
                <RefreshCw className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Rotate Master Key</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
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
          <Alert variant="destructive" className="py-2 px-3 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs ml-2 break-words">{error}</AlertDescription>
          </Alert>
        )}

        {/* Current State / Transition Banner */}
        {isScopeSwitch ? (
          <div className="p-3 bg-muted/50 rounded-lg border border-border/70 text-xs space-y-1.5 w-full min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1.5 font-medium">
              <span className="text-muted-foreground shrink-0">Scope Conversion:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-foreground flex-wrap">
                <span>{isDedicatedProjectKey ? "Project Key" : "Workspace Master"}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{isTargetingWorkspace ? "Workspace Master" : "Dedicated Project Key"}</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isTargetingWorkspace
                ? "This project will adopt the shared workspace master key. Enter your current project passphrase to re-encrypt."
                : "This project will be decoupled from the workspace key. Generate or enter an isolated project key below."}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/40 border border-border/60 rounded-lg text-xs w-full min-w-0">
            {isDedicatedProjectKey ? (
              <>
                <Key className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-muted-foreground shrink-0">Current Scope:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400 truncate">Dedicated Project Key (Isolated)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-muted-foreground shrink-0">Current Scope:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">Workspace Master Key</span>
              </>
            )}
          </div>
        )}

        {/* Workspace Key Adoption Notice & Admin Access Enforcement */}
        {isScopeSwitch && isTargetingWorkspace && (
          !isWorkspaceAdminOrOwner ? (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-destructive text-[11px]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Workspace Admin or Owner Access Required</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Only Workspace Admins and Owners have permission to configure or switch a project to the Workspace Master Key. You currently hold the role <strong>'{workspaceRole || "member"}'</strong> in this workspace.
              </p>
            </div>
          ) : hasWorkspaceSentinel ? (
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Workspace Master Key Established</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Other projects in this workspace are already encrypted under the Workspace Master Key. Please paste or enter the matching 24-word recovery passphrase to join this project to the shared vault.
              </p>
            </div>
          ) : (
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs space-y-1.5 w-full min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400 text-[11px]">
                <Zap className="h-4 w-4 shrink-0" />
                <span>First-Time Workspace Master Key Setup</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This workspace does not have an active master key yet. You are initializing the master key that all workspace projects will share.
              </p>
            </div>
          )
        )}

        <form onSubmit={handleRotateSubmit} className="space-y-3.5 py-1 w-full min-w-0 overflow-hidden">
          {/* Current Passphrase Field - Only required if vault already initialized */}
          {!isInitializing && (
            <div className="space-y-1.5 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1 min-w-0">
                <Label className="text-xs font-semibold shrink-0">
                  {isScopeSwitch && !isDedicatedProjectKey ? "Current Workspace Passphrase" : "Current Master Passphrase"}
                </Label>
                {currentVaultPassphrase && currentPassphrase !== currentVaultPassphrase && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPassphrase(currentVaultPassphrase)}
                    className="h-5 text-[11px] px-1.5 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                  >
                    Use Active Session Key
                  </Button>
                )}
              </div>
              <div className="relative w-full min-w-0">
                <Input
                  type={showCurrentPass ? "text" : "password"}
                  placeholder="Enter current passphrase to decrypt..."
                  value={currentPassphrase}
                  onChange={(e) => setCurrentPassphrase(e.target.value)}
                  required={!isInitializing}
                  className="font-mono text-xs pr-9 w-full min-w-0"
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
          )}

          {/* New Passphrase Field */}
          <div className="space-y-1.5 w-full min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 min-w-0">
              <Label className="text-xs font-semibold shrink-0">
                {isScopeSwitch && isTargetingWorkspace
                  ? hasWorkspaceSentinel
                    ? "Existing Workspace Master Passphrase"
                    : "New Workspace Master Passphrase"
                  : "New Master Passphrase"}
              </Label>
              {/* If workspace sentinel already exists, DO NOT allow Generate Key to prevent Split-Brain! */}
              {(!isScopeSwitch || !isTargetingWorkspace || !hasWorkspaceSentinel) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isScopeSwitch && isTargetingWorkspace && !isWorkspaceAdminOrOwner}
                  className="h-5 text-xs px-2 text-primary font-medium hover:text-primary hover:bg-primary/10 shrink-0"
                  title="Generate a secure 24-word recovery phrase"
                >
                  <Key className="h-3 w-3 mr-1" /> Generate Key
                </Button>
              )}
            </div>
            <div className="relative w-full min-w-0">
              <Input
                type={showNewPass ? "text" : "password"}
                placeholder={
                  isScopeSwitch && isTargetingWorkspace
                    ? hasWorkspaceSentinel
                      ? "Paste team's 24-word workspace master key..."
                      : "Enter or click 'Generate Key'..."
                    : "Enter or click 'Generate Key'..."
                }
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                required
                disabled={isScopeSwitch && isTargetingWorkspace && !isWorkspaceAdminOrOwner}
                className={`font-mono text-xs pr-9 w-full min-w-0 ${
                  sentinelValidationResult === false
                    ? "border-destructive focus-visible:ring-destructive"
                    : sentinelValidationResult === true
                    ? "border-emerald-500 focus-visible:ring-emerald-500"
                    : ""
                }`}
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

            {/* Real-time Workspace Sentinel Verification Feedback */}
            {isScopeSwitch && isTargetingWorkspace && hasWorkspaceSentinel && sentinelValidationResult !== null && (
              <div className="pt-0.5">
                {sentinelValidationResult ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Cryptographically verified against Workspace Master Sentinel.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-destructive font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Authentication tag mismatch. This key does not match your workspace master key.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generated phrase preview (if user generated one) */}
          {generatedMnemonic && newPassphrase === generatedMnemonic && (
            <div className="p-2.5 bg-muted/60 border border-border/80 rounded-lg space-y-2 text-xs w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5 text-[11px] min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Key Generated (Recovery Kit will download on rotate)</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
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
              <p className="font-mono text-[11px] text-muted-foreground break-all bg-background/90 p-2 rounded border border-border/40 select-all max-w-full overflow-hidden">
                {newPassphrase}
              </p>
            </div>
          )}

          {/* Mandatory Recovery Key Backup Acknowledgment */}
          {(generatedMnemonic || (isScopeSwitch && isTargetingWorkspace && !hasWorkspaceSentinel)) && (
            <div className="flex items-start space-x-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
              <input
                type="checkbox"
                id="ack-saved-ws-key"
                checked={hasAcknowledgedKeySaved}
                onChange={(e) => setHasAcknowledgedKeySaved(e.target.checked)}
                className="h-3.5 w-3.5 mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
              />
              <label htmlFor="ack-saved-ws-key" className="text-[11px] text-amber-800 dark:text-amber-200 cursor-pointer select-none leading-relaxed">
                <strong>Mandatory Confirmation:</strong> I have copied and safely saved this recovery passphrase. I understand that lost master passphrases cannot be recovered by administrators or support.
              </label>
            </div>
          )}

          {/* Confirm Passphrase Field */}
          <div className="space-y-1.5 w-full min-w-0">
            <Label className="text-xs font-semibold">Confirm Passphrase</Label>
            <div className="relative w-full min-w-0">
              <Input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm passphrase..."
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                required
                className="font-mono text-xs pr-9 w-full min-w-0"
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

          <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2 sm:gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isRotating}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isRotating ||
                (isScopeSwitch && isTargetingWorkspace && !isWorkspaceAdminOrOwner) ||
                (isScopeSwitch && isTargetingWorkspace && hasWorkspaceSentinel && sentinelValidationResult === false) ||
                ((generatedMnemonic || (isScopeSwitch && isTargetingWorkspace && !hasWorkspaceSentinel)) && !hasAcknowledgedKeySaved)
              }
              className="bg-primary hover:bg-primary/90"
              title={
                isScopeSwitch && isTargetingWorkspace && !isWorkspaceAdminOrOwner
                  ? "Only Workspace Admins and Owners can switch to Workspace Master Key"
                  : isScopeSwitch && isTargetingWorkspace && hasWorkspaceSentinel && sentinelValidationResult === false
                  ? "Passphrase does not match workspace master key sentinel"
                  : (generatedMnemonic || (isScopeSwitch && isTargetingWorkspace && !hasWorkspaceSentinel)) && !hasAcknowledgedKeySaved
                  ? "Please confirm that you have safely saved your recovery passphrase"
                  : undefined
              }
            >
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
