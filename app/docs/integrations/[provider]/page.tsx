import { notFound } from "next/navigation";
import { INTEGRATION_METADATA, SyncProvider } from "@/lib/integrations/config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, ShieldAlert, Link2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PremiumCallout } from "@/components/docs/PremiumCallout";

export async function generateStaticParams() {
  return Object.keys(INTEGRATION_METADATA).map((provider) => ({
    provider: provider,
  }));
}

export default async function IntegrationDetailDocs({ params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = await params;
  const providerId = resolvedParams.provider as SyncProvider;
  const meta = INTEGRATION_METADATA[providerId];

  if (!meta) {
    notFound();
  }

  const isTokenBased = meta.tokenBased ?? false;
  
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "source": return "Source Control";
      case "deployment": return "Deployment";
      case "cloud": return "Cloud Infrastructure";
      case "notifications": return "Notifications";
      default: return "Integration";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      <Link href="/docs/integrations" className="inline-block mb-10">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Button>
      </Link>
      
      {/* Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-16">
        <div className={`h-24 w-24 rounded-2xl flex items-center justify-center shrink-0 border border-border shadow-lg ${meta.iconBg}`}>
          <div className="scale-150">{meta.icon}</div>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-3">
            {getCategoryLabel(meta.category)}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-2">
            {meta.name} Setup Guide
          </h1>
          <p className="text-xl text-muted-foreground">
            {meta.detailText}
          </p>
        </div>
      </div>

      <PremiumCallout type="info" title="Quick Connect">
        Ready to connect? Go directly to your <a href="/integrations" className="underline font-bold text-primary">Integrations Dashboard</a> and search for {meta.name}.
      </PremiumCallout>

      {/* Prerequisites */}
      <section className="mt-16 mb-12 scroll-mt-20" id="prerequisites">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <ShieldAlert className="w-5 h-5 text-primary" /> Prerequisites
        </h2>
        <ul className="space-y-3 text-muted-foreground list-disc list-inside">
          <li>An active XtraSecurity workspace with Owner or Admin privileges.</li>
          <li>An active account on {meta.name}.</li>
          {isTokenBased ? (
            <li>Sufficient permissions in {meta.name} to generate an API Token or Personal Access Token (PAT).</li>
          ) : (
            <li>Sufficient permissions in {meta.name} to authorize an OAuth Application.</li>
          )}
        </ul>
      </section>

      {/* Connection Guide */}
      <section className="mb-12 scroll-mt-20" id="connection">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Link2 className="w-5 h-5 text-primary" /> Connection Steps
        </h2>
        
        <div className="space-y-6">
          {isTokenBased ? (
            <>
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                  Generate an Access Token in {meta.name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  XtraSecurity requires an access token to communicate securely with your {meta.name} infrastructure. Log into your {meta.name} dashboard and navigate to your Developer Settings or Security settings to generate a new token.
                </p>
                <PremiumCallout type="warning" title="Security Best Practice">
                  Only grant the minimum necessary scopes required for managing secrets or environment variables. Do not grant full administrative access unless absolutely necessary.
                </PremiumCallout>
              </div>
              
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                  Link the Token in XtraSecurity
                </h3>
                <p className="text-muted-foreground">
                  Navigate to your XtraSecurity <strong>Integrations Dashboard</strong>. Find the {meta.name} card and click "Connect". Paste your securely generated token into the modal. The token is immediately encrypted via AES-256-GCM before being stored in our database.
                </p>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                Authorize via OAuth
              </h3>
              <p className="text-muted-foreground mb-4">
                {meta.name} uses an official OAuth 2.0 flow. Simply navigate to your <strong>Integrations Dashboard</strong>, find the {meta.name} card, and click "Connect".
              </p>
              <p className="text-muted-foreground">
                You will be redirected to {meta.name} to authorize the XtraSecurity application. Once approved, you will be securely redirected back, and the connection will be established instantly.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Syncing Mechanics */}
      <section className="mb-16 scroll-mt-20" id="syncing">
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2 text-foreground border-b pb-2">
          <Terminal className="w-5 h-5 text-primary" /> How Syncing Works
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Once {meta.name} is connected, you can configure an active <strong>Secret Sync</strong>.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          XtraSecurity acts as your Single Source of Truth. Whenever a secret is added, updated, or rotated in your XtraSecurity project, our background workers immediately push that updated encrypted payload to your configured <strong>{meta.repoLabel}</strong> in {meta.name}.
        </p>
      </section>

      {/* Footer CTA */}
      <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center">
        <h3 className="text-2xl font-bold mb-2">Ready to secure your pipeline?</h3>
        <p className="text-muted-foreground mb-6">Connect {meta.name} in under 60 seconds.</p>
        <Link href="/integrations">
          <Button size="lg" className="gap-2 font-bold shadow-lg">
            Connect {meta.name} <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
