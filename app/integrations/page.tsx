"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Github,
  Gitlab,
  Trash2,
  RefreshCw,
  Check,
  Loader2,
  Lock,
  Link2,
  Unlink,
  ArrowRight,
  Globe,
  Shield,
  Triangle,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from "@/hooks/useUser";

interface IntegrationStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
  authUrl?: string;
}

interface Repo {
  id: number | string;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
  framework?: string | null;
}

type SyncProvider = "github" | "gitlab" | "vercel";

/* ── Vercel Connect Modal ─────────────────────────────────────── */
function VercelConnectModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected: (status: IntegrationStatus) => void;
}) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) {
      toast({ title: "Token required", description: "Paste your Vercel Personal Access Token.", variant: "destructive" });
      return;
    }
    try {
      setConnecting(true);
      const res = await fetch("/api/integrations/vercel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      toast({ title: "Vercel Connected ✓", description: `Linked as @${data.username}` });
      onConnected({ connected: true, username: data.username });
      setToken("");
      onClose();
    } catch (err: any) {
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-black flex items-center justify-center">
              <Triangle className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            Connect Vercel
          </DialogTitle>
          <DialogDescription>
            Paste a Vercel Personal Access Token to link your account. Secrets will be pushed as encrypted environment variables.
          </DialogDescription>
        </DialogHeader>

        {/* Step-by-step guide */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> How to get your token
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Open <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">vercel.com/account/tokens <ExternalLink className="h-2.5 w-2.5" /></a></li>
            <li>Click <strong className="text-foreground">Create</strong> and give it a name (e.g. "XtraSecurity")</li>
            <li>Set expiry to <strong className="text-foreground">No Expiration</strong> (or your preferred duration)</li>
            <li>Copy the generated token and paste it below</li>
          </ol>
          <p className="text-[10px] text-muted-foreground/70 border-t pt-2 mt-1">
            Required scope: Full Account access. The token is stored encrypted using AES-256-GCM.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vercel-token" className="text-xs font-medium">Personal Access Token</Label>
          <div className="relative">
            <Input
              id="vercel-token"
              type={showToken ? "text" : "password"}
              placeholder="Enter your Vercel Personal Access Token..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-9 pr-9 font-mono text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={connecting}>Cancel</Button>
          <Button size="sm" onClick={handleConnect} disabled={connecting || !token.trim()} className="gap-2">
            {connecting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...</> : <><Link2 className="h-3.5 w-3.5" /> Connect</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function IntegrationsPage() {
  const { user, selectedWorkspace } = useUser();
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(null);
  const [gitlabStatus, setGitlabStatus] = useState<IntegrationStatus | null>(null);
  const [vercelStatus, setVercelStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("github");
  const [githubRepos, setGithubRepos] = useState<Repo[]>([]);
  const [gitlabRepos, setGitlabRepos] = useState<Repo[]>([]);
  const [vercelRepos, setVercelRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  const [vercelModalOpen, setVercelModalOpen] = useState(false);

  const repos =
    syncProvider === "github"
      ? githubRepos
      : syncProvider === "gitlab"
      ? gitlabRepos
      : vercelRepos;

  useEffect(() => {
    fetchAllStatuses();
    loadProjects();
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "github_connected") {
      toast({ title: "GitHub Connected!", description: "Your GitHub account is now linked." });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("success") === "gitlab_connected") {
      toast({ title: "GitLab Connected!", description: "Your GitLab account is now linked." });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      toast({ title: "Connection Failed", description: params.get("error"), variant: "destructive" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => { if (githubStatus?.connected) fetchGithubRepos(); }, [githubStatus?.connected]);
  useEffect(() => { if (gitlabStatus?.connected) fetchGitlabRepos(); }, [gitlabStatus?.connected]);
  useEffect(() => { if (vercelStatus?.connected) fetchVercelProjects(); }, [vercelStatus?.connected]);

  useEffect(() => {
    if (githubStatus && gitlabStatus && vercelStatus) {
      if (!githubStatus.connected && !gitlabStatus.connected && vercelStatus.connected) setSyncProvider("vercel");
      else if (!githubStatus.connected && gitlabStatus.connected) setSyncProvider("gitlab");
    }
  }, [githubStatus, gitlabStatus, vercelStatus]);

  useEffect(() => { setSelectedRepo(""); setSyncResults(null); }, [syncProvider]);

  const fetchAllStatuses = async () => {
    try {
      setLoading(true);
      const [ghRes, glRes, vcRes] = await Promise.all([
        fetch("/api/integrations/github"),
        fetch("/api/integrations/gitlab"),
        fetch("/api/integrations/vercel"),
      ]);
      if (ghRes.ok) setGithubStatus(await ghRes.json());
      if (glRes.ok) setGitlabStatus(await glRes.json());
      if (vcRes.ok) setVercelStatus(await vcRes.json());
    } catch (error) {
      console.error("Failed to fetch integration status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await ProjectController.fetchProjects();
      if (Array.isArray(data)) setProjects(data);
    } catch (error) {
      console.error("Failed to load projects", error);
    }
  };

  const fetchGithubRepos = async () => {
    try {
      const res = await fetch("/api/integrations/github/sync");
      if (res.ok) { const data = await res.json(); setGithubRepos(data.repos || []); }
    } catch (error) { console.error("Failed to fetch GitHub repos:", error); }
  };

  const fetchGitlabRepos = async () => {
    try {
      const res = await fetch("/api/integrations/gitlab/sync");
      if (res.ok) { const data = await res.json(); setGitlabRepos(data.repos || []); }
    } catch (error) { console.error("Failed to fetch GitLab repos:", error); }
  };

  const fetchVercelProjects = async () => {
    try {
      const res = await fetch("/api/integrations/vercel/sync");
      if (res.ok) { const data = await res.json(); setVercelRepos(data.repos || []); }
    } catch (error) { console.error("Failed to fetch Vercel projects:", error); }
  };

  const disconnectIntegration = async (provider: SyncProvider) => {
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
      if (res.ok) {
        if (provider === "github") { setGithubStatus({ connected: false }); setGithubRepos([]); }
        else if (provider === "gitlab") { setGitlabStatus({ connected: false }); setGitlabRepos([]); }
        else { setVercelStatus({ connected: false }); setVercelRepos([]); }
        if (syncProvider === provider) setSyncResults(null);
        const label = provider === "github" ? "GitHub" : provider === "gitlab" ? "GitLab" : "Vercel";
        toast({ title: "Disconnected", description: `${label} account unlinked.` });
        fetchAllStatuses();
      }
    } catch {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleSync = async () => {
    if (!selectedProject || !selectedRepo) {
      toast({ title: "Missing fields", description: "Select a project and repository first.", variant: "destructive" });
      return;
    }
    try {
      setSyncing(true); setSyncResults(null);
      const repo = repos.find((r) => r.id.toString() === selectedRepo);
      if (!repo) return;

      let res: Response;
      if (syncProvider === "github") {
        res = await fetch("/api/integrations/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, repoOwner: repo.owner, repoName: repo.name, secretPrefix }),
        });
      } else if (syncProvider === "gitlab") {
        res = await fetch("/api/integrations/gitlab/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, gitlabProjectId: repo.id, secretPrefix }),
        });
      } else {
        // Vercel
        res = await fetch("/api/integrations/vercel/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, vercelProjectId: repo.id, secretPrefix }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults(data);
      toast({ title: "Sync Complete ✓", description: `${data.summary.synced} secrets pushed to ${data.repo}` });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSecret = async (secretKey: string) => {
    const repo = repos.find((r) => r.id.toString() === selectedRepo);
    if (!repo) return;
    try {
      let res: Response;
      if (syncProvider === "github") {
        res = await fetch(`/api/integrations/github/sync?repoOwner=${repo.owner}&repoName=${repo.name}&secretName=${secretKey}`, { method: "DELETE" });
      } else if (syncProvider === "gitlab") {
        res = await fetch(`/api/integrations/gitlab/sync?gitlabProjectId=${repo.id}&variableKey=${secretKey}`, { method: "DELETE" });
      } else {
        res = await fetch(`/api/integrations/vercel/sync?vercelProjectId=${repo.id}&secretName=${secretKey}`, { method: "DELETE" });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults((prev: any) => ({
        ...prev,
        results: prev.results.filter((r: any) => r.key !== secretKey),
        summary: { ...prev.summary, total: prev.summary.total - 1, synced: prev.summary.synced - 1 },
      }));
      toast({ title: "Deleted", description: `${secretKey} removed from ${syncProvider}` });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
  const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

  const anyConnected = githubStatus?.connected || gitlabStatus?.connected || vercelStatus?.connected;
  const currentProviderConnected =
    syncProvider === "github"
      ? githubStatus?.connected
      : syncProvider === "gitlab"
      ? gitlabStatus?.connected
      : vercelStatus?.connected;

  if (!hasAdminAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm text-center max-w-sm">Only workspace owners can manage integrations.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const selectedRepoObj = repos.find((r) => r.id.toString() === selectedRepo);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect external services and sync secrets to your CI/CD pipelines.</p>
        </div>

        {/* Connection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* GitHub */}
          <ConnectionCard
            name="GitHub"
            icon={<Github className="h-5 w-5 text-white" />}
            iconBg="bg-[#24292e]"
            status={githubStatus}
            onConnect={() => (window.location.href = githubStatus?.authUrl || "#")}
            onDisconnect={() => disconnectIntegration("github")}
          />
          {/* GitLab */}
          <ConnectionCard
            name="GitLab"
            icon={<Gitlab className="h-5 w-5 text-white" />}
            iconBg="bg-[#FC6D26]"
            status={gitlabStatus}
            onConnect={() => (window.location.href = gitlabStatus?.authUrl || "#")}
            onDisconnect={() => disconnectIntegration("gitlab")}
          />
          {/* Vercel */}
          <ConnectionCard
            name="Vercel"
            icon={<Triangle className="h-4 w-4 text-white fill-white" />}
            iconBg="bg-black"
            status={vercelStatus}
            onConnect={() => setVercelModalOpen(true)}
            onDisconnect={() => disconnectIntegration("vercel")}
            tokenBased
          />
          {/* Coming soon cards */}
          {(["Netlify", "AWS Secrets Manager", "Doppler"] as const).map((name) => (
            <div key={name} className="rounded-lg border border-dashed p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
              <Globe className="h-5 w-5 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs font-medium text-muted-foreground">{name}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Coming soon</p>
            </div>
          ))}
        </div>

        {/* Sync section */}
        {anyConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sync Secrets</h2>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setSyncProvider("github")}
                  disabled={!githubStatus?.connected}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${syncProvider === "github" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"} ${!githubStatus?.connected ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <Github className="h-3 w-3" /> GitHub
                </button>
                <button
                  onClick={() => setSyncProvider("gitlab")}
                  disabled={!gitlabStatus?.connected}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${syncProvider === "gitlab" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"} ${!gitlabStatus?.connected ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <Gitlab className="h-3 w-3" /> GitLab
                </button>
                <button
                  onClick={() => setSyncProvider("vercel")}
                  disabled={!vercelStatus?.connected}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${syncProvider === "vercel" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"} ${!vercelStatus?.connected ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  <Triangle className="h-3 w-3 fill-current" /> Vercel
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">

                {/* Project */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select project..." /></SelectTrigger>
                    <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Environment */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Environment</Label>
                  <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Development</div></SelectItem>
                      <SelectItem value="staging"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Staging {syncProvider === "vercel" && <span className="text-[10px] text-muted-foreground">(→ Preview)</span>}</div></SelectItem>
                      <SelectItem value="production"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Production</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repository / Project */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    {syncProvider === "github" ? "Repository" : syncProvider === "gitlab" ? "GitLab Project" : "Vercel Project"}
                  </Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {repos.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          <div className="flex items-center gap-2">
                            {r.private ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Globe className="h-3 w-3 text-muted-foreground" />}
                            {r.fullName}
                            {r.framework && <span className="text-[10px] text-muted-foreground">({r.framework})</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prefix + Sync button */}
              <div className="border-t px-4 py-3 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Prefix</Label>
                  <Input
                    placeholder="optional"
                    value={secretPrefix}
                    onChange={(e) => setSecretPrefix(e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs max-w-[120px]"
                  />
                  {secretPrefix && <span className="text-[10px] text-muted-foreground">e.g. {secretPrefix}_API_KEY</span>}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedProject ? projects.find((p) => p.id === selectedProject)?.name : "—"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {syncProvider === "github" ? <Github className="h-3 w-3" /> : syncProvider === "gitlab" ? <Gitlab className="h-3 w-3 text-[#FC6D26]" /> : <Triangle className="h-3 w-3 fill-current" />}
                    {selectedRepoObj?.fullName || "—"}
                  </span>
                </div>

                <Button
                  onClick={handleSync}
                  disabled={syncing || !selectedProject || !selectedRepo || !currentProviderConnected}
                  size="sm"
                  className="gap-2 ml-auto"
                >
                  {syncing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing...</> : <><RefreshCw className="h-3.5 w-3.5" /> Sync</>}
                </Button>
              </div>
            </div>

            {/* Sync results */}
            {syncResults && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-medium">Synced to {syncResults.repo}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 dark:text-green-400 font-medium">{syncResults.summary.synced} synced</span>
                    {syncResults.summary.failed > 0 && <span className="text-destructive font-medium">{syncResults.summary.failed} failed</span>}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/10">
                        <th className="text-left p-2.5 pl-4 text-xs font-medium text-muted-foreground">KEY</th>
                        <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">STATUS</th>
                        <th className="text-left p-2.5 text-xs font-medium text-muted-foreground">DETAIL</th>
                        <th className="p-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {syncResults.results.map((res: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors group">
                          <td className="p-2.5 pl-4 font-mono text-xs">{res.key}</td>
                          <td className="p-2.5">
                            {res.success
                              ? <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="h-3 w-3" /> OK</span>
                              : <span className="text-xs text-destructive">Failed</span>}
                          </td>
                          <td className="p-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                            {res.error || (syncProvider === "github" ? "Pushed to GitHub Actions" : syncProvider === "gitlab" ? "Pushed to GitLab CI/CD" : "Pushed to Vercel Environment")}
                          </td>
                          <td className="p-2.5">
                            {res.success && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSecret(res.key)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
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
            <p className="text-muted-foreground text-sm mb-5">Connect GitHub, GitLab, or Vercel above to start syncing secrets.</p>
          </div>
        )}
      </div>

      {/* Vercel connect modal */}
      <VercelConnectModal
        open={vercelModalOpen}
        onClose={() => setVercelModalOpen(false)}
        onConnected={(status) => { setVercelStatus(status); fetchVercelProjects(); }}
      />
    </DashboardLayout>
  );
}

/* ── Connection Card ───────────────────────────────────────────── */
function ConnectionCard({
  name, icon, iconBg, status, onConnect, onDisconnect, tokenBased,
}: {
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  status: IntegrationStatus | null;
  onConnect: () => void;
  onDisconnect: () => void;
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
            {tokenBased && !status?.connected && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Token</span>
            )}
          </div>
          {status?.connected ? (
            <p className="text-xs text-green-600 dark:text-green-400 truncate">@{status.username}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Not connected</p>
          )}
        </div>
      </div>
      <div className="mt-3">
        {status?.connected ? (
          <Button variant="outline" size="sm" onClick={onDisconnect} className="w-full h-8 text-xs text-destructive border-destructive/20 hover:bg-destructive/5 gap-1.5">
            <Unlink className="h-3 w-3" /> Disconnect
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect} className={`w-full h-8 text-xs gap-1.5 ${name === "GitLab" ? "bg-[#FC6D26] hover:bg-[#e85d1a]" : name === "Vercel" ? "bg-black hover:bg-neutral-800 text-white" : ""}`}>
            <Link2 className="h-3 w-3" /> Connect
          </Button>
        )}
      </div>
    </div>
  );
}
