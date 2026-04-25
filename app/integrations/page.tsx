"use client";


import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Github, Gitlab, Trash2, RefreshCw, Check, Loader2, Lock, Link2, Unlink, 
  ArrowRight, Globe, Shield, Triangle, ExternalLink, Eye, EyeOff, Info, 
  Rocket, AlertCircle, Plus, RotateCcw, CloudLightning, Pencil, Search, 
  X, Mail, Send, Box, Activity, Flame, Database, HardDrive, Zap, Ship, 
  Building, Webhook, MessageSquare 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/util/Interface";
import { ProjectController } from "@/util/ProjectController";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from "@/hooks/useUser";

import { 
  StatusBadge, ComparePanel, ConnectionCard 
} from "@/components/integrations/IntegrationComponents";
import * as Modals from "@/components/integrations/IntegrationModals";
import { INTEGRATION_METADATA, AWS_REGIONS } from "@/lib/integrations/config";
import { 
  IntegrationStatus, Repo, DiffItem, CompareData, SyncProvider 
} from "@/lib/integrations/types";


// Refactored Integrations Dashboard

export default function IntegrationsPage() {
  const { user, selectedWorkspace } = useUser();
  const [statuses, setStatuses] = useState<Partial<Record<SyncProvider, IntegrationStatus>>>({});


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
  const [teamsStatus, setTeamsStatus] = useState<IntegrationStatus | null>(null);
  const [vaultStatus, setVaultStatus] = useState<IntegrationStatus | null>(null);
  const [circleciStatus, setCircleciStatus] = useState<IntegrationStatus | null>(null);
  const [cloudflareStatus, setCloudflareStatus] = useState<IntegrationStatus | null>(null);
  const [jenkinsStatus, setJenkinsStatus] = useState<IntegrationStatus | null>(null);
  const [pagerdutyStatus, setPagerdutyStatus] = useState<IntegrationStatus | null>(null);
  const [travisciStatus, setTravisciStatus] = useState<IntegrationStatus | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<IntegrationStatus | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<IntegrationStatus | null>(null);
  const [emailStatus, setEmailStatus] = useState<IntegrationStatus | null>(null);
  const [terraformStatus, setTerraformStatus] = useState<IntegrationStatus | null>(null);
  const [buildkiteStatus, setBuildkiteStatus] = useState<IntegrationStatus | null>(null);
  const [opsgenieStatus, setOpsgenieStatus] = useState<IntegrationStatus | null>(null);
  const [checklyStatus, setChecklyStatus] = useState<IntegrationStatus | null>(null);
  const [hasuraStatus, setHasuraStatus] = useState<IntegrationStatus | null>(null);
  const [postmanStatus, setPostmanStatus] = useState<IntegrationStatus | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<IntegrationStatus | null>(null);
  const [twilioStatus, setTwilioStatus] = useState<IntegrationStatus | null>(null);
  const [k8sStatus, setK8sStatus] = useState<IntegrationStatus | null>(null);
  const [linearStatus, setLinearStatus] = useState<IntegrationStatus | null>(null);
  const [psStatus, setPsStatus] = useState<IntegrationStatus | null>(null);
  const [bwStatus, setBwStatus] = useState<IntegrationStatus | null>(null);
  const [ghostStatus, setGhostStatus] = useState<IntegrationStatus | null>(null);
  const [appwriteStatus, setAppwriteStatus] = useState<IntegrationStatus | null>(null);
  const [opStatus, setOpStatus] = useState<IntegrationStatus | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<IntegrationStatus | null>(null);
  const [sentryStatus, setSentryStatus] = useState<IntegrationStatus | null>(null);
  const [notionStatus, setNotionStatus] = useState<IntegrationStatus | null>(null);
  const [gdStatus, setGdStatus] = useState<IntegrationStatus | null>(null);
  const [zapierStatus, setZapierStatus] = useState<IntegrationStatus | null>(null);
  const [bbpStatus, setBbpStatus] = useState<IntegrationStatus | null>(null);
  const [glsmStatus, setGlsmStatus] = useState<IntegrationStatus | null>(null);
  const [discordWebhookStatus, setDiscordWebhookStatus] = useState<IntegrationStatus | null>(null);
  const [mattermostStatus, setMattermostStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "source" | "deployment" | "cloud" | "notifications">("all");

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
  const [teamsModal, setTeamsModal] = useState(false);
  const [vaultModal, setVaultModal] = useState(false);
  const [circleciModal, setCircleciModal] = useState(false);
  const [cloudflareModal, setCloudflareModal] = useState(false);
  const [jenkinsModal, setJenkinsModal] = useState(false);
  const [pagerdutyModal, setPagerdutyModal] = useState(false);
  const [travisciModal, setTravisciModal] = useState(false);
  const [supabaseModal, setSupabaseModal] = useState(false);
  const [telegramModal, setTelegramModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [terraformModal, setTerraformModal] = useState(false);
  const [buildkiteModal, setBuildkiteModal] = useState(false);
  const [opsgenieModal, setOpsgenieModal] = useState(false);
  const [checklyModal, setChecklyModal] = useState(false);
  const [hasuraModal, setHasuraModal] = useState(false);
  const [postmanModal, setPostmanModal] = useState(false);
  const [shopifyModal, setShopifyModal] = useState(false);
  const [twilioModal, setTwilioModal] = useState(false);
  const [k8sModal, setK8sModal] = useState(false);
  const [linearModal, setLinearModal] = useState(false);
  const [psModal, setPsModal] = useState(false);
  const [bwModal, setBwModal] = useState(false);
  const [ghostModal, setGhostModal] = useState(false);
  const [appwriteModal, setAppwriteModal] = useState(false);
  const [opModal, setOpModal] = useState(false);
  const [firebaseModal, setFirebaseModal] = useState(false);
  const [sentryModal, setSentryModal] = useState(false);
  const [notionModal, setNotionModal] = useState(false);
  const [driveModal, setDriveModal] = useState(false);
  const [zapierModal, setZapierModal] = useState(false);
  const [bbpModal, setBbpModal] = useState(false);
  const [glsmModal, setGlsmModal] = useState(false);
  const [discordWebhookModal, setDiscordWebhookModal] = useState(false);
  const [mattermostModal, setMattermostModal] = useState(false);

  const [k8sRepos, setK8sRepos] = useState<Repo[]>([]);
  const [linearRepos, setLinearRepos] = useState<Repo[]>([]);
  const [psRepos, setPsRepos] = useState<Repo[]>([]);
  const [bwRepos, setBwRepos] = useState<Repo[]>([]);
  const [appwriteRepos, setAppwriteRepos] = useState<Repo[]>([]);
  const [opRepos, setOpRepos] = useState<Repo[]>([]);
  const [firebaseRepos, setFirebaseRepos] = useState<Repo[]>([]);
  const [sentryRepos, setSentryRepos] = useState<Repo[]>([]);
  const [notionRepos, setNotionRepos] = useState<Repo[]>([]);
  const [gdRepos, setGdRepos] = useState<Repo[]>([]);
  const [zapierRepos, setZapierRepos] = useState<Repo[]>([]);
  const [bbpRepos, setBbpRepos] = useState<Repo[]>([]);
  const [glsmRepos, setGlsmRepos] = useState<Repo[]>([]);
  const [discordWebhookRepos, setDiscordWebhookRepos] = useState<Repo[]>([]);
  const [mattermostRepos, setMattermostRepos] = useState<Repo[]>([]);
  const [postmanRepos, setPostmanRepos] = useState<Repo[]>([]);
  const [shopifyRepos, setShopifyRepos] = useState<Repo[]>([]);
  const [hasuraRepos, setHasuraRepos] = useState<Repo[]>([]);
  const [checklyRepos, setChecklyRepos] = useState<Repo[]>([]);
  const [terraformRepos, setTerraformRepos] = useState<Repo[]>([]);
  const [buildkiteRepos, setBuildkiteRepos] = useState<Repo[]>([]);

  const [travisciRepos, setTravisciRepos] = useState<Repo[]>([]);
  const [supabaseRepos, setSupabaseRepos] = useState<Repo[]>([]);

  const [cloudflareRepos, setCloudflareRepos] = useState<Repo[]>([]);
  const [jenkinsRepos, setJenkinsRepos] = useState<Repo[]>([]);

  const [vaultRepos, setVaultRepos] = useState<Repo[]>([]);
  const [circleciRepos, setCircleciRepos] = useState<Repo[]>([]);

  const repos = syncProvider === "github" ? githubRepos : syncProvider === "gitlab" ? gitlabRepos : syncProvider === "vercel" ? vercelRepos : syncProvider === "netlify" ? netlifyRepos : syncProvider === "doppler" ? dopplerRepos : syncProvider === "bitbucket" ? bitbucketRepos : syncProvider === "gcp" ? gcpRepos : syncProvider === "azure" ? azureRepos : syncProvider === "railway" ? railwayRepos : syncProvider === "fly" ? flyRepos : syncProvider === "render" ? renderRepos : syncProvider === "digitalocean" ? doRepos : syncProvider === "heroku" ? herokuRepos : syncProvider === "vault" ? vaultRepos : syncProvider === "circleci" ? circleciRepos : syncProvider === "cloudflare" ? cloudflareRepos : syncProvider === "jenkins" ? jenkinsRepos : syncProvider === "travisci" ? travisciRepos : syncProvider === "supabase" ? supabaseRepos : syncProvider === "terraform" ? terraformRepos : syncProvider === "buildkite" ? buildkiteRepos : syncProvider === "checkly" ? checklyRepos : syncProvider === "hasura" ? hasuraRepos : syncProvider === "postman" ? postmanRepos : syncProvider === "shopify" ? shopifyRepos : syncProvider === "kubernetes" ? k8sRepos : syncProvider === "linear" ? linearRepos : syncProvider === "planetscale" ? psRepos : syncProvider === "bitwarden" ? bwRepos : syncProvider === "appwrite" ? appwriteRepos : syncProvider === "onepassword" ? opRepos : syncProvider === "firebase" ? firebaseRepos : syncProvider === "sentry" ? sentryRepos : syncProvider === "notion" ? notionRepos : syncProvider === "googledrive" ? gdRepos : syncProvider === "zapier" ? zapierRepos : syncProvider === "bitbucketpipelines" ? bbpRepos : syncProvider === "gitlabselfmanaged" ? glsmRepos : syncProvider === "discordwebhook" ? discordWebhookRepos : syncProvider === "mattermost" ? mattermostRepos : awsRepos;
  const selectedRepoObj = repos.find(r => r.id.toString() === selectedRepo);

  const fetchWithHandling = async (url: string, setter: (val: any) => void) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setter(d);
      } else if (res.status === 401) {
        setter({ connected: false, error: "Unauthorized" });
      } else {
        const d = await res.json().catch(() => ({}));
        setter({ connected: false, error: d.error || "Server error" });
      }
    } catch {
      setter({ connected: false, error: "Network error" });
    }
  };

  const fetchAllStatuses = async () => {
    setLoading(true);
    await Promise.all([
      fetchWithHandling("/api/integrations/github", setGithubStatus),
      fetchWithHandling("/api/integrations/gitlab", setGitlabStatus),
      fetchWithHandling("/api/integrations/vercel", setVercelStatus),
      fetchWithHandling("/api/integrations/netlify", setNetlifyStatus),
      fetchWithHandling("/api/integrations/aws", setAwsStatus),
      fetchWithHandling("/api/integrations/doppler", setDopplerStatus),
      fetchWithHandling("/api/integrations/bitbucket", setBitbucketStatus),
      fetchWithHandling("/api/integrations/gcp", setGcpStatus),
      fetchWithHandling("/api/integrations/azure", setAzureStatus),
      fetchWithHandling("/api/integrations/railway", setRailwayStatus),
      fetchWithHandling("/api/integrations/fly", setFlyStatus),
      fetchWithHandling("/api/integrations/render", setRenderStatus),
      fetchWithHandling("/api/integrations/digitalocean", setDoStatus),
      fetchWithHandling("/api/integrations/heroku", setHerokuStatus),
      fetchWithHandling("/api/integrations/slack", setSlackStatus),
      fetchWithHandling("/api/integrations/discord", setDiscordStatus),
      fetchWithHandling("/api/integrations/teams", setTeamsStatus),
      fetchWithHandling("/api/integrations/vault", setVaultStatus),
      fetchWithHandling("/api/integrations/circleci", setCircleciStatus),
      fetchWithHandling("/api/integrations/cloudflare", setCloudflareStatus),
      fetchWithHandling("/api/integrations/jenkins", setJenkinsStatus),
      fetchWithHandling("/api/integrations/pagerduty", setPagerdutyStatus),
      fetchWithHandling("/api/integrations/travisci", setTravisciStatus),
      fetchWithHandling("/api/integrations/supabase", setSupabaseStatus),
      fetchWithHandling("/api/integrations/telegram", setTelegramStatus),
      fetchWithHandling("/api/integrations/email", setEmailStatus),
      fetchWithHandling("/api/integrations/terraform", setTerraformStatus),
      fetchWithHandling("/api/integrations/buildkite", setBuildkiteStatus),
      fetchWithHandling("/api/integrations/opsgenie", setOpsgenieStatus),
      fetchWithHandling("/api/integrations/checkly", setChecklyStatus),
      fetchWithHandling("/api/integrations/hasura", setHasuraStatus),
      fetchWithHandling("/api/integrations/postman", setPostmanStatus),
      fetchWithHandling("/api/integrations/shopify", setShopifyStatus),
      fetchWithHandling("/api/integrations/twilio", setTwilioStatus),
      fetchWithHandling("/api/integrations/kubernetes", setK8sStatus),
      fetchWithHandling("/api/integrations/linear", setLinearStatus),
      fetchWithHandling("/api/integrations/planetscale", setPsStatus),
      fetchWithHandling("/api/integrations/bitwarden", setBwStatus),
      fetchWithHandling("/api/integrations/ghost", setGhostStatus),
      fetchWithHandling("/api/integrations/appwrite", setAppwriteStatus),
      fetchWithHandling("/api/integrations/onepassword", setOpStatus),
      fetchWithHandling("/api/integrations/firebase", setFirebaseStatus),
      fetchWithHandling("/api/integrations/sentry", setSentryStatus),
      fetchWithHandling("/api/integrations/notion", setNotionStatus),
      fetchWithHandling("/api/integrations/googledrive", setGdStatus),
      fetchWithHandling("/api/integrations/zapier", setZapierStatus),
      fetchWithHandling("/api/integrations/bitbucketpipelines", setBbpStatus),
      fetchWithHandling("/api/integrations/gitlabselfmanaged", setGlsmStatus),
      fetchWithHandling("/api/integrations/discordwebhook", setDiscordWebhookStatus),
      fetchWithHandling("/api/integrations/mattermost", setMattermostStatus),
    ]);
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
  useEffect(() => { if (vaultStatus?.connected) fetch("/api/integrations/vault/sync").then(r => r.ok && r.json()).then(d => d && setVaultRepos(d.repos || [])); }, [vaultStatus?.connected]);
  useEffect(() => { if (circleciStatus?.connected) fetch("/api/integrations/circleci/sync").then(r => r.ok && r.json()).then(d => d && setCircleciRepos(d.repos || [])); }, [circleciStatus?.connected]);
  useEffect(() => { if (cloudflareStatus?.connected) fetch("/api/integrations/cloudflare/sync").then(r => r.ok && r.json()).then(d => d && setCloudflareRepos(d.repos || [])); }, [cloudflareStatus?.connected]);
  useEffect(() => { if (jenkinsStatus?.connected) fetch("/api/integrations/jenkins/sync").then(r => r.ok && r.json()).then(d => d && setJenkinsRepos(d.repos || [])); }, [jenkinsStatus?.connected]);
  useEffect(() => { if (travisciStatus?.connected) fetch("/api/integrations/travisci/sync").then(r => r.ok && r.json()).then(d => d && setTravisciRepos(d.repos || [])); }, [travisciStatus?.connected]);
  useEffect(() => { if (supabaseStatus?.connected) fetch("/api/integrations/supabase/sync").then(r => r.ok && r.json()).then(d => d && setSupabaseRepos(d.repos || [])); }, [supabaseStatus?.connected]);
  useEffect(() => { if (terraformStatus?.connected) fetch("/api/integrations/terraform/sync").then(r => r.ok && r.json()).then(d => d && setTerraformRepos(d.repos || [])); }, [terraformStatus?.connected]);
  useEffect(() => { if (buildkiteStatus?.connected) fetch("/api/integrations/buildkite/sync").then(r => r.ok && r.json()).then(d => d && setBuildkiteRepos(d.repos || [])); }, [buildkiteStatus?.connected]);
  useEffect(() => { if (checklyStatus?.connected) fetch("/api/integrations/checkly/sync").then(r => r.ok && r.json()).then(d => d && setChecklyRepos(d.repos || [])); }, [checklyStatus?.connected]);
  useEffect(() => { if (hasuraStatus?.connected) fetch("/api/integrations/hasura/sync").then(r => r.ok && r.json()).then(d => d && setHasuraRepos(d.repos || [])); }, [hasuraStatus?.connected]);
  useEffect(() => { if (postmanStatus?.connected) fetch("/api/integrations/postman/sync").then(r => r.ok && r.json()).then(d => d && setPostmanRepos(d.repos || [])); }, [postmanStatus?.connected]);
  useEffect(() => { if (shopifyStatus?.connected) fetch("/api/integrations/shopify/sync").then(r => r.ok && r.json()).then(d => d && setShopifyRepos(d.repos || [])); }, [shopifyStatus?.connected]);
  useEffect(() => { if (k8sStatus?.connected) fetch("/api/integrations/kubernetes/sync").then(r => r.ok && r.json()).then(d => d && setK8sRepos(d.repos || [])); }, [k8sStatus?.connected]);
  useEffect(() => { if (linearStatus?.connected) fetch("/api/integrations/linear/sync").then(r => r.ok && r.json()).then(d => d && setLinearRepos(d.repos || [])); }, [linearStatus?.connected]);
  useEffect(() => { if (psStatus?.connected) fetch("/api/integrations/planetscale/sync").then(r => r.ok && r.json()).then(d => d && setPsRepos(d.repos || [])); }, [psStatus?.connected]);
  useEffect(() => { if (bwStatus?.connected) fetch("/api/integrations/bitwarden/sync").then(r => r.ok && r.json()).then(d => d && setBwRepos(d.repos || [])); }, [bwStatus?.connected]);
  useEffect(() => { if (appwriteStatus?.connected) fetch("/api/integrations/appwrite/sync").then(r => r.ok && r.json()).then(d => d && setAppwriteRepos(d.repos || [])); }, [appwriteStatus?.connected]);
  useEffect(() => { if (opStatus?.connected) fetch("/api/integrations/onepassword/sync").then(r => r.ok && r.json()).then(d => d && setOpRepos(d.repos || [])); }, [opStatus?.connected]);
  useEffect(() => { if (firebaseStatus?.connected) fetch("/api/integrations/firebase/sync").then(r => r.ok && r.json()).then(d => d && setFirebaseRepos(d.repos || [])); }, [firebaseStatus?.connected]);
  useEffect(() => { if (sentryStatus?.connected) fetch("/api/integrations/sentry/sync").then(r => r.ok && r.json()).then(d => d && setSentryRepos(d.repos || [])); }, [sentryStatus?.connected]);
  useEffect(() => { if (notionStatus?.connected) fetch("/api/integrations/notion/sync").then(r => r.ok && r.json()).then(d => d && setNotionRepos(d.repos || [])); }, [notionStatus?.connected]);
  useEffect(() => { if (gdStatus?.connected) fetch("/api/integrations/googledrive/sync").then(r => r.ok && r.json()).then(d => d && setGdRepos(d.repos || [])); }, [gdStatus?.connected]);
  useEffect(() => { if (zapierStatus?.connected) fetch("/api/integrations/zapier/sync").then(r => r.ok && r.json()).then(d => d && setZapierRepos(d.repos || [])); }, [zapierStatus?.connected]);
  useEffect(() => { if (bbpStatus?.connected) fetch("/api/integrations/bitbucketpipelines/sync").then(r => r.ok && r.json()).then(d => d && setBbpRepos(d.repos || [])); }, [bbpStatus?.connected]);
  useEffect(() => { if (glsmStatus?.connected) fetch("/api/integrations/gitlabselfmanaged/sync").then(r => r.ok && r.json()).then(d => d && setGlsmRepos(d.repos || [])); }, [glsmStatus?.connected]);
  useEffect(() => { if (discordWebhookStatus?.connected) fetch("/api/integrations/discordwebhook/sync").then(r => r.ok && r.json()).then(d => d && setDiscordWebhookRepos(d.repos || [])); }, [discordWebhookStatus?.connected]);
  useEffect(() => { if (mattermostStatus?.connected) fetch("/api/integrations/mattermost/sync").then(r => r.ok && r.json()).then(d => d && setMattermostRepos(d.repos || [])); }, [mattermostStatus?.connected]);
  useEffect(() => { setSelectedRepo(""); setSyncResults(null); setShowCompare(false); }, [syncProvider]);
  useEffect(() => { setShowCompare(false); }, [selectedRepo, selectedEnv]);

  const disconnect = async (provider: SyncProvider) => {
    const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
    if (res.ok) {
      const setters: Record<SyncProvider, () => void> = { github: () => { setGithubStatus({ connected: false }); setGithubRepos([]); }, gitlab: () => { setGitlabStatus({ connected: false }); setGitlabRepos([]); }, vercel: () => { setVercelStatus({ connected: false }); setVercelRepos([]); }, netlify: () => { setNetlifyStatus({ connected: false }); setNetlifyRepos([]); }, aws: () => { setAwsStatus({ connected: false }); setAwsRepos([]); }, doppler: () => { setDopplerStatus({ connected: false }); setDopplerRepos([]); }, bitbucket: () => { setBitbucketStatus({ connected: false }); setBitbucketRepos([]); }, gcp: () => { setGcpStatus({ connected: false }); setGcpRepos([]); }, azure: () => { setAzureStatus({ connected: false }); setAzureRepos([]); }, railway: () => { setRailwayStatus({ connected: false }); setRailwayRepos([]); }, fly: () => { setFlyStatus({ connected: false }); setFlyRepos([]); }, render: () => { setRenderStatus({ connected: false }); setRenderRepos([]); }, digitalocean: () => { setDoStatus({ connected: false }); setDoRepos([]); }, heroku: () => { setHerokuStatus({ connected: false }); setHerokuRepos([]); }, slack: () => { setSlackStatus({ connected: false }); }, discord: () => { setDiscordStatus({ connected: false }); }, teams: () => { setTeamsStatus({ connected: false }); }, vault: () => { setVaultStatus({ connected: false }); setVaultRepos([]); }, circleci: () => { setCircleciStatus({ connected: false }); setCircleciRepos([]); }, cloudflare: () => { setCloudflareStatus({ connected: false }); setCloudflareRepos([]); }, jenkins: () => { setJenkinsStatus({ connected: false }); setJenkinsRepos([]); }, pagerduty: () => { setPagerdutyStatus({ connected: false }); }, travisci: () => { setTravisciStatus({ connected: false }); setTravisciRepos([]); }, supabase: () => { setSupabaseStatus({ connected: false }); setSupabaseRepos([]); }, telegram: () => { setTelegramStatus({ connected: false }); }, email: () => { setEmailStatus({ connected: false }); }, terraform: () => { setTerraformStatus({ connected: false }); setTerraformRepos([]); }, buildkite: () => { setBuildkiteStatus({ connected: false }); setBuildkiteRepos([]); }, opsgenie: () => { setOpsgenieStatus({ connected: false }); }, checkly: () => { setChecklyStatus({ connected: false }); setChecklyRepos([]); }, hasura: () => { setHasuraStatus({ connected: false }); setHasuraRepos([]); }, postman: () => { setPostmanStatus({ connected: false }); setPostmanRepos([]); }, shopify: () => { setShopifyStatus({ connected: false }); setShopifyRepos([]); }, twilio: () => { setTwilioStatus({ connected: false }); }, kubernetes: () => { setK8sStatus({ connected: false }); setK8sRepos([]); }, linear: () => { setLinearStatus({ connected: false }); setLinearRepos([]); }, planetscale: () => { setPsStatus({ connected: false }); setPsRepos([]); }, bitwarden: () => { setBwStatus({ connected: false }); setBwRepos([]); }, ghost: () => { setGhostStatus({ connected: false }); }, appwrite: () => { setAppwriteStatus({ connected: false }); setAppwriteRepos([]); }, onepassword: () => { setOpStatus({ connected: false }); setOpRepos([]); }, firebase: () => { setFirebaseStatus({ connected: false }); setFirebaseRepos([]); }, sentry: () => { setSentryStatus({ connected: false }); setSentryRepos([]); }, notion: () => { setNotionStatus({ connected: false }); setNotionRepos([]); }, googledrive: () => { setGdStatus({ connected: false }); setGdRepos([]); }, zapier: () => { setZapierStatus({ connected: false }); setZapierRepos([]); }, bitbucketpipelines: () => { setBbpStatus({ connected: false }); setBbpRepos([]); }, gitlabselfmanaged: () => { setGlsmStatus({ connected: false }); setGlsmRepos([]); }, discordwebhook: () => { setDiscordWebhookStatus({ connected: false }); setDiscordWebhookRepos([]); }, mattermost: () => { setMattermostStatus({ connected: false }); setMattermostRepos([]); } };
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

  // ── Derived values (must stay above early returns so hooks order is stable) ──
  const connectedCount = [githubStatus, gitlabStatus, vercelStatus, netlifyStatus, awsStatus, dopplerStatus, bitbucketStatus, gcpStatus, azureStatus, railwayStatus, flyStatus, renderStatus, doStatus, herokuStatus, slackStatus, discordStatus, teamsStatus, vaultStatus, circleciStatus, cloudflareStatus, jenkinsStatus, pagerdutyStatus, travisciStatus, supabaseStatus, telegramStatus, emailStatus, terraformStatus, buildkiteStatus, opsgenieStatus, checklyStatus, hasuraStatus, postmanStatus, shopifyStatus, twilioStatus, k8sStatus, linearStatus, psStatus, bwStatus, ghostStatus, appwriteStatus, opStatus, firebaseStatus, sentryStatus, notionStatus, gdStatus, zapierStatus, bbpStatus, glsmStatus, discordWebhookStatus, mattermostStatus].filter(s => s?.connected).length;

  const categories = [
    { id: "all", label: "All" },
    { id: "source", label: "Source Control" },
    { id: "deployment", label: "Deployment" },
    { id: "cloud", label: "Cloud" },
    { id: "notifications", label: "Notifications" },
  ] as const;

  type IntegrationDef = { name: string; category: "source" | "deployment" | "cloud" | "notifications"; card: React.ReactNode; };

  const allIntegrations: IntegrationDef[] = [
    { name: "GitHub", category: "source", card: <ConnectionCard name="GitHub" icon={<Github className="h-5 w-5 text-white" />} iconBg="bg-[#24292e]" status={githubStatus} onConnect={() => { if (githubStatus?.authUrl) window.location.href = githubStatus.authUrl; else toast({ title: "GitHub Link Error", description: githubStatus?.error || "Unable to start GitHub authentication.", variant: "destructive" }); }} onDisconnect={() => disconnect("github")} /> },
    { name: "GitLab", category: "source", card: <ConnectionCard name="GitLab" icon={<Gitlab className="h-5 w-5 text-white" />} iconBg="bg-[#FC6D26]" status={gitlabStatus} onConnect={() => { if (gitlabStatus?.authUrl) window.location.href = gitlabStatus.authUrl; else toast({ title: "GitLab Link Error", description: gitlabStatus?.error || "Unable to start GitLab authentication.", variant: "destructive" }); }} onDisconnect={() => disconnect("gitlab")} /> },
    { name: "Bitbucket", category: "source", card: <ConnectionCard name="Bitbucket" icon={<img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className="h-6 w-6" />} iconBg="bg-white shadow-inner" status={bitbucketStatus} onConnect={() => setBitbucketModal(true)} onDisconnect={() => disconnect("bitbucket")} tokenBased /> },
    { name: "Vercel", category: "deployment", card: <ConnectionCard name="Vercel" icon={<Triangle className="h-4 w-4 text-white fill-white" />} iconBg="bg-black" status={vercelStatus} onConnect={() => setVercelModal(true)} onDisconnect={() => disconnect("vercel")} tokenBased /> },
    { name: "Netlify", category: "deployment", card: <ConnectionCard name="Netlify" icon={<img src="/Netlify Symbol SVG.svg" alt="Netlify" className="h-6 w-6 object-contain" />} iconBg="bg-[#00C7B7]" status={netlifyStatus} onConnect={() => setNetlifyModal(true)} onDisconnect={() => disconnect("netlify")} tokenBased /> },
    { name: "Railway", category: "deployment", card: <ConnectionCard name="Railway" icon={<img src="/Railway Symbol SVG.svg" alt="Railway" className="h-6 w-6 object-contain" />} iconBg="bg-[#0B0D0E]" status={railwayStatus} onConnect={() => setRailwayModal(true)} onDisconnect={() => disconnect("railway")} tokenBased /> },
    { name: "Fly.io", category: "deployment", card: <ConnectionCard name="Fly.io" icon={<img src="/Fly (1)io Symbol SVG.svg" alt="Fly.io" className="h-6 w-6 object-contain" />} iconBg="bg-[#4222E9]" status={flyStatus} onConnect={() => setFlyModal(true)} onDisconnect={() => disconnect("fly")} tokenBased /> },
    { name: "Render", category: "deployment", card: <ConnectionCard name="Render" icon={<img src="/Render Symbol SVG.svg" alt="Render" className="h-6 w-6 object-contain" />} iconBg="bg-white border shadow-sm" status={renderStatus} onConnect={() => setRenderModal(true)} onDisconnect={() => disconnect("render")} tokenBased /> },
    { name: "Heroku", category: "deployment", card: <ConnectionCard name="Heroku" icon={<img src="/Heroku Symbol SVG.svg" alt="Heroku" className="h-6 w-6 object-contain" />} iconBg="bg-[#6762A6]" status={herokuStatus} onConnect={() => setHerokuModal(true)} onDisconnect={() => disconnect("heroku")} tokenBased /> },
    { name: "AWS", category: "cloud", card: <ConnectionCard name="AWS" icon={<img src="/Amazon Web Services Icon.png" alt="AWS" className="h-6 w-6 object-contain" />} iconBg="bg-white" status={awsStatus} onConnect={() => setAwsModal(true)} onDisconnect={() => disconnect("aws")} onEdit={() => setAwsModal(true)} tokenBased /> },
    { name: "Doppler", category: "cloud", card: <ConnectionCard name="Doppler" icon={<img src="/Doppler.png" alt="Doppler" className="h-6 w-6 object-contain rounded" />} iconBg="bg-white" status={dopplerStatus} onConnect={() => setDopplerModal(true)} onDisconnect={() => disconnect("doppler")} tokenBased /> },
    { name: "Google Cloud", category: "cloud", card: <ConnectionCard name="Google Cloud" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4" /><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853" /><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05" /><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335" /></svg>} iconBg="bg-white border" status={gcpStatus} onConnect={() => setGcpModal(true)} onDisconnect={() => disconnect("gcp")} tokenBased /> },
    { name: "Azure", category: "cloud", card: <ConnectionCard name="Azure" icon={<img src="/Microsoft Symbol SVG.svg" alt="Azure" className="h-6 w-6 object-contain" />} iconBg="bg-[#0089D6]" status={azureStatus} onConnect={() => setAzureModal(true)} onDisconnect={() => disconnect("azure")} tokenBased /> },
    { name: "DigitalOcean", category: "cloud", card: <ConnectionCard name="DigitalOcean" icon={<img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className="h-6 w-6 object-contain" />} iconBg="bg-white" status={doStatus} onConnect={() => setDoModal(true)} onDisconnect={() => disconnect("digitalocean")} tokenBased /> },
    { name: "Slack", category: "notifications", card: <ConnectionCard name="Slack" icon={<img src="/Slack Symbol SVG.svg" alt="Slack" className="h-6 w-6 object-contain" />} iconBg="bg-[#4A154B]" status={slackStatus} onConnect={() => setSlackModal(true)} onDisconnect={() => disconnect("slack")} tokenBased /> },
    { name: "Discord", category: "notifications", card: <ConnectionCard name="Discord" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.006 14.006 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" /></svg>} iconBg="bg-[#5865F2]" status={discordStatus} onConnect={() => setDiscordModal(true)} onDisconnect={() => disconnect("discord")} tokenBased /> },
    { name: "Microsoft Teams", category: "notifications", card: <ConnectionCard name="Microsoft Teams" icon={<img src="/Microsoft Symbol SVG.svg" alt="Teams" className="h-6 w-6 object-contain" />} iconBg="bg-[#6264A7]" status={teamsStatus} onConnect={() => setTeamsModal(true)} onDisconnect={() => disconnect("teams")} tokenBased /> },
    { name: "HashiCorp Vault", category: "cloud", card: <ConnectionCard name="HashiCorp Vault" icon={<span className="font-bold text-[#FFCD00] text-sm">V</span>} iconBg="bg-[#1A1A1A]" status={vaultStatus} onConnect={() => setVaultModal(true)} onDisconnect={() => disconnect("vault")} tokenBased /> },
    { name: "CircleCI", category: "deployment", card: <ConnectionCard name="CircleCI" icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="#04D361" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm0 4.5c2.084 0 3.97.77 5.408 2.035A7.454 7.454 0 0 0 12 4.5zm0 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1 0-9zm-7.468 2.043A7.5 7.5 0 0 0 12 19.5a7.5 7.5 0 0 0 7.468-9.957A4.498 4.498 0 0 1 12 16.5a4.498 4.498 0 0 1-7.468-6.957z" /></svg>} iconBg="bg-[#343434]" status={circleciStatus} onConnect={() => setCircleciModal(true)} onDisconnect={() => disconnect("circleci")} tokenBased /> },
    { name: "Cloudflare", category: "deployment", card: <ConnectionCard name="Cloudflare" icon={<svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 14.3c.2-.7.1-1.4-.3-1.9s-1-.8-1.7-.8H6.2c-.1 0-.1 0-.1.1l-.4 1.4c-.2.7-.1 1.4.3 1.9s1 .8 1.7.8h7c.1 0 .2-.1.2-.2l.6-1.3zM18 10.6c-.4-1.3-1.5-2.1-2.9-2.1-.1 0-.2 0-.4.1-.6-1.1-1.8-1.8-3.1-1.8-2.1 0-3.8 1.7-3.8 3.8v.1c-1.4.2-2.5 1.4-2.5 2.9 0 .1 0 .2.1.2H16c.1 0 .2-.1.2-.2l1.8-3z" /></svg>} iconBg="bg-[#F6821F]" status={cloudflareStatus} onConnect={() => setCloudflareModal(true)} onDisconnect={() => disconnect("cloudflare")} tokenBased /> },
    { name: "Jenkins", category: "deployment", card: <ConnectionCard name="Jenkins" icon={<span className="font-bold text-white text-sm">J</span>} iconBg="bg-[#D33833]" status={jenkinsStatus} onConnect={() => setJenkinsModal(true)} onDisconnect={() => disconnect("jenkins")} tokenBased /> },
    { name: "PagerDuty", category: "notifications", card: <ConnectionCard name="PagerDuty" icon={<span className="font-bold text-white text-[10px]">PD</span>} iconBg="bg-[#06AC38]" status={pagerdutyStatus} onConnect={() => setPagerdutyModal(true)} onDisconnect={() => disconnect("pagerduty")} tokenBased /> },
    { name: "Travis CI", category: "deployment", card: <ConnectionCard name="Travis CI" icon={<span className="font-bold text-white text-[10px]">CI</span>} iconBg="bg-[#3EAAAF]" status={travisciStatus} onConnect={() => setTravisciModal(true)} onDisconnect={() => disconnect("travisci")} tokenBased /> },
    { name: "Supabase", category: "cloud", card: <ConnectionCard name="Supabase" icon={<span className="font-bold text-black text-[10px]">SB</span>} iconBg="bg-[#3ECF8E]" status={supabaseStatus} onConnect={() => setSupabaseModal(true)} onDisconnect={() => disconnect("supabase")} tokenBased /> },
    { name: "Telegram", category: "notifications", card: <ConnectionCard name="Telegram" icon={<svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>} iconBg="bg-[#229ED9]" status={telegramStatus} onConnect={() => setTelegramModal(true)} onDisconnect={() => disconnect("telegram")} tokenBased /> },
    { name: "Email", category: "notifications", card: <ConnectionCard name="Email" icon={<Mail className="h-5 w-5 text-white" />} iconBg="bg-[#2563eb]" status={emailStatus} onConnect={() => setEmailModal(true)} onDisconnect={() => disconnect("email")} tokenBased /> },
    { name: "Terraform Cloud", category: "cloud", card: <ConnectionCard name="Terraform Cloud" icon={<span className="font-bold text-white text-[10px]">TF</span>} iconBg="bg-[#7B42BC]" status={terraformStatus} onConnect={() => setTerraformModal(true)} onDisconnect={() => disconnect("terraform")} tokenBased /> },
    { name: "Buildkite", category: "deployment", card: <ConnectionCard name="Buildkite" icon={<span className="font-bold text-black text-[10px]">BK</span>} iconBg="bg-[#23D381]" status={buildkiteStatus} onConnect={() => setBuildkiteModal(true)} onDisconnect={() => disconnect("buildkite")} tokenBased /> },
    { name: "Opsgenie", category: "notifications", card: <ConnectionCard name="Opsgenie" icon={<span className="font-bold text-white text-[10px]">OG</span>} iconBg="bg-[#2563EB]" status={opsgenieStatus} onConnect={() => setOpsgenieModal(true)} onDisconnect={() => disconnect("opsgenie")} tokenBased /> },
    { name: "Checkly", category: "deployment", card: <ConnectionCard name="Checkly" icon={<span className="font-bold text-white text-[10px]">C</span>} iconBg="bg-[#4285F4]" status={checklyStatus} onConnect={() => setChecklyModal(true)} onDisconnect={() => disconnect("checkly")} tokenBased /> },
    { name: "Hasura Cloud", category: "cloud", card: <ConnectionCard name="Hasura Cloud" icon={<span className="font-bold text-[#3ECF8E] text-[10px]">H</span>} iconBg="bg-[#191D31]" status={hasuraStatus} onConnect={() => setHasuraModal(true)} onDisconnect={() => disconnect("hasura")} tokenBased /> },
    { name: "Postman", category: "source", card: <ConnectionCard name="Postman" icon={<span className="font-bold text-white text-[10px]">PM</span>} iconBg="bg-[#FF6C37]" status={postmanStatus} onConnect={() => setPostmanModal(true)} onDisconnect={() => disconnect("postman")} tokenBased /> },
    { name: "Shopify", category: "cloud", card: <ConnectionCard name="Shopify" icon={<span className="font-bold text-white text-[10px]">S</span>} iconBg="bg-[#96BF48]" status={shopifyStatus} onConnect={() => setShopifyModal(true)} onDisconnect={() => disconnect("shopify")} tokenBased /> },
    { name: "Twilio", category: "notifications", card: <ConnectionCard name="Twilio" icon={<span className="font-bold text-white text-[10px]">TW</span>} iconBg="bg-[#F22F46]" status={twilioStatus} onConnect={() => setTwilioModal(true)} onDisconnect={() => disconnect("twilio")} tokenBased /> },
    { name: "Kubernetes", category: "deployment", card: <ConnectionCard name="Kubernetes" icon={<span className="font-bold text-white text-[10px]">K8S</span>} iconBg="bg-[#326CE5]" status={k8sStatus} onConnect={() => setK8sModal(true)} onDisconnect={() => disconnect("kubernetes")} tokenBased /> },
    { name: "Linear", category: "notifications", card: <ConnectionCard name="Linear" icon={<span className="font-bold text-white text-[10px]">L</span>} iconBg="bg-[#5E6AD2]" status={linearStatus} onConnect={() => setLinearModal(true)} onDisconnect={() => disconnect("linear")} tokenBased /> },
    { name: "PlanetScale", category: "cloud", card: <ConnectionCard name="PlanetScale" icon={<span className="font-bold text-white text-[10px]">PS</span>} iconBg="bg-black" status={psStatus} onConnect={() => setPsModal(true)} onDisconnect={() => disconnect("planetscale")} tokenBased /> },
    { name: "Bitwarden", category: "source", card: <ConnectionCard name="Bitwarden" icon={<Shield className="h-3 w-3 text-white" />} iconBg="bg-[#175DDC]" status={bwStatus} onConnect={() => setBwModal(true)} onDisconnect={() => disconnect("bitwarden")} tokenBased /> },
    { name: "Ghost CMS", category: "notifications", card: <ConnectionCard name="Ghost" icon={<Globe className="h-3 w-3 text-white" />} iconBg="bg-[#15171A]" status={ghostStatus} onConnect={() => setGhostModal(true)} onDisconnect={() => disconnect("ghost")} tokenBased /> },
    { name: "Appwrite", category: "cloud", card: <ConnectionCard name="Appwrite" icon={<Box className="h-3 w-3 text-white" />} iconBg="bg-[#F02E65]" status={appwriteStatus} onConnect={() => setAppwriteModal(true)} onDisconnect={() => disconnect("appwrite")} tokenBased /> },
    { name: "1Password", category: "source", card: <ConnectionCard name="1Password" icon={<Lock className="h-3 w-3 text-white" />} iconBg="bg-[#0094F5]" status={opStatus} onConnect={() => setOpModal(true)} onDisconnect={() => disconnect("onepassword")} tokenBased /> },
    { name: "Firebase", category: "cloud", card: <ConnectionCard name="Firebase" icon={<Flame className="h-3 w-3 text-white" />} iconBg="bg-[#FFCA28]" status={firebaseStatus} onConnect={() => setFirebaseModal(true)} onDisconnect={() => disconnect("firebase")} tokenBased /> },
    { name: "Sentry", category: "notifications", card: <ConnectionCard name="Sentry" icon={<Activity className="h-3 w-3 text-white" />} iconBg="bg-[#362D59]" status={sentryStatus} onConnect={() => setSentryModal(true)} onDisconnect={() => disconnect("sentry")} tokenBased /> },
    { name: "Notion", category: "source", card: <ConnectionCard name="Notion" icon={<Database className="h-3 w-3 text-white" />} iconBg="bg-[#000000]" status={notionStatus} onConnect={() => setNotionModal(true)} onDisconnect={() => disconnect("notion")} tokenBased /> },
    { name: "Google Drive", category: "cloud", card: <ConnectionCard name="Google Drive" icon={<HardDrive className="h-3 w-3 text-white" />} iconBg="bg-[#4285F4]" status={gdStatus} onConnect={() => setDriveModal(true)} onDisconnect={() => disconnect("googledrive")} tokenBased /> },
    { name: "Zapier", category: "notifications", card: <ConnectionCard name="Zapier" icon={<Zap className="h-3 w-3 text-white" />} iconBg="bg-[#FF4F00]" status={zapierStatus} onConnect={() => setZapierModal(true)} onDisconnect={() => disconnect("zapier")} tokenBased /> },
    { name: "Bitbucket Pipelines", category: "source", card: <ConnectionCard name="BB Pipelines" icon={<Ship className="h-3 w-3 text-white" />} iconBg="bg-[#0052CC]" status={bbpStatus} onConnect={() => setBbpModal(true)} onDisconnect={() => disconnect("bitbucketpipelines")} tokenBased /> },
    { name: "GitLab Self-Managed", category: "source", card: <ConnectionCard name="GitLab SM" icon={<Building className="h-3 w-3 text-white" />} iconBg="bg-[#FC6D26]" status={glsmStatus} onConnect={() => setGlsmModal(true)} onDisconnect={() => disconnect("gitlabselfmanaged")} tokenBased /> },
    { name: "Discord Webhook", category: "notifications", card: <ConnectionCard name="Discord Webhook" icon={<Webhook className="h-3 w-3 text-white" />} iconBg="bg-[#5865F2]" status={discordWebhookStatus} onConnect={() => setDiscordWebhookModal(true)} onDisconnect={() => disconnect("discordwebhook")} tokenBased /> },
    { name: "Mattermost", category: "notifications", card: <ConnectionCard name="Mattermost" icon={<MessageSquare className="h-3 w-3 text-white" />} iconBg="bg-[#0058CC]" status={mattermostStatus} onConnect={() => setMattermostModal(true)} onDisconnect={() => disconnect("mattermost")} tokenBased /> },
  ];

  // useMemo must be above early returns (Rules of Hooks)
  const filteredIntegrations = useMemo(() => {
    return allIntegrations.filter(i => {
      const matchCat = activeCategory === "all" || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, activeCategory, githubStatus, gitlabStatus, vercelStatus, netlifyStatus, awsStatus, dopplerStatus, bitbucketStatus, gcpStatus, azureStatus, railwayStatus, flyStatus, renderStatus, doStatus, herokuStatus, slackStatus, discordStatus, teamsStatus, vaultStatus, circleciStatus, cloudflareStatus, jenkinsStatus, pagerdutyStatus, travisciStatus, supabaseStatus, telegramStatus, emailStatus, terraformStatus, buildkiteStatus, opsgenieStatus, checklyStatus, hasuraStatus, postmanStatus, shopifyStatus, twilioStatus, k8sStatus, linearStatus, psStatus, bwStatus, ghostStatus, appwriteStatus, opStatus, firebaseStatus, sentryStatus, notionStatus, gdStatus, zapierStatus, bbpStatus, glsmStatus, discordWebhookStatus, mattermostStatus]);

  // ── Early returns (after all hooks) ──────────────────────────────────────────
  if (!loading && !(isPersonalWorkspace || isWorkspaceOwner)) {
    return <DashboardLayout><div className="flex flex-col items-center justify-center h-[60vh] space-y-4"><Shield className="h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-semibold">Access Denied</h2><p className="text-muted-foreground text-sm">Only workspace owners can manage integrations.</p></div></DashboardLayout>;
  }
  const anyConnected = [githubStatus, gitlabStatus, vercelStatus, netlifyStatus, awsStatus, dopplerStatus, bitbucketStatus, gcpStatus, azureStatus, railwayStatus, flyStatus, renderStatus, doStatus, herokuStatus, slackStatus, discordStatus, teamsStatus, vaultStatus, circleciStatus, cloudflareStatus, jenkinsStatus, pagerdutyStatus, travisciStatus, supabaseStatus, telegramStatus, emailStatus, terraformStatus, buildkiteStatus, opsgenieStatus, checklyStatus, hasuraStatus, postmanStatus, shopifyStatus, twilioStatus, k8sStatus, linearStatus, psStatus, bwStatus, ghostStatus, appwriteStatus, opStatus, firebaseStatus, sentryStatus, notionStatus, gdStatus, zapierStatus, bbpStatus, glsmStatus, discordWebhookStatus, mattermostStatus].some(s => s?.connected);

  const providerConnected: Record<SyncProvider, boolean | undefined> = {
    github: githubStatus?.connected, gitlab: gitlabStatus?.connected, vercel: vercelStatus?.connected,
    netlify: netlifyStatus?.connected, aws: awsStatus?.connected, doppler: dopplerStatus?.connected,
    bitbucket: bitbucketStatus?.connected, gcp: gcpStatus?.connected, azure: azureStatus?.connected,
    railway: railwayStatus?.connected, fly: flyStatus?.connected, render: renderStatus?.connected,
    digitalocean: doStatus?.connected, heroku: herokuStatus?.connected, slack: slackStatus?.connected,
    discord: discordStatus?.connected, teams: teamsStatus?.connected, vault: vaultStatus?.connected,
    circleci: circleciStatus?.connected, cloudflare: cloudflareStatus?.connected, jenkins: jenkinsStatus?.connected,
    pagerduty: pagerdutyStatus?.connected, travisci: travisciStatus?.connected, supabase: supabaseStatus?.connected,
    telegram: telegramStatus?.connected, email: emailStatus?.connected, terraform: terraformStatus?.connected,
    buildkite: buildkiteStatus?.connected, opsgenie: opsgenieStatus?.connected, checkly: checklyStatus?.connected,
    hasura: hasuraStatus?.connected, postman: postmanStatus?.connected, shopify: shopifyStatus?.connected,
    twilio: twilioStatus?.connected, kubernetes: k8sStatus?.connected, linear: linearStatus?.connected,
    planetscale: psStatus?.connected, bitwarden: bwStatus?.connected, ghost: ghostStatus?.connected,
    appwrite: appwriteStatus?.connected, onepassword: opStatus?.connected, firebase: firebaseStatus?.connected,
    sentry: sentryStatus?.connected, notion: notionStatus?.connected, googledrive: gdStatus?.connected,
    zapier: zapierStatus?.connected, bitbucketpipelines: bbpStatus?.connected, gitlabselfmanaged: glsmStatus?.connected,
    discordwebhook: discordWebhookStatus?.connected, mattermost: mattermostStatus?.connected
  };

  const repoLabel: Record<SyncProvider, string> = { github: "Repository", gitlab: "GitLab Project", vercel: "Vercel Project", netlify: "Netlify Site", aws: "AWS Region", doppler: "Doppler Config", bitbucket: "Bitbucket Repo", gcp: "GCP Project", azure: "Azure Vault", railway: "Railway Target", fly: "Fly App", render: "Render Target", digitalocean: "DigitalOcean App", heroku: "Heroku App", slack: "N/A", discord: "N/A", teams: "N/A", vault: "Secret Engine", circleci: "CircleCI Org", cloudflare: "Worker / Pages Project", jenkins: "Jenkins Job", pagerduty: "PagerDuty Service", travisci: "Repository", supabase: "Supabase Project", telegram: "N/A", email: "N/A", terraform: "Workspace", buildkite: "Pipeline", opsgenie: "N/A", checkly: "Account Context", hasura: "Project", postman: "Environment", shopify: "Store Context", twilio: "N/A", kubernetes: "Namespace", linear: "Team Context", planetscale: "DB Branch", bitwarden: "BW Project", ghost: "N/A", appwrite: "Appwrite Target", onepassword: "Vault", firebase: "Firebase Location", sentry: "Sentry Project", notion: "Notion Database", googledrive: "Backup Folder", zapier: "Zapier Webhook", bitbucketpipelines: "Pipelines Repo", gitlabselfmanaged: "Enterprise Project", discordwebhook: "Discord Hook", mattermost: "Mattermost Hook" };

  const canCompare = (syncProvider === "vercel" || syncProvider === "netlify") && !!selectedRepo && !!selectedProject;

  const providerIcon = (p: SyncProvider, cls = "h-3 w-3") => {
    if (p === "github") return <Github className={cls} />;
    if (p === "gitlab") return <Gitlab className={`${cls} text-[#FC6D26]`} />;
    if (p === "vercel") return <Triangle className={`${cls} fill-current`} />;
    if (p === "netlify") return <span className="text-[#00C7B7] font-bold text-[10px]">◆</span>;
    if (p === "doppler") return <span className="text-[#6366f1] font-bold text-[10px]">D</span>;
    if (p === "bitbucket") return <img src="/Bitbucket Symbol SVG.svg" alt="Bitbucket" className={cls} />;
    if (p === "gcp") return <svg viewBox="0 0 24 24" className={cls} xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5v14l8 3 8-3V5l-8-3z" fill="#4285F4" /><path d="M12 22l8-3V5l-8-3v20z" fill="#34A853" /><path d="M4 5v14l8 3v-7l-8-3.5V5z" fill="#FBBC05" /><path d="M20 5v14l-8 3v-7l8-3.5V5z" fill="#EA4335" /></svg>;
    if (p === "azure") return <svg viewBox="0 0 24 24" className={cls} xmlns="http://www.w3.org/2000/svg"><path d="M11.52.53L1.13 11.16l1.39 12.31L12.92 23.3l9.95-10.74L21.48.69l-9.96-.16zm0 2.21l7.74.12 1.11 9.77-7.75 8.35-8.08-.11-1.08-9.59 8.06-8.54z" fill="#0089D6" /><path d="M12.92 23.3s-9.95.17-10.4 0c-.45-.17 1.39-12.31 1.39-12.31l10.39-11 8.56.16 1.11 12.15-11.05 11z" fill="#0089D6" opacity=".1" /><path d="M11.52.53L1.13 11.16s9.9-.17 10.39-11L11.52.53z" fill="#0089D6" /><path d="M1.13 11.16l1.39 12.31s9.54.1 10.4 0c.86-.1 1.08-11 1.08-11L1.13 11.16z" fill="#0072C6" /></svg>;
    if (p === "railway") return <img src="/Railway Symbol SVG.svg" alt="Railway" className={cls} />;
    if (p === "fly") return <img src="/Fly (1)io Symbol SVG.svg" alt="Fly.io" className={cls} />;
    if (p === "render") return <img src="/Render Symbol SVG.svg" alt="Render" className={cls} />;
    if (p === "digitalocean") return <img src="/DigitalOcean Holdings Symbol SVG.svg" alt="DigitalOcean" className={cls} />;
    if (p === "heroku") return <img src="/Heroku Symbol SVG.svg" alt="Heroku" className={cls} />;
    if (p === "email") return <Mail className={cls} />;
    if (p === "terraform") return <span className="text-[#000000] font-bold text-[10px]">TF</span>;
    if (p === "buildkite") return <span className="text-[#000000] font-bold text-[10px]">BK</span>;
    if (p === "opsgenie") return <span className="text-[#2563EB] font-bold text-[10px]">OG</span>;
    if (p === "checkly") return <span className="text-[#4285F4] font-bold text-[10px]">C</span>;
    if (p === "hasura") return <span className="text-[#3ECF8E] font-bold text-[10px]">H</span>;
    if (p === "postman") return <span className="text-[#FF6C37] font-bold text-[10px]">PM</span>;
    if (p === "shopify") return <span className="text-[#96BF48] font-bold text-[10px]">S</span>;
    if (p === "twilio") return <span className="text-[#F22F46] font-bold text-[10px]">TW</span>;
    if (p === "kubernetes") return <span className="text-[#326CE5] font-bold text-[10px]">K8S</span>;
    if (p === "linear") return <span className="text-[#5E6AD2] font-bold text-[10px]">L</span>;
    if (p === "planetscale") return <span className="text-white font-bold text-[10px]">PS</span>;
    if (p === "bitwarden") return <Shield className="h-3 w-3 text-[#175DDC]" />;
    if (p === "ghost") return <Globe className="h-3 w-3 text-[#15171A]" />;
    if (p === "appwrite") return <Box className="h-3 w-3 text-[#F02E65]" />;
    if (p === "onepassword") return <Lock className="h-3 w-3 text-[#0094F5]" />;
    if (p === "firebase") return <Flame className="h-3 w-3 text-[#FFCA28]" />;
    if (p === "sentry") return <Activity className="h-3 w-3 text-white" />;
    if (p === "notion") return <Database className="h-3 w-3 text-white" />;
    if (p === "googledrive") return <HardDrive className="h-3 w-3 text-white" />;
    if (p === "zapier") return <Zap className="h-3 w-3 text-white" />;
    if (p === "bitbucketpipelines") return <Ship className="h-3 w-3 text-white" />;
    if (p === "gitlabselfmanaged") return <Building className="h-3 w-3 text-white" />;
    if (p === "discordwebhook") return <Webhook className="h-3 w-3 text-white" />;
    if (p === "mattermost") return <MessageSquare className="h-3 w-3 text-white" />;
    return <img src="/aws-logo.svg" alt="AWS" className={cls} />;
  };

  const detailText: Record<SyncProvider, string> = { github: "Pushed to GitHub Actions", gitlab: "Pushed to GitLab CI/CD", vercel: "Pushed to Vercel Environment", netlify: "Pushed to Netlify Site", aws: "Pushed to AWS Secrets Manager", doppler: "Pushed to Doppler Config", bitbucket: "Pushed to Bitbucket Repository Variables", gcp: "Pushed to Google Cloud Secret Manager", azure: "Azure Key Vault", railway: "Pushed to Railway Environment Variables", fly: "Fly.io App Secrets", render: "Pushed to Render Environment Variables", digitalocean: "Pushed to DigitalOcean App Platform", heroku: "Heroku Config Vars", slack: "Sent to Slack", discord: "Sent to Discord", teams: "Sent to Microsoft Teams", vault: "Pushed to HashiCorp Vault KV", circleci: "Pushed to CircleCI Env Variables", cloudflare: "Pushed to Cloudflare Worker/Pages", jenkins: "Pushed to Jenkins Credentials Store", pagerduty: "Incident triggered in PagerDuty", travisci: "Pushed to Travis CI Env Variables", supabase: "Pushed to Supabase Project Secrets", telegram: "Sent to Telegram", email: "Email alert sent via SMTP", terraform: "Pushed to Terraform Workspace Variables", buildkite: "Pushed to Buildkite Pipeline Env", opsgenie: "Alert triggered in Opsgenie", checkly: "Pushed to Checkly Global Variables", hasura: "Pushed to Hasura Cloud Env Vars", postman: "Pushed to Postman Environment", shopify: "Pushed to Shopify Metafields", twilio: "SMS alert sent via Twilio", kubernetes: "Pushed to K8s Opaque Secret", linear: "Issue created in Linear", planetscale: "Pushed to Database Infrastructure", bitwarden: "Pushed to BW Secrets Manager", ghost: "Draft post created in Ghost", appwrite: "Pushed to Appwrite Variables", onepassword: "Pushed to 1Password Vault", firebase: "Firebase Secret Manager", sentry: "Event reported to Sentry", notion: "Pushed to Notion Database", googledrive: "Backup created in Google Drive", zapier: "Automation triggered in Zapier", bitbucketpipelines: "Pushed to BB Pipeline Variables", gitlabselfmanaged: "Pushed to Enterprise GitLab CI", discordwebhook: "Sent to Discord Channel", mattermost: "Sent to Mattermost Channel" };

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-80 rounded-lg" />
          <Skeleton className="h-8 w-56 rounded-md ml-auto" />
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        {/* Sync */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <div className="rounded-lg border">
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-56 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 space-y-1.5">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className="border-t px-4 py-3 flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        {/* ── Header ────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect services and sync secrets to CI/CD pipelines.</p>
        </div>

        {/* ── Filter bar ───────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/30">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeCategory === cat.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 text-xs rounded-md border bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-shadow placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {connectedCount > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {connectedCount}/{allIntegrations.length} active
            </span>
          )}
        </div>

        {/* ── Connections grid ──────────────────────────────── */}
        {filteredIntegrations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredIntegrations.map(i => (
              <div key={i.name}>{i.card}</div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Search className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
            <p className="font-medium text-sm">No integrations match</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try a different filter or search term.</p>
          </div>
        )}

        {/* ── Sync Secrets ──────────────────────────────── */}
        {anyConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sync Secrets</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Push secrets from a project to a connected provider.</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden">
              {/* Row 1: Destination provider selector */}
              <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-3">
                <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Destination</Label>
                <Select value={syncProvider} onValueChange={(v) => setSyncProvider(v as SyncProvider)}>
                  <SelectTrigger className="h-8 w-56 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["github", "gitlab", "bitbucket", "vercel", "netlify", "aws", "doppler", "gcp", "azure", "railway", "fly", "render", "digitalocean", "heroku", "slack", "discord", "teams", "vault", "circleci", "cloudflare", "jenkins", "pagerduty", "travisci", "supabase", "telegram", "email", "terraform", "buildkite", "opsgenie", "checkly", "hasura", "postman", "shopify", "twilio", "kubernetes", "linear", "planetscale", "bitwarden", "ghost", "appwrite", "onepassword", "firebase", "sentry", "notion", "googledrive", "zapier", "bitbucketpipelines", "gitlabselfmanaged", "discordwebhook", "mattermost"] as SyncProvider[]).map(p => {
                      const labels: Record<SyncProvider, string> = { github: "GitHub Actions", gitlab: "GitLab CI/CD", bitbucket: "Bitbucket", vercel: "Vercel", netlify: "Netlify", aws: "AWS Secrets", doppler: "Doppler", gcp: "Google Cloud", azure: "Azure Key Vault", railway: "Railway", fly: "Fly.io", render: "Render", digitalocean: "DigitalOcean", heroku: "Heroku", slack: "Slack", discord: "Discord", teams: "Teams", vault: "HashiCorp Vault", circleci: "CircleCI", cloudflare: "Cloudflare", jenkins: "Jenkins", pagerduty: "PagerDuty", travisci: "Travis CI", supabase: "Supabase", telegram: "Telegram", email: "Email", terraform: "Terraform Cloud", buildkite: "Buildkite", opsgenie: "Opsgenie", checkly: "Checkly", hasura: "Hasura Cloud", postman: "Postman", shopify: "Shopify", twilio: "Twilio (SMS)", kubernetes: "Kubernetes", linear: "Linear", planetscale: "PlanetScale", bitwarden: "Bitwarden", ghost: "Ghost CMS", appwrite: "Appwrite", onepassword: "1Password", firebase: "Firebase", sentry: "Sentry", notion: "Notion", googledrive: "Google Drive", zapier: "Zapier", bitbucketpipelines: "Bitbucket Pipelines", gitlabselfmanaged: "GitLab Self-Managed", discordwebhook: "Discord Webhook", mattermost: "Mattermost" };
                      return (
                        <SelectItem key={p} value={p} disabled={!providerConnected[p]}>
                          <div className="flex items-center gap-2">
                            {providerIcon(p, "h-3.5 w-3.5")}
                            <span>{labels[p]}</span>
                            {!providerConnected[p] && <span className="text-[10px] text-muted-foreground/60 ml-auto">not connected</span>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground ml-auto hidden sm:block">
                  {({ github: "GitHub Actions Secrets", gitlab: "GitLab CI/CD Variables", bitbucket: "Bitbucket Repo Variables", vercel: "Vercel Env Vars", netlify: "Netlify Site Env Vars", aws: "AWS Secrets Manager", doppler: "Doppler Config", gcp: "GCP Secret Manager", azure: "Azure Key Vault", railway: "Railway Env Vars", fly: "Fly.io Secrets", render: "Render Env Vars", digitalocean: "DO App Platform", heroku: "Heroku Config Vars", slack: "Slack Webhook", discord: "Discord Webhook", teams: "Teams Webhook", vault: "Vault KV Secrets", circleci: "CircleCI Env", cloudflare: "Cloudflare Secrets", jenkins: "Jenkins Credentials", pagerduty: "PagerDuty Events", travisci: "Travis Secrets", supabase: "Supabase Secrets", telegram: "Telegram Bot", email: "SMTP Server", terraform: "Terraform Variables", buildkite: "Buildkite Env", opsgenie: "Opsgenie Alerts", checkly: "Checkly Variables", hasura: "Hasura Env", postman: "Postman Env", shopify: "Shopify Metafields", twilio: "Twilio SMS", kubernetes: "K8s Secrets", linear: "Linear Issues", planetscale: "PScale Secrets", bitwarden: "Bitwarden Secrets", ghost: "Ghost Posts", appwrite: "Appwrite Env", onepassword: "1Password Vaults", firebase: "Firebase Secrets", sentry: "Sentry Issues", notion: "Notion Pages", googledrive: "Cloud Backups", zapier: "Zapier Hooks", bitbucketpipelines: "Pipelines Secrets", gitlabselfmanaged: "Self-Hosted CI/CD", discordwebhook: "Security Alerts", mattermost: "Team Sync" } as Record<SyncProvider, string>)[syncProvider]}
                </span>
              </div>

              {/* Row 2: Source config */}
              <div className={`grid grid-cols-1 divide-y ${syncProvider === "aws" ? "md:grid-cols-2 md:divide-y-0 md:divide-x" : "md:grid-cols-3 md:divide-y-0 md:divide-x"}`}>
                {/* Project */}
                <div className="p-4 space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select project..." /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Environment */}
                <div className="p-4 space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Environment</Label>
                  <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Development {syncProvider === "netlify" && <span className="text-[10px] text-muted-foreground">(→ dev)</span>}</div></SelectItem>
                      <SelectItem value="staging"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />Staging {syncProvider === "vercel" && <span className="text-[10px] text-muted-foreground">(→ Preview)</span>}{syncProvider === "netlify" && <span className="text-[10px] text-muted-foreground">(→ branch-deploy)</span>}</div></SelectItem>
                      <SelectItem value="production"><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Production</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target */}
                {syncProvider !== "aws" && (
                  <div className="p-4 space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{repoLabel[syncProvider]}</Label>
                    <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{repos.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          <div className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground" />{r.fullName}{r.framework && <span className="text-[10px] text-muted-foreground">({r.framework})</span>}</div>
                        </SelectItem>
                      ))}</SelectContent>
                    </Select>
                  </div>
                )}

                {/* AWS path prefix */}
                {syncProvider === "aws" && (
                  <div className="p-4 space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Path Prefix</Label>
                    <Input placeholder="/myapp/prod/" value={awsPathPrefix} onChange={e => setAwsPathPrefix(e.target.value)} className="h-9 font-mono text-xs" />
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="border-t px-4 py-3 flex items-center gap-3 bg-muted/5">
                <div className="flex items-center gap-2 mr-auto">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 cursor-help whitespace-nowrap">
                        Key Prefix <Info className="h-2.5 w-2.5 text-muted-foreground/40" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>Prepend a prefix to all keys, e.g. PROD_DATABASE_URL</TooltipContent>
                  </Tooltip>
                  <Input
                    placeholder="optional"
                    value={secretPrefix}
                    onChange={e => setSecretPrefix(e.target.value.toUpperCase())}
                    className="h-7 font-mono text-[11px] w-24 bg-background"
                  />
                  {secretPrefix && <code className="text-[10px] text-muted-foreground">{secretPrefix}API_KEY</code>}
                </div>

                {/* Warning for restart-on-sync providers */}
                {(syncProvider === "fly" || syncProvider === "render" || syncProvider === "digitalocean" || syncProvider === "heroku") && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />Triggers redeploy
                  </span>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {canCompare && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setShowCompare(v => !v)}>
                      <AlertCircle className="h-3 w-3" />{showCompare ? "Hide Diff" : "Diff"}
                    </Button>
                  )}
                  <Button
                    onClick={handleSync}
                    disabled={syncing || !selectedProject || (!selectedRepo && syncProvider !== "aws") || !providerConnected[syncProvider]}
                    size="sm" className="gap-1.5 h-7 text-[11px] px-4"
                  >
                    {syncing ? <><Loader2 className="h-3 w-3 animate-spin" />Syncing...</> : <><RefreshCw className="h-3 w-3" />Sync</>}
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
                        <td className="p-2.5">{res.success && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(res.key)}><Trash2 className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Remove this secret from {syncProvider}</TooltipContent></Tooltip>}</td>
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

      <Modals.VercelConnectModal open={vercelModal} onClose={() => setVercelModal(false)} onConnected={s => { setVercelStatus(s); }} />
      <Modals.TokenModal open={netlifyModal} onClose={() => setNetlifyModal(false)} onConnected={s => { setNetlifyStatus(s); }} provider="netlify" providerName="Netlify" providerColor="#00C7B7"
        steps={[{ text: "Open", link: { href: "https://app.netlify.com/user/applications#personal-access-tokens", label: "app.netlify.com → User Settings → Applications" } }, { text: "Click New access token, name it XtraSecurity" }, { text: "Copy immediately — shown once" }]}
        scopeNote="No scope needed — inherits full account access." />
      <Modals.AwsConnectModal open={awsModal} onClose={() => setAwsModal(false)} onConnected={s => { setAwsStatus(s); }} currentRegion={awsStatus?.region} />
      <Modals.TokenModal open={dopplerModal} onClose={() => setDopplerModal(false)} onConnected={s => { setDopplerStatus(s); }} provider="doppler" providerName="Doppler" providerColor="#6366f1"
        steps={[
          { text: "Open", link: { href: "https://dashboard.doppler.com/workplace/integrations/service-tokens", label: "Doppler Dashboard → Integrations → Service Tokens" } },
          { text: "Or use a Personal Token: Account Settings → API Keys" },
          { text: "Create token with read+write access, copy once" },
        ]}
        scopeNote="Use a Service Token (dp.st.xxx) for project-scoped access, or a Personal Token (dp.pt.xxx) for full account access." />
      <Modals.BitbucketConnectModal open={bitbucketModal} onClose={() => setBitbucketModal(false)} onConnected={s => { setBitbucketStatus(s); }} />
      <Modals.GcpConnectModal open={gcpModal} onClose={() => setGcpModal(false)} onConnected={s => { setGcpStatus(s); }} />
      <Modals.AzureConnectModal open={azureModal} onClose={() => setAzureModal(false)} onConnected={s => { setAzureStatus(s); }} />
      <Modals.RailwayConnectModal open={railwayModal} onClose={() => setRailwayModal(false)} onConnected={s => { setRailwayStatus(s); }} />
      <Modals.FlyConnectModal open={flyModal} onClose={() => setFlyModal(false)} onConnected={s => { setFlyStatus(s); }} />
      <Modals.RenderConnectModal open={renderModal} onClose={() => setRenderModal(false)} onConnected={s => { setRenderStatus(s); }} />
      <Modals.DOConnectModal open={doModal} onClose={() => setDoModal(false)} onConnected={s => { setDoStatus(s); }} />
      <Modals.HerokuConnectModal open={herokuModal} onClose={() => setHerokuModal(false)} onConnected={s => { setHerokuStatus(s); }} />
      <Modals.SlackConnectModal open={slackModal} onClose={() => setSlackModal(false)} onConnected={s => { setSlackStatus(s); }} />
      <Modals.DiscordConnectModal open={discordModal} onClose={() => setDiscordModal(false)} onConnected={s => { setDiscordStatus(s); }} />
      <Modals.TeamsConnectModal open={teamsModal} onClose={() => setTeamsModal(false)} onConnected={s => { setTeamsStatus(s); }} />
      <Modals.VaultConnectModal open={vaultModal} onClose={() => setVaultModal(false)} onConnected={s => { setVaultStatus(s); }} />
      <Modals.CircleCIConnectModal open={circleciModal} onClose={() => setCircleciModal(false)} onConnected={s => { setCircleciStatus(s); }} />
      <Modals.CloudflareConnectModal open={cloudflareModal} onClose={() => setCloudflareModal(false)} onConnected={s => { setCloudflareStatus(s); }} />
      <Modals.JenkinsConnectModal open={jenkinsModal} onClose={() => setJenkinsModal(false)} onConnected={s => { setJenkinsStatus(s); }} />
      <Modals.PagerDutyConnectModal open={pagerdutyModal} onClose={() => setPagerdutyModal(false)} onConnected={s => { setPagerdutyStatus(s); }} />
      <Modals.TravisCIConnectModal open={travisciModal} onClose={() => setTravisciModal(false)} onConnected={s => { setTravisciStatus(s); }} />
      <Modals.SupabaseConnectModal open={supabaseModal} onClose={() => setSupabaseModal(false)} onConnected={s => { setSupabaseStatus(s); }} />
      <Modals.TelegramConnectModal open={telegramModal} onClose={() => setTelegramModal(false)} onConnected={s => { setTelegramStatus(s); }} />
      <Modals.EmailConnectModal open={emailModal} onClose={() => setEmailModal(false)} onConnected={s => { setEmailStatus(s); }} />
      <Modals.TerraformConnectModal open={terraformModal} onClose={() => setTerraformModal(false)} onConnected={s => { setTerraformStatus(s); }} />
      <Modals.BuildkiteConnectModal open={buildkiteModal} onClose={() => setBuildkiteModal(false)} onConnected={s => { setBuildkiteStatus(s); }} />
      <Modals.OpsgenieConnectModal open={opsgenieModal} onClose={() => setOpsgenieModal(false)} onConnected={s => { setOpsgenieStatus(s); }} />
      <Modals.ChecklyConnectModal open={checklyModal} onClose={() => setChecklyModal(false)} onConnected={s => { setChecklyStatus(s); }} />
      <Modals.HasuraConnectModal open={hasuraModal} onClose={() => setHasuraModal(false)} onConnected={s => { setHasuraStatus(s); }} />
      <Modals.PostmanConnectModal open={postmanModal} onClose={() => setPostmanModal(false)} onConnected={s => { setPostmanStatus(s); }} />
      <Modals.ShopifyConnectModal open={shopifyModal} onClose={() => setShopifyModal(false)} onConnected={s => { setShopifyStatus(s); }} />
      <Modals.TwilioConnectModal open={twilioModal} onClose={() => setTwilioModal(false)} onConnected={s => { setTwilioStatus(s); }} />
      <Modals.KubernetesConnectModal open={k8sModal} onClose={() => setK8sModal(false)} onConnected={s => { setK8sStatus(s); }} />
      <Modals.LinearConnectModal open={linearModal} onClose={() => setLinearModal(false)} onConnected={s => { setLinearStatus(s); }} />
      <Modals.PlanetScaleConnectModal open={psModal} onClose={() => setPsModal(false)} onConnected={s => { setPsStatus(s); }} />
      <Modals.BitwardenConnectModal open={bwModal} onClose={() => setBwModal(false)} onConnected={s => { setBwStatus(s); }} />
      <Modals.GhostConnectModal open={ghostModal} onClose={() => setGhostModal(false)} onConnected={s => { setGhostStatus(s); }} />
      <Modals.AppwriteConnectModal open={appwriteModal} onClose={() => setAppwriteModal(false)} onConnected={s => { setAppwriteStatus(s); }} />
      <Modals.OnePasswordConnectModal open={opModal} onClose={() => setOpModal(false)} onConnected={s => { setOpStatus(s); }} />
      <Modals.FirebaseConnectModal open={firebaseModal} onClose={() => setFirebaseModal(false)} onConnected={s => { setFirebaseStatus(s); }} />
      <Modals.SentryConnectModal open={sentryModal} onClose={() => setSentryModal(false)} onConnected={s => { setSentryStatus(s); }} />
      <Modals.NotionConnectModal open={notionModal} onClose={() => setNotionModal(false)} onConnected={s => { setNotionStatus(s); }} />
      <Modals.GoogleDriveConnectModal open={driveModal} onClose={() => setDriveModal(false)} onConnected={s => { setGdStatus(s); }} />
      <Modals.ZapierConnectModal open={zapierModal} onClose={() => setZapierModal(false)} onConnected={s => { setZapierStatus(s); }} />
      <Modals.BitbucketPipelinesConnectModal open={bbpModal} onClose={() => setBbpModal(false)} onConnected={s => { setBbpStatus(s); }} />
      <Modals.GitLabSelfManagedConnectModal open={glsmModal} onClose={() => setGlsmModal(false)} onConnected={s => { setGlsmStatus(s); }} />
      <Modals.DiscordWebhookConnectModal open={discordWebhookModal} onClose={() => setDiscordWebhookModal(false)} onConnected={s => { setDiscordWebhookStatus(s); }} />
      <Modals.MattermostConnectModal open={mattermostModal} onClose={() => setMattermostModal(false)} onConnected={s => { setMattermostStatus(s); }} />
    </DashboardLayout>
  );
}

