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
  onSuccess: (newPassphrase: string) => void;
}

export function RotateMasterKeyModal({ isOpen, onClose, projectId, onSuccess }: RotateMasterKeyModalProps) {
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const { selectedWorkspace } = useGlobalContext();

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
      
      // Update local storage for project (and workspace if applicable)
      sessionStorage.setItem(`xtra_vault_${projectId}`, newPassphrase);
      
      onSuccess(newPassphrase);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to rotate master key.");
    } finally {
      setIsRotating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Rotate Master Passphrase
          </DialogTitle>
          <DialogDescription>
            This action will decrypt all secrets in this project and re-encrypt them with your new master passphrase.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 px-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRotate} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Master Passphrase</Label>
            <Input
              type="password"
              placeholder="Enter current passphrase"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>New Master Passphrase</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleGenerate} className="h-6 text-xs px-2 text-primary">
                Generate Secure Phrase
              </Button>
            </div>
            <Input
              type="password"
              placeholder="Enter new passphrase"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Confirm New Passphrase</Label>
            <Input
              type="password"
              placeholder="Confirm new passphrase"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isRotating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRotating}>
              {isRotating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress || "Rotating..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Rotate Passphrase
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
