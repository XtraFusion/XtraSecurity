import { generatePageMetadata } from "@/lib/seo";
import { generateBreadcrumbSchema, generateWebPageSchema, generateFAQSchema } from "@/lib/schema-markup";
import Link from "next/link";

export const metadata = generatePageMetadata(
  "XtraSecurity vs HashiCorp Vault — Which Secrets Manager is Right for You?",
  "Detailed comparison of XtraSecurity vs HashiCorp Vault. Compare setup time, pricing, features, and ease of use. Find out which secrets manager fits your team in 2026.",
  "/vs/hashicorp-vault"
);

export default function VsVaultPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://xtrasecurity.in" },
    { name: "Comparisons", url: "https://xtrasecurity.in/comparisons" },
    { name: "vs HashiCorp Vault", url: "https://xtrasecurity.in/vs/hashicorp-vault" },
  ]);
  const webPageSchema = generateWebPageSchema(
    "XtraSecurity vs HashiCorp Vault",
    "Head-to-head comparison of XtraSecurity and HashiCorp Vault for environment variable and secrets management",
    "https://xtrasecurity.in/vs/hashicorp-vault"
  );
  const faqSchema = generateFAQSchema([
    {
      question: "Is XtraSecurity better than HashiCorp Vault?",
      answer: "It depends on your use case. XtraSecurity is better for teams that need fast setup (5 min vs 2+ hours), transparent pricing, a visual dashboard, and native team collaboration. HashiCorp Vault is better for complex infrastructure requiring dynamic secrets generation, PKI management, or strict self-hosted requirements."
    },
    {
      question: "How long does it take to set up XtraSecurity vs Vault?",
      answer: "XtraSecurity takes under 5 minutes to set up — sign up, create a project, install the CLI, and start injecting secrets. HashiCorp Vault typically takes 2+ hours for initial configuration including server setup, policy writing, auth method configuration, and seal/unseal procedures."
    },
    {
      question: "Can XtraSecurity replace HashiCorp Vault?",
      answer: "For application-level secrets management (environment variables, API keys, database credentials), yes. XtraSecurity provides encryption, RBAC, rotation, and audit logging with much less operational overhead. However, if you need Vault-specific features like dynamic database credentials, PKI certificate management, or Sentinel policies, Vault remains the better choice."
    },
  ]);

  const comparisonRows = [
    { feature: "Setup Time", xtra: "5 minutes", vault: "2+ hours" },
    { feature: "Pricing", xtra: "Free plan + $29/mo Pro", vault: "Free OSS + $2,500+/mo Enterprise" },
    { feature: "Visual Dashboard", xtra: "✅ Full web UI", vault: "⚠️ Limited UI (mostly CLI)" },
    { feature: "Team Collaboration", xtra: "✅ Built-in workspaces & invites", vault: "❌ Requires custom setup" },
    { feature: "Secret Branching", xtra: "✅ Git-like branching & diffs", vault: "❌ Not available" },
    { feature: "JIT Access", xtra: "✅ Built-in with auto-revoke", vault: "⚠️ Requires custom implementation" },
    { feature: "Dynamic Secrets", xtra: "❌ Not yet supported", vault: "✅ Database, AWS, PKI" },
    { feature: "PKI Management", xtra: "❌ Not supported", vault: "✅ Full PKI engine" },
    { feature: "Policy Engine", xtra: "RBAC (4 roles)", vault: "HCL + Sentinel (complex)" },
    { feature: "Encryption", xtra: "AES-256-GCM", vault: "AES-256-GCM + Transit engine" },
    { feature: "Managed Service", xtra: "✅ Fully hosted SaaS", vault: "⚠️ HCP Vault (separate product)" },
    { feature: "Ops Overhead", xtra: "Zero — fully managed", vault: "High — unseal, HA, storage backend" },
    { feature: "CLI", xtra: "xtra-cli (purpose-built)", vault: "vault CLI (general-purpose)" },
    { feature: "Kubernetes", xtra: "✅ Native CSI driver", vault: "✅ Agent sidecar injection" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium text-orange-500">Honest Comparison</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary">XtraSecurity</span> vs <span className="text-orange-500">HashiCorp Vault</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Two different approaches to secrets management. XtraSecurity is built for developer teams who want fast setup and simple pricing. Vault is built for infrastructure teams who need maximum control. Here's an honest breakdown.
            </p>
          </div>
        </section>

        {/* TL;DR */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center">TL;DR — Which One Should You Choose?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="p-6 rounded-xl border-2 border-primary/30 bg-primary/5">
                <h3 className="text-xl font-bold text-primary mb-4">Choose XtraSecurity if you...</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Want to be up and running in 5 minutes",
                    "Need transparent, predictable pricing",
                    "Want a visual dashboard for your team",
                    "Need git-like branching for secrets",
                    "Prefer managed SaaS over self-hosting ops",
                    "Need JIT access with built-in approval flows",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="p-6 rounded-xl border border-orange-500/30 bg-orange-500/5">
                <h3 className="text-xl font-bold text-orange-500 mb-4">Choose Vault if you...</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Need dynamic secrets (database credentials on-demand)",
                    "Require PKI certificate management",
                    "Must self-host for strict data sovereignty",
                    "Have a dedicated DevOps team for Vault operations",
                    "Need Sentinel policy engine for complex policies",
                    "Already have significant Vault investment",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">→</span> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Detailed Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-muted/50 border border-muted p-4 text-left font-semibold">Feature</th>
                    <th className="bg-primary/10 border border-muted p-4 text-center font-semibold text-primary">XtraSecurity</th>
                    <th className="bg-orange-500/10 border border-muted p-4 text-center font-semibold text-orange-500">HashiCorp Vault</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="border border-muted p-4 font-medium">{row.feature}</td>
                      <td className="border border-muted p-4 text-center text-sm">{row.xtra}</td>
                      <td className="border border-muted p-4 text-center text-sm text-muted-foreground">{row.vault}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Try XtraSecurity — No Infrastructure Required</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start managing secrets in 5 minutes. Free plan available — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Get Started Free →
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-md border px-8 py-3 text-sm font-medium hover:bg-accent transition-colors">
                See How It Works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
