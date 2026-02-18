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
  Zap,
  Lock,
  ArrowRight,
  Link2,
  Unlink,
  ChevronRight,
  Globe,
  Shield,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";
import { DashboardLayout } from "@/components/dashboard-layout";

interface IntegrationStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
  authUrl?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  url: string;
}

export default function IntegrationsPage() {
  const [githubStatus, setGithubStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("development");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [secretPrefix, setSecretPrefix] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  useEffect(() => {
    fetchIntegrationStatus();
    loadProjects();
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "github_connected") {
      toast({ title: "GitHub Connected!", description: "Your GitHub account is now linked." });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      toast({ title: "Connection Failed", description: params.get("error"), variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    if (githubStatus?.connected) fetchRepos();
  }, [githubStatus?.connected]);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/github");
      if (res.ok) setGithubStatus(await res.json());
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

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/integrations/github/sync");
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
      }
    } catch (error) {
      console.error("Failed to fetch repos:", error);
    }
  };

  const disconnectGitHub = async () => {
    try {
      const res = await fetch("/api/integrations/github", { method: "DELETE" });
      if (res.ok) {
        setGithubStatus({ connected: false });
        setRepos([]);
        setSyncResults(null);
        toast({ title: "Disconnected", description: "GitHub account unlinked." });
        fetchIntegrationStatus();
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
      setSyncing(true);
      setSyncResults(null);
      const repo = repos.find(r => r.id.toString() === selectedRepo);
      if (!repo) return;
      const res = await fetch("/api/integrations/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject, environment: selectedEnv, repoOwner: repo.owner, repoName: repo.name, secretPrefix })
      });
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

  const handleDeleteFromGitHub = async (secretKey: string) => {
    const repo = repos.find(r => r.id.toString() === selectedRepo);
    if (!repo) return;
    try {
      const res = await fetch(
        `/api/integrations/github/sync?repoOwner=${repo.owner}&repoName=${repo.name}&secretName=${secretKey}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults((prev: any) => ({
        ...prev,
        results: prev.results.filter((r: any) => r.key !== secretKey),
        summary: { ...prev.summary, total: prev.summary.total - 1, synced: prev.summary.synced - 1 }
      }));
      toast({ title: "Deleted", description: `${secretKey} removed from GitHub` });
    } catch (error: any) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Link2 className="h-6 w-6 absolute inset-0 m-auto text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Loading integrations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedRepoObj = repos.find(r => r.id.toString() === selectedRepo);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Integrations</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Connect Your Tools</h1>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Push secrets directly to external services. Keep your CI/CD pipelines in sync automatically.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border rounded-full px-4 py-2">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              End-to-end encrypted
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left: Connections */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Connections</h2>

            {/* GitHub Card */}
            <div className={`relative rounded-xl border p-5 transition-all duration-200 ${githubStatus?.connected
                ? "border-green-500/30 bg-green-500/5"
                : "border-border bg-card hover:border-primary/30"
              }`}>
              {githubStatus?.connected && (
                <div className="absolute top-3 right-3">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-[#24292e] flex items-center justify-center shadow-lg">
                  <Github className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">GitHub</p>
                  {githubStatus?.connected ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {githubStatus.avatarUrl && (
                        <img src={githubStatus.avatarUrl} alt="" className="h-4 w-4 rounded-full" />
                      )}
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium truncate">
                        @{githubStatus.username}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Not connected</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {githubStatus?.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectGitHub}
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 gap-2"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" className="w-full gap-2" asChild>
                    <a href={githubStatus?.authUrl}>
                      <Link2 className="h-3.5 w-3.5" />
                      Connect GitHub
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* GitLab Card (coming soon) */}
            <div className="relative rounded-xl border border-border bg-card p-5 opacity-50 select-none">
              <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
              <div className="flex items-center gap-4 blur-[2px]">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                  <Gitlab className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">GitLab</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Not connected</p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" disabled>Connect GitLab</Button>
              </div>
            </div>

            {/* More coming soon */}
            <div className="rounded-xl border border-dashed border-border p-5 text-center">
              <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">More integrations coming soon</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Vercel, AWS, Netlify...</p>
            </div>
          </div>

          {/* Right: Sync Panel */}
          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Sync Secrets</h2>

            {!githubStatus?.connected ? (
              /* Not connected state */
              <div className="rounded-xl border border-dashed border-primary/20 bg-card p-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Github className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect GitHub to Start</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  Link your GitHub account to push secrets directly into GitHub Actions — no manual copy-paste.
                </p>
                <Button asChild className="gap-2">
                  <a href={githubStatus?.authUrl}>
                    <Github className="h-4 w-4" />
                    Connect GitHub Account
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step 1 & 2 side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Source */}
                  <div className="rounded-xl border bg-card p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
                      <h3 className="font-semibold text-sm">Source</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">XtraSecurity</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Project</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select project..." />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Environment</Label>
                        <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="development">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Development
                              </div>
                            </SelectItem>
                            <SelectItem value="staging">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                Staging
                              </div>
                            </SelectItem>
                            <SelectItem value="production">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Production
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="rounded-xl border bg-card p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
                      <h3 className="font-semibold text-sm">Destination</h3>
                      <Badge variant="secondary" className="text-xs ml-auto gap-1">
                        <Github className="h-3 w-3" /> GitHub
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Repository</Label>
                        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select repository..." />
                          </SelectTrigger>
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

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Secret Prefix <span className="text-muted-foreground/50">(optional)</span>
                        </Label>
                        <Input
                          placeholder="e.g. PROD"
                          value={secretPrefix}
                          onChange={(e) => setSecretPrefix(e.target.value.toUpperCase())}
                          className="h-9 font-mono text-sm"
                        />
                        {secretPrefix && (
                          <p className="text-xs text-muted-foreground">
                            Keys will be named <code className="bg-muted px-1 rounded">{secretPrefix}_DATABASE_URL</code>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow preview + Sync button */}
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      {/* Source pill */}
                      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium">
                          {selectedProject ? projects.find(p => p.id === selectedProject)?.name : "No project"}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground capitalize">{selectedEnv}</span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground" />

                      {/* Destination pill */}
                      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                        <Github className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {selectedRepoObj ? selectedRepoObj.fullName : "No repo"}
                        </span>
                        {selectedRepoObj?.private && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>

                    <Button
                      onClick={handleSync}
                      disabled={syncing || !selectedProject || !selectedRepo}
                      className="gap-2 min-w-[140px]"
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Sync Secrets
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Results */}
                {syncResults && (
                  <div className="rounded-xl border bg-card overflow-hidden">
                    {/* Results header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-sm">Sync Results</span>
                        <span className="text-xs text-muted-foreground">→ {syncResults.repo}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {syncResults.summary.synced} synced
                        </span>
                        {syncResults.summary.failed > 0 && (
                          <span className="flex items-center gap-1.5 text-destructive font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            {syncResults.summary.failed} failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results table */}
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/20">
                            <th className="text-left p-3 pl-5 text-xs font-medium text-muted-foreground">SECRET KEY</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">STATUS</th>
                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">MESSAGE</th>
                            <th className="p-3 w-12" />
                          </tr>
                        </thead>
                        <tbody>
                          {syncResults.results.map((res: any, i: number) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                              <td className="p-3 pl-5 font-mono text-xs font-medium">{res.key}</td>
                              <td className="p-3">
                                {res.success ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                                    <Check className="h-3.5 w-3.5" />
                                    Synced
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
                                    <span className="h-3.5 w-3.5 rounded-full border-2 border-destructive flex items-center justify-center text-[8px]">✕</span>
                                    Failed
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                {res.error || "Pushed to GitHub Actions"}
                              </td>
                              <td className="p-3">
                                {res.success && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    title="Remove from GitHub"
                                    onClick={() => handleDeleteFromGitHub(res.key)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
