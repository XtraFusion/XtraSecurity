"use client";

import React, { useState, useEffect } from "react";
import { 
  Cloud, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Loader2,
  Search,
  Database,
  Globe,
  Info
} from "lucide-react";
import { Dialog as CustomDialog } from "@/components/ui/dialog-custom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useIntegrations } from "@/hooks/useIntegrations";
import { AWS_REGIONS, INTEGRATION_METADATA } from "@/lib/integrations/config";
import { SyncProvider } from "@/lib/integrations/types";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  const [provider, setProvider] = useState<SyncProvider>("aws");
  const [targetId, setTargetId] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const providerRepos = repos[provider] || [];
  const isConnected = statuses[provider]?.connected;

  const filteredItems = provider === "aws" 
    ? AWS_REGIONS.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
    : providerRepos.filter(r => (r.fullName || r.name).toLowerCase().includes(searchQuery.toLowerCase()));

  const loadTargets = async () => {
    setIsLoading(true);
    try {
      // Mocking for now as per previous implementation
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
      : (targetId ? [targetId] : []);

    if (idsToAdd.length === 0) return;

    setIsAdding(true);
    try {
      const newTargets: SyncTarget[] = idsToAdd.map(id => ({
        id: Math.random().toString(36).substr(2, 9),
        provider: provider as "aws" | "vercel",
        targetId: id,
        status: "pending",
        lastSync: new Date().toISOString()
      }));
      
      setTargets([...targets, ...newTargets]);
      setSelectedTargetIds(new Set());
      setTargetId("");
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
    setTargets(targets.filter(t => t.id !== id));
  };

  return (
    <CustomDialog
      isOpen={open}
      onClose={onClose}
      title="Multi-Cloud Sync"
      description={`Keep ${secretKey} in sync across external platforms.`}
      className="max-w-xl"
      noPadding
    >
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Add Target Section */}
          <div className="space-y-4 p-4 rounded-xl border bg-card/50 shadow-sm">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Sync Target
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Provider</Label>
                <Select 
                  value={provider} 
                  onValueChange={(val: any) => setProvider(val)}
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
                  {INTEGRATION_METADATA[provider]?.repoLabel || "Target ID"}
                </Label>
                
                {integrationsLoading ? (
                  <div className="h-10 px-3 flex items-center gap-2 rounded-md border bg-muted/20">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Checking connection...</span>
                  </div>
                ) : !isConnected ? (
                  <div className="h-10 px-3 flex items-center justify-between rounded-md border bg-muted/20 text-xs text-muted-foreground italic">
                    Account not connected
                    <Link href="/integrations" className="text-primary hover:underline not-italic font-bold">Connect →</Link>
                  </div>
                ) : (provider === "aws" || providerRepos.length > 0) ? (
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
                  <Input 
                    placeholder={INTEGRATION_METADATA[provider]?.repoLabel ? `e.g. ${INTEGRATION_METADATA[provider].repoLabel}` : "e.g. my-awesome-app"}
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="h-10"
                  />
                )}
              </div>
            </div>
            <Button 
              className="w-full mt-3" 
              onClick={handleAddTarget}
              disabled={(selectedTargetIds.size === 0 && !targetId.trim()) || isAdding}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Cloud className="h-4 w-4 mr-2" />}
              {selectedTargetIds.size > 1 
                ? `Link ${selectedTargetIds.size} Targets` 
                : "Link External Target"
              }
            </Button>
          </div>

          {/* Active Targets List */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Active Destinations ({targets.length})
            </h4>
            
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                <p className="text-sm text-muted-foreground mt-4">Loading active syncs...</p>
              </div>
            ) : targets.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Cloud className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No active sync targets found.</p>
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
                            {INTEGRATION_METADATA[target.provider]?.name}
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
      </div>
    </CustomDialog>
  );
}
