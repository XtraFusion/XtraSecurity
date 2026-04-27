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
import { IntegrationCommandPalette } from "@/components/integrations/IntegrationCommandPalette";
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
  const { user, selectedWorkspace, sessionStatus } = useUser();
  const { 
    statuses, repos, modals, loading: integrationsLoading, projects, 
    setModalOpen, disconnect, refresh, refreshStatus, setStatuses 
  } = useIntegrations();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "source" | "deployment" | "cloud" | "notifications">("all");
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("github");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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

  // Improved access check: Only show Access Denied if session is authenticated AND user is loaded AND we are NOT integrations-loading
  const isProfileLoading = sessionStatus === "loading" || (!user && sessionStatus === "authenticated");
  const isAccessDenied = !isProfileLoading && !integrationsLoading && !(isPersonalWorkspace || isWorkspaceOwner);

  if (isAccessDenied) {
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

  const loading = integrationsLoading || isProfileLoading;

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
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center w-full h-9 px-3 text-sm text-muted-foreground bg-background/50 border rounded-md hover:bg-background/80 transition-colors"
            >
              <Search className="h-4 w-4 mr-2 opacity-50" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
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
      {Object.entries(modals).map(([id, isOpen]) => {
        if (!isOpen) return null;
        
        // Dynamic lookup from registry using the lowercase ID
        const ModalComponent = (Modals.INTEGRATION_MODAL_REGISTRY as any)[id];

        if (!ModalComponent) return null;

        return (
          <ModalComponent
            key={id}
            open={isOpen}
            onClose={() => setModalOpen(id as any, false)}
            onConnected={(s: any) => {
              setStatuses((p: any) => ({ ...p, [id]: s }));
              refreshStatus(id as any);
            }}
            // Provider-specific props
            {...(id === "aws" ? { currentRegion: statuses.aws?.region } : {})}
          />
        );
      })}

      <IntegrationCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectProvider={handleConnect}
        statuses={statuses}
      />
    </DashboardLayout>
  );
}
