"use client";

import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight,
  Settings2,
  Database,
  Globe,
  Loader2,
  X
} from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useIntegrations } from "@/hooks/useIntegrations";
import { AWS_REGIONS, INTEGRATION_METADATA } from "@/lib/integrations/config";
import { SyncProvider } from "@/lib/integrations/types";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface SyncTarget {
  id: string;
  provider: "aws" | "vercel";
  targetId: string;
  status: "synced" | "failed" | "pending";
  lastSync?: string;
  error?: string;
}

interface SyncTargetsModalProps {
  open: boolean;
  onClose: () => void;
  secretId: string;
  secretKey: string;
}

export function SyncTargetsModal({ open, onClose, secretId, secretKey }: SyncTargetsModalProps) {
  const { statuses, repos, loading: integrationsLoading, refresh: refreshIntegrations } = useIntegrations();
  const [targets, setTargets] = useState<SyncTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTarget, setNewTarget] = useState({
    provider: "aws" as SyncProvider,
    targetId: "", // Legacy single selection
  });
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const providerRepos = repos[newTarget.provider] || [];
  const isConnected = statuses[newTarget.provider]?.connected;

  const filteredItems = newTarget.provider === "aws" 
    ? AWS_REGIONS.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
    : providerRepos.filter(r => (r.fullName || r.name).toLowerCase().includes(searchQuery.toLowerCase()));

  const loadTargets = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // const res = await axios.get(`/api/secret/sync?secretId=${secretId}`);
      // setTargets(res.data);
      
      // Mocking for now
      setTimeout(() => {
        setTargets([]);
        setIsLoading(false);
      }, 600);
    } catch (err) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTargets();
      refreshIntegrations();
    }
  }, [open, secretId, refreshIntegrations]);

  const handleAddTarget = async () => {
    const idsToAdd = selectedTargetIds.size > 0 
      ? Array.from(selectedTargetIds) 
      : (newTarget.targetId ? [newTarget.targetId] : []);

    if (idsToAdd.length === 0) return;

    setIsAdding(true);
    try {
      // Mocking successful add for all selected
      const newTargets: SyncTarget[] = idsToAdd.map(id => ({
        id: Math.random().toString(36).substr(2, 9),
        provider: newTarget.provider,
        targetId: id,
        status: "pending",
        lastSync: new Date().toISOString()
      }));
      
      setTargets([...targets, ...newTargets]);
      setSelectedTargetIds(new Set());
      setNewTarget(prev => ({ ...prev, targetId: "" }));
      setIsAdding(false);
    } catch (err) {
      setIsAdding(false);
    }
  };

  const toggleTarget = (id: string) => {
    const next = new Set(selectedTargetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTargetIds(next);
  };

  const removeTarget = async (id: string) => {
    try {
      // await axios.delete(`/api/secret/sync?id=${id}`);
      setTargets(targets.filter(t => t.id !== id));
    } catch (err) {}
  };

  if (!open) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Multi-Cloud Sync</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep <code className="text-primary font-bold">{secretKey}</code> in sync across external platforms.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted/80">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
          {/* Add New Target Form */}
          <div className="space-y-4 p-4 rounded-xl border bg-card/50 shadow-sm">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Sync Target
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Provider</Label>
                <Select 
                  value={newTarget.provider} 
                  onValueChange={(val: any) => setNewTarget({...newTarget, provider: val})}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["aws", "vercel", "github", "gitlab", "netlify", "railway", "fly", "doppler"].map((p) => {
                      const meta = INTEGRATION_METADATA[p as SyncProvider];
                      return (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-4 w-4 shrink-0">
                              {meta.icon}
                            </div>
                            <span>{meta.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  {INTEGRATION_METADATA[newTarget.provider]?.repoLabel || "Target ID"}
                </Label>
                
                {integrationsLoading ? (
                  <div className="h-10 px-3 flex items-center gap-2 rounded-md border bg-muted/20">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Checking connection...</span>
                  </div>
                ) : !isConnected ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-10 px-3 flex items-center justify-between rounded-md border bg-muted/20 text-xs text-muted-foreground italic">
                      Account not connected
                      <Link href="/integrations" className="text-primary hover:underline not-italic font-bold">Connect →</Link>
                    </div>
                  </div>
                ) : (newTarget.provider === "aws" || providerRepos.length > 0) ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs bg-muted/20"
                      />
                    </div>
                    <ScrollArea className="h-[120px] rounded-md border bg-muted/5 p-2">
                      <div className="space-y-1">
                        {filteredItems.map((item: any) => {
                          const id = typeof item === 'string' ? item : item.id.toString();
                          const label = typeof item === 'string' ? item : (item.fullName || item.name);
                          const isSelected = selectedTargetIds.has(id);
                          return (
                            <div 
                              key={id} 
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-muted ${isSelected ? 'bg-primary/5' : ''}`}
                              onClick={() => toggleTarget(id)}
                            >
                              <Checkbox 
                                checked={isSelected} 
                                onCheckedChange={() => toggleTarget(id)}
                                onClick={e => e.stopPropagation()} 
                              />
                              <span className="text-xs font-medium truncate">{label}</span>
                            </div>
                          );
                        })}
                        {filteredItems.length === 0 && (
                          <div className="py-8 text-center text-[10px] text-muted-foreground">
                            No results found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="relative">
                    <Input 
                      placeholder={newTarget.provider === "aws" ? "e.g. us-east-1" : "e.g. my-awesome-app"}
                      value={newTarget.targetId}
                      onChange={(e) => setNewTarget({...newTarget, targetId: e.target.value})}
                      className="h-10"
                    />
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full h-10 shadow-lg shadow-primary/10" 
              onClick={handleAddTarget}
              disabled={(selectedTargetIds.size === 0 && !newTarget.targetId.trim()) || isAdding}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Cloud className="h-4 w-4 mr-2" />}
              {selectedTargetIds.size > 1 
                ? `Link ${selectedTargetIds.size} Targets` 
                : "Link External Target"
              }
            </Button>
          </div>

          {/* Active Targets List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold px-1">Active Targets ({targets.length})</h4>
            
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                <p className="text-sm text-muted-foreground mt-4">Loading active syncs...</p>
              </div>
            ) : targets.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Cloud className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No active sync targets found.</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Secrets will only be stored in XtraSecurity.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {targets.map((target) => (
                    <motion.div
                      key={target.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${target.provider === 'aws' ? 'bg-amber-500/10 text-amber-600' : 'bg-foreground/5 text-foreground'}`}>
                          {target.provider === 'aws' ? <Database className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{target.targetId}</span>
                            {target.status === 'synced' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                            {target.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                            {target.status === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {target.provider === 'aws' ? 'AWS Secrets Manager' : 'Vercel Project Environment'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeTarget(target.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="p-6 bg-muted/30 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Updates are synced automatically via background queue.
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" 
    ? createPortal(modalContent, document.body) 
    : null;
}

function Info({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
