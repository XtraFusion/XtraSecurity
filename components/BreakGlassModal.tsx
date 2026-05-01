"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  Terminal, 
  Lock, 
  ShieldCheck,
  ChevronRight,
  Info,
  Loader2,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface BreakGlassModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onActivated?: () => void;
}

export function BreakGlassModal({ open, onClose, projectId, projectName, onActivated }: BreakGlassModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  const reset = () => {
    setStep(1);
    setReason("");
    setTicketId("");
    setError(null);
    setSessionData(null);
  };

  useEffect(() => {
    if (!open) {
      // Delay reset slightly to allow closing animation to finish
      const timer = setTimeout(reset, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleActivate = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for activation.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/access/break-glass", {
        projectId,
        reason,
        ticketId
      });
      
      setSessionData(response.data);
      setStep(3);
      if (onActivated) onActivated();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to activate Break Glass mode.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 gap-0 border-red-500/20">
        <div className="relative overflow-hidden">
          {/* Accent Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Break Glass Access
                    <Badge variant="outline" className="text-[10px] uppercase border-red-500/50 text-red-500">Emergency</Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Temporary 15-minute root access for {projectName}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold">CAUTION: This action is heavily audited</AlertTitle>
                    <AlertDescription className="text-xs mt-1 leading-relaxed">
                      Activating Break Glass mode grants immediate administrative access to all secrets in this project. 
                      All workspace admins will be notified, and all session activity will be logged.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="p-4 rounded-xl border bg-card/50 flex flex-col gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold">15 Minutes</span>
                      <span className="text-xs text-muted-foreground">Session Duration</span>
                    </div>
                    <div className="p-4 rounded-xl border bg-card/50 flex flex-col gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold">Full Access</span>
                      <span className="text-xs text-muted-foreground">Root Permissions</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Info className="h-3.5 w-3.5" />
                      WHAT HAPPENS NEXT?
                    </div>
                    <ul className="text-[11px] space-y-1 mt-1 list-disc pl-4 opacity-80">
                      <li>Your current permissions are temporarily elevated to Admin.</li>
                      <li>A "Break Glass" alert is triggered in the audit log.</li>
                      <li>You will receive a temporary token for CLI/SDK usage.</li>
                    </ul>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
                    Proceed to Verification
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Activation Reason <span className="text-red-500">*</span></Label>
                    <Textarea 
                      placeholder="Explain why emergency access is required (e.g., Production outage, database recovery...)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[100px] resize-none focus-visible:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Ticket ID / Reference (Optional)</Label>
                    <Input 
                      placeholder="e.g. INC-452 or JIRA-8892"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      className="focus-visible:ring-red-500/30"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 font-medium animate-pulse">{error}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                      Back
                    </Button>
                    <Button 
                      onClick={handleActivate} 
                      disabled={isLoading || !reason.trim()}
                      className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Activate Root Access
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-4"
                >
                  <div className="relative inline-flex mb-1">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="relative p-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Lock className="h-8 w-8" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold">Access Granted</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto leading-relaxed">
                      Your permissions have been elevated. You have 15 minutes of administrative access.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 text-left border space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">SESSION DETAILS</span>
                      <Badge variant="secondary" className="text-[10px] animate-pulse bg-emerald-500/10 text-emerald-600 border-emerald-500/20">LIVE</Badge>
                    </div>
                    <div className="space-y-1.5 font-mono">
                      <p className="text-[11px] flex justify-between">
                        <span className="text-muted-foreground">Session ID:</span>
                        <span className="truncate ml-4">{sessionData?.session?.id}</span>
                      </p>
                      <p className="text-[11px] flex justify-between">
                        <span className="text-muted-foreground">Expires In:</span>
                        <span className="text-red-500 font-bold">14:59</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">CLI Activation</p>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative bg-black rounded-lg p-3 text-emerald-400 text-xs font-mono text-left border border-white/10">
                        xtra access break-glass link --id {sessionData?.session?.id}
                      </div>
                    </div>
                  </div>

                  <Button onClick={onClose} className="w-full h-10 bg-foreground text-background hover:opacity-90 transition-opacity">
                    Continue to Dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
