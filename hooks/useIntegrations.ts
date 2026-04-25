"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { IntegrationStatus, Repo, SyncProvider } from "@/lib/integrations/types";
import { ProjectController } from "@/util/ProjectController";
import { Project } from "@/util/Interface";

export function useIntegrations() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [repos, setRepos] = useState<Record<string, Repo[]>>({});
  const [modals, setModals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchStatus = useCallback(async (provider: SyncProvider) => {
    try {
      const res = await fetch(`/api/integrations/${provider}`);
      const data = await res.json();
      setStatuses(prev => ({ ...prev, [provider]: res.ok ? data : { connected: false, error: data.error } }));
      
      // If connected and has repo-based sync, fetch repos
      if (res.ok && data.connected) {
        fetchRepos(provider);
      }
    } catch (e) {
      setStatuses(prev => ({ ...prev, [provider]: { connected: false, error: "Network error" } }));
    }
  }, []);

  const fetchRepos = useCallback(async (provider: SyncProvider) => {
    try {
      const res = await fetch(`/api/integrations/${provider}/sync`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.repos) {
          setRepos(prev => ({ ...prev, [provider]: data.repos }));
        }
      }
    } catch (e) {
      console.error(`Failed to fetch repos for ${provider}`, e);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const providers: SyncProvider[] = [
      "github", "gitlab", "vercel", "netlify", "aws", "doppler", "bitbucket", 
      "gcp", "azure", "railway", "fly", "render", "digitalocean", "heroku", 
      "slack", "discord", "teams", "vault", "circleci", "cloudflare", "jenkins", 
      "pagerduty", "travisci", "supabase", "telegram", "email", "terraform", 
      "buildkite", "opsgenie", "checkly", "hasura", "postman", "shopify", 
      "twilio", "kubernetes", "linear", "planetscale", "bitwarden", "ghost", 
      "appwrite", "onepassword", "firebase", "sentry", "notion", "googledrive", 
      "zapier", "bitbucketpipelines", "gitlabselfmanaged", "discordwebhook", "mattermost"
    ];

    await Promise.all([
      ...providers.map(p => fetchStatus(p)),
      ProjectController.fetchProjects().then(d => { if (Array.isArray(d)) setProjects(d); })
    ]);
    setLoading(false);
  }, [fetchStatus]);

  const disconnect = useCallback(async (provider: SyncProvider) => {
    try {
      const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
      if (res.ok) {
        setStatuses(prev => ({ ...prev, [provider]: { connected: false } }));
        setRepos(prev => ({ ...prev, [provider]: [] }));
        toast({ title: "Disconnected", description: `${provider} unlinked successfully.` });
      } else {
        const d = await res.json();
        throw new Error(d.error || "Failed to disconnect");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, []);

  const setModalOpen = (provider: string, isOpen: boolean) => {
    setModals(prev => ({ ...prev, [provider]: isOpen }));
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    statuses,
    repos,
    modals,
    loading,
    projects,
    setStatuses,
    setRepos,
    setModalOpen,
    disconnect,
    refresh: fetchAll,
    refreshStatus: fetchStatus
  };
}
