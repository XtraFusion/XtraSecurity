"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Shield, RotateCcw, Search, X 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from "@/hooks/useUser";

import { ConnectionCard } from "@/components/integrations/IntegrationComponents";
import { SyncSection } from "@/components/integrations/SyncSection";
import * as Modals from "@/components/integrations/IntegrationModals";
import { INTEGRATION_METADATA } from "@/lib/integrations/config";
import { SyncProvider } from "@/lib/integrations/types";
import { useIntegrations } from "@/hooks/useIntegrations";

/**
 * Modular Integrations Dashboard
 * 
 * Architecture:
 * - hooks/useIntegrations: Centralized state management for 50+ providers.
 * - components/integrations/IntegrationModals: Specialized modals for each provider.
 * - components/integrations/SyncSection: UI for pushing secrets to external targets.
 * - lib/integrations/config: Metadata and config for all integrations.
 */
export default function IntegrationsPage() {
  const { user, selectedWorkspace } = useUser();
  const { 
    statuses, repos, modals, loading, projects, 
    setModalOpen, disconnect, refresh, refreshStatus, setStatuses 
  } = useIntegrations();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "source" | "deployment" | "cloud" | "notifications">("all");
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("github");

  const isWorkspaceOwner = selectedWorkspace?.createdBy === user?.id;
  const isPersonalWorkspace = selectedWorkspace?.workspaceType === "personal";

  const categories = [
    { id: "all", label: "All" },
    { id: "source", label: "Source Control" },
    { id: "deployment", label: "Deployment" },
    { id: "cloud", label: "Cloud" },
    { id: "notifications", label: "Notifications" },
  ] as const;

  const filteredProviders = useMemo(() => {
    return (Object.keys(INTEGRATION_METADATA) as SyncProvider[]).filter(p => {
      const meta = INTEGRATION_METADATA[p];
      const matchCat = activeCategory === "all" || meta.category === activeCategory;
      const matchSearch = meta.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  const connectedCount = useMemo(() => 
    Object.values(statuses).filter(s => s.connected).length, 
  [statuses]);

  const handleConnect = (provider: SyncProvider) => {
    const status = statuses[provider];
    if (provider === "github" || provider === "gitlab") {
      if (status?.authUrl) {
        window.location.href = status.authUrl;
      } else {
        toast({ title: "Auth Error", description: "Unable to start OAuth flow. Please refresh.", variant: "destructive" });
      }
    } else {
      setModalOpen(provider, true);
    }
  };

  if (!loading && !(isPersonalWorkspace || isWorkspaceOwner)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Shield className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm">Only workspace owners can manage integrations.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8 pb-20">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground text-sm mt-1">Connect your stack to sync secrets and trigger automated workflows.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-7 px-3 bg-muted/20 font-medium border-primary/20">
              {connectedCount} Connected
            </Badge>
            <button onClick={refresh} className="text-muted-foreground hover:text-primary transition-colors">
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-2 rounded-xl border border-border/60">
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? "bg-background text-primary shadow-sm border border-border/60" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-background/50 border-none focus-visible:ring-1"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 bg-card/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProviders.map(p => {
              const meta = INTEGRATION_METADATA[p];
              return (
                <ConnectionCard
                  key={p}
                  name={meta.name}
                  icon={meta.icon}
                  iconBg={meta.iconBg}
                  status={statuses[p] || null}
                  onConnect={() => handleConnect(p)}
                  onDisconnect={() => disconnect(p)}
                  onEdit={p === "aws" ? () => setModalOpen("aws", true) : undefined}
                  tokenBased={meta.tokenBased}
                />
              );
            })}
          </div>
        )}

        {/* ── Sync Section ────────────────────────────────────────── */}
        {Object.values(statuses).some(s => s.connected) && (
          <div className="pt-4 border-t space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Active Secret Sync</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Source Provider</span>
                <Select value={syncProvider} onValueChange={(v: any) => setSyncProvider(v)}>
                  <SelectTrigger className="h-8 w-44 bg-muted/30 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statuses) as SyncProvider[])
                      .filter(p => statuses[p]?.connected && INTEGRATION_METADATA[p].category !== "notifications")
                      .map(p => (
                        <SelectItem key={p} value={p} className="text-xs">{INTEGRATION_METADATA[p].name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SyncSection
              projects={projects}
              repos={repos[syncProvider] || []}
              syncProvider={syncProvider}
              onSyncSuccess={() => refreshStatus(syncProvider)}
            />
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      <Modals.VercelConnectModal open={!!modals.vercel} onClose={() => setModalOpen("vercel", false)} onConnected={s => { setStatuses(p => ({ ...p, vercel: s })); refreshStatus("vercel"); }} />
      <Modals.TokenModal open={!!modals.netlify} onClose={() => setModalOpen("netlify", false)} onConnected={s => { setStatuses(p => ({ ...p, netlify: s })); refreshStatus("netlify"); }} provider="netlify" providerName="Netlify" providerColor="#00C7B7"
        steps={[{ text: "Open", link: { href: "https://app.netlify.com/user/applications#personal-access-tokens", label: "app.netlify.com → User Settings → Applications" } }, { text: "Click New access token, name it XtraSecurity" }, { text: "Copy immediately — shown once" }]}
        scopeNote="No scope needed — inherits full account access." />
      <Modals.AwsConnectModal open={!!modals.aws} onClose={() => setModalOpen("aws", false)} onConnected={s => { setStatuses(p => ({ ...p, aws: s })); refreshStatus("aws"); }} currentRegion={statuses.aws?.region} />
      <Modals.TokenModal open={!!modals.doppler} onClose={() => setModalOpen("doppler", false)} onConnected={s => { setStatuses(p => ({ ...p, doppler: s })); refreshStatus("doppler"); }} provider="doppler" providerName="Doppler" providerColor="#6366f1"
        steps={[
          { text: "Open", link: { href: "https://dashboard.doppler.com/workplace/integrations/service-tokens", label: "Doppler Dashboard → Integrations → Service Tokens" } },
          { text: "Or use a Personal Token: Account Settings → API Keys" },
          { text: "Create token with read+write access, copy once" },
        ]}
        scopeNote="Use a Service Token (dp.st.xxx) for project-scoped access, or a Personal Token (dp.pt.xxx) for full account access." />
      <Modals.BitbucketConnectModal open={!!modals.bitbucket} onClose={() => setModalOpen("bitbucket", false)} onConnected={s => { setStatuses(p => ({ ...p, bitbucket: s })); refreshStatus("bitbucket"); }} />
      <Modals.GcpConnectModal open={!!modals.gcp} onClose={() => setModalOpen("gcp", false)} onConnected={s => { setStatuses(p => ({ ...p, gcp: s })); refreshStatus("gcp"); }} />
      <Modals.AzureConnectModal open={!!modals.azure} onClose={() => setModalOpen("azure", false)} onConnected={s => { setStatuses(p => ({ ...p, azure: s })); refreshStatus("azure"); }} />
      <Modals.RailwayConnectModal open={!!modals.railway} onClose={() => setModalOpen("railway", false)} onConnected={s => { setStatuses(p => ({ ...p, railway: s })); refreshStatus("railway"); }} />
      <Modals.FlyConnectModal open={!!modals.fly} onClose={() => setModalOpen("fly", false)} onConnected={s => { setStatuses(p => ({ ...p, fly: s })); refreshStatus("fly"); }} />
      <Modals.RenderConnectModal open={!!modals.render} onClose={() => setModalOpen("render", false)} onConnected={s => { setStatuses(p => ({ ...p, render: s })); refreshStatus("render"); }} />
      <Modals.DOConnectModal open={!!modals.digitalocean} onClose={() => setModalOpen("digitalocean", false)} onConnected={s => { setStatuses(p => ({ ...p, digitalocean: s })); refreshStatus("digitalocean"); }} />
      <Modals.HerokuConnectModal open={!!modals.heroku} onClose={() => setModalOpen("heroku", false)} onConnected={s => { setStatuses(p => ({ ...p, heroku: s })); refreshStatus("heroku"); }} />
      <Modals.SlackConnectModal open={!!modals.slack} onClose={() => setModalOpen("slack", false)} onConnected={s => { setStatuses(p => ({ ...p, slack: s })); refreshStatus("slack"); }} />
      <Modals.DiscordConnectModal open={!!modals.discord} onClose={() => setModalOpen("discord", false)} onConnected={s => { setStatuses(p => ({ ...p, discord: s })); refreshStatus("discord"); }} />
      <Modals.TeamsConnectModal open={!!modals.teams} onClose={() => setModalOpen("teams", false)} onConnected={s => { setStatuses(p => ({ ...p, teams: s })); refreshStatus("teams"); }} />
      <Modals.VaultConnectModal open={!!modals.vault} onClose={() => setModalOpen("vault", false)} onConnected={s => { setStatuses(p => ({ ...p, vault: s })); refreshStatus("vault"); }} />
      <Modals.CircleCIConnectModal open={!!modals.circleci} onClose={() => setModalOpen("circleci", false)} onConnected={s => { setStatuses(p => ({ ...p, circleci: s })); refreshStatus("circleci"); }} />
      <Modals.CloudflareConnectModal open={!!modals.cloudflare} onClose={() => setModalOpen("cloudflare", false)} onConnected={s => { setStatuses(p => ({ ...p, cloudflare: s })); refreshStatus("cloudflare"); }} />
      <Modals.JenkinsConnectModal open={!!modals.jenkins} onClose={() => setModalOpen("jenkins", false)} onConnected={s => { setStatuses(p => ({ ...p, jenkins: s })); refreshStatus("jenkins"); }} />
      <Modals.PagerDutyConnectModal open={!!modals.pagerduty} onClose={() => setModalOpen("pagerduty", false)} onConnected={s => { setStatuses(p => ({ ...p, pagerduty: s })); refreshStatus("pagerduty"); }} />
      <Modals.TravisCIConnectModal open={!!modals.travisci} onClose={() => setModalOpen("travisci", false)} onConnected={s => { setStatuses(p => ({ ...p, travisci: s })); refreshStatus("travisci"); }} />
      <Modals.SupabaseConnectModal open={!!modals.supabase} onClose={() => setModalOpen("supabase", false)} onConnected={s => { setStatuses(p => ({ ...p, supabase: s })); refreshStatus("supabase"); }} />
      <Modals.TelegramConnectModal open={!!modals.telegram} onClose={() => setModalOpen("telegram", false)} onConnected={s => { setStatuses(p => ({ ...p, telegram: s })); refreshStatus("telegram"); }} />
      <Modals.EmailConnectModal open={!!modals.email} onClose={() => setModalOpen("email", false)} onConnected={s => { setStatuses(p => ({ ...p, email: s })); refreshStatus("email"); }} />
      <Modals.TerraformConnectModal open={!!modals.terraform} onClose={() => setModalOpen("terraform", false)} onConnected={s => { setStatuses(p => ({ ...p, terraform: s })); refreshStatus("terraform"); }} />
      <Modals.BuildkiteConnectModal open={!!modals.buildkite} onClose={() => setModalOpen("buildkite", false)} onConnected={s => { setStatuses(p => ({ ...p, buildkite: s })); refreshStatus("buildkite"); }} />
      <Modals.OpsgenieConnectModal open={!!modals.opsgenie} onClose={() => setModalOpen("opsgenie", false)} onConnected={s => { setStatuses(p => ({ ...p, opsgenie: s })); refreshStatus("opsgenie"); }} />
      <Modals.ChecklyConnectModal open={!!modals.checkly} onClose={() => setModalOpen("checkly", false)} onConnected={s => { setStatuses(p => ({ ...p, checkly: s })); refreshStatus("checkly"); }} />
      <Modals.HasuraConnectModal open={!!modals.hasura} onClose={() => setModalOpen("hasura", false)} onConnected={s => { setStatuses(p => ({ ...p, hasura: s })); refreshStatus("hasura"); }} />
      <Modals.PostmanConnectModal open={!!modals.postman} onClose={() => setModalOpen("postman", false)} onConnected={s => { setStatuses(p => ({ ...p, postman: s })); refreshStatus("postman"); }} />
      <Modals.ShopifyConnectModal open={!!modals.shopify} onClose={() => setModalOpen("shopify", false)} onConnected={s => { setStatuses(p => ({ ...p, shopify: s })); refreshStatus("shopify"); }} />
      <Modals.TwilioConnectModal open={!!modals.twilio} onClose={() => setModalOpen("twilio", false)} onConnected={s => { setStatuses(p => ({ ...p, twilio: s })); refreshStatus("twilio"); }} />
      <Modals.KubernetesConnectModal open={!!modals.kubernetes} onClose={() => setModalOpen("kubernetes", false)} onConnected={s => { setStatuses(p => ({ ...p, kubernetes: s })); refreshStatus("kubernetes"); }} />
      <Modals.LinearConnectModal open={!!modals.linear} onClose={() => setModalOpen("linear", false)} onConnected={s => { setStatuses(p => ({ ...p, linear: s })); refreshStatus("linear"); }} />
      <Modals.PlanetScaleConnectModal open={!!modals.planetscale} onClose={() => setModalOpen("planetscale", false)} onConnected={s => { setStatuses(p => ({ ...p, planetscale: s })); refreshStatus("planetscale"); }} />
      <Modals.BitwardenConnectModal open={!!modals.bitwarden} onClose={() => setModalOpen("bitwarden", false)} onConnected={s => { setStatuses(p => ({ ...p, bitwarden: s })); refreshStatus("bitwarden"); }} />
      <Modals.GhostConnectModal open={!!modals.ghost} onClose={() => setModalOpen("ghost", false)} onConnected={s => { setStatuses(p => ({ ...p, ghost: s })); refreshStatus("ghost"); }} />
      <Modals.AppwriteConnectModal open={!!modals.appwrite} onClose={() => setModalOpen("appwrite", false)} onConnected={s => { setStatuses(p => ({ ...p, appwrite: s })); refreshStatus("appwrite"); }} />
      <Modals.OnePasswordConnectModal open={!!modals.onepassword} onClose={() => setModalOpen("onepassword", false)} onConnected={s => { setStatuses(p => ({ ...p, onepassword: s })); refreshStatus("onepassword"); }} />
      <Modals.FirebaseConnectModal open={!!modals.firebase} onClose={() => setModalOpen("firebase", false)} onConnected={s => { setStatuses(p => ({ ...p, firebase: s })); refreshStatus("firebase"); }} />
      <Modals.SentryConnectModal open={!!modals.sentry} onClose={() => setModalOpen("sentry", false)} onConnected={s => { setStatuses(p => ({ ...p, sentry: s })); refreshStatus("sentry"); }} />
      <Modals.NotionConnectModal open={!!modals.notion} onClose={() => setModalOpen("notion", false)} onConnected={s => { setStatuses(p => ({ ...p, notion: s })); refreshStatus("notion"); }} />
      <Modals.GoogleDriveConnectModal open={!!modals.googledrive} onClose={() => setModalOpen("googledrive", false)} onConnected={s => { setStatuses(p => ({ ...p, googledrive: s })); refreshStatus("googledrive"); }} />
      <Modals.ZapierConnectModal open={!!modals.zapier} onClose={() => setModalOpen("zapier", false)} onConnected={s => { setStatuses(p => ({ ...p, zapier: s })); refreshStatus("zapier"); }} />
      <Modals.BitbucketPipelinesConnectModal open={!!modals.bitbucketpipelines} onClose={() => setModalOpen("bitbucketpipelines", false)} onConnected={s => { setStatuses(p => ({ ...p, bitbucketpipelines: s })); refreshStatus("bitbucketpipelines"); }} />
      <Modals.GitLabSelfManagedConnectModal open={!!modals.gitlabselfmanaged} onClose={() => setModalOpen("gitlabselfmanaged", false)} onConnected={s => { setStatuses(p => ({ ...p, gitlabselfmanaged: s })); refreshStatus("gitlabselfmanaged"); }} />
      <Modals.DiscordWebhookConnectModal open={!!modals.discordwebhook} onClose={() => setModalOpen("discordwebhook", false)} onConnected={s => { setStatuses(p => ({ ...p, discordwebhook: s })); refreshStatus("discordwebhook"); }} />
      <Modals.MattermostConnectModal open={!!modals.mattermost} onClose={() => setModalOpen("mattermost", false)} onConnected={s => { setStatuses(p => ({ ...p, mattermost: s })); refreshStatus("mattermost"); }} />
    </DashboardLayout>
  );
}
