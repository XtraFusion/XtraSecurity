"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Github, Gitlab, Trash2, RefreshCw, Check, Loader2, Lock, Link2, Unlink, ArrowRight, Globe, Shield, Triangle, ExternalLink, Eye, EyeOff, Info, Rocket, AlertCircle, Plus, RotateCcw, CloudLightning } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from "@/hooks/useUser";

// ─── Types ────────────────────────────────────────────────────────
interface IntegrationStatus { connected: boolean; username?: string; avatarUrl?: string; connectedAt?: string; authUrl?: string; region?: string; }
interface Repo { id: number | string; name: string; fullName: string; owner: string; private: boolean; url: string; framework?: string | null; accountId?: string; arn?: string; }
interface DiffItem { key: string; status: "new" | "in_sync" | "only_vercel" | "only_netlify" | "only_remote"; vercelId?: string; }
interface CompareData { items: DiffItem[]; latestDeployment: { id: string; url: string | null; state: string; createdAt: number } | null; summary: { new: number; inSync: number; onlyVercel?: number; onlyNetlify?: number; }; }
type SyncProvider = "github" | "gitlab" | "vercel" | "netlify" | "aws";

const AWS_REGIONS = ["us-east-1","us-east-2","us-west-1","us-west-2","eu-west-1","eu-west-2","eu-central-1","ap-south-1","ap-southeast-1","ap-southeast-2","ap-northeast-1","ca-central-1","sa-east-1"];

// ─── Status Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
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

// ─── Vercel Connect Modal ──────────────────────────────────────────
function VercelConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/vercel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.trim() }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "Vercel Connected ✓", description: `Linked as @${d.username}` });
      onConnected({ connected: true, username: d.username }); setToken(""); onClose();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-black flex items-center justify-center"><Triangle className="h-3.5 w-3.5 text-white fill-white" /></div>Connect Vercel</DialogTitle>
          <DialogDescription>Paste a Vercel Personal Access Token to sync secrets as encrypted environment variables.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> How to get your token</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Open <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">vercel.com/account/tokens <ExternalLink className="h-2.5 w-2.5" /></a></li>
            <li>Click <strong className="text-foreground">Create</strong> — name it "XtraSecurity"</li>
            <li>Set expiry → Copy token (shown once)</li>
          </ol>
          <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Stored encrypted AES-256-GCM.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Personal Access Token</Label>
          <div className="relative">
            <Input type={show ? "text" : "password"} placeholder="Paste token..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
            <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generic Token Modal (Netlify, Doppler…) ──────────────────────
function TokenModal({ open, onClose, onConnected, provider, providerName, providerColor, steps, scopeNote }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void; provider: string; providerName: string; providerColor: string; steps: { text: string; link?: { href: string; label: string } }[]; scopeNote?: string; }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.trim() }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: `${providerName} Connected ✓`, description: `Linked as @${d.username}` });
      onConnected({ connected: true, username: d.username }); setToken(""); onClose();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: providerColor }}>{providerName[0]}</div>Connect {providerName}</DialogTitle>
          <DialogDescription>Paste your {providerName} Personal Access Token.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />How to get your token</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">{steps.map((s, i) => <li key={i}>{s.text}{s.link && <> <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">{s.link.label}<ExternalLink className="h-2.5 w-2.5" /></a></>}</li>)}</ol>
          {scopeNote && <p className="text-[10px] border-t pt-1 text-muted-foreground/70">{scopeNote} Stored AES-256-GCM encrypted.</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Personal Access Token</Label>
          <div className="relative">
            <Input type={show ? "text" : "password"} placeholder={`Paste ${providerName} token...`} value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
            <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 text-white" style={{ backgroundColor: providerColor }}>{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AWS Connect Modal ─────────────────────────────────────────────
function AwsConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [accessKeyId, setAccessKeyId] = useState(""); const [secretKey, setSecretKey] = useState(""); const [region, setRegion] = useState("us-east-1"); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!accessKeyId.trim() || !secretKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/aws", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessKeyId: accessKeyId.trim(), secretAccessKey: secretKey.trim(), region }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "AWS Connected ✓", description: `Region: ${region}` });
      onConnected({ connected: true, username: d.username, region }); setAccessKeyId(""); setSecretKey(""); onClose();
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#FF9900] flex items-center justify-center"><CloudLightning className="h-4 w-4 text-white" /></div>Connect AWS Secrets Manager</DialogTitle>
          <DialogDescription>Enter your IAM credentials to sync secrets to AWS Secrets Manager.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />Where to find your credentials</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Open <a href="https://console.aws.amazon.com/iam/home#/security_credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">IAM Security Credentials<ExternalLink className="h-2.5 w-2.5" /></a></li>
            <li>Create an IAM user with <code className="bg-muted px-1 rounded">secretsmanager:*</code> permissions</li>
            <li>Under that user → Security credentials → Create access key</li>
            <li>Copy <strong className="text-foreground">Access Key ID</strong> and <strong className="text-foreground">Secret Access Key</strong></li>
          </ol>
          <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Both keys are encrypted AES-256-GCM. Never use root credentials.</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Access Key ID</Label><Input placeholder="AKIAIOSFODNN7EXAMPLE" value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Secret Access Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Region</Label>
            <Select value={region} onValueChange={setRegion}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{AWS_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={connect} disabled={loading || !accessKeyId.trim() || !secretKey.trim()} className="gap-2 bg-[#FF9900] hover:bg-[#e6890a] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Validating...</> : <><Link2 className="h-3.5 w-3.5" />Connect</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Compare Panel ─────────────────────────────────────────────────
function ComparePanel({ provider, vercelProjectId, netlifySiteId, netlifyAccountId, projectId, environment, onSync }: { provider: "vercel" | "netlify"; vercelProjectId?: string; netlifySiteId?: string; netlifyAccountId?: string; projectId: string; environment: string; onSync: () => void; }) {
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [syncingKeys, setSyncingKeys] = useState<Set<string>>(new Set());

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
    } catch {}
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
      await onSync(); // full sync — individual key sync reuses the bulk endpoint
      load();
    } finally { setSyncingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }
  };

  const dep = data?.latestDeployment;
  const isVercel = provider === "vercel";

  return (
    <div className="rounded-lg border bg-card overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold">Environment Diff <span className="text-muted-foreground font-normal">— {isVercel ? "Vercel" : "Netlify"} vs XtraSecurity</span></p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {data && !loading && (
            <div className="flex items-center gap-2 text-xs">
              {data.summary.new > 0 && <span className="text-blue-600 dark:text-blue-400 font-medium">{data.summary.new} new</span>}
              {data.summary.inSync > 0 && <span className="text-green-600 dark:text-green-400 font-medium">{data.summary.inSync} in sync</span>}
              {((data.summary.onlyVercel || 0) + (data.summary.onlyNetlify || 0)) > 0 && <span className="text-orange-600 dark:text-orange-400 font-medium">{(data.summary.onlyVercel || data.summary.onlyNetlify || 0)} remote-only</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} className="h-7 w-7 p-0"><RotateCcw className="h-3.5 w-3.5" /></Button>
          {dep && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-2 py-1">
              <span className={`h-1.5 w-1.5 rounded-full ${dep.state === "READY" || dep.state === "ready" ? "bg-green-500" : dep.state === "BUILDING" || dep.state === "building" ? "bg-yellow-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span>{dep.state}</span>
              {dep.url && <a href={dep.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">{new URL(dep.url).hostname}<ExternalLink className="h-2.5 w-2.5" /></a>}
            </div>
          )}
          <Button onClick={handleDeploy} disabled={deploying} size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            {deploying ? <><Loader2 className="h-3 w-3 animate-spin" />Deploying...</> : <><Rocket className="h-3 w-3" />{isVercel ? "Redeploy" : "Rebuild"}</>}
          </Button>
        </div>
      </div>

      {/* Diff table */}
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
              <th className="p-2.5 w-20" />
            </tr></thead>
            <tbody>{data.items.map((item, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors group">
                <td className="p-2.5 pl-4 font-mono text-xs">{item.key}</td>
                <td className="p-2.5"><StatusBadge status={item.status} /></td>
                <td className="p-2.5 text-xs text-muted-foreground">
                  {item.status === "new" ? "XtraSecurity" : item.status === "in_sync" ? "Both" : isVercel ? "Vercel only" : "Netlify only"}
                </td>
                <td className="p-2.5">
                  {(item.status === "new") && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 opacity-0 group-hover:opacity-100" onClick={() => handleSyncKey(item.key)}>
                      {syncingKeys.has(item.key) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}Push
                    </Button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Connection Card ───────────────────────────────────────────────
function ConnectionCard({ name, icon, iconBg, status, onConnect, onDisconnect, tokenBased }: { name: string; icon: React.ReactNode; iconBg: string; status: IntegrationStatus | null; onConnect: () => void; onDisconnect: () => void; tokenBased?: boolean; }) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${status?.connected ? "border-green-500/30 bg-green-500/[0.03]" : "bg-card"}`}>
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{name}</p>
            {status?.connected && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            {tokenBased && !status?.connected && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Token</span>}
          </div>
          {status?.connected ? (
            <p className="text-xs text-green-600 dark:text-green-400 truncate">
              {name === "AWS" ? status.region : `@${status.username}`}
            </p>
          ) : <p className="text-xs text-muted-foreground">Not connected</p>}
        </div>
      </div>
      <div className="mt-3">
        {status?.connected ? (
          <Button variant="outline" size="sm" onClick={onDisconnect} className="w-full h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/5 gap-1.5"><Unlink className="h-3 w-3" /> Disconnect</Button>
        ) : (
          <Button size="sm" onClick={onConnect} className={`w-full h-8 text-xs gap-1.5 ${name === "GitLab" ? "bg-[#FC6D26] hover:bg-[#e85d1a] text-white" : name === "Vercel" ? "bg-black hover:bg-neutral-800 text-white" : name === "Netlify" ? "bg-[#00C7B7] hover:bg-[#00a89c] text-white" : name === "AWS" ? "bg-[#FF9900] hover:bg-[#e6890a] text-white" : ""}`}>
            <Link2 className="h-3 w-3" /> Connect
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const { user, selectedWorkspace } = useUser();
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(null);
  const [gitlabStatus, setGitlabStatus] = useState<IntegrationStatus | null>(null);
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(null);
  const [netlifyStatus, setNetlifyStatus] = useState<IntegrationStatus | null>(null);
  const [awsStatus, setAwsStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("github");
  const [githubRepos, setGithubRepos] = useState<Repo[]>([]);
  const [gitlabRepos, setGitlabRepos] = useState<Repo[]>([]);
  const [vercelRepos, setVercelRepos] = useState<Repo[]>([]);
  const [netlifyRepos, setNetlifyRepos] = useState<Repo[]>([]);
  const [awsRepos, setAwsRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [awsPathPrefix, setAwsPathPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);

  const [vercelModal, setVercelModal] = useState(false);
  const [netlifyModal, setNetlifyModal] = useState(false);
  const [awsModal, setAwsModal] = useState(false);

  const repos = syncProvider === "github" ? githubRepos : syncProvider === "gitlab" ? gitlabRepos : syncProvider === "vercel" ? vercelRepos : syncProvider === "netlify" ? netlifyRepos : awsRepos;
  const selectedRepoObj = repos.find(r => r.id.toString() === selectedRepo);

  const fetchAllStatuses = async () => {
    setLoading(true);
    try {
      const [gh, gl, vc, nt, aws] = await Promise.all([
        fetch("/api/integrations/github"), fetch("/api/integrations/gitlab"),
        fetch("/api/integrations/vercel"), fetch("/api/integrations/netlify"),
        fetch("/api/integrations/aws"),
      ]);
      if (gh.ok) setGithubStatus(await gh.json());
      if (gl.ok) setGitlabStatus(await gl.json());
      if (vc.ok) setVercelStatus(await vc.json());
      if (nt.ok) setNetlifyStatus(await nt.json());
      if (aws.ok) setAwsStatus(await aws.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAllStatuses(); ProjectController.fetchProjects().then(d => { if (Array.isArray(d)) setProjects(d); }); }, []);

  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("success") === "github_connected") { toast({ title: "GitHub Connected!" }); window.history.replaceState({}, "", window.location.pathname); } else if (p.get("success") === "gitlab_connected") { toast({ title: "GitLab Connected!" }); window.history.replaceState({}, "", window.location.pathname); } else if (p.get("error")) { toast({ title: "Error", description: p.get("error")!, variant: "destructive" }); window.history.replaceState({}, "", window.location.pathname); } }, []);

  useEffect(() => { if (githubStatus?.connected) fetch("/api/integrations/github/sync").then(r => r.ok && r.json()).then(d => d && setGithubRepos(d.repos || [])); }, [githubStatus?.connected]);
  useEffect(() => { if (gitlabStatus?.connected) fetch("/api/integrations/gitlab/sync").then(r => r.ok && r.json()).then(d => d && setGitlabRepos(d.repos || [])); }, [gitlabStatus?.connected]);
  useEffect(() => { if (vercelStatus?.connected) fetch("/api/integrations/vercel/sync").then(r => r.ok && r.json()).then(d => d && setVercelRepos(d.repos || [])); }, [vercelStatus?.connected]);
  useEffect(() => { if (netlifyStatus?.connected) fetch("/api/integrations/netlify/sync").then(r => r.ok && r.json()).then(d => d && setNetlifyRepos(d.repos || [])); }, [netlifyStatus?.connected]);
  useEffect(() => { if (awsStatus?.connected) fetch("/api/integrations/aws/sync").then(r => r.ok && r.json()).then(d => d && setAwsRepos(d.repos || [])); }, [awsStatus?.connected]);
  useEffect(() => { setSelectedRepo(""); setSyncResults(null); setShowCompare(false); }, [syncProvider]);
  useEffect(() => { setShowCompare(false); }, [selectedRepo, selectedEnv]);

  const disconnect = async (provider: SyncProvider) => {
    const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
    if (res.ok) {
      const setters: Record<SyncProvider, () => void> = { github: () => { setGithubStatus({ connected: false }); setGithubRepos([]); }, gitlab: () => { setGitlabStatus({ connected: false }); setGitlabRepos([]); }, vercel: () => { setVercelStatus({ connected: false }); setVercelRepos([]); }, netlify: () => { setNetlifyStatus({ connected: false }); setNetlifyRepos([]); }, aws: () => { setAwsStatus({ connected: false }); setAwsRepos([]); } };
      setters[provider]?.();
      if (syncProvider === provider) setSyncResults(null);
      toast({ title: "Disconnected", description: `${provider} unlinked.` });
    }
  };

  const handleSync = async () => {
    if (!selectedProject || !selectedRepo) { toast({ title: "Missing fields", description: "Select a project and target first.", variant: "destructive" }); return; }
    setSyncing(true); setSyncResults(null);
    try {
      const repo = repos.find(r => r.id.toString() === selectedRepo)!;
      let res: Response;
      if (syncProvider === "github") res = await fetch("/api/integrations/github/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, repoOwner: repo.owner, repoName: repo.name, secretPrefix }) });
      else if (syncProvider === "gitlab") res = await fetch("/api/integrations/gitlab/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, gitlabProjectId: repo.id, secretPrefix }) });
      else if (syncProvider === "vercel") res = await fetch("/api/integrations/vercel/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, vercelProjectId: repo.id, secretPrefix }) });
      else if (syncProvider === "netlify") res = await fetch("/api/integrations/netlify/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, netlifySiteId: repo.id, netlifyAccountId: repo.accountId, secretPrefix }) });
      else res = await fetch("/api/integrations/aws/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, secretPrefix, pathPrefix: awsPathPrefix }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults(data);
      toast({ title: "Sync Complete ✓", description: `${data.summary.synced} secrets pushed` });
    } catch (e: any) { toast({ title: "Sync Failed", description: e.message, variant: "destructive" }); }
    finally { setSyncing(false); }
  };

  const handleDelete = async (key: string) => {
    const repo = repos.find(r => r.id.toString() === selectedRepo)!;
    let res: Response;
    if (syncProvider === "github") res = await fetch(`/api/integrations/github/sync?repoOwner=${repo.owner}&repoName=${repo.name}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "gitlab") res = await fetch(`/api/integrations/gitlab/sync?gitlabProjectId=${repo.id}&variableKey=${key}`, { method: "DELETE" });
    else if (syncProvider === "vercel") res = await fetch(`/api/integrations/vercel/sync?vercelProjectId=${repo.id}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "netlify") res = await fetch(`/api/integrations/netlify/sync?netlifySiteId=${repo.id}&secretName=${key}&accountId=${repo.accountId || ""}`, { method: "DELETE" });
    else res = await fetch(`/api/integrations/aws/sync?secretName=${key}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast({ title: "Delete Failed", description: d.error, variant: "destructive" }); return; }
    setSyncResults((p: any) => ({ ...p, results: p.results.filter((r: any) => r.key !== key), summary: { ...p.summary, total: p.summary.total - 1, synced: p.summary.synced - 1 } }));
    toast({ title: "Deleted", description: `${key} removed` });
  };

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
  if (!loading && !(isPersonalWorkspace || isWorkspaceOwner)) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-[60vh] space-y-4"><Shield className="h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-semibold">Access Denied</h2><p className="text-muted-foreground text-sm">Only workspace owners can manage integrations.</p></div></DashboardLayout>;
  }
  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></DashboardLayout>;

  const anyConnected = [githubStatus, gitlabStatus, vercelStatus, netlifyStatus, awsStatus].some(s => s?.connected);
  const providerConnected: Record<SyncProvider, boolean | undefined> = { github: githubStatus?.connected, gitlab: gitlabStatus?.connected, vercel: vercelStatus?.connected, netlify: netlifyStatus?.connected, aws: awsStatus?.connected };
  const repoLabel: Record<SyncProvider, string> = { github: "Repository", gitlab: "GitLab Project", vercel: "Vercel Project", netlify: "Netlify Site", aws: "AWS Region" };
  const canCompare = (syncProvider === "vercel" || syncProvider === "netlify") && !!selectedRepo && !!selectedProject;

  const providerIcon = (p: SyncProvider, cls = "h-3 w-3") => {
    if (p === "github") return <Github className={cls} />;
    if (p === "gitlab") return <Gitlab className={`${cls} text-[#FC6D26]`} />;
    if (p === "vercel") return <Triangle className={`${cls} fill-current`} />;
    if (p === "netlify") return <span className="text-[#00C7B7] font-bold text-[10px]">◆</span>;
    return <CloudLightning className={`${cls} text-[#FF9900]`} />;
  };

  const detailText: Record<SyncProvider, string> = { github: "Pushed to GitHub Actions", gitlab: "Pushed to GitLab CI/CD", vercel: "Pushed to Vercel Environment", netlify: "Pushed to Netlify Site", aws: "Pushed to AWS Secrets Manager" };

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect external services and sync secrets to your deployment pipelines.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ConnectionCard name="GitHub" icon={<Github className="h-5 w-5 text-white" />} iconBg="bg-[#24292e]" status={githubStatus} onConnect={() => window.location.href = githubStatus?.authUrl || "#"} onDisconnect={() => disconnect("github")} />
          <ConnectionCard name="GitLab" icon={<Gitlab className="h-5 w-5 text-white" />} iconBg="bg-[#FC6D26]" status={gitlabStatus} onConnect={() => window.location.href = gitlabStatus?.authUrl || "#"} onDisconnect={() => disconnect("gitlab")} />
          <ConnectionCard name="Vercel" icon={<Triangle className="h-4 w-4 text-white fill-white" />} iconBg="bg-black" status={vercelStatus} onConnect={() => setVercelModal(true)} onDisconnect={() => disconnect("vercel")} tokenBased />
          <ConnectionCard name="Netlify" icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="white"><path d="M16.934 8.219a4.467 4.467 0 0 0-3.205-3.197l-.812 2.568.013.04 3.204 3.205.823-2.571-.023-.045zm-4.148-3.56a4.467 4.467 0 0 0-4.728 1.07L9.92 7.59l3.678-2.93h-.812zm-5.444 1.794a4.466 4.466 0 0 0-1.07 4.727l2.57-.812-1.5-3.915zm-.705 5.452a4.467 4.467 0 0 0 3.197 3.205l.812-2.568-.013-.04-3.197-3.197-.822 2.572.023.028zm4.15 3.561a4.467 4.467 0 0 0 4.727-1.07l-1.862-1.862-3.678 2.932h.813zm5.443-1.795a4.466 4.466 0 0 0 1.07-4.727l-2.57.812 1.5 3.915z" /></svg>} iconBg="bg-[#00C7B7]" status={netlifyStatus} onConnect={() => setNetlifyModal(true)} onDisconnect={() => disconnect("netlify")} tokenBased />
          <ConnectionCard name="AWS" icon={<CloudLightning className="h-4 w-4 text-white" />} iconBg="bg-[#FF9900]" status={awsStatus} onConnect={() => setAwsModal(true)} onDisconnect={() => disconnect("aws")} tokenBased />
          {(["Doppler", "Bitbucket"] as const).map(n => (
            <div key={n} className="rounded-lg border border-dashed p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
              <Globe className="h-5 w-5 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs font-medium text-muted-foreground">{n}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Coming soon</p>
            </div>
          ))}
        </div>

        {/* Sync section */}
        {anyConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Sync Secrets</h2>
              {/* Provider tabs */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs flex-wrap">
                {(["github", "gitlab", "vercel", "netlify", "aws"] as SyncProvider[]).map(p => {
                  const labels: Record<SyncProvider, string> = { github: "GitHub", gitlab: "GitLab", vercel: "Vercel", netlify: "Netlify", aws: "AWS" };
                  return (
                    <button key={p} onClick={() => setSyncProvider(p)} disabled={!providerConnected[p]}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${syncProvider === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"} ${!providerConnected[p] ? "opacity-30 cursor-not-allowed" : ""}`}>
                      {providerIcon(p)} {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className={`grid grid-cols-1 divide-y ${syncProvider === "aws" ? "md:grid-cols-2 md:divide-y-0 md:divide-x" : "md:grid-cols-3 md:divide-y-0 md:divide-x"}`}>
                {/* Project */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select project..." /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Environment */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Environment</Label>
                  <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Development {syncProvider === "netlify" && <span className="text-[10px] text-muted-foreground">(→ dev)</span>}</div></SelectItem>
                      <SelectItem value="staging"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />Staging {syncProvider === "vercel" && <span className="text-[10px] text-muted-foreground">(→ Preview)</span>}{syncProvider === "netlify" && <span className="text-[10px] text-muted-foreground">(→ branch-deploy)</span>}</div></SelectItem>
                      <SelectItem value="production"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Production</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Target selector */}
                {syncProvider !== "aws" && (
                  <div className="p-4 space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">{repoLabel[syncProvider]}</Label>
                    <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{repos.map(r => (<SelectItem key={r.id} value={r.id.toString()}><div className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground" />{r.fullName}{r.framework && <span className="text-[10px] text-muted-foreground">({r.framework})</span>}</div></SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* AWS extra: path prefix */}
              {syncProvider === "aws" && (
                <div className="border-t px-4 py-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Path Prefix <span className="text-muted-foreground/60">(optional)</span></Label><Input placeholder="/myapp/prod/" value={awsPathPrefix} onChange={e => setAwsPathPrefix(e.target.value)} className="h-8 font-mono text-xs" /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Key Prefix <span className="text-muted-foreground/60">(optional)</span></Label><Input placeholder="APP_" value={secretPrefix} onChange={e => setSecretPrefix(e.target.value.toUpperCase())} className="h-8 font-mono text-xs" /></div>
                </div>
              )}

              {/* Footer: prefix + arrows + buttons */}
              <div className="border-t px-4 py-3 flex items-center gap-3 flex-wrap">
                {syncProvider !== "aws" && (
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Prefix</Label>
                    <Input placeholder="optional" value={secretPrefix} onChange={e => setSecretPrefix(e.target.value.toUpperCase())} className="h-8 font-mono text-xs max-w-[120px]" />
                    {secretPrefix && <span className="text-[10px] text-muted-foreground">e.g. {secretPrefix}_API_KEY</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                  <span className="font-medium text-foreground">{selectedProject ? projects.find(p => p.id === selectedProject)?.name : "—"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1 font-medium text-foreground">{providerIcon(syncProvider)}{selectedRepoObj?.fullName || (syncProvider === "aws" ? awsStatus?.region || "AWS" : "—")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {canCompare && (
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCompare(v => !v)}>
                      <AlertCircle className="h-3.5 w-3.5" />{showCompare ? "Hide" : "Compare"}
                    </Button>
                  )}
                  <Button onClick={handleSync} disabled={syncing || !selectedProject || (!selectedRepo && syncProvider !== "aws") || !providerConnected[syncProvider]} size="sm" className="gap-2">
                    {syncing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Syncing...</> : <><RefreshCw className="h-3.5 w-3.5" />Sync All</>}
                  </Button>
                </div>
              </div>
            </div>

            {/* Compare Panel for Vercel / Netlify */}
            {showCompare && canCompare && (
              <ComparePanel
                provider={syncProvider as "vercel" | "netlify"}
                vercelProjectId={syncProvider === "vercel" ? selectedRepo : undefined}
                netlifySiteId={syncProvider === "netlify" ? selectedRepo : undefined}
                netlifyAccountId={selectedRepoObj?.accountId}
                projectId={selectedProject}
                environment={selectedEnv}
                onSync={handleSync}
              />
            )}

            {/* Sync results */}
            {syncResults && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-sm"><Check className="h-3.5 w-3.5 text-green-500" /><span className="font-medium">Synced to {syncResults.repo}</span></div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 dark:text-green-400 font-medium">{syncResults.summary.synced} synced</span>
                    {syncResults.summary.failed > 0 && <span className="text-destructive font-medium">{syncResults.summary.failed} failed</span>}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/10"><th className="text-left p-2.5 pl-4 text-xs font-medium text-muted-foreground">KEY</th><th className="text-left p-2.5 text-xs font-medium text-muted-foreground">STATUS</th><th className="text-left p-2.5 text-xs font-medium text-muted-foreground">DETAIL</th><th className="p-2.5 w-10" /></tr></thead>
                    <tbody>{syncResults.results.map((res: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors group">
                        <td className="p-2.5 pl-4 font-mono text-xs">{res.key}</td>
                        <td className="p-2.5">{res.success ? <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="h-3 w-3" />OK</span> : <span className="text-xs text-destructive">Failed</span>}</td>
                        <td className="p-2.5 text-xs text-muted-foreground truncate max-w-[200px]">{res.error || detailText[syncProvider]}</td>
                        <td className="p-2.5">{res.success && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(res.key)}><Trash2 className="h-3 w-3" /></Button>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!anyConnected && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Link2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold mb-1">No integrations connected</h3>
            <p className="text-muted-foreground text-sm">Connect GitHub, GitLab, Vercel, Netlify, or AWS above.</p>
          </div>
        )}
      </div>

      <VercelConnectModal open={vercelModal} onClose={() => setVercelModal(false)} onConnected={s => { setVercelStatus(s); }} />
      <TokenModal open={netlifyModal} onClose={() => setNetlifyModal(false)} onConnected={s => { setNetlifyStatus(s); }} provider="netlify" providerName="Netlify" providerColor="#00C7B7"
        steps={[{ text: "Open", link: { href: "https://app.netlify.com/user/applications#personal-access-tokens", label: "app.netlify.com → User Settings → Applications" } }, { text: "Click New access token, name it XtraSecurity" }, { text: "Copy immediately — shown once" }]}
        scopeNote="No scope needed — inherits full account access." />
      <AwsConnectModal open={awsModal} onClose={() => setAwsModal(false)} onConnected={s => { setAwsStatus(s); }} />
    </DashboardLayout>
  );
}
