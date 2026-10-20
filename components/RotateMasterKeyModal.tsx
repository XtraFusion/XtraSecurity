"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, RefreshCw, AlertCircle, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { deriveProjectKey, decryptSecretValue, encryptSecretValueWebCrypto, generateRecoveryMnemonic, validateProjectPassphrase } from "@/lib/crypto/e2ee";
import { useGlobalContext } from "@/hooks/useUser";

interface RotateMasterKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  initialNewPassphrase?: string;
  onSuccess: (newPassphrase: string) => void;
}

export function RotateMasterKeyModal({
  isOpen,
  onClose,
  projectId,
  projectName = "this project",
  initialNewPassphrase = "",
  onSuccess
}: RotateMasterKeyModalProps) {
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState(initialNewPassphrase);
  const [confirmPassphrase, setConfirmPassphrase] = useState(initialNewPassphrase);
  const [targetScope, setTargetScope] = useState<"project" | "workspace">("project");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const { selectedWorkspace } = useGlobalContext();

  // Sync initial phrase if passed
  React.useEffect(() => {
    if (initialNewPassphrase) {
      setNewPassphrase(initialNewPassphrase);
      setConfirmPassphrase(initialNewPassphrase);
    }
  }, [initialNewPassphrase]);

  const handleGenerate = () => {
    const result = generateRecoveryMnemonic();
    setNewPassphrase(result.mnemonic);
    setConfirmPassphrase(result.mnemonic);
  };

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProgress(null);

    if (!currentPassphrase || !newPassphrase || !confirmPassphrase) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setError("New passphrases do not match.");
      return;
    }

    setIsRotating(true);
    setProgress("Deriving cryptographic keys...");

    try {
      const oldKey = deriveProjectKey(projectId, currentPassphrase);
      const newKey = deriveProjectKey(projectId, newPassphrase);

      setProgress("Fetching project secrets...");
      const res = await axios.get(`/api/secret?projectId=${projectId}`);
      const rawSecrets = Array.isArray(res.data) ? res.data : (res.data.data || []);

      if (rawSecrets.length === 0) {
        setProgress("No secrets found. Updating master key...");
        persistRotatedKey(newPassphrase);
        onSuccess(newPassphrase);
        onClose();
        setIsRotating(false);
        return;
      }

      setProgress(`Re-encrypting ${rawSecrets.length} secrets and their history...`);
      
      const updates = [];

      for (const secret of rawSecrets) {
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
              plainValue = val; // Might be server encrypted or plain
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
               } catch (e) {
                 // Skip un-decryptable history items silently rather than failing entire rotation
                 hPlain = hVal;
               }
            } else {
               hPlain = hVal;
            }

            let newHStr = hPlain;
            if (hPlain && hPlain.startsWith && !hPlain.startsWith("{") && !hPlain.startsWith("[")) {
               const newHEnc = await encryptSecretValueWebCrypto(hPlain, newKey);
               newHStr = JSON.stringify(newHEnc);
            } else if (hPlain && !hPlain.startsWith) {
               // Fallback if not string
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

      setProgress("Saving rotated secrets to the cloud...");
      await axios.post("/api/secret/rotate", {
        projectId,
        updates
      });

      setProgress("Rotation successful!");
      
      persistRotatedKey(newPassphrase);
      
      onSuccess(newPassphrase);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to rotate master key.");
    } finally {
      setIsRotating(false);
    }
  };

  const persistRotatedKey = (pass: string) => {
    if (typeof window === "undefined") return;

    // Save project-specific key
    sessionStorage.setItem(`xtra_vault_${projectId}`, pass);
    if (rememberDevice) {
      localStorage.setItem(`xtra_vault_${projectId}`, pass);
    } else {
      localStorage.removeItem(`xtra_vault_${projectId}`);
    }

    // If workspace scope chosen, also apply as workspace master key
    if (targetScope === "workspace") {
      const wsId = selectedWorkspace?.id || selectedWorkspace?.value;
      if (wsId) {
        sessionStorage.setItem(`xtra_ws_vault_${wsId}`, pass);
        if (rememberDevice) {
          localStorage.setItem(`xtra_ws_vault_${wsId}`, pass);
          localStorage.setItem("xtra_global_vault_passphrase", pass);
        } else {
          localStorage.removeItem(`xtra_ws_vault_${wsId}`);
        }
      }
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { workspaceId: wsId, scope: "workspace" } }));
    } else {
      window.dispatchEvent(new CustomEvent("xtra-vault-change", { detail: { projectId, scope: "project" } }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Rotate Master Passphrase
          </DialogTitle>
          <DialogDescription>
            This action will decrypt all secrets in {projectName} and re-encrypt them with your new master passphrase.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRotate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Current Master Passphrase</Label>
            <Input
              type="password"
              placeholder="Enter current passphrase to decrypt existing secrets..."
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              required
              className="font-mono text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">New Master Passphrase or Mnemonic</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleGenerate} className="h-6 text-xs px-2 text-primary">
                <Key className="h-3 w-3 mr-1" /> Generate 24-Word Phrase
              </Button>
            </div>
            <Input
              type="password"
              placeholder="Enter or generate new passphrase..."
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              required
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
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

          {/* Key Scope Selection */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold">Passphrase Scope</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  targetScope === "project"
                    ? "border-primary bg-primary/5 text-foreground"
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
                  <span className="font-semibold text-foreground">Project Only (Isolated)</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 ml-5">
                  Re-encrypts this project. Other projects in the workspace remain unaffected.
                </span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  targetScope === "workspace"
                    ? "border-primary bg-primary/5 text-foreground"
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
                  <span className="font-semibold text-foreground">Workspace Master</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 ml-5">
                  Applies this key as the Workspace Master Key for all projects in this workspace.
                </span>
              </label>
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

          <DialogFooter className="pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isRotating}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isRotating}>
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
