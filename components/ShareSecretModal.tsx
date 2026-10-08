"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Share2, Loader2, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ShareSecretModalProps {
    isOpen: boolean;
    onClose: () => void;
    secret: any;
}

export function ShareSecretModal({ isOpen, onClose, secret }: ShareSecretModalProps) {
    const [expiresInHours, setExpiresInHours] = useState("24");
    const [maxViews, setMaxViews] = useState("");
    const [label, setLabel] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    const handleShare = async () => {
        if (!secret || !secret.value) {
            toast.error("Secret value is not available. Please unlock the vault first.");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Generate an ephemeral symmetric key
            const sharedKeyBuffer = crypto.getRandomValues(new Uint8Array(32));
            const sharedKeyHex = Array.from(sharedKeyBuffer).map(b => b.toString(16).padStart(2, "0")).join("");

            const key = await crypto.subtle.importKey(
                "raw",
                sharedKeyBuffer,
                { name: "AES-GCM" },
                false,
                ["encrypt"]
            );

            // 2. Encrypt the plaintext secret
            const ivBuffer = crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder();
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: ivBuffer },
                key,
                enc.encode(secret.value)
            );

            const encryptedPayloadBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
            const ivBase64 = btoa(String.fromCharCode(...ivBuffer));

            // 3. Send encrypted payload to server
            const res = await fetch("/api/secret/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secretId: secret.id,
                    expiresInHours: parseInt(expiresInHours, 10),
                    maxViews: maxViews ? parseInt(maxViews, 10) : null,
                    label,
                    encryptedPayload: encryptedPayloadBase64,
                    iv: ivBase64,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create share link");
            }

            const data = await res.json();
            
            // 4. Construct URL with the decryption key in the hash fragment (Zero-Knowledge)
            const finalUrl = `${data.shareUrl}#key=${sharedKeyHex}`;
            setShareUrl(finalUrl);
            toast.success("Share link created successfully!");

        } catch (error: any) {
            toast.error(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Copied to clipboard!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setShareUrl("");
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[500px] border-slate-800 bg-[#0B1121] text-slate-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Share2 className="h-5 w-5 text-blue-500" />
                        Share Secret Securely
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Create a temporary, end-to-end encrypted link for <span className="text-slate-200 font-mono text-xs">{secret?.key}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300">
                        <p className="font-medium text-blue-400 mb-1">Zero-Knowledge E2EE</p>
                        <p>The secret is encrypted locally in your browser. The server never sees the plaintext or the decryption key.</p>
                    </div>
                </div>

                {!shareUrl ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Expiration Time</Label>
                            <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                                <SelectTrigger className="bg-slate-900 border-slate-800">
                                    <SelectValue placeholder="Select expiration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Hour</SelectItem>
                                    <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                                    <SelectItem value="168">168 Hours (7 Days)</SelectItem>
                                    <SelectItem value="720">720 Hours (30 Days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Max Views (Optional)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 1"
                                value={maxViews}
                                onChange={(e) => setMaxViews(e.target.value)}
                                min="1"
                                className="bg-slate-900 border-slate-800 text-slate-200"
                            />
                            <p className="text-xs text-slate-500">Leave blank for unlimited views until expiration.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Label / Note (Optional)</Label>
                            <Input
                                placeholder="e.g. For the new developer"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-slate-200"
                            />
                        </div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-4 space-y-4"
                    >
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center space-y-2">
                            <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <h3 className="text-emerald-400 font-medium">Link Created Successfully!</h3>
                            <p className="text-xs text-emerald-500/80">
                                This link contains the decryption key in the URL fragment. Do not share it over insecure channels.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input 
                                value={shareUrl} 
                                readOnly 
                                className="bg-slate-900 border-slate-800 text-emerald-400 font-mono text-xs"
                            />
                            <Button onClick={copyToClipboard} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                    </motion.div>
                )}

                <DialogFooter className="mt-6">
                    {!shareUrl ? (
                        <>
                            <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-white">
                                Cancel
                            </Button>
                            <Button onClick={handleShare} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Secure Link
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => { setShareUrl(""); onClose(); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
