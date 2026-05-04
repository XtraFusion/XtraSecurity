import { generatePageMetadata } from "@/lib/seo";
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema-markup";
import Link from "next/link";

export const metadata = generatePageMetadata(
  "Use Cases — How Teams Use XtraSecurity for Secrets Management",
  "Discover how startups, DevOps teams, and enterprises use XtraSecurity to securely manage environment variables, API keys, and secrets across development, staging, and production environments.",
  "/use-cases"
);

const USE_CASES = [
  {
    id: "startup-teams",
    title: "Startup Teams Scaling from .env Files",
    subtitle: "From 2 developers to 20 — without losing control of secrets",
    problem:
      "Your startup started with a single .env file shared over Slack. Now you have 15 developers, 8 microservices, and three environments. Secrets are scattered across personal machines, CI/CD configs, and shared documents. Nobody knows who has access to the production database credentials.",
    solution:
      "XtraSecurity centralizes all your secrets in one encrypted platform. Import your existing .env files, set up role-based access control so junior developers only see development secrets, and enable audit logging so your CTO knows exactly who accessed what. When you onboard a new engineer, they get access in 30 seconds — and when someone leaves, their access is revoked instantly.",
    features: [
      "Bulk .env file import for instant migration",
      "RBAC — restrict production secrets to senior engineers",
      "Workspace-based team management",
      "Instant access provisioning and revocation",
      "Free tier supports up to 3 projects",
    ],
    metrics: "60% reduction in manual configuration errors",
    icon: "🚀",
  },
  {
    id: "devops-cicd",
    title: "DevOps Engineers Automating CI/CD Pipelines",
    subtitle: "Inject secrets at build time without hardcoding them in config files",
    problem:
      "Your CI/CD pipeline needs database URLs, API keys, and service account credentials. Storing them as CI/CD environment variables creates sprawl — you have hundreds of secrets duplicated across GitHub Actions, GitLab CI, and Jenkins. Rotating a single API key means updating it in 12 different places.",
    solution:
      "XtraSecurity becomes the single source of truth for all your pipeline secrets. Use the xtra-cli or REST API to pull secrets at build time. When you rotate a credential, it updates everywhere automatically. The CLI's `xtra run` command injects secrets directly into your process memory — no .env files written to disk in your CI/CD environment.",
    features: [
      "GitHub Actions, GitLab CI, Jenkins integration",
      "xtra-cli for secret injection at build time",
      "Single source of truth — update once, deploy everywhere",
      "Secret rotation propagates to all pipelines automatically",
      "Secrets never written to disk in CI/CD",
    ],
    metrics: "5,000+ secure API requests daily",
    icon: "⚙️",
  },
  {
    id: "compliance-security",
    title: "Security & Compliance Teams Needing Audit Trails",
    subtitle: "SOC2, GDPR, and ISO 27001 compliance made simple",
    problem:
      "Your compliance team needs to demonstrate that sensitive credentials are encrypted, access is controlled, and every access event is logged. With .env files, there's no audit trail. You can't prove who accessed the production database credentials last Tuesday at 3 PM, and your compliance audit takes weeks of manual documentation.",
    solution:
      "XtraSecurity provides immutable audit logs for every secret operation — creation, access, modification, rotation, and deletion. Each log entry includes the user identity, timestamp, IP address, and a full change diff. Role-based access control ensures only authorized personnel can access sensitive secrets, and Just-in-Time access provides time-limited credentials with automatic expiration for compliance-sensitive operations.",
    features: [
      "Immutable audit logs with full context",
      "RBAC with 4-tier permission model",
      "Just-in-Time (JIT) access with automatic expiration",
      "Break-Glass emergency access with audit trail",
      "Exportable compliance reports",
    ],
    metrics: "Complete audit trail for every secret operation",
    icon: "🛡️",
  },
  {
    id: "multi-environment",
    title: "Teams Managing Multiple Environments",
    subtitle: "Development, staging, and production — each with their own secrets",
    problem:
      "Your application runs in development, staging, and production environments, each requiring different database URLs, API keys, and service endpoints. Developers accidentally use production credentials in development, staging environments have outdated configs, and nobody can tell which secrets are missing in which environment.",
    solution:
      "XtraSecurity's multi-environment architecture lets you manage development, staging, and production secrets separately within the same project. The Environment Sync Status feature detects missing secrets across environments, preventing deployment failures. Git-like branching lets developers create temporary secret branches for feature development without touching the production configuration.",
    features: [
      "Three-environment separation (dev, staging, prod)",
      "Environment Sync Status — detect missing secrets",
      "Git-like secret branching for feature development",
      "Copy secrets between environments with one click",
      "Branch comparison to see configuration diffs",
    ],
    metrics: "Manage 500+ environment variables across 50+ applications",
    icon: "🌐",
  },
  {
    id: "secret-rotation",
    title: "Teams Automating Secret Rotation",
    subtitle: "Rotate credentials automatically without downtime",
    problem:
      "Security best practices require regular credential rotation, but doing it manually is error-prone and time-consuming. You need to update the credential in the secrets store, propagate it to all services, and verify that nothing breaks — all without causing downtime.",
    solution:
      "XtraSecurity's automated rotation engine handles the entire lifecycle. Configure rotation schedules (every 7, 30, 60, or 90 days), set up webhook-triggered rotation for custom credential providers, and use shadow rotation for zero-downtime updates. When a rotation occurs, all connected services receive the new credential through the API or CLI automatically.",
    features: [
      "Configurable rotation schedules (7, 30, 60, 90 days)",
      "Webhook-triggered rotation for custom providers",
      "Shadow rotation for zero-downtime updates",
      "Rotation history and rollback support",
      "Slack/Discord notifications on rotation events",
    ],
    metrics: "40% faster variable retrieval with Redis caching",
    icon: "🔄",
  },
  {
    id: "open-source-contributors",
    title: "Open-Source Projects with External Contributors",
    subtitle: "Let contributors build without exposing your API keys",
    problem:
      "Your open-source project needs API keys for third-party services (Stripe, SendGrid, Firebase). Contributors need these to run the project locally, but you can't share production credentials. Creating separate test credentials and distributing them securely to dozens of contributors is a logistics nightmare.",
    solution:
      "XtraSecurity lets you create development-only secrets with Viewer role access for contributors. Contributors join your workspace, get read access to development secrets only, and can use the CLI to pull them locally. When a contributor's access needs to end, you revoke it with one click. Production secrets remain invisible to external contributors.",
    features: [
      "Viewer role for read-only contributor access",
      "Development-only secret visibility",
      "One-click access revocation",
      "Time-limited secret sharing links",
      "Audit logs for contributor access tracking",
    ],
    metrics: "Instant access provisioning and revocation",
    icon: "🌍",
  },
];

export default function UseCasesPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://xtrasecurity.in" },
    { name: "Use Cases", url: "https://xtrasecurity.in/use-cases" },
  ]);
  const webPageSchema = generateWebPageSchema(
    "XtraSecurity Use Cases",
    "Real-world scenarios where XtraSecurity solves environment variable and secrets management challenges",
    "https://xtrasecurity.in/use-cases"
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Who Uses <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">XtraSecurity</span>?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              From solo developers to enterprise DevOps teams — see how teams use XtraSecurity to replace 
              .env files with secure, centralized environment variable management.
            </p>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {USE_CASES.map((useCase, idx) => (
              <article key={useCase.id} id={useCase.id} className="scroll-mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{useCase.icon}</span>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold">{useCase.title}</h2>
                        <p className="text-sm text-primary font-medium mt-0.5">{useCase.subtitle}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <div>
                        <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">The Problem</h3>
                        <p className="text-muted-foreground leading-relaxed">{useCase.problem}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-2">The XtraSecurity Solution</h3>
                        <p className="text-muted-foreground leading-relaxed">{useCase.solution}</p>
                      </div>
                    </div>
                  </div>

                  <aside className="p-6 rounded-xl border bg-card lg:sticky lg:top-24">
                    <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Key Features Used</h3>
                    <ul className="space-y-2 mb-4">
                      {useCase.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Impact</div>
                      <div className="text-sm font-semibold text-primary">{useCase.metrics}</div>
                    </div>
                  </aside>
                </div>

                {idx < USE_CASES.length - 1 && <hr className="mt-16 border-border/50" />}
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials Placeholder */}
        <section className="py-16 lg:py-20 border-t bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">What Developers Say</h2>
            <p className="text-muted-foreground mb-12">Teams trust XtraSecurity to manage their critical infrastructure secrets.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "XtraSecurity replaced our messy .env sharing workflow. Onboarding new developers went from hours to minutes.",
                  author: "Engineering Lead",
                  company: "SaaS Startup",
                },
                {
                  quote: "The JIT access feature is a game-changer for compliance. We can now demonstrate exactly who had access to what and when.",
                  author: "DevOps Engineer",
                  company: "Fintech Company",
                },
                {
                  quote: "We integrated XtraSecurity into our GitHub Actions pipeline in 15 minutes. Secret rotation is now fully automated.",
                  author: "CTO",
                  company: "Series A Startup",
                },
              ].map((t, i) => (
                <blockquote key={i} className="p-6 rounded-xl border bg-card text-left">
                  <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <footer>
                    <cite className="not-italic text-sm font-semibold block">{t.author}</cite>
                    <span className="text-xs text-muted-foreground">{t.company}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Securing Your Secrets Today</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join developers and DevOps teams using XtraSecurity to manage environment variables securely. Free plan available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Get Started Free →
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
                See How It Works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
