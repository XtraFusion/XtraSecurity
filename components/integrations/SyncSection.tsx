"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Trash2, Check, ExternalLink, Activity } from "lucide-react";
import { Repo, SyncProvider } from "@/lib/integrations/types";
import { Project } from "@/util/Interface";
import { INTEGRATION_METADATA } from "@/lib/integrations/config";
import { ComparePanel } from "./IntegrationComponents";

interface SyncSectionProps {
  projects: Project[];
  repos: Repo[];
  syncProvider: SyncProvider;
  onSyncSuccess: (data: any) => void;
}

export function SyncSection({ projects, repos, syncProvider, onSyncSuccess }: SyncSectionProps) {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [awsPathPrefix, setAwsPathPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);

  const handleSync = async () => {
    if (!selectedProject || !selectedRepo) {
      toast({ title: "Missing fields", description: "Select a project and target first.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      const repo = repos.find(r => r.id.toString() === selectedRepo)!;
      const res = await fetch(`/api/integrations/${syncProvider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          environment: selectedEnv,
          secretPrefix,
          ...(syncProvider === "github" ? { repoOwner: repo.owner, repoName: repo.name } : {}),
          ...(syncProvider === "gitlab" ? { gitlabProjectId: repo.id } : {}),
          ...(syncProvider === "vercel" ? { vercelProjectId: repo.id } : {}),
          ...(syncProvider === "netlify" ? { netlifySiteId: repo.id, netlifyAccountId: repo.accountId } : {}),
          ...(syncProvider === "doppler" ? { dopplerProjectSlug: repo.dopplerProject, dopplerConfig: repo.dopplerConfig } : {}),
          ...(syncProvider === "bitbucket" ? { repoFullName: repo.id } : {}),
          ...(syncProvider === "railway" ? { railwayProjectId: repo.projectId, railwayEnvironmentId: repo.environmentId } : {}),
          ...(syncProvider === "fly" ? { flyAppName: repo.id } : {}),
          ...(syncProvider === "render" ? { targetId: repo.id } : {}),
          ...(syncProvider === "digitalocean" ? { appId: repo.id } : {}),
          ...(syncProvider === "heroku" ? { appId: repo.id } : {}),
          ...(syncProvider === "aws" ? { pathPrefix: awsPathPrefix } : {}),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults(data);
      onSyncSuccess(data);
      toast({ title: "Sync Complete ✓", description: `${data.summary.synced} secrets pushed` });
    } catch (e: any) {
      toast({ title: "Sync Failed", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const repo = repos.find(r => r.id.toString() === selectedRepo)!;
      const params = new URLSearchParams({
        secretName: key,
        ...(syncProvider === "github" ? { repoOwner: repo.owner, repoName: repo.name } : {}),
        ...(syncProvider === "gitlab" ? { gitlabProjectId: repo.id, variableKey: key } : {}),
        ...(syncProvider === "vercel" ? { vercelProjectId: repo.id } : {}),
        ...(syncProvider === "netlify" ? { netlifySiteId: repo.id, accountId: repo.accountId || "" } : {}),
        ...(syncProvider === "doppler" ? { dopplerProject: repo.dopplerProject, dopplerConfig: repo.dopplerConfig } : {}),
        ...(syncProvider === "bitbucket" ? { repoFullName: repo.id } : {}),
        ...(syncProvider === "railway" ? { railwayProjectId: repo.projectId, railwayEnvironmentId: repo.environmentId } : {}),
        ...(syncProvider === "fly" ? { flyAppName: repo.id } : {}),
        ...(syncProvider === "render" ? { targetId: repo.id } : {}),
        ...(syncProvider === "digitalocean" ? { appId: repo.id } : {}),
        ...(syncProvider === "heroku" ? { appId: repo.id } : {}),
      });

      const res = await fetch(`/api/integrations/${syncProvider}/sync?${params.toString()}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      
      setSyncResults((p: any) => ({
        ...p,
        results: p.results.filter((r: any) => r.key !== key),
        summary: { ...p.summary, total: p.summary.total - 1, synced: p.summary.synced - 1 }
      }));
      toast({ title: "Deleted", description: `${key} removed` });
    } catch (e: any) {
      toast({ title: "Delete Failed", description: e.message, variant: "destructive" });
    }
  };

  const metadata = INTEGRATION_METADATA[syncProvider];
  if (!metadata) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg ${metadata.iconBg} flex items-center justify-center p-1.5 shadow-sm`}>
              {metadata.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Sync Secrets to {metadata.name}</h3>
              <p className="text-[11px] text-muted-foreground">{metadata.detailText}</p>
            </div>
          </div>
          <Button onClick={handleSync} disabled={syncing || !selectedProject || !selectedRepo} size="sm" className="gap-2 h-8 px-4">
            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {syncing ? "Syncing..." : "Run Sync Now"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
          <div className="p-5 space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">1. Source Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-10 bg-background/50">
                <SelectValue placeholder="Select XtraSecurity Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">2. Target {metadata.repoLabel}</Label>
            <Select value={selectedRepo} onValueChange={setSelectedRepo}>
              <SelectTrigger className="h-10 bg-background/50">
                <SelectValue placeholder={`Select ${metadata.repoLabel}`} />
              </SelectTrigger>
              <SelectContent>
                {repos.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.fullName || r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">3. Environment</Label>
            <Select value={selectedEnv} onValueChange={setSelectedEnv}>
              <SelectTrigger className="h-10 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="preview">Preview / Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-5 py-4 bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Secret Prefix (Optional)</Label>
            <Input placeholder="e.g. NEXT_PUBLIC_" value={secretPrefix} onChange={e => setSecretPrefix(e.target.value)} className="h-8 text-xs bg-background/50" />
          </div>
          {syncProvider === "aws" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">AWS Path Prefix (Optional)</Label>
              <Input placeholder="e.g. /prod/myapp/" value={awsPathPrefix} onChange={e => setAwsPathPrefix(e.target.value)} className="h-8 text-xs bg-background/50" />
            </div>
          )}
        </div>
      </div>

      {syncResults && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Sync Activity
            </h4>
            {(syncProvider === "vercel" || syncProvider === "netlify") && (
              <Button variant="outline" size="sm" onClick={() => setShowCompare(!showCompare)} className="h-8 gap-2 text-xs">
                {showCompare ? "Hide Comparison" : "Compare with Remote"}
              </Button>
            )}
          </div>

          {showCompare && (syncProvider === "vercel" || syncProvider === "netlify") ? (
            <ComparePanel 
              provider={syncProvider as "vercel" | "netlify"} 
              vercelProjectId={syncProvider === "vercel" ? selectedRepo : undefined}
              netlifySiteId={syncProvider === "netlify" ? selectedRepo : undefined}
              netlifyAccountId={syncProvider === "netlify" ? repos.find(r => r.id.toString() === selectedRepo)?.accountId : undefined}
              projectId={selectedProject}
              environment={selectedEnv}
              onSync={handleSync}
            />
          ) : (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr className="text-left border-b">
                      <th className="px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Secret Key</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {syncResults.results.map((r: any) => (
                      <tr key={r.key} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-medium">{r.key}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                            <Check className="h-3 w-3" /> Pushed
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.key)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-muted/30 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <p>Synced {syncResults.summary.synced} of {syncResults.summary.total} secrets successfully.</p>
                {syncResults.latestDeployment?.url && (
                  <a href={syncResults.latestDeployment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                    View Live <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
