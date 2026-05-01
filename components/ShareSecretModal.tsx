"use client";

import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Check, 
  Copy, 
  Link as LinkIcon, 
  Loader2, 
  X, 
  Clock, 
  Eye, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import axios from "axios";

interface ShareSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  secret: { id: string, key: string } | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ShareSecretModal({ isOpen, onClose, secret, onSuccess, onError }: ShareSecretModalProps) {
  const [shareExpiry, setShareExpiry] = useState("24");
  const [shareMaxViews, setShareMaxViews] = useState<string>("1");
  const [shareLabel, setShareLabel] = useState("");
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareResult, setShareResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShareResult(null);
      setShareExpiry("24");
      setShareMaxViews("1");
      setShareLabel("");
      setShareCopied(false);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const createShareLink = async () => {
    if (!secret) return;
    setIsCreatingShare(true);
    try {
      const response = await axios.post("/api/secret/share", {
        secretId: secret.id,
        expiresInHours: parseInt(shareExpiry),
        maxViews: shareMaxViews === "unlimited" ? null : parseInt(shareMaxViews),
        label: shareLabel || null,
      });
      setShareResult({ url: response.data.shareUrl, expiresAt: response.data.expiresAt });
      onSuccess?.("Share link generated!");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to create share link";
      onError?.(errorMsg);
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareResult) return;
    navigator.clipboard?.writeText(shareResult.url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    onSuccess?.("Link copied to clipboard!");
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Share Secret</h3>
                <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                  {secret?.key}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="p-6 space-y-6">
            {!shareResult ? (
              <div className="space-y-5">
                {/* Expiry Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Expires After
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      ["1h", "1"],
                      ["24h", "24"],
                      ["7d", "168"],
                      ["30d", "720"]
                    ].map(([label, val]) => (
                      <button
                        key={val}
                        onClick={() => setShareExpiry(val)}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                          shareExpiry === val 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                            : "border-border hover:bg-muted bg-card/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Views Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Max Views
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      ["1x", "1"],
                      ["5x", "5"],
                      ["10x", "10"],
                      ["∞", "unlimited"]
                    ].map(([label, val]) => (
                      <button
                        key={val}
                        onClick={() => setShareMaxViews(val)}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                          shareMaxViews === val 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                            : "border-border hover:bg-muted bg-card/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
                  <Input
                    placeholder="e.g. for new dev onboarding"
                    value={shareLabel}
                    onChange={e => setShareLabel(e.target.value)}
                    className="bg-card/50 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground pl-1">
                    This note will be visible to anyone with the link.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button 
                    onClick={createShareLink} 
                    disabled={isCreatingShare}
                    className="rounded-xl px-6 h-11"
                  >
                    {isCreatingShare ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LinkIcon className="mr-2 h-4 w-4" />
                    )}
                    Generate Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-emerald-600">Share Link Created!</h4>
                  <p className="text-sm text-muted-foreground">The link is now active and ready to share.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Secure URL</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/50 border rounded-xl px-4 py-3 font-mono text-xs break-all min-h-[44px] flex items-center">
                      {shareResult.url}
                    </div>
                    <Button
                      size="icon"
                      variant={shareCopied ? "default" : "outline"}
                      className="h-11 w-11 rounded-xl shrink-0"
                      onClick={handleCopyLink}
                    >
                      {shareCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> Expires
                    </span>
                    <span className="font-semibold">{new Date(shareResult.expiresAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> View Limit
                    </span>
                    <span className="font-semibold">{shareMaxViews === "unlimited" ? "Unlimited" : `${shareMaxViews} view(s)`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 leading-relaxed">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  This link will only be visible according to the limits above. Make sure to copy it now!
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setShareResult(null)}>Create Another</Button>
                  <Button className="rounded-xl px-8" onClick={onClose}>Done</Button>
                </div>
              </div>
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
