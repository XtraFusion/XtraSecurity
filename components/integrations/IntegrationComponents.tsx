"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, Rocket, ExternalLink, Loader2, Plus, Trash2, Pencil, Unlink 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  IntegrationStatus, CompareData 
} from "@/lib/integrations/types";

// ─── Status Badge ─────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "New", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    in_sync: { label: "In Sync", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    only_vercel: { label: "Vercel Only", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    only_netlify: { label: "Netlify Only", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    only_remote: { label: "Remote Only", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const cfg = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Compare Panel ─────────────────────────────────────────────────
export function ComparePanel({ provider, vercelProjectId, netlifySiteId, netlifyAccountId, projectId, environment, onSync }: { provider: "vercel" | "netlify"; vercelProjectId?: string; netlifySiteId?: string; netlifyAccountId?: string; projectId: string; environment: string; onSync: () => void; }) {
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [syncingKeys, setSyncingKeys] = useState<Set<string>>(new Set());
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if ((provider === "vercel" && !vercelProjectId) || (provider === "netlify" && !netlifySiteId)) return;
    setLoading(true);
    try {
      let url = "";
      if (provider === "vercel") url = `/api/integrations/vercel/compare?vercelProjectId=${vercelProjectId}&projectId=${projectId}&environment=${environment}`;
      else url = `/api/integrations/netlify/compare?netlifySiteId=${netlifySiteId}&projectId=${projectId}&environment=${environment}&accountId=${netlifyAccountId || ""}`;
      const res = await fetch(url);
      const d = await res.json();
      if (res.ok) setData(d);
    } catch { }
    finally { setLoading(false); }
  }, [provider, vercelProjectId, netlifySiteId, projectId, environment, netlifyAccountId]);

  useEffect(() => { load(); }, [load]);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch(provider === "vercel" ? "/api/integrations/vercel/deploy" : "/api/integrations/netlify/deploy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider === "vercel" ? { vercelProjectId } : { netlifySiteId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: provider === "vercel" ? "Redeploy Triggered ✓" : "Build Triggered ✓", description: d.url ? `Deploying to ${d.url}` : "Build started successfully" });
      setTimeout(load, 3000);
    } catch (e: any) { toast({ title: "Deploy Failed", description: e.message, variant: "destructive" }); }
    finally { setDeploying(false); }
  };

  const handleSyncKey = async (key: string) => {
    setSyncingKeys(prev => new Set(prev).add(key));
    try {
      const body: any = { projectId, environment, secretPrefix: "" };
      if (provider === "vercel") { body.vercelProjectId = vercelProjectId; body.singleKey = key; }
      else { body.netlifySiteId = netlifySiteId; body.netlifyAccountId = netlifyAccountId; body.singleKey = key; }
      // This part assumes onSync handles the fetch. If it's just a callback, we might need more logic here.
      // But based on page.tsx, onSync is passed as a callback that triggers a sync.
      await onSync();
      load();
    } finally { setSyncingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }
  };

  const handleDeleteKey = async (key: string, vercelEnvId?: string) => {
    setDeletingKeys(prev => new Set(prev).add(key));
    try {
      let res: Response;
      if (provider === "vercel") {
        const params = vercelEnvId
          ? `vercelProjectId=${vercelProjectId}&envId=${vercelEnvId}&secretName=${key}`
          : `vercelProjectId=${vercelProjectId}&secretName=${key}`;
        res = await fetch(`/api/integrations/vercel/sync?${params}`, { method: "DELETE" });
      } else {
        res = await fetch(`/api/integrations/netlify/sync?netlifySiteId=${netlifySiteId}&secretName=${key}&accountId=${netlifyAccountId || ""}`, { method: "DELETE" });
      }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "Deleted ✓", description: `${key} removed from ${provider === "vercel" ? "Vercel" : "Netlify"}` });
      setData(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.key !== key),
        summary: {
          ...prev.summary,
          inSync: prev.summary.inSync - (prev.items.find(i => i.key === key)?.status === "in_sync" ? 1 : 0),
          onlyVercel: (prev.summary.onlyVercel || 0) - (prev.items.find(i => i.key === key)?.status === "only_vercel" ? 1 : 0),
          onlyNetlify: (prev.summary.onlyNetlify || 0) - (prev.items.find(i => i.key === key)?.status === "only_netlify" ? 1 : 0),
        }
      } : null);
    } catch (e: any) {
      toast({ title: "Delete Failed", description: e.message, variant: "destructive" });
    } finally {
      setDeletingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const dep = data?.latestDeployment;
  const isVercel = provider === "vercel";

  return (
    <div className="rounded-lg border bg-card overflow-hidden mt-4">
      <div className="px-4 pt-3 pb-2 border-b bg-muted/20 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <p className="text-sm font-semibold shrink-0">Environment Diff</p>
            <span className="text-xs text-muted-foreground shrink-0">— {isVercel ? "Vercel" : "Netlify"} vs XtraSecurity</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {data && !loading && (
              <div className="flex items-center gap-2.5 text-xs">
                {data.summary.new > 0 && (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{data.summary.new} new
                  </span>
                )}
                {data.summary.inSync > 0 && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{data.summary.inSync} in sync
                  </span>
                )}
                {((data.summary.onlyVercel || 0) + (data.summary.onlyNetlify || 0)) > 0 && (
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />{(data.summary.onlyVercel || data.summary.onlyNetlify || 0)} remote-only
                  </span>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={load} className="h-7 w-7 p-0"><RotateCcw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pb-1">
          {dep ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dep.state === "READY" || dep.state === "ready" ? "bg-green-500" : dep.state === "BUILDING" || dep.state === "building" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span className="shrink-0 font-medium">{dep.state}</span>
              {dep.url && (
                <a href={dep.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5 truncate min-w-0">
                  <span className="truncate max-w-[280px]">{new URL(dep.url).hostname}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              )}
            </div>
          ) : <span className="text-xs text-muted-foreground">No deployments found</span>}
          <Button onClick={handleDeploy} disabled={deploying} size="sm" variant="outline" className="h-7 text-xs gap-1.5 shrink-0">
            {deploying ? <><Loader2 className="h-3 w-3 animate-spin" />Deploying...</> : <><Rocket className="h-3 w-3" />{isVercel ? "Redeploy" : "Rebuild"}</>}
          </Button>
        </div>
      </div>

      {!data || loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No secrets found for this environment.</div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/10 text-xs text-muted-foreground">
              <th className="text-left p-2.5 pl-4">KEY</th>
              <th className="text-left p-2.5">STATUS</th>
              <th className="text-left p-2.5">SOURCE</th>
              <th className="p-2.5 w-28 text-right pr-4 text-[10px]">ACTIONS</th>
            </tr></thead>
            <tbody>{data.items.map((item, i) => {
              const isDeleting = deletingKeys.has(item.key);
              const isSyncing = syncingKeys.has(item.key);
              const canPush = item.status === "new";
              const canDelete = item.status === "in_sync" || item.status === "only_vercel" || item.status === "only_netlify";
              return (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors group">
                  <td className="p-2.5 pl-4 font-mono text-xs">{item.key}</td>
                  <td className="p-2.5"><StatusBadge status={item.status} /></td>
                  <td className="p-2.5 text-xs text-muted-foreground">
                    {item.status === "new" ? "XtraSecurity only" : item.status === "in_sync" ? "Both" : isVercel ? "Vercel only" : "Netlify only"}
                  </td>
                  <td className="p-2.5 pr-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canPush && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleSyncKey(item.key)} disabled={isSyncing}>
                          {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}Push
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteKey(item.key, item.vercelId)} disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}Remove
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Connection Card ───────────────────────────────────────────────
export function ConnectionCard({ name, icon, iconBg, status, onConnect, onDisconnect, onEdit, tokenBased, isDisconnecting }: {
  name: string; icon: React.ReactNode; iconBg: string;
  status: IntegrationStatus | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onEdit?: () => void;
  tokenBased?: boolean;
  isDisconnecting?: boolean;
}) {
  return (
    <div className={`group relative rounded-lg border bg-card p-3.5 transition-all hover:shadow-sm ${status?.connected ? "border-border" : "border-border/60 hover:border-border"
      }`}>
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[13px] leading-tight">{name}</p>
          {status?.connected ? (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {name === "AWS" ? status.region : `@${status.username}`}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {tokenBased ? "Token · Not connected" : "Not connected"}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {status?.connected ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                <span className="h-1 w-1 rounded-full bg-green-500" />Active
              </span>
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onDisconnect} className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isDisconnecting}>
                {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onConnect}
              className="h-7 text-[11px] px-3 gap-1.5"
            >
              <Plus className="h-3 w-3" /> Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
