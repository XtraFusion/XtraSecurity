"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Triangle, Info, ExternalLink, Eye, EyeOff, Loader2, Link2, 
  Mail, Send, Box, Activity, Flame, Database, HardDrive, Zap, 
  Ship, Building, Webhook, MessageSquare, Shield, Globe, Lock 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { IntegrationStatus } from "@/lib/integrations/types";
import { AWS_REGIONS } from "@/lib/integrations/config";

// ─── Vercel Connect Modal ──────────────────────────────────────────
export function VercelConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function TokenModal({ open, onClose, onConnected, provider, providerName, providerColor, steps, scopeNote }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void; provider: string; providerName: string; providerColor: string; steps: { text: string; link?: { href: string; label: string } }[]; scopeNote?: string; }) {
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
export function AwsConnectModal({ open, onClose, onConnected, currentRegion }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void; currentRegion?: string; }) {
  const [accessKeyId, setAccessKeyId] = useState(""); const [secretKey, setSecretKey] = useState(""); const [region, setRegion] = useState(currentRegion || "us-east-1"); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
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
export function BitbucketConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function GcpConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4" /><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853" /><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05" /><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335" /></svg> GCP Connection</DialogTitle><DialogDescription>Securely connect using a Service Account JSON key.</DialogDescription></DialogHeader>
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
            <textarea placeholder='{ "type": "service_account", ... }' value={json} onChange={e => setJson(e.target.value)} className="w-full h-32 p-3 text-[10px] font-mono border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none whitespace-pre-wrap break-all" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !json.trim()} className="gap-2 bg-[#4285F4] hover:bg-[#357ae8] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect GCP</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Azure Connect Modal ───────────────────────────────────────────
export function AzureConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M11.52.53L1.13 11.16l1.39 12.31L12.92 23.3l9.95-10.74L21.48.69l-9.96-.16zm0 2.21l7.74.12 1.11 9.77-7.75 8.35-8.08-.11-1.08-9.59 8.06-8.54z" fill="#0089D6" /><path d="M12.92 23.3s-9.95.17-10.4 0c-.45-.17 1.39-12.31 1.39-12.31l10.39-11 8.56.16 1.11 12.15-11.05 11z" fill="#0089D6" opacity=".1" /><path d="M11.52.53L1.13 11.16s9.9-.17 10.39-11L11.52.53z" fill="#0089D6" /><path d="M1.13 11.16l1.39 12.31s9.54.1 10.4 0c.86-.1 1.08-11 1.08-11L1.13 11.16z" fill="#0072C6" /></svg> Azure Connection</DialogTitle><DialogDescription>Connect using a Service Principal (App Registration).</DialogDescription></DialogHeader>
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
export function RailwayConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function FlyConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#4222E9] flex items-center justify-center p-1"><img src="/Fly (1)io Symbol SVG.svg" alt="Fly.io" className="h-full w-full object-contain" /></div> Fly.io Connection</DialogTitle><DialogDescription>Connect using a Fly API Token.</DialogDescription></DialogHeader>
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
export function RenderConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function DOConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function HerokuConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
export function SlackConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#4A154B] flex items-center justify-center p-1"><img src="/Slack Symbol SVG.svg" alt="Slack" className="h-full w-full object-contain" /></div> Slack Webhook</DialogTitle><DialogDescription>Get real-time sync alerts in your Slack channel.</DialogDescription></DialogHeader>
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

export function DiscordConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Webhook className="h-5 w-5 text-[#5865F2]" /> Discord Webhook</DialogTitle><DialogDescription>Get real-time sync alerts in your Discord channel.</DialogDescription></DialogHeader>
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

export function TeamsConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [url, setUrl] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!url.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookUrl: url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: "Teams Webhook" }); onClose(); toast({ title: "Microsoft Teams Connected ✓", description: "Test message sent to your Teams channel." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#6264A7] flex items-center justify-center p-1"><img src="/Microsoft Symbol SVG.svg" alt="Teams" className="h-full w-full object-contain" /></div> Microsoft Teams</DialogTitle><DialogDescription>Connect via an Incoming Webhook to receive alerts in a Teams channel.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to create an Incoming Webhook:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open a Teams channel → <strong className="text-foreground">More options (···)</strong> → <strong>Connectors</strong></li>
              <li>Search for <strong className="text-foreground">Incoming Webhook</strong> and click <strong>Configure</strong></li>
              <li>Name it "XtraSecurity", click <strong className="text-foreground">Create</strong>, copy the URL</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">A test message will be sent on connection. Stored AES-256-GCM encrypted.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Incoming Webhook URL</Label>
            <Input placeholder="https://xxx.webhook.office.com/webhookb2/..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !url.trim()} className="gap-2 bg-[#6264A7] hover:bg-[#4f527e] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Teams</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VaultConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [vaultAddr, setVaultAddr] = useState(""); const [token, setToken] = useState(""); const [namespace, setNamespace] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!vaultAddr.trim() || !token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/vault", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vaultAddr, token, namespace: namespace || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "HashiCorp Vault Connected ✓", description: `Vault at ${vaultAddr}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#1A1A1A] flex items-center justify-center font-bold text-[#FFCD00] text-xs">V</div> HashiCorp Vault</DialogTitle><DialogDescription>Connect using your Vault address and a Token with read/write access.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Prerequisites:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vault must be reachable from the internet (or use self-hosted XtraSecurity)</li>
              <li>Token requires at minimum <code className="bg-muted px-1 rounded">kv/*</code> policy</li>
            </ul>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Token stored AES-256-GCM encrypted. KV v1 & v2 supported.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Vault Address</Label><Input placeholder="https://vault.example.com:8200" value={vaultAddr} onChange={e => setVaultAddr(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Vault Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="hvs.XXXXXXXX" value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Namespace <span className="text-muted-foreground/60">(optional, HCP Vault / Enterprise)</span></Label><Input placeholder="admin" value={namespace} onChange={e => setNamespace(e.target.value)} className="h-9 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !vaultAddr.trim() || !token.trim()} className="gap-2 bg-[#1A1A1A] hover:bg-[#333] text-[#FFCD00]">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Vault</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CircleCIConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/circleci", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "CircleCI Connected ✓", description: `Linked as @${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-[#343434] flex items-center justify-center p-1"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#04D361" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 4.5c2.084 0 3.97.77 5.408 2.035A7.454 7.454 0 0 0 12 4.5zm0 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1 0-9zm-7.468 2.043A7.5 7.5 0 0 0 12 19.5a7.5 7.5 0 0 0 7.468-9.957A4.498 4.498 0 0 1 12 16.5a4.498 4.498 0 0 1-7.468-6.957z" /></svg></div> CircleCI</DialogTitle><DialogDescription>Connect using a CircleCI Personal API Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get a Personal API Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <a href="https://app.circleci.com/settings/user/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">CircleCI → User Settings → Personal API Tokens<ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>Click <strong className="text-foreground">Create New Token</strong>, name it "XtraSecurity"</li>
              <li>Copy the token (shown once) and paste below</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Stored AES-256-GCM encrypted.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Personal API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#343434] hover:bg-[#222] text-[#04D361]">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect CircleCI</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CloudflareConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiToken, setApiToken] = useState(""); const [accountId, setAccountId] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiToken.trim() || !accountId.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/cloudflare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiToken, accountId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Cloudflare Connected ✓", description: `Linked to ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#F6821F] flex items-center justify-center p-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 14.3c.2-.7.1-1.4-.3-1.9s-1-.8-1.7-.8H6.2c-.1 0-.1 0-.1.1l-.4 1.4c-.2.7-.1 1.4.3 1.9s1 .8 1.7.8h7c.1 0 .2-.1.2-.2l.6-1.3zM18 10.6c-.4-1.3-1.5-2.1-2.9-2.1-.1 0-.2 0-.4.1-.6-1.1-1.8-1.8-3.1-1.8-2.1 0-3.8 1.7-3.8 3.8v.1c-1.4.2-2.5 1.4-2.5 2.9 0 .1 0 .2.1.2H16c.1 0 .2-.1.2-.2l1.8-3z" /></svg></div> Cloudflare</DialogTitle><DialogDescription>Connect using an API Token scoped to Workers and Pages.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Cloudflare Dashboard → API Tokens<ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>Create token with <strong className="text-foreground">Workers Scripts:Edit</strong> + <strong className="text-foreground">Pages:Edit</strong> permissions</li>
              <li>Copy your <strong className="text-foreground">Account ID</strong> from the dashboard sidebar</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Account ID</Label><Input placeholder="a1b2c3d4e5f6..." value={accountId} onChange={e => setAccountId(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiToken.trim() || !accountId.trim()} className="gap-2 bg-[#F6821F] hover:bg-[#d9700f] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Cloudflare</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function JenkinsConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [jenkinsUrl, setJenkinsUrl] = useState(""); const [username, setUsername] = useState(""); const [apiToken, setApiToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!jenkinsUrl.trim() || !username.trim() || !apiToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/jenkins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jenkinsUrl, username, apiToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Jenkins Connected ✓", description: `Linked as ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#D33833] flex items-center justify-center text-white font-bold text-xs">J</div> Jenkins</DialogTitle><DialogDescription>Connect using your Jenkins instance URL and a personal API Token.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an API Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <strong className="text-foreground">Jenkins → People → Your User → Configure</strong></li>
              <li>Click <strong className="text-foreground">Add new Token</strong> under API Token section</li>
              <li>Copy the generated token (shown once)</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Requires <code className="bg-muted px-0.5 rounded">credentials.create</code> permission. Secrets sync to Jenkins Global Credentials Store.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Jenkins URL</Label><Input placeholder="https://jenkins.example.com" value={jenkinsUrl} onChange={e => setJenkinsUrl(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Username</Label><Input placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="h-9 text-xs" /></div>
            <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
              <div className="relative"><Input type={show ? "text" : "password"} placeholder="11abc..." value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
                <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !jenkinsUrl.trim() || !username.trim() || !apiToken.trim()} className="gap-2 bg-[#D33833] hover:bg-[#b52e2a] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Jenkins</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PagerDutyConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/pagerduty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "PagerDuty Connected ✓", description: `Linked as ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#06AC38] flex items-center justify-center text-white font-bold text-xs">PD</div> PagerDuty</DialogTitle><DialogDescription>Connect with a PagerDuty REST API Key to trigger incidents.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an API Key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://app.pagerduty.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">PagerDuty → Integrations → API Access Keys<ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>Click <strong className="text-foreground">Create New API Key</strong></li>
              <li>Choose <strong className="text-foreground">Full Access</strong> and copy the key</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Used to trigger incidents when secrets are breached or rotated. Key stored AES-256-GCM encrypted.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">REST API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="u+xxxxxxxxxxxx" value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiKey.trim()} className="gap-2 bg-[#06AC38] hover:bg-[#059130] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect PagerDuty</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TravisCIConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/travisci", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Travis CI Connected ✓", description: `Linked as @${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#3EAAAF] flex items-center justify-center text-white font-bold text-[10px]">CI</div> Travis CI</DialogTitle><DialogDescription>Connect using a Travis CI API Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an API Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://app.travis-ci.com/account/preferences" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Travis CI → Settings → API Authentication<ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>Copy your token (shown at bottom of the page)</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Syncs secrets as encrypted environment variables to Travis CI repos.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#3EAAAF] hover:bg-[#339a9f] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Travis CI</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SupabaseConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/supabase", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Supabase Connected ✓", description: `Linked to ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#3ECF8E] flex items-center justify-center text-black font-bold text-[10px]">SB</div> Supabase</DialogTitle><DialogDescription>Connect using a Supabase Personal Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an Access Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Supabase → Account → Access Tokens<ExternalLink className="h-2.5 w-2.5" /></a></li>
              <li>Click <strong className="text-foreground">Generate new token</strong>, name it "XtraSecurity"</li>
              <li>Copy the token (shown once)</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Personal Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="sbp_..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" onKeyDown={e => e.key === "Enter" && connect()} />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim()} className="gap-2 bg-[#3ECF8E] hover:bg-[#2db87a] text-black">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Supabase</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TelegramConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [botToken, setBotToken] = useState(""); const [chatId, setChatId] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!botToken.trim() || !chatId.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ botToken, chatId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Telegram Connected ✓", description: `Bot ${data.username} active — test message sent.` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#229ED9]" /> Telegram Bot</DialogTitle><DialogDescription>Connect your Telegram bot to receive security alerts.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram, send <code className="bg-muted px-0.5 rounded">/newbot</code> and copy the token</li>
              <li>Start a chat with your bot or add it to a group</li>
              <li>Get your Chat ID by messaging <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@userinfobot</a></li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">A test message will be sent on connection. Token stored AES-256-GCM encrypted.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Bot Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="123456:ABC-DEF..." value={botToken} onChange={e => setBotToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Chat ID</Label><Input placeholder="-1001234567890 or 123456789" value={chatId} onChange={e => setChatId(e.target.value)} className="h-9 font-mono text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !botToken.trim() || !chatId.trim()} className="gap-2 bg-[#229ED9] hover:bg-[#1a8bc5] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Telegram</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmailConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [smtpHost, setSmtpHost] = useState(""); const [smtpPort, setSmtpPort] = useState("465"); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [fromEmail, setFromEmail] = useState(""); const [toEmail, setToEmail] = useState(""); const [secure, setSecure] = useState(true); const [loading, setLoading] = useState(false); const [show, setShow] = useState(false);
  const connect = async () => {
    if (!smtpHost.trim() || !username.trim() || !password.trim() || !fromEmail.trim() || !toEmail.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ smtpHost, smtpPort, username, password, fromEmail, toEmail, secure }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Email Connected ✓", description: `Alerts will be sent to ${toEmail}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Alerts (SMTP)</DialogTitle><DialogDescription>Connect your SMTP server to receive security alerts via email.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">SMTP Host</Label><Input placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">SMTP Port</Label><Input placeholder="465" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Username</Label><Input placeholder="user@example.com" value={username} onChange={e => setUsername(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Password</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-9 pr-9 text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">From Email</Label><Input placeholder="alerts@xtrasecurity.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Send Alerts To</Label><Input placeholder="security@yourcompany.com" value={toEmail} onChange={e => setToEmail(e.target.value)} className="h-9 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Verifying...</> : <><Send className="h-3.5 w-3.5" />Verify & Connect</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TerraformConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiToken, setApiToken] = useState(""); const [organization, setOrganization] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/terraform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiToken, organization }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Terraform Connected ✓", description: `Linked as ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#7B42BC] flex items-center justify-center text-white font-bold text-[10px]">TF</div> Terraform Cloud</DialogTitle><DialogDescription>Connect using a Terraform Cloud API Token.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://app.terraform.io/app/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">User Settings → Tokens</a></li>
              <li>Create a new API token and copy it</li>
              <li>Optionally provide an organization name to sync variables to specific workspaces.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Organization (Optional)</Label><Input placeholder="my-org" value={organization} onChange={e => setOrganization(e.target.value)} className="h-9 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiToken.trim()} className="gap-2 bg-[#7B42BC] hover:bg-[#603299] text-white">Connect Terraform</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BuildkiteConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiToken, setApiToken] = useState(""); const [orgSlug, setOrgSlug] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiToken.trim() || !orgSlug.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/buildkite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiToken, orgSlug }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Buildkite Connected ✓", description: `Linked org: ${orgSlug}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#23D381] flex items-center justify-center text-black font-bold text-[10px]">BK</div> Buildkite</DialogTitle><DialogDescription>Connect using a Buildkite API Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a token at <a href="https://buildkite.com/user/api-access-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">User Settings → API Access Tokens</a></li>
              <li>Ensure it has <strong className="text-foreground">read_user</strong> and <strong className="text-foreground">write_pipelines</strong> scopes</li>
              <li>Copy your organization slug from the settings page.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Organization Slug</Label><Input placeholder="my-org" value={orgSlug} onChange={e => setOrgSlug(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiToken.trim() || !orgSlug.trim()} className="gap-2 bg-[#23D381] hover:bg-[#1bb06a] text-black">Connect Buildkite</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OpsgenieConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [region, setRegion] = useState("US"); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/opsgenie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, region }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Opsgenie Connected ✓", description: `Linked context: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#2563EB] flex items-center justify-center p-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L2.3 5.4v13.2L12 24l9.7-5.4V5.4L12 0zm0 18.5L5.7 15V9l6.3-3.5 6.3 3.5v6l-6.3 3.5z" /></svg></div> Opsgenie</DialogTitle><DialogDescription>Connect your Opsgenie account to trigger security incidents.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create an API Key in <a href="https://app.opsgenie.com/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → API</a></li>
              <li>Ensure the key has **create** and **read** permissions.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste GenieKey..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Data Center Region</Label>
            <Select value={region} onValueChange={setRegion}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="US">US (api.opsgenie.com)</SelectItem><SelectItem value="EU">EU (api.eu.opsgenie.com)</SelectItem></SelectContent></Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !apiKey.trim()} className="gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white">Connect Opsgenie</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChecklyConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiToken, setApiToken] = useState(""); const [accountId, setAccountId] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiToken.trim() || !accountId.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/checkly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiToken, accountId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Checkly Connected ✓", description: `Joined ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#4285F4] flex items-center justify-center p-1 font-bold text-white text-xs">C</div> Checkly</DialogTitle><DialogDescription>Connect Checkly to sync secrets to monitor environment variables.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Get a **User API Key** from <a href="https://app.checklyhq.com/settings/user/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">User Settings</a></li>
              <li>Find your **Account ID** in the URL or Account Settings.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">API Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Account ID</Label><Input placeholder="UUID..." value={accountId} onChange={e => setAccountId(e.target.value)} className="h-9 font-mono text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#4285F4] hover:bg-[#3267d6] text-white">Connect Checkly</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HasuraConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [personalAccessToken, setPersonalAccessToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!personalAccessToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/hasura", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personalAccessToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Hasura Cloud Connected ✓", description: `Owner: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#191D31] flex items-center justify-center p-1.5"><svg viewBox="0 0 24 24" className="h-full w-full fill-[#3ECF8E]" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></div> Hasura Cloud</DialogTitle><DialogDescription>Connect using a Hasura Cloud Personal Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://cloud.hasura.io/settings/access-tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Hasura Cloud → Settings → Access Tokens</a></li>
              <li>Create a new PAT and copy it.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Personal Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="hasura_pat_..." value={personalAccessToken} onChange={e => setPersonalAccessToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#191D31] hover:bg-[#252b45] text-white">Connect Hasura</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PostmanConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/postman", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Postman Connected ✓", description: `User: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#FF6C37] flex items-center justify-center p-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c.828 0 1.5.672 1.5 1.5S12.828 7.5 12 7.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm3 4.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zm-6 0c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5zM12 19.5c-3.314 0-6-2.686-6-6h12c0 3.314-2.686 6-6 6z" /></svg></div> Postman</DialogTitle><DialogDescription>Connect your Postman account to sync secrets to environments.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://web.postman.co/settings/me/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings → API Keys</a></li>
              <li>Generate a new key and paste it below.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="PMAK-..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#FF6C37] hover:bg-[#e65a2b] text-white">Connect Postman</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShopifyConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [shop, setShop] = useState(""); const [accessToken, setAccessToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!shop.trim() || !accessToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/shopify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shop, accessToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Shopify Connected ✓", description: `Store: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#96BF48] flex items-center justify-center p-1"><Box className="h-full w-full text-white" /></div> Shopify</DialogTitle><DialogDescription>Connect your Shopify store using an Admin API Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>In Shopify Admin, go to **Settings → Apps and sales channels**</li>
              <li>Click **Develop apps** and create a temporary app.</li>
              <li>Enable **write_metafields** scope and install the app.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Shop URL</Label><Input placeholder="my-store.myshopify.com" value={shop} onChange={e => setShop(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Admin Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="shpat_..." value={accessToken} onChange={e => setAccessToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#96BF48] hover:bg-[#7a9d3a] text-white">Connect Shopify</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TwilioConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [accountSid, setAccountSid] = useState(""); const [authToken, setAuthToken] = useState(""); const [fromNumber, setFromNumber] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!accountSid.trim() || !authToken.trim() || !fromNumber.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/twilio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountSid, authToken, fromNumber }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Twilio Connected ✓", description: `Account: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#F22F46] flex items-center justify-center p-1 font-bold text-white text-[8px]">TW</div> Twilio</DialogTitle><DialogDescription>Connect Twilio to receive SMS security alerts.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Account SID</Label><Input placeholder="AC..." value={accountSid} onChange={e => setAccountSid(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Auth Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="..." value={authToken} onChange={e => setAuthToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">From Phone Number</Label><Input placeholder="+1..." value={fromNumber} onChange={e => setFromNumber(e.target.value)} className="h-9 font-mono text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#F22F46] hover:bg-[#d1283c] text-white">Connect Twilio</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KubernetesConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiServer, setApiServer] = useState(""); const [token, setToken] = useState(""); const [skipTLS, setSkipTLS] = useState(false); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiServer.trim() || !token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/kubernetes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiServer, token, skipTLS }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Kubernetes Connected ✓", description: `Cluster: ${apiServer}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#326CE5] flex items-center justify-center p-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L2.3 5.4v13.2L12 24l9.7-5.4V5.4L12 0zm0 18.5L5.7 15V9l6.3-3.5 6.3 3.5v6l-6.3 3.5z" /></svg></div> Kubernetes</DialogTitle><DialogDescription>Connect your K8s cluster via Service Account Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">API Server URL</Label><Input placeholder="https://api.k8s.example.com" value={apiServer} onChange={e => setApiServer(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Service Account Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="eyJhbG..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="flex items-center space-x-2"><input type="checkbox" id="skipTLS" checked={skipTLS} onChange={e => setSkipTLS(e.target.checked)} className="rounded border-gray-300" /><Label htmlFor="skipTLS" className="text-xs text-muted-foreground">Skip TLS Verification (Danger)</Label></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#326CE5] hover:bg-[#2856b7] text-white">Connect Cluster</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LinearConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/linear", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Linear Connected ✓", description: `Joined: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#5E6AD2]" /> Linear</DialogTitle><DialogDescription>Connect Linear to create security issues automatically.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-1.5">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>In Linear, go to **Settings → API**</li>
              <li>Create a new **Personal API Key** and paste it below.</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Personal API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="lin_api_..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#5E6AD2] hover:bg-[#4a54a6] text-white">Connect Linear</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlanetScaleConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [org, setOrg] = useState(""); const [serviceTokenId, setServiceTokenId] = useState(""); const [serviceToken, setServiceToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!org.trim() || !serviceTokenId.trim() || !serviceToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/planetscale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ org, serviceTokenId, serviceToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "PlanetScale Connected ✓", description: `Org: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-black" /> PlanetScale</DialogTitle><DialogDescription>Connect using a Service Token for database automation.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Organization Name</Label><Input placeholder="my-org" value={org} onChange={e => setOrg(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Service Token ID</Label><Input placeholder="ps_tok_..." value={serviceTokenId} onChange={e => setServiceTokenId(e.target.value)} className="h-9 font-mono text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Service Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="..." value={serviceToken} onChange={e => setServiceToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#000000] hover:bg-[#333333] text-white">Connect PlanetScale</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BitwardenConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [accessToken, setAccessToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!accessToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/bitwarden", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Bitwarden Connected ✓", description: "Secrets Manager access enabled." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#175DDC]" /> Bitwarden</DialogTitle><DialogDescription>Connect Bitwarden Secrets Manager via Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Secrets Manager Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="bw_sm_..." value={accessToken} onChange={e => setAccessToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#175DDC] hover:bg-[#1249ad] text-white">Connect Bitwarden</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GhostConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [url, setUrl] = useState(""); const [adminKey, setAdminKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!url.trim() || !adminKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/ghost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, adminKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Ghost Connected ✓", description: `Site: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-[#15171A]" /> Ghost CMS</DialogTitle><DialogDescription>Connect your Ghost blog as a security log target.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Ghost API URL</Label><Input placeholder="https://blog.example.com" value={url} onChange={e => setUrl(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Admin API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="65..." value={adminKey} onChange={e => setAdminKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#15171A] hover:bg-[#000000] text-white">Connect Ghost</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppwriteConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [endpoint, setEndpoint] = useState("https://cloud.appwrite.io/v1"); const [project, setProject] = useState(""); const [apiKey, setApiKey] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!endpoint.trim() || !project.trim() || !apiKey.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/appwrite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint, project, apiKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Appwrite Connected ✓", description: `Project: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Box className="h-5 w-5 text-[#F02E65]" /> Appwrite</DialogTitle><DialogDescription>Connect Appwrite project to manage cloud variables.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">API Endpoint</Label><Input placeholder="https://cloud.appwrite.io/v1" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Project ID</Label><Input placeholder="65..." value={project} onChange={e => setProject(e.target.value)} className="h-9 text-xs font-mono" /></div>
          <div className="space-y-1.5"><Label className="text-xs">API Key</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="..." value={apiKey} onChange={e => setApiKey(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#F02E65] hover:bg-[#d62456] text-white">Connect Appwrite</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotionConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [databaseId, setDatabaseId] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim() || !databaseId.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/notion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, databaseId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Notion Connected ✓", description: `Database: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-black" /> Notion</DialogTitle><DialogDescription>Connect a Notion database for tracking.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Integration Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="secret_..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Database ID</Label><Input placeholder="4b2..." value={databaseId} onChange={e => setDatabaseId(e.target.value)} className="h-9 text-xs font-mono" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-black hover:bg-zinc-800 text-white border border-zinc-700">Connect Notion</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GoogleDriveConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [serviceAccount, setServiceAccount] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!serviceAccount.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/googledrive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceAccount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Google Drive Connected ✓", description: "Automated backups enabled." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-[#4285F4]" /> Google Drive</DialogTitle><DialogDescription>Connect Drive via Service Account for backups.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Service Account JSON</Label><Textarea placeholder='{ "type": "service_account", ... }' value={serviceAccount} onChange={e => setServiceAccount(e.target.value)} className="h-40 text-[10px] font-mono leading-relaxed resize-none w-full whitespace-pre-wrap break-all" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#4285F4] hover:bg-[#3367d6] text-white">Connect Google Drive</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ZapierConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [webhookUrl, setWebhookUrl] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!webhookUrl.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/zapier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Zapier Linked ✓", description: "Automation triggers ready." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#FF4F00]" /> Zapier</DialogTitle><DialogDescription>Connect a Zapier Webhook URL.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Webhook URL</Label><Input placeholder="https://hooks.zapier.com/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="h-9 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#FF4F00] hover:bg-[#e64600] text-white font-semibold">Link Zapier</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BitbucketPipelinesConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [username, setUsername] = useState(""); const [appPassword, setAppPassword] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!username.trim() || !appPassword.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/bitbucketpipelines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, appPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Pipelines Connected ✓", description: "Repository variables unlocked." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#0052CC] flex items-center justify-center p-1.5"><Ship className="h-full w-full text-white" /></div> Bitbucket Pipelines</DialogTitle><DialogDescription>Connect via BB Username and App Password.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Username</Label><Input placeholder="myuser" value={username} onChange={e => setUsername(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">App Password</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="app_..." value={appPassword} onChange={e => setAppPassword(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#0052CC] hover:bg-[#0047b3] text-white">Connect Pipelines</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GitLabSelfManagedConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [instanceUrl, setInstanceUrl] = useState(""); const [privateToken, setPrivateToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!instanceUrl.trim() || !privateToken.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/gitlabselfmanaged", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instanceUrl, privateToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "GitLab Self-Managed Connected ✓", description: `Instance: ${instanceUrl}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#FC6D26] flex items-center justify-center p-1.5"><Building className="h-full w-full text-white" /></div> GitLab Self-Managed</DialogTitle><DialogDescription>Connect to your private GitLab instance.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Instance URL</Label><Input placeholder="https://gitlab.mycompany.com" value={instanceUrl} onChange={e => setInstanceUrl(e.target.value)} className="h-9 text-xs font-mono" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Private Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="glpat-..." value={privateToken} onChange={e => setPrivateToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#FC6D26] hover:bg-[#e24329] text-white">Connect GitLab</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DiscordWebhookConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [webhookUrl, setWebhookUrl] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!webhookUrl.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/discordwebhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Discord Linked ✓", description: "Channel notifications active." });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#5865F2] flex items-center justify-center p-1.5"><Webhook className="h-full w-full text-white" /></div> Discord Webhook</DialogTitle><DialogDescription>Connect a Discord channel for alerts.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Webhook URL</Label><Input placeholder="https://discord.com/api/webhooks/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="h-9 text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold">Link Discord</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MattermostConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [url, setUrl] = useState(""); const [token, setToken] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!url.trim() || !token.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/mattermost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Mattermost Connected ✓", description: `Server: ${url}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#0058CC] flex items-center justify-center p-1.5"><MessageSquare className="h-full w-full text-white" /></div> Mattermost</DialogTitle><DialogDescription>Connect via Server URL and Personal Access Token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label className="text-xs">Mattermost URL</Label><Input placeholder="https://mattermost.myorg.com" value={url} onChange={e => setUrl(e.target.value)} className="h-9 text-xs font-mono" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="token_..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading} className="gap-2 bg-[#0058CC] hover:bg-[#0047b3] text-white">Connect Mattermost</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OnePasswordConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [serverUrl, setServerUrl] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim() || !serverUrl.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/onepassword", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, serverUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "1Password Connected ✓", description: `Vault: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#0094F5] flex items-center justify-center p-1.5"><Shield className="h-full w-full text-white" /></div> 1Password</DialogTitle><DialogDescription>Connect using a 1Password Connect Server token.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Deploy a <a href="https://developer.1password.com/docs/connect/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">1Password Connect Server</a></li>
              <li>Create a <strong className="text-foreground">Service Account Token</strong> with vault access</li>
              <li>Paste the server URL and token below</li>
            </ol>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Connect Server URL</Label><Input placeholder="https://connect.myorg.com" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className="h-9 text-xs font-mono" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Access Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="Paste token..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim() || !serverUrl.trim()} className="gap-2 bg-[#0094F5] hover:bg-[#007ad4] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect 1Password</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FirebaseConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [json, setJson] = useState(""); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!json.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/firebase", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceAccountJson: json }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.projectId }); onClose(); toast({ title: "Firebase Connected ✓", description: `Project: ${data.projectId}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#FFCA28] flex items-center justify-center p-1.5"><Flame className="h-full w-full text-white" /></div> Firebase</DialogTitle><DialogDescription>Connect using a Firebase Service Account JSON key.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open <a href="https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console → Project Settings → Service Accounts</a></li>
              <li>Click <strong className="text-foreground">Generate new private key</strong></li>
              <li>Paste the contents of the downloaded JSON file below</li>
            </ol>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Service Account JSON</Label>
            <textarea placeholder={'{ "type": "service_account", ... }'} value={json} onChange={e => setJson(e.target.value)} className="w-full h-32 p-3 text-[10px] font-mono border rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary resize-none whitespace-pre-wrap break-all" />
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !json.trim()} className="gap-2 bg-[#FFCA28] hover:bg-[#e6b523] text-black font-semibold">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Firebase</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SentryConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: (s: IntegrationStatus) => void }) {
  const [token, setToken] = useState(""); const [org, setOrg] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const connect = async () => {
    if (!token.trim() || !org.trim()) return; setLoading(true);
    try {
      const res = await fetch("/api/integrations/sentry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, org }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected({ connected: true, username: data.username }); onClose(); toast({ title: "Sentry Connected ✓", description: `Org: ${data.username}` });
    } catch (e: any) { toast({ title: "Connection Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-7 w-7 rounded-md bg-[#362D59] flex items-center justify-center p-1.5"><Activity className="h-full w-full text-white" /></div> Sentry</DialogTitle><DialogDescription>Connect using a Sentry Auth Token to report events and manage releases.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-lg border text-[11px] space-y-2">
            <p className="font-semibold text-muted-foreground flex items-center gap-1.5"><Info className="h-3 w-3" /> How to get an Auth Token:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://sentry.io/settings/account/api/auth-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sentry → Settings → Auth Tokens</a></li>
              <li>Create a token with <strong className="text-foreground">project:read</strong> and <strong className="text-foreground">org:read</strong> scopes</li>
              <li>Copy the token and your organization slug</li>
            </ol>
            <p className="text-[10px] border-t pt-1 text-muted-foreground/70">Stored AES-256-GCM encrypted.</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Organization Slug</Label><Input placeholder="my-org" value={org} onChange={e => setOrg(e.target.value)} className="h-9 text-xs" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Auth Token</Label>
            <div className="relative"><Input type={show ? "text" : "password"} placeholder="sntrys_..." value={token} onChange={e => setToken(e.target.value)} className="h-9 pr-9 font-mono text-xs" />
              <button onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button><Button size="sm" onClick={connect} disabled={loading || !token.trim() || !org.trim()} className="gap-2 bg-[#362D59] hover:bg-[#2a2247] text-white">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</> : <><Link2 className="h-3.5 w-3.5" />Connect Sentry</>}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const INTEGRATION_MODAL_REGISTRY: Record<string, any> = {
  vercel: (props: any) => <TokenModal {...props} provider="vercel" providerName="Vercel" providerColor="#000000" steps={[{ text: "Go to", link: { href: "https://vercel.com/account/tokens", label: "Vercel → Settings → Tokens" } }, { text: "Create a new token with Full Access" }]} />,
  netlify: (props: any) => <TokenModal {...props} provider="netlify" providerName="Netlify" providerColor="#00C7B7" steps={[{ text: "Go to", link: { href: "https://app.netlify.com/user/applications#personal-access-tokens", label: "Netlify → User Settings → Applications" } }, { text: "Create a new personal access token" }]} />,
  github: (props: any) => null,
  gitlab: (props: any) => null,
  aws: AwsConnectModal,
  doppler: (props: any) => <TokenModal {...props} provider="doppler" providerName="Doppler" providerColor="#D33833" steps={[{ text: "Go to Doppler Dashboard → Project → Config → Access" }, { text: "Create Service Token" }]} />,
  bitbucket: (props: any) => <TokenModal {...props} provider="bitbucket" providerName="Bitbucket" providerColor="#0052CC" steps={[{ text: "Go to Personal Settings → App Passwords" }, { text: "Create App Password with 'Variable: Write' scope" }]} />,
  gcp: (props: any) => <TokenModal {...props} provider="gcp" providerName="Google Cloud" providerColor="#4285F4" steps={[{ text: "Go to IAM & Admin → Service Accounts" }, { text: "Create Key and download JSON" }]} />,
  azure: (props: any) => <TokenModal {...props} provider="azure" providerName="Azure" providerColor="#0089D6" steps={[{ text: "Go to App Registrations → New Registration" }, { text: "Create Client Secret" }]} />,
  railway: (props: any) => <TokenModal {...props} provider="railway" providerName="Railway" providerColor="#0B0D0E" steps={[{ text: "Go to Account Settings → Tokens" }, { text: "Create New Token" }]} />,
  fly: (props: any) => <TokenModal {...props} provider="fly" providerName="Fly.io" providerColor="#4222E9" steps={[{ text: "Run 'fly auth token' in your terminal" }]} />,
  render: (props: any) => <TokenModal {...props} provider="render" providerName="Render" providerColor="#000000" steps={[{ text: "Go to Account Settings → API Keys" }, { text: "Create API Key" }]} />,
  digitalocean: (props: any) => <TokenModal {...props} provider="digitalocean" providerName="DigitalOcean" providerColor="#0080FF" steps={[{ text: "Go to API → Tokens/Keys" }, { text: "Generate New Token" }]} />,
  heroku: (props: any) => <TokenModal {...props} provider="heroku" providerName="Heroku" providerColor="#6762A6" steps={[{ text: "Go to Account Settings → API Key" }]} />,
  slack: (props: any) => <TokenModal {...props} provider="slack" providerName="Slack" providerColor="#4A154B" steps={[{ text: "Create a Slack App" }, { text: "Enable Incoming Webhooks" }]} />,
  discord: (props: any) => <TokenModal {...props} provider="discord" providerName="Discord" providerColor="#5865F2" steps={[{ text: "Channel Settings → Integrations → Webhooks" }]} />,
  teams: (props: any) => <TokenModal {...props} provider="teams" providerName="Microsoft Teams" providerColor="#6264A7" steps={[{ text: "Channel → Connectors → Incoming Webhook" }]} />,
  vault: (props: any) => <TokenModal {...props} provider="vault" providerName="Vault" providerColor="#000000" steps={[{ text: "Generate a new Vault token with 'secret' access" }]} />,
  circleci: (props: any) => <TokenModal {...props} provider="circleci" providerName="CircleCI" providerColor="#343434" steps={[{ text: "User Settings → Personal API Tokens" }]} />,
  cloudflare: (props: any) => <TokenModal {...props} provider="cloudflare" providerName="Cloudflare" providerColor="#F6821F" steps={[{ text: "My Profile → API Tokens → Create Token" }]} />,
  jenkins: (props: any) => <TokenModal {...props} provider="jenkins" providerName="Jenkins" providerColor="#D33833" steps={[{ text: "User → Settings → API Token" }]} />,
  pagerduty: (props: any) => <TokenModal {...props} provider="pagerduty" providerName="PagerDuty" providerColor="#06AC38" steps={[{ text: "Integrations → API Access Keys" }]} />,
  travisci: (props: any) => <TokenModal {...props} provider="travisci" providerName="Travis CI" providerColor="#3EAAAF" steps={[{ text: "User Settings → API Token" }]} />,
  supabase: (props: any) => <TokenModal {...props} provider="supabase" providerName="Supabase" providerColor="#3ECF8E" steps={[{ text: "Account Settings → Access Tokens" }]} />,
  telegram: (props: any) => <TokenModal {...props} provider="telegram" providerName="Telegram" providerColor="#229ED9" steps={[{ text: "Create bot via @BotFather" }]} />,
  email: (props: any) => <TokenModal {...props} provider="email" providerName="Email" providerColor="#2563EB" steps={[{ text: "Enter destination email address" }]} />,
  terraform: (props: any) => <TokenModal {...props} provider="terraform" providerName="Terraform" providerColor="#7B42BC" steps={[{ text: "User Settings → Tokens → Create API Token" }]} />,
  buildkite: (props: any) => <TokenModal {...props} provider="buildkite" providerName="Buildkite" providerColor="#23D381" steps={[{ text: "Account Settings → API Access Tokens" }]} />,
  opsgenie: (props: any) => <TokenModal {...props} provider="opsgenie" providerName="Opsgenie" providerColor="#2563EB" steps={[{ text: "Settings → API Key Management" }]} />,
  checkly: (props: any) => <TokenModal {...props} provider="checkly" providerName="Checkly" providerColor="#4285F4" steps={[{ text: "User Settings → API Keys" }]} />,
  hasura: (props: any) => <TokenModal {...props} provider="hasura" providerName="Hasura" providerColor="#191D31" steps={[{ text: "Project Settings → Admin Secret" }]} />,
  postman: (props: any) => <TokenModal {...props} provider="postman" providerName="Postman" providerColor="#FF6C37" steps={[{ text: "Settings → API Keys" }]} />,
  shopify: (props: any) => <TokenModal {...props} provider="shopify" providerName="Shopify" providerColor="#96BF48" steps={[{ text: "Apps → App settings → Develop apps" }]} />,
  twilio: (props: any) => <TokenModal {...props} provider="twilio" providerName="Twilio" providerColor="#F22F46" steps={[{ text: "Console → Account SID & Auth Token" }]} />,
  kubernetes: (props: any) => <TokenModal {...props} provider="kubernetes" providerName="Kubernetes" providerColor="#326CE5" steps={[{ text: "Download Kubeconfig file" }]} />,
  linear: (props: any) => <TokenModal {...props} provider="linear" providerName="Linear" providerColor="#5E6AD2" steps={[{ text: "Settings → API → Personal API Keys" }]} />,
  planetscale: (props: any) => <TokenModal {...props} provider="planetscale" providerName="PlanetScale" providerColor="#000000" steps={[{ text: "Settings → Service Tokens" }]} />,
  bitwarden: (props: any) => <TokenModal {...props} provider="bitwarden" providerName="Bitwarden" providerColor="#175DDC" steps={[{ text: "Settings → Security → Access Token" }]} />,
  ghost: (props: any) => <TokenModal {...props} provider="ghost" providerName="Ghost" providerColor="#15171A" steps={[{ text: "Settings → Integrations → Custom Integration" }]} />,
  appwrite: (props: any) => <TokenModal {...props} provider="appwrite" providerName="Appwrite" providerColor="#F02E65" steps={[{ text: "Project Settings → API Keys" }]} />,
  onepassword: OnePasswordConnectModal,
  firebase: FirebaseConnectModal,
  sentry: SentryConnectModal,
  notion: (props: any) => <TokenModal {...props} provider="notion" providerName="Notion" providerColor="#000000" steps={[{ text: "Settings → Connections → Create new integration" }]} />,
  googledrive: (props: any) => <TokenModal {...props} provider="googledrive" providerName="Google Drive" providerColor="#4285F4" steps={[{ text: "Enable Drive API → Create Credentials" }]} />,
  zapier: (props: any) => <TokenModal {...props} provider="zapier" providerName="Zapier" providerColor="#FF4F00" steps={[{ text: "Settings → Developer → API Keys" }]} />,
  bitbucketpipelines: (props: any) => <TokenModal {...props} provider="bitbucketpipelines" providerName="Bitbucket Pipelines" providerColor="#0052CC" steps={[{ text: "Repository Settings → Pipelines → Variables" }]} />,
  gitlabselfmanaged: (props: any) => <TokenModal {...props} provider="gitlabselfmanaged" providerName="GitLab Self-Managed" providerColor="#FC6D26" steps={[{ text: "User Settings → Access Tokens" }]} />,
  discordwebhook: (props: any) => <TokenModal {...props} provider="discordwebhook" providerName="Discord Webhook" providerColor="#5865F2" steps={[{ text: "Channel Settings → Integrations → Webhooks" }]} />,
  mattermost: MattermostConnectModal,
};


