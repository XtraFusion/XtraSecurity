"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/axios";

interface OtpVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mfaEnabled: boolean;
}

export function OtpVerificationModal({ isOpen, onClose, onSuccess, mfaEnabled }: OtpVerificationModalProps) {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setOtp("");
            setError("");
        }
    }, [isOpen]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await apiClient.post("/api/user/security/verify-otp", {
                otp,
                mfaEnabled
            });

            if (res.data.success) {
                toast({
                    title: "Success",
                    description: res.data.message,
                });
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] border-border/40 bg-card/95 backdrop-blur-xl">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-teal-500" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">Verify Identity</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        We've sent a 6-digit verification code to your registered email address. 
                        Please enter it below to confirm this change.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp" className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center block">
                            Verification Code
                        </Label>
                        <Input
                            id="otp"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                            className="text-center text-2xl font-mono tracking-[0.5em] h-14 bg-muted/20 border-border/40 focus-visible:ring-teal-500/30"
                            maxLength={6}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 text-xs font-medium bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-lg border-border/40"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleVerify}
                        disabled={isLoading || otp.length !== 6}
                        className="flex-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-black font-bold shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
