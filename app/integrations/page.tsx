"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";

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

  // Sync State
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

    // Check for success/error parameters in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "github_connected") {
      toast({ title: "Success", description: "GitHub account connected successfully!" });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error")) {
      toast({ title: "Error", description: params.get("error"), variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    if (githubStatus?.connected) {
      fetchRepos();
    }
  }, [githubStatus?.connected]);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/github");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch integration status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      // Use fetchProjects from ProjectController based on viewed file content
      const data = await ProjectController.fetchProjects();
      if (Array.isArray(data)) {
        setProjects(data);
      }
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
        toast({ title: "Disconnected", description: "GitHub account disconnected" });
        // Refresh status to get new auth URL
        fetchIntegrationStatus();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleSync = async () => {
    if (!selectedProject || !selectedRepo) {
      toast({ title: "Error", description: "Select a project and repository", variant: "destructive" });
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
        body: JSON.stringify({
          projectId: selectedProject,
          environment: selectedEnv,
          repoOwner: repo.owner,
          repoName: repo.name,
          secretPrefix
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSyncResults(data);
      toast({
        title: "Sync Complete",
        description: `Synced ${data.summary.synced} secrets to ${data.repo}`
      });

    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Integrations
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect external services to sync secrets and automate workflows
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connections Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle>Connections</CardTitle>
                <CardDescription>Manage your connected accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GitHub */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black text-white rounded-full">
                      <Github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub</p>
                      {githubStatus?.connected ? (
                        <p className="text-xs text-success flex items-center gap-1">
                          <Check className="h-3 w-3" /> Connected as {githubStatus.username}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {githubStatus?.connected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={disconnectGitHub}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <a href={githubStatus?.authUrl}>Connect</a>
                    </Button>
                  )}
                </div>

                {/* GitLab (Placeholder) */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-primary/10 opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 text-white rounded-full">
                      <Gitlab className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">GitLab</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled>Connect</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card border-primary/20 h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle>Sync Secrets</CardTitle>
                    <CardDescription>Push secrets to external repositories</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!githubStatus?.connected ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-primary/20">
                    <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Connect GitHub to Start Syncing</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Connect your GitHub account to push secrets directly to repository secrets for use in GitHub Actions.
                    </p>
                    <Button asChild>
                      <a href={githubStatus?.authUrl}>Connect GitHub Account</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Source Configuration */}
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-primary/10">
                        <h3 className="font-medium flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs">1</span>
                          Source (XtraSync)
                        </h3>

                        <div className="space-y-2">
                          <Label>Project</Label>
                          <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Environment</Label>
                          <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="staging">Staging</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Destination Configuration */}
                      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-primary/10">
                        <h3 className="font-medium flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs">2</span>
                          Destination (GitHub)
                        </h3>

                        <div className="space-y-2">
                          <Label>Repository</Label>
                          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Repository" />
                            </SelectTrigger>
                            <SelectContent>
                              {repos.map(r => (
                                <SelectItem key={r.id} value={r.id.toString()}>
                                  {r.fullName} {r.private && "🔒"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Secret Prefix (Optional)</Label>
                          <Input
                            placeholder="e.g. PROD"
                            value={secretPrefix}
                            onChange={(e) => setSecretPrefix(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Secrets will be named {secretPrefix ? `${secretPrefix}_KEY` : "KEY"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSync}
                        disabled={syncing || !selectedProject || !selectedRepo}
                        className="gap-2"
                      >
                        {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Sync Secrets
                      </Button>
                    </div>

                    {/* Results Display */}
                    {syncResults && (
                      <div className="mt-6 border rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
                          <span className="font-medium">Sync Results</span>
                          <div className="flex gap-2 text-sm">
                            <span className="text-success">{syncResults.summary.synced} Success</span>
                            <span className="text-muted-foreground">|</span>
                            <span className={syncResults.summary.failed > 0 ? "text-destructive" : "text-muted-foreground"}>
                              {syncResults.summary.failed} Failed
                            </span>
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-0">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                              <tr>
                                <th className="p-3 font-medium">Secret Key</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Message</th>
                              </tr>
                            </thead>
                            <tbody>
                              {syncResults.results.map((res: any, i: number) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                                  <td className="p-3 font-mono">{res.key}</td>
                                  <td className="p-3">
                                    {res.success ? (
                                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        Synced
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">Failed</Badge>
                                    )}
                                  </td>
                                  <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                                    {res.error || "Successfully updated in GitHub"}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
