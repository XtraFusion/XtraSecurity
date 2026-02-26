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
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
}

type SyncProvider = "github" | "gitlab";

export default function IntegrationsPage() {
  const { user, selectedWorkspace } = useUser();
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(null);
  const [gitlabStatus, setGitlabStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("github");
  const [githubRepos, setGithubRepos] = useState<Repo[]>([]);
  const [gitlabRepos, setGitlabRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  const repos = syncProvider === "github" ? githubRepos : gitlabRepos;

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
  useEffect(() => {
    if (githubStatus && gitlabStatus && !githubStatus.connected && gitlabStatus.connected) setSyncProvider("gitlab");
  }, [githubStatus, gitlabStatus]);
  useEffect(() => { setSelectedRepo(""); setSyncResults(null); }, [syncProvider]);

  const fetchAllStatuses = async () => {
    try {
      setLoading(true);
      const [ghRes, glRes] = await Promise.all([fetch("/api/integrations/github"), fetch("/api/integrations/gitlab")]);
      if (ghRes.ok) setGithubStatus(await ghRes.json());
      if (glRes.ok) setGitlabStatus(await glRes.json());
    } catch (error) { console.error("Failed to fetch integration status:", error); }
    finally { setLoading(false); }
  };

  const loadProjects = async () => {
    try { const data = await ProjectController.fetchProjects(); if (Array.isArray(data)) setProjects(data); } catch (error) { console.error("Failed to load projects", error); }
  };

  const fetchGithubRepos = async () => {
    try { const res = await fetch("/api/integrations/github/sync"); if (res.ok) { const data = await res.json(); setGithubRepos(data.repos || []); } } catch (error) { console.error("Failed to fetch GitHub repos:", error); }
  };

  const fetchGitlabRepos = async () => {
    try { const res = await fetch("/api/integrations/gitlab/sync"); if (res.ok) { const data = await res.json(); setGitlabRepos(data.repos || []); } } catch (error) { console.error("Failed to fetch GitLab repos:", error); }
  };

  const disconnectIntegration = async (provider: SyncProvider) => {
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
      if (res.ok) {
        if (provider === "github") { setGithubStatus({ connected: false }); setGithubRepos([]); }
        else { setGitlabStatus({ connected: false }); setGitlabRepos([]); }
        if (syncProvider === provider) setSyncResults(null);
        toast({ title: "Disconnected", description: `${provider === "github" ? "GitHub" : "GitLab"} account unlinked.` });
        fetchAllStatuses();
      }
    } catch { toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" }); }
  };

  const handleSync = async () => {
    if (!selectedProject || !selectedRepo) { toast({ title: "Missing fields", description: "Select a project and repository first.", variant: "destructive" }); return; }
    try {
      setSyncing(true); setSyncResults(null);
      const repo = repos.find(r => r.id.toString() === selectedRepo);
      if (!repo) return;
      let res;
      if (syncProvider === "github") {
        res = await fetch("/api/integrations/github/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, repoOwner: repo.owner, repoName: repo.name, secretPrefix }) });
      } else {
        res = await fetch("/api/integrations/gitlab/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, gitlabProjectId: repo.id, secretPrefix }) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults(data);
      toast({ title: "Sync Complete ✓", description: `${data.summary.synced} secrets pushed to ${data.repo}` });
    } catch (error: any) { toast({ title: "Sync Failed", description: error.message, variant: "destructive" }); }
    finally { setSyncing(false); }
  };

  const handleDeleteSecret = async (secretKey: string) => {
    const repo = repos.find(r => r.id.toString() === selectedRepo);
    if (!repo) return;
    try {
      let res;
      if (syncProvider === "github") { res = await fetch(`/api/integrations/github/sync?repoOwner=${repo.owner}&repoName=${repo.name}&secretName=${secretKey}`, { method: "DELETE" }); }
      else { res = await fetch(`/api/integrations/gitlab/sync?gitlabProjectId=${repo.id}&variableKey=${secretKey}`, { method: "DELETE" }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults((prev: any) => ({ ...prev, results: prev.results.filter((r: any) => r.key !== secretKey), summary: { ...prev.summary, total: prev.summary.total - 1, synced: prev.summary.synced - 1 } }));
      toast({ title: "Deleted", description: `${secretKey} removed from ${syncProvider === "github" ? "GitHub" : "GitLab"}` });
    } catch (error: any) { toast({ title: "Delete Failed", description: error.message, variant: "destructive" }); }
  };

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";
  const hasAdminAccess = isPersonalWorkspace || isWorkspaceOwner;

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

  const selectedRepoObj = repos.find(r => r.id.toString() === selectedRepo);
  const anyConnected = githubStatus?.connected || gitlabStatus?.connected;
  const currentProviderConnected = syncProvider === "github" ? githubStatus?.connected : gitlabStatus?.connected;

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
            onConnect={() => window.location.href = githubStatus?.authUrl || "#"}
            onDisconnect={() => disconnectIntegration("github")}
          />
          {/* GitLab */}
          <ConnectionCard
            name="GitLab"
            icon={<Gitlab className="h-5 w-5 text-white" />}
            iconBg="bg-[#FC6D26]"
            status={gitlabStatus}
            onConnect={() => window.location.href = gitlabStatus?.authUrl || "#"}
            onDisconnect={() => disconnectIntegration("gitlab")}
          />
          {/* Coming soon */}
          <div className="rounded-lg border border-dashed p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
            <Globe className="h-5 w-5 text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground">More coming soon</p>
            <p className="text-[10px] text-muted-foreground/60">Vercel · AWS · Netlify</p>
          </div>
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
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">

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
                      <SelectItem value="development"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Development</div></SelectItem>
                      <SelectItem value="staging"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Staging</div></SelectItem>
                      <SelectItem value="production"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Production</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repository */}
                <div className="p-4 space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">
                    {syncProvider === "github" ? "Repository" : "GitLab Project"}
                  </Label>
                  <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {repos.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          <div className="flex items-center gap-2">
                            {r.private ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Globe className="h-3 w-3 text-muted-foreground" />}
                            {r.fullName}
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
                  <span className="font-medium text-foreground">{selectedProject ? projects.find(p => p.id === selectedProject)?.name : "—"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    {syncProvider === "github" ? <Github className="h-3 w-3" /> : <Gitlab className="h-3 w-3 text-[#FC6D26]" />}
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
                            {res.error || `Pushed to ${syncProvider === "github" ? "GitHub Actions" : "GitLab CI/CD"}`}
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
            <p className="text-muted-foreground text-sm mb-5">Connect GitHub or GitLab above to start syncing secrets.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Connection Card ───────────────────────────────────────── */
function ConnectionCard({ name, icon, iconBg, status, onConnect, onDisconnect }: {
  name: string; icon: React.ReactNode; iconBg: string;
  status: IntegrationStatus | null;
  onConnect: () => void; onDisconnect: () => void;
}) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${status?.connected ? "border-green-500/30 bg-green-500/[0.03]" : "bg-card"}`}>
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{name}</p>
            {status?.connected && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
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
          <Button size="sm" onClick={onConnect} className={`w-full h-8 text-xs gap-1.5 ${name === "GitLab" ? "bg-[#FC6D26] hover:bg-[#e85d1a]" : ""}`}>
            <Link2 className="h-3 w-3" /> Connect
          </Button>
        )}
      </div>
    </div>
  );
}
