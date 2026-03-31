"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Github, Gitlab, Trash2, RefreshCw, Check, Loader2, Lock, Link2, Unlink, ArrowRight, Globe, Shield, Triangle, ExternalLink, Eye, EyeOff, Info, Rocket, AlertCircle, Plus, RotateCcw, CloudLightning, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from "@/hooks/useUser";

// ─── Types ────────────────────────────────────────────────────────
interface IntegrationStatus { connected: boolean; username?: string; avatarUrl?: string; connectedAt?: string; authUrl?: string; region?: string; projectId?: string; vaultName?: string; }
interface Repo { id: number | string; name: string; fullName: string; owner: string; private: boolean; url: string; framework?: string | null; accountId?: string; arn?: string; dopplerProject?: string; dopplerConfig?: string; projectId?: string; environmentId?: string; }
interface DiffItem { key: string; status: "new" | "in_sync" | "only_vercel" | "only_netlify" | "only_remote" | "only_doppler"; vercelId?: string; }
interface CompareData { items: DiffItem[]; latestDeployment: { id: string; url: string | null; state: string; createdAt: number } | null; summary: { new: number; inSync: number; onlyVercel?: number; onlyNetlify?: number; onlyDoppler?: number; }; }
type SyncProvider = "github" | "gitlab" | "vercel" | "netlify" | "aws" | "doppler" | "bitbucket" | "gcp" | "azure" | "railway" | "fly" | "render" | "digitalocean" | "heroku" | "slack" | "discord";

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
function AwsConnectModal({ open, onClose, onConnected, currentRegion }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void; currentRegion?: string; }) {
  const [accessKeyId, setAccessKeyId] = useState(""); const [secretKey, setSecretKey] = useState(""); const [region, setRegion] = useState(currentRegion || "us-east-1"); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  // Sync region from prop when modal opens
  useEffect(() => { if (open) setRegion(currentRegion || "us-east-1"); }, [open, currentRegion]);
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
          <DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-white flex items-center justify-center border shadow-sm p-1"><img src="/aws-logo.svg" alt="AWS" className="h-full w-full object-contain" /></div>Connect AWS Secrets Manager</DialogTitle>
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

// ─── Bitbucket Connect Modal ───────────────────────────────────────
function BitbucketConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [username, setUsername] = useState(""); const [appPassword, setAppPassword] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!username.trim() || !appPassword.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/bitbucket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, appPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Bitbucket Connected ✓", description: `Linked as ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-white flex items-center justify-center border shadow-sm p-1"><img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className="h-full w-full object-contain" /></div> Bitbucket Connection</DialogTitle><DialogDescription>Connect using an App Password. Recommended permissions: Repositories (Write), Pipelines (Write).</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an App Password:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <a href="https://bitbucket.org/account/settings/app-passwords/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bitbucket → Personal Settings → App Passwords</a></li>
              <li>Click <strong className="text-foreground">Create app password</strong></li>
              <li>Label it "XtraSecurity" & check <strong className="text-foreground">Repositories (Write)</strong> and <strong className="text-foreground">Pipelines (Write)</strong></li>
              <li>Copy the generated password (shown only once)</li>
            </ol>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Bitbucket Username / Email</Label><Input placeholder="e.g. jdoe" value={username} onChange={e => setUsername(e.target.value)} className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">App Password</Label>
              <div className="relative"><Input type={show ? "text" : "password"} placeholder="Enter your app password..." value={appPassword} onChange={e => setAppPassword(e.target.value)} className="h-9 pr-9" />
                <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !username.trim() || !appPassword.trim()} className="gap-2 bg-[#0052CC] hover:bg-[#0747a6] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Bitbucket</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── GCP Connect Modal ─────────────────────────────────────────────
function GcpConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [json, setJson] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!json.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/gcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceAccountJson: json }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, projectId: data.projectId }); onClose(); toast({ title: "GCP Connected ✓", description: `Project: ${data.projectId}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4"/><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853"/><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05"/><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335"/></svg> GCP Connection</DialogTitle><DialogDescription>Securely connect using a Service Account JSON key.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GCP Console → IAM & Admin → Service Accounts</a></li>
              <li>Create a service account with <strong className="text-foreground">Secret Manager Admin</strong> role</li>
              <li>Go to <strong className="text-foreground">Keys</strong> tab → <strong className="text-foreground">Add Key</strong> → <strong className="text-foreground">Create new key (JSON)</strong></li>
              <li>Paste the contents of the downloaded file below</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Service Account JSON</Label>
            <textarea placeholder='{ "type": "service_account", ... }' value={json} onChange={e => setJson(e.target.value)} className="w-full h-32 p-3 text-[10px] font-mono border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !json.trim()} className="gap-2 bg-[#4285F4] hover:bg-[#357ae8] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect GCP</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Azure Connect Modal ───────────────────────────────────────────
function AzureConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [tenantId, setTenantId] = useState(""); const [clientId, setClientId] = useState(""); const [clientSecret, setClientSecret] = useState(""); const [vaultName, setVaultName] = useState("");
  const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim() || !vaultName.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/azure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, clientId, clientSecret, vaultName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, vaultName: data.vaultName }); onClose(); toast({ title: "Azure Connected ✓", description: `Vault: ${data.vaultName}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M11.52.53L1.13 11.16l1.39 12.31L12.92 23.3l9.95-10.74L21.48.69l-9.96-.16zm0 2.21l7.74.12 1.11 9.77-7.75 8.35-8.08-.11-1.08-9.59 8.06-8.54z" fill="#0089D6"/><path d="M12.92 23.3s-9.95.17-10.4 0c-.45-.17 1.39-12.31 1.39-12.31l10.39-11 8.56.16 1.11 12.15-11.05 11z" fill="#0089D6" opacity=".1"/><path d="M11.52.53L1.13 11.16s9.9-.17 10.39-11L11.52.53z" fill="#0089D6"/><path d="M1.13 11.16l1.39 12.31s9.54.1 10.4 0c.86-.1 1.08-11 1.08-11L1.13 11.16z" fill="#0072C6"/></svg> Azure Connection</DialogTitle><DialogDescription>Connect using a Service Principal (App Registration).</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-2.5 rounded-lg border text-[10px] space-y-1.5 font-medium">
            <p className="flex items-center gap-1.5 text-primary"><Info className="h-3 w-3" /> Quick Setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" rel="noopener noreferrer" className="underline">Azure Portal → App Registrations</a></li>
              <li>Create a new registration, copy <strong className="text-foreground">Client ID</strong> and <strong className="text-foreground">Tenant ID</strong></li>
              <li>Under <strong className="text-foreground">Certificates & secrets</strong>, create a Client Secret</li>
              <li>In your <strong className="text-foreground">Key Vault</strong>, go to Access Control (IAM) → Add Role Assignment → <strong className="text-foreground">Key Vault Secrets Officer</strong> to your app.</li>
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[11px]">Tenant ID</Label><Input placeholder="00000000-..." value={tenantId} onChange={e => setTenantId(e.target.value)} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-[11px]">Client ID</Label><Input placeholder="00000000-..." value={clientId} onChange={e => setClientId(e.target.value)} className="h-8 text-xs" /></div>
          </div>
          <div className="space-y-1"><Label className="text-[11px]">Client Secret</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste secret here..." value={clientSecret} onChange={e => setClientSecret(e.target.value)} className="h-8 text-xs pr-8" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1"><Label className="text-[11px]">Key Vault Name</Label><Input placeholder="e.g. my-vault" value={vaultName} onChange={e => setVaultName(e.target.value)} className="h-8 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !tenantId.trim() || !clientId.trim() || !clientSecret.trim() || !vaultName.trim()} className="gap-2 bg-[#0072C6] hover:bg-[#005a9e] text-white font-semibold text-xs">{loading ? <><Loader2 className="h-3 w-3 animate-spin" />Linking...</> : <><Link2 className="h-3 w-3" />Link Azure Vault</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Railway Connect Modal ─────────────────────────────────────────
function RailwayConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/railway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Railway Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#0B0D0E] flex items-center justify-center p-1"><img src="/railway-color.svg" alt="Railway" className="h-full w-full object-contain" /></div> Railway Connection</DialogTitle><DialogDescription>Connect using a Personal Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <a href="https://railway.app/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Railway Settings → Tokens</a></li>
              <li>Create a new **Personal Access Token**</li>
              <li>Paste the token below to link your account</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Railway API Token</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Paste your token here..." value={token} onChange={e => setToken(e.target.value)} className="pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#0B0D0E] hover:bg-[#1a1c1d] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Railway</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fly.io Connect Modal ──────────────────────────────────────────
function FlyConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/fly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Fly.io Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#4222E9] flex items-center justify-center p-1"><img src="/Fly.io Symbol SVG" alt="Fly.io" className="h-full w-full object-contain" /></div> Fly.io Connection</DialogTitle><DialogDescription>Connect using a Fly API Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Run `fly auth token` in your terminal</li>
              <li>Or create one in [Fly.io Dashboard](https://fly.io/dashboard/personal/tokens)</li>
              <li>Paste the token below to link your account</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fly API Token</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Paste your token here..." value={token} onChange={e => setToken(e.target.value)} className="pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#4222E9] hover:bg-[#3418c3] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Fly.io</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Render Connect Modal ──────────────────────────────────────────
function RenderConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Render Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-white border shadow-sm flex items-center justify-center p-1"><img src="/Render Symbol SVG.svg" alt="Render" className="h-full w-full object-contain" /></div> Render Connection</DialogTitle><DialogDescription>Connect using a Render API Key.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open [Render Dashboard → API Keys](https://dashboard.render.com/account#api-keys)</li>
              <li>Create a new **API Key**</li>
              <li>Paste the key below to link your account</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Render API Key</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Paste your API key here..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiKey.trim()} className="gap-2 bg-[#46E3B7] hover:bg-[#3cd1a6] text-black font-semibold">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Render</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DigitalOcean Connect Modal ─────────────────────────────────────
function DOConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/digitalocean", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "DigitalOcean Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-white border shadow-sm flex items-center justify-center p-1"><img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className="h-full w-full object-contain" /></div> DigitalOcean Connection</DialogTitle><DialogDescription>Connect using a Personal Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open [DigitalOcean Control Panel → API](https://cloud.digitalocean.com/account/api/tokens)</li>
              <li>Generate a **Personal Access Token** (Read & Write)</li>
              <li>Paste the token below to link your account</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Personal Access Token</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Paste your token here..." value={token} onChange={e => setToken(e.target.value)} className="pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#008bcf] hover:bg-[#0076af] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect DigitalOcean</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Heroku Connect Modal ───────────────────────────────────────────
function HerokuConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/heroku", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Heroku Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#6762A6] flex items-center justify-center p-1"><img src="/Heroku Symbol SVG.svg" alt="Heroku" className="h-full w-full object-contain" /></div> Heroku Connection</DialogTitle><DialogDescription>Connect using your Heroku API Key.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open [Heroku Dashboard → Account Settings](https://dashboard.heroku.com/account)</li>
              <li>Scroll to **API Key**, reveal and copy it</li>
              <li>Paste the key below to link your account</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Heroku API Key</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="Paste your API key here..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiKey.trim()} className="gap-2 bg-[#6762A6] hover:bg-[#544e94] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Heroku</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Slack Connect Modal ────────────────────────────────────────────
function SlackConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [url, setUrl] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!url.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/slack", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookUrl: url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Slack Connected ✓", description: "Test message sent." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.523-2.52A2.528 2.528 0 0 1 8.834 0a2.527 2.527 0 0 1 2.52 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1-2.52 2.521 2.527 2.527 0 0 1 2.52 2.521h6.313A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522-2.521H8.834zM18.958 8.834a2.528 2.528 0 0 1 2.522-2.523A2.528 2.528 0 0 1 24 8.834a2.527 2.527 0 0 1-2.52 2.52h-2.52V8.834zM17.687 8.834a2.527 2.527 0 0 1-2.521 2.52 2.527 2.527 0 0 1-2.521-2.52V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.166 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zM15.166 17.687a2.527 2.527 0 0 1 2.52-2.521 2.527 2.527 0 0 1-2.52-2.521H8.833A2.528 2.528 0 0 1 0 15.166a2.528 2.528 0 0 1 2.522 2.521h12.644z"/></svg> Slack Webhook</DialogTitle><DialogDescription>Get real-time sync alerts in your Slack channel.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get a Webhook URL:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to [api.slack.com/apps](https://api.slack.com/apps)</li>
              <li>Create a new App and enable **Incoming Webhooks**</li>
              <li>Click **Add New Webhook to Workspace** and pick a channel</li>
              <li>Copy the Webhook URL and paste it below</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook URL</Label>
            <Input placeholder="https://hooks.slack.com/services/..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !url.trim()} className="gap-2 bg-[#4A154B] hover:bg-[#3b113c] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Slack</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscordConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [url, setUrl] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!url.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/discord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookUrl: url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Discord Connected ✓", description: "Test message sent." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.006 14.006 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg> Discord Webhook</DialogTitle><DialogDescription>Get real-time sync alerts in your Discord channel.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get a Webhook URL:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your Discord Server settings</li>
              <li>Go to **Integrations** → **Webhooks**</li>
              <li>Click **New Webhook**, select a channel, and copy the URL</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Webhook URL</Label>
            <Input placeholder="https://discord.com/api/webhooks/..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !url.trim()} className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Discord</>}</Button></DialogFooter>
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
      await onSync();
      load();
    } finally { setSyncingKeys(prev => { const n = new Set(prev); n.delete(key); return n; }); }
  };

  const handleDeleteKey = async (key: string, vercelEnvId?: string) => {
    setDeletingKeys(prev => new Set(prev).add(key));
    try {
      let res: Response;
      if (provider === "vercel") {
        // Use envId if available for direct delete, otherwise resolve by name
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
      // Optimistically remove from local data
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
      {/* Header — row 1: title + stats + refresh */}
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
        {/* Row 2: deployment info + action */}
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
function ConnectionCard({ name, icon, iconBg, status, onConnect, onDisconnect, onEdit, tokenBased }: {
  name: string; icon: React.ReactNode; iconBg: string;
  status: IntegrationStatus | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onEdit?: () => void;
  tokenBased?: boolean;
}) {
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
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 h-8 text-xs gap-1.5">
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDisconnect} className={`h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/5 gap-1.5 ${onEdit ? "flex-1" : "w-full"}`}>
              <Unlink className="h-3 w-3" /> Disconnect
            </Button>
          </div>
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
  const [dopplerStatus, setDopplerStatus] = useState<IntegrationStatus | null>(null);
  const [bitbucketStatus, setBitbucketStatus] = useState<IntegrationStatus | null>(null);
  const [gcpStatus, setGcpStatus] = useState<IntegrationStatus | null>(null);
  const [azureStatus, setAzureStatus] = useState<IntegrationStatus | null>(null);
  const [railwayStatus, setRailwayStatus] = useState<IntegrationStatus | null>(null);
  const [flyStatus, setFlyStatus] = useState<IntegrationStatus | null>(null);
  const [renderStatus, setRenderStatus] = useState<IntegrationStatus | null>(null);
  const [doStatus, setDoStatus] = useState<IntegrationStatus | null>(null);
  const [herokuStatus, setHerokuStatus] = useState<IntegrationStatus | null>(null);
  const [slackStatus, setSlackStatus] = useState<IntegrationStatus | null>(null);
  const [discordStatus, setDiscordStatus] = useState<IntegrationStatus | null>(null);
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
  const [dopplerRepos, setDopplerRepos] = useState<Repo[]>([]);
  const [bitbucketRepos, setBitbucketRepos] = useState<Repo[]>([]);
  const [gcpRepos, setGcpRepos] = useState<Repo[]>([]);
  const [azureRepos, setAzureRepos] = useState<Repo[]>([]);
  const [railwayRepos, setRailwayRepos] = useState<Repo[]>([]);
  const [flyRepos, setFlyRepos] = useState<Repo[]>([]);
  const [renderRepos, setRenderRepos] = useState<Repo[]>([]);
  const [doRepos, setDoRepos] = useState<Repo[]>([]);
  const [herokuRepos, setHerokuRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [awsPathPrefix, setAwsPathPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [showCompare, setShowCompare] = useState(false);

  const [vercelModal, setVercelModal] = useState(false);
  const [netlifyModal, setNetlifyModal] = useState(false);
  const [awsModal, setAwsModal] = useState(false);
  const [dopplerModal, setDopplerModal] = useState(false);
  const [bitbucketModal, setBitbucketModal] = useState(false);
  const [gcpModal, setGcpModal] = useState(false);
  const [azureModal, setAzureModal] = useState(false);
  const [railwayModal, setRailwayModal] = useState(false);
  const [flyModal, setFlyModal] = useState(false);
  const [renderModal, setRenderModal] = useState(false);
  const [doModal, setDoModal] = useState(false);
  const [herokuModal, setHerokuModal] = useState(false);
  const [slackModal, setSlackModal] = useState(false);
  const [discordModal, setDiscordModal] = useState(false);

  const repos = syncProvider === "github" ? githubRepos : syncProvider === "gitlab" ? gitlabRepos : syncProvider === "vercel" ? vercelRepos : syncProvider === "netlify" ? netlifyRepos : syncProvider === "doppler" ? dopplerRepos : syncProvider === "bitbucket" ? bitbucketRepos : syncProvider === "gcp" ? gcpRepos : syncProvider === "azure" ? azureRepos : syncProvider === "railway" ? railwayRepos : syncProvider === "fly" ? flyRepos : syncProvider === "render" ? renderRepos : syncProvider === "digitalocean" ? doRepos : syncProvider === "heroku" ? herokuRepos : awsRepos;
  const selectedRepoObj = repos.find(r => r.id.toString() === selectedRepo);

  const fetchAllStatuses = async () => {
    setLoading(true);
    try {
      const [gh, gl, vc, nt, aws, dp, bb, gcp, az, rw, fl, rd, do_res, hk, sl, ds] = await Promise.all([
        fetch("/api/integrations/github"), fetch("/api/integrations/gitlab"),
        fetch("/api/integrations/vercel"), fetch("/api/integrations/netlify"),
        fetch("/api/integrations/aws"), fetch("/api/integrations/doppler"),
        fetch("/api/integrations/bitbucket"), fetch("/api/integrations/gcp"),
        fetch("/api/integrations/azure"), fetch("/api/integrations/railway"),
        fetch("/api/integrations/fly"), fetch("/api/integrations/render"),
        fetch("/api/integrations/digitalocean"), fetch("/api/integrations/heroku"),
        fetch("/api/integrations/slack"), fetch("/api/integrations/discord"),
      ]);
      if (gh.ok) setGithubStatus(await gh.json());
      if (gl.ok) setGitlabStatus(await gl.json());
      if (vc.ok) setVercelStatus(await vc.json());
      if (nt.ok) setNetlifyStatus(await nt.json());
      if (aws.ok) setAwsStatus(await aws.json());
      if (dp.ok) setDopplerStatus(await dp.json());
      if (bb.ok) setBitbucketStatus(await bb.json());
      if (gcp.ok) setGcpStatus(await gcp.json());
      if (az.ok) setAzureStatus(await az.json());
      if (rw.ok) setRailwayStatus(await rw.json());
      if (fl.ok) setFlyStatus(await fl.json());
      if (rd.ok) setRenderStatus(await rd.json());
      if (do_res.ok) setDoStatus(await do_res.json());
      if (hk.ok) setHerokuStatus(await hk.json());
      if (sl.ok) setSlackStatus(await sl.json());
      if (ds.ok) setDiscordStatus(await ds.json());
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
  useEffect(() => { if (dopplerStatus?.connected) fetch("/api/integrations/doppler/sync").then(r => r.ok && r.json()).then(d => d && setDopplerRepos(d.repos || [])); }, [dopplerStatus?.connected]);
  useEffect(() => { if (bitbucketStatus?.connected) fetch("/api/integrations/bitbucket/sync").then(r => r.ok && r.json()).then(d => d && setBitbucketRepos(d.repos || [])); }, [bitbucketStatus?.connected]);
  useEffect(() => { if (gcpStatus?.connected) fetch("/api/integrations/gcp/sync").then(r => r.ok && r.json()).then(d => d && setGcpRepos(d.repos || [])); }, [gcpStatus?.connected]);
  useEffect(() => { if (azureStatus?.connected) fetch("/api/integrations/azure/sync").then(r => r.ok && r.json()).then(d => d && setAzureRepos(d.repos || [])); }, [azureStatus?.connected]);
  useEffect(() => { if (railwayStatus?.connected) fetch("/api/integrations/railway/sync").then(r => r.ok && r.json()).then(d => d && setRailwayRepos(d.repos || [])); }, [railwayStatus?.connected]);
  useEffect(() => { if (flyStatus?.connected) fetch("/api/integrations/fly/sync").then(r => r.ok && r.json()).then(d => d && setFlyRepos(d.repos || [])); }, [flyStatus?.connected]);
  useEffect(() => { if (renderStatus?.connected) fetch("/api/integrations/render/sync").then(r => r.ok && r.json()).then(d => d && setRenderRepos(d.repos || [])); }, [renderStatus?.connected]);
  useEffect(() => { if (doStatus?.connected) fetch("/api/integrations/digitalocean/sync").then(r => r.ok && r.json()).then(d => d && setDoRepos(d.repos || [])); }, [doStatus?.connected]);
  useEffect(() => { if (herokuStatus?.connected) fetch("/api/integrations/heroku/sync").then(r => r.ok && r.json()).then(d => d && setHerokuRepos(d.repos || [])); }, [herokuStatus?.connected]);
  useEffect(() => { setSelectedRepo(""); setSyncResults(null); setShowCompare(false); }, [syncProvider]);
  useEffect(() => { setShowCompare(false); }, [selectedRepo, selectedEnv]);

  const disconnect = async (provider: SyncProvider) => {
    const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
    if (res.ok) {
      const setters: Record<SyncProvider, () => void> = { github: () => { setGithubStatus({ connected: false }); setGithubRepos([]); }, gitlab: () => { setGitlabStatus({ connected: false }); setGitlabRepos([]); }, vercel: () => { setVercelStatus({ connected: false }); setVercelRepos([]); }, netlify: () => { setNetlifyStatus({ connected: false }); setNetlifyRepos([]); }, aws: () => { setAwsStatus({ connected: false }); setAwsRepos([]); }, doppler: () => { setDopplerStatus({ connected: false }); setDopplerRepos([]); }, bitbucket: () => { setBitbucketStatus({ connected: false }); setBitbucketRepos([]); }, gcp: () => { setGcpStatus({ connected: false }); setGcpRepos([]); }, azure: () => { setAzureStatus({ connected: false }); setAzureRepos([]); }, railway: () => { setRailwayStatus({ connected: false }); setRailwayRepos([]); }, fly: () => { setFlyStatus({ connected: false }); setFlyRepos([]); }, render: () => { setRenderStatus({ connected: false }); setRenderRepos([]); }, digitalocean: () => { setDoStatus({ connected: false }); setDoRepos([]); }, heroku: () => { setHerokuStatus({ connected: false }); setHerokuRepos([]); }, slack: () => { setSlackStatus({ connected: false }); }, discord: () => { setDiscordStatus({ connected: false }); } };
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
      else if (syncProvider === "doppler") res = await fetch("/api/integrations/doppler/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, dopplerProjectSlug: repo.dopplerProject, dopplerConfig: repo.dopplerConfig, secretPrefix }) });
      else if (syncProvider === "bitbucket") res = await fetch("/api/integrations/bitbucket/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, repoFullName: repo.id, secretPrefix }) });
      else if (syncProvider === "gcp") res = await fetch("/api/integrations/gcp/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, secretPrefix }) });
      else if (syncProvider === "azure") res = await fetch("/api/integrations/azure/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, secretPrefix }) });
      else if (syncProvider === "railway") res = await fetch("/api/integrations/railway/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, railwayProjectId: repo.projectId, railwayEnvironmentId: repo.environmentId, secretPrefix }) });
      else if (syncProvider === "fly") res = await fetch("/api/integrations/fly/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, flyAppName: repo.id, secretPrefix }) });
      else if (syncProvider === "render") res = await fetch("/api/integrations/render/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, targetId: repo.id, secretPrefix }) });
      else if (syncProvider === "digitalocean") res = await fetch("/api/integrations/digitalocean/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, appId: repo.id, secretPrefix }) });
      else if (syncProvider === "heroku") res = await fetch("/api/integrations/heroku/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, appId: repo.id, secretPrefix }) });
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
    else if (syncProvider === "doppler") res = await fetch(`/api/integrations/doppler/sync?dopplerProject=${repo.dopplerProject}&dopplerConfig=${repo.dopplerConfig}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "bitbucket") res = await fetch(`/api/integrations/bitbucket/sync?repoFullName=${repo.id}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "gcp") res = await fetch(`/api/integrations/gcp/sync?secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "azure") res = await fetch(`/api/integrations/azure/sync?secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "railway") res = await fetch(`/api/integrations/railway/sync?railwayProjectId=${repo.projectId}&railwayEnvironmentId=${repo.environmentId}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "fly") res = await fetch(`/api/integrations/fly/sync?flyAppName=${repo.id}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "render") res = await fetch(`/api/integrations/render/sync?targetId=${repo.id}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "digitalocean") res = await fetch(`/api/integrations/digitalocean/sync?appId=${repo.id}&secretName=${key}`, { method: "DELETE" });
    else if (syncProvider === "heroku") res = await fetch(`/api/integrations/heroku/sync?appId=${repo.id}&secretName=${key}`, { method: "DELETE" });
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

  const anyConnected = [githubStatus, gitlabStatus, vercelStatus, netlifyStatus, awsStatus, dopplerStatus, bitbucketStatus, gcpStatus, azureStatus, railwayStatus, flyStatus, renderStatus, doStatus, herokuStatus, slackStatus, discordStatus].some(s => s?.connected);
  const providerConnected: Record<SyncProvider, boolean | undefined> = { github: githubStatus?.connected, gitlab: gitlabStatus?.connected, vercel: vercelStatus?.connected, netlify: netlifyStatus?.connected, aws: awsStatus?.connected, doppler: dopplerStatus?.connected, bitbucket: bitbucketStatus?.connected, gcp: gcpStatus?.connected, azure: azureStatus?.connected, railway: railwayStatus?.connected, fly: flyStatus?.connected, render: renderStatus?.connected, digitalocean: doStatus?.connected, heroku: herokuStatus?.connected, slack: slackStatus?.connected, discord: discordStatus?.connected };
  const repoLabel: Record<SyncProvider, string> = { github: "Repository", gitlab: "GitLab Project", vercel: "Vercel Project", netlify: "Netlify Site", aws: "AWS Region", doppler: "Doppler Config", bitbucket: "Bitbucket Repo", gcp: "GCP Project", azure: "Azure Vault", railway: "Railway Target", fly: "Fly App", render: "Render Target", digitalocean: "DigitalOcean App", heroku: "Heroku App", slack: "N/A", discord: "N/A" };
  const canCompare = (syncProvider === "vercel" || syncProvider === "netlify") && !!selectedRepo && !!selectedProject;

  const providerIcon = (p: SyncProvider, cls = "h-3 w-3") => {
    if (p === "github") return <Github className={cls} />;
    if (p === "gitlab") return <Gitlab className={`${cls} text-[#FC6D26]`} />;
    if (p === "vercel") return <Triangle className={`${cls} fill-current`} />;
    if (p === "netlify") return <span className="text-[#00C7B7] font-bold text-[10px]">◆</span>;
    if (p === "doppler") return <span className="text-[#6366f1] font-bold text-[10px]">D</span>;
    if (p === "bitbucket") return <img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className={cls} />;
    if (p === "gcp") return <svg viewBox="0 0 24 24" className={cls} xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4"/><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853"/><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05"/><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335"/></svg>;
    if (p === "azure") return <svg viewBox="0 0 24 24" className={cls} xmlns="http://www.w3.org/2000/svg"><path d="M11.52.53L1.13 11.16l1.39 12.31L12.92 23.3l9.95-10.74L21.48.69l-9.96-.16zm0 2.21l7.74.12 1.11 9.77-7.75 8.35-8.08-.11-1.08-9.59 8.06-8.54z" fill="#0089D6"/><path d="M12.92 23.3s-9.95.17-10.4 0c-.45-.17 1.39-12.31 1.39-12.31l10.39-11 8.56.16 1.11 12.15-11.05 11z" fill="#0089D6" opacity=".1"/><path d="M11.52.53L1.13 11.16s9.9-.17 10.39-11L11.52.53z" fill="#0089D6"/><path d="M1.13 11.16l1.39 12.31s9.54.1 10.4 0c.86-.1 1.08-11 1.08-11L1.13 11.16z" fill="#0072C6"/></svg>;
    if (p === "railway") return <img src="/railway-color.svg" alt="Railway" className={cls} />;
    if (p === "fly") return <img src="/Fly.io Symbol SVG" alt="Fly.io" className={cls} />;
    if (p === "render") return <img src="/Render Symbol SVG.svg" alt="Render" className={cls} />;
    if (p === "digitalocean") return <img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className={cls} />;
    if (p === "heroku") return <img src="/Heroku Symbol SVG.svg" alt="Heroku" className={cls} />;
    return <img src="/aws-logo.svg" alt="AWS" className={cls} />;
  };

  const detailText: Record<SyncProvider, string> = { github: "Pushed to GitHub Actions", gitlab: "Pushed to GitLab CI/CD", vercel: "Pushed to Vercel Environment", netlify: "Pushed to Netlify Site", aws: "Pushed to AWS Secrets Manager", doppler: "Pushed to Doppler Config", bitbucket: "Pushed to Bitbucket Repository Variables", gcp: "Pushed to Google Cloud Secret Manager", azure: "Pushed to Azure Key Vault", railway: "Pushed to Railway Environment Variables", fly: "Pushed to Fly.io App Secrets", render: "Pushed to Render Environment Variables", digitalocean: "Pushed to DigitalOcean App Platform", heroku: "Pushed to Heroku Config Vars", slack: "Sent to Slack", discord: "Sent to Discord" };

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
          <ConnectionCard name="AWS" icon={<img src="/aws-logo.svg" alt="AWS" className="h-6 w-6" />} iconBg="bg-white" status={awsStatus} onConnect={() => setAwsModal(true)} onDisconnect={() => disconnect("aws")} onEdit={() => setAwsModal(true)} tokenBased />
          <ConnectionCard name="Doppler" icon={<span className="text-white font-bold text-sm">D</span>} iconBg="bg-[#6366f1]" status={dopplerStatus} onConnect={() => setDopplerModal(true)} onDisconnect={() => disconnect("doppler")} tokenBased />
          <ConnectionCard name="Bitbucket" icon={<img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className="h-6 w-6" />} iconBg="bg-white shadow-inner" status={bitbucketStatus} onConnect={() => setBitbucketModal(true)} onDisconnect={() => disconnect("bitbucket")} tokenBased />
          <ConnectionCard name="Google Cloud" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4"/><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853"/><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05"/><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335"/></svg>} iconBg="bg-white border" status={gcpStatus} onConnect={() => setGcpModal(true)} onDisconnect={() => disconnect("gcp")} tokenBased />
          <ConnectionCard name="Azure" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M11.52.53L1.13 11.16l1.39 12.31L12.92 23.3l9.95-10.74L21.48.69l-9.96-.16zm0 2.21l7.74.12 1.11 9.77-7.75 8.35-8.08-.11-1.08-9.59 8.06-8.54z" fill="white" opacity=".9"/><path d="M12.92 23.3s-9.95.17-10.4 0c-.45-.17 1.39-12.31 1.39-12.31l10.39-11 8.56.16 1.11 12.15-11.05 11z" fill="white" opacity=".2"/><path d="M1.13 11.16l1.39 12.31s9.54.1 10.4 0c.86-.1 1.08-11 1.08-11L1.13 11.16z" fill="white" opacity=".4"/></svg>} iconBg="bg-[#0089D6]" status={azureStatus} onConnect={() => setAzureModal(true)} onDisconnect={() => disconnect("azure")} tokenBased />
          <ConnectionCard name="Railway" icon={<img src="/railway-color.svg" alt="Railway" className="h-6 w-6" />} iconBg="bg-[#0B0D0E]" status={railwayStatus} onConnect={() => setRailwayModal(true)} onDisconnect={() => disconnect("railway")} tokenBased />
          <ConnectionCard name="Fly.io" icon={<img src="/Fly.io Symbol SVG" alt="Fly.io" className="h-6 w-6" />} iconBg="bg-[#4222E9]" status={flyStatus} onConnect={() => setFlyModal(true)} onDisconnect={() => disconnect("fly")} tokenBased />
          <ConnectionCard name="Render" icon={<img src="/Render Symbol SVG.svg" alt="Render" className="h-6 w-6" />} iconBg="bg-white border shadow-sm" status={renderStatus} onConnect={() => setRenderModal(true)} onDisconnect={() => disconnect("render")} tokenBased />
          <ConnectionCard name="DigitalOcean" icon={<img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className="h-6 w-6" />} iconBg="bg-white" status={doStatus} onConnect={() => setDoModal(true)} onDisconnect={() => disconnect("digitalocean")} tokenBased />
          <ConnectionCard name="Heroku" icon={<img src="/Heroku Symbol SVG.svg" alt="Heroku" className="h-6 w-6" />} iconBg="bg-[#6762A6]" status={herokuStatus} onConnect={() => setHerokuModal(true)} onDisconnect={() => disconnect("heroku")} tokenBased />
        </div>

        {/* Notifications Section */}
        <h2 className="text-lg font-semibold mt-8 mb-4">Notifications & Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          <ConnectionCard name="Slack" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.523-2.52A2.528 2.528 0 0 1 8.834 0a2.527 2.527 0 0 1 2.52 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 0 1-2.52 2.521h6.313A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522-2.521H8.834zM18.958 8.834a2.528 2.528 0 0 1 2.522-2.523A2.528 2.528 0 0 1 24 8.834a2.527 2.527 0 0 1-2.52 2.52h-2.52V8.834zM17.687 8.834a2.527 2.527 0 0 1-2.521 2.52 2.527 2.527 0 0 1-2.521-2.52V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.166 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.166 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zM15.166 17.687a2.527 2.527 0 0 1 2.52-2.521 2.527 2.527 0 0 1-2.52-2.521H8.833A2.528 2.528 0 0 1 0 15.166a2.528 2.528 0 0 1 2.522 2.521h12.644z"/></svg>} iconBg="bg-[#4A154B]" status={slackStatus} onConnect={() => setSlackModal(true)} onDisconnect={() => disconnect("slack")} tokenBased />
          <ConnectionCard name="Discord" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.006 14.006 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>} iconBg="bg-[#5865F2]" status={discordStatus} onConnect={() => setDiscordModal(true)} onDisconnect={() => disconnect("discord")} tokenBased />
        </div>

        {/* Sync section */}
        {anyConnected && (
          <div className="space-y-4">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Sync Secrets</h2>
              {/* Provider tabs — full width row */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 text-xs overflow-x-auto">
                {(["github", "gitlab", "bitbucket", "vercel", "netlify", "aws", "doppler", "gcp", "azure", "railway", "fly", "render", "digitalocean", "heroku"] as SyncProvider[]).map(p => {
                  const labels: Record<SyncProvider, string> = { github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket", vercel: "Vercel", netlify: "Netlify", aws: "AWS Secrets", doppler: "Doppler", gcp: "Google Cloud", azure: "Azure Vault", railway: "Railway", fly: "Fly.io", render: "Render", digitalocean: "DigitalOcean", heroku: "Heroku", slack: "Slack", discord: "Discord" };
                  return (
                    <button key={p} onClick={() => setSyncProvider(p)} disabled={!providerConnected[p]}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all whitespace-nowrap ${
                        syncProvider === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      } ${!providerConnected[p] ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}>
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

              {/* Footer */}
              <div className="border-t">
                {/* Prefix row — only for non-AWS */}
                {syncProvider !== "aws" && (
                  <div className="px-4 py-2.5 flex items-center gap-3 border-b bg-muted/10">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap w-12">Prefix</Label>
                    <Input
                      placeholder="optional"
                      value={secretPrefix}
                      onChange={e => setSecretPrefix(e.target.value.toUpperCase())}
                      className="h-8 font-mono text-xs w-36"
                    />
                    {secretPrefix && (
                      <span className="text-[10px] text-muted-foreground">e.g. <span className="font-mono">{secretPrefix}_API_KEY</span></span>
                    )}
                  </div>
                )}
                {/* Action row */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                    <span className="font-medium text-foreground truncate max-w-[120px]">
                      {selectedProject ? projects.find(p => p.id === selectedProject)?.name : "—"}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span className="flex items-center gap-1 font-medium text-foreground truncate max-w-[180px]">
                      {providerIcon(syncProvider)}
                      <span className="truncate">{selectedRepoObj?.fullName || (syncProvider === "aws" ? awsStatus?.region || "AWS" : "—")}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canCompare && (
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCompare(v => !v)}>
                        <AlertCircle className="h-3.5 w-3.5" />{showCompare ? "Hide Diff" : "View Diff"}
                      </Button>
                    )}
                    <Button
                      onClick={handleSync}
                      disabled={syncing || !selectedProject || (!selectedRepo && syncProvider !== "aws") || !providerConnected[syncProvider]}
                      size="sm" className="gap-2 h-8"
                    >
                      {syncing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Syncing...</> : <><RefreshCw className="h-3.5 w-3.5" />Sync All</>}
                    </Button>
                  </div>
                </div>
              </div>
            {(syncProvider === "fly" || syncProvider === "render" || syncProvider === "digitalocean" || syncProvider === "heroku") && (
                <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm mx-4 mb-4">
                  <Info className="h-4 w-4" />
                  <p>Note: Updating secrets on **{syncProvider === "fly" ? "Fly.io" : syncProvider === "render" ? "Render" : syncProvider === "digitalocean" ? "DigitalOcean" : "Heroku"}** will trigger a new deployment/restart of your {syncProvider === "digitalocean" || syncProvider === "heroku" ? "app" : "service"}.</p>
                </div>
              )}
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
      <AwsConnectModal open={awsModal} onClose={() => setAwsModal(false)} onConnected={s => { setAwsStatus(s); }} currentRegion={awsStatus?.region} />
      <TokenModal open={dopplerModal} onClose={() => setDopplerModal(false)} onConnected={s => { setDopplerStatus(s); }} provider="doppler" providerName="Doppler" providerColor="#6366f1"
        steps={[
          { text: "Open", link: { href: "https://dashboard.doppler.com/workplace/integrations/service-tokens", label: "Doppler Dashboard → Integrations → Service Tokens" } },
          { text: "Or use a Personal Token: Account Settings → API Keys" },
          { text: "Create token with read+write access, copy once" },
        ]}
        scopeNote="Use a Service Token (dp.st.xxx) for project-scoped access, or a Personal Token (dp.pt.xxx) for full account access." />
      <BitbucketConnectModal open={bitbucketModal} onClose={() => setBitbucketModal(false)} onConnected={s => { setBitbucketStatus(s); }} />
      <GcpConnectModal open={gcpModal} onClose={() => setGcpModal(false)} onConnected={s => { setGcpStatus(s); }} />
      <AzureConnectModal open={azureModal} onClose={() => setAzureModal(false)} onConnected={s => { setAzureStatus(s); }} />
      <RailwayConnectModal open={railwayModal} onClose={() => setRailwayModal(false)} onConnected={s => { setRailwayStatus(s); }} />
      <FlyConnectModal open={flyModal} onClose={() => setFlyModal(false)} onConnected={s => { setFlyStatus(s); }} />
      <RenderConnectModal open={renderModal} onClose={() => setRenderModal(false)} onConnected={s => { setRenderStatus(s); }} />
      <DOConnectModal open={doModal} onClose={() => setDoModal(false)} onConnected={s => { setDoStatus(s); }} />
      <HerokuConnectModal open={herokuModal} onClose={() => setHerokuModal(false)} onConnected={s => { setHerokuStatus(s); }} />
      <SlackConnectModal open={slackModal} onClose={() => setSlackModal(false)} onConnected={s => { setSlackStatus(s); }} />
      <DiscordConnectModal open={discordModal} onClose={() => setDiscordModal(false)} onConnected={s => { setDiscordStatus(s); }} />
    </DashboardLayout>
  );
}
