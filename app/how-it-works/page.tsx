import { generatePageMetadata } from "@/lib/seo";
import { generateHowToSchema, generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/schema-markup";
import Link from "next/link";

export const metadata = generatePageMetadata(
  "How XtraSecurity Works — Secure Environment Variable Management in 4 Steps",
  "Learn how XtraSecurity replaces insecure .env files with AES-256 encrypted, centralized secret storage. Set up secure environment variable management in under 10 minutes with our CLI, dashboard, and CI/CD integrations.",
  "/how-it-works"
);

export default function HowItWorksPage() {
  const howToSchema = generateHowToSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://xtrasecurity.in" },
    { name: "How It Works", url: "https://xtrasecurity.in/how-it-works" },
  ]);
  const webPageSchema = generateWebPageSchema(
    "How XtraSecurity Works",
    "Step-by-step guide to secure environment variable management with XtraSecurity",
    "https://xtrasecurity.in/how-it-works"
  );

  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">Setup in under 10 minutes</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              How <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">XtraSecurity</span> Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Replace insecure .env files with AES-256 encrypted, centralized secret storage. 
              XtraSecurity provides role-based access control, automated rotation, and complete audit logging 
              for your environment variables — all in a developer-friendly platform.
            </p>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Problem with .env Files</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Traditional .env files create serious security, collaboration, and operational risks that grow with your team.
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Security Vulnerabilities",
                  desc: "Plain-text .env files can be accidentally committed to Git repositories, exposing API keys, database credentials, and encryption secrets. Once leaked, credentials are compromised permanently.",
                  icon: "🔓",
                },
                {
                  title: "No Access Control",
                  desc: "Every developer who has the .env file has access to every secret. There's no way to restrict access by role, project, or environment. No audit trail of who accessed what.",
                  icon: "👥",
                },
                {
                  title: "Manual Configuration Drift",
                  desc: "Keeping .env files synchronized across team members, CI/CD pipelines, and deployment environments leads to configuration drift, broken deployments, and production outages.",
                  icon: "⚠️",
                },
              ].map((item, idx) => (
                <article key={idx} className="p-6 rounded-xl border bg-card hover:border-primary/30 transition-colors">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 4-Step Workflow */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in 4 Simple Steps</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From signup to secure secret injection in under 10 minutes. No infrastructure to manage.
              </p>
            </header>

            <div className="space-y-12">
              {[
                {
                  step: 1,
                  title: "Create a Free Account",
                  description: "Sign up at xtrasecurity.in/register with your email or GitHub account. No credit card required. You'll get instant access to the dashboard with 3 projects and 50 secrets on the free plan.",
                  code: null,
                  details: ["Email or OAuth signup", "Instant dashboard access", "Free tier: 3 projects, 50 secrets, 2 team members"],
                },
                {
                  step: 2,
                  title: "Create a Project & Add Secrets",
                  description: "Create a project for your application, select the environment (development, staging, production), and add your environment variables. You can bulk import from existing .env files — just paste the contents and XtraSecurity will parse and encrypt each key-value pair automatically using AES-256-GCM.",
                  code: null,
                  details: [
                    "Bulk import from .env files",
                    "Multi-environment support (dev, staging, prod)",
                    "Git-like branching for feature development",
                    "AES-256-GCM encryption applied automatically",
                  ],
                },
                {
                  step: 3,
                  title: "Install the CLI & Authenticate",
                  description: "Install the xtra-cli command-line tool globally via npm. Then authenticate with your XtraSecurity account and link your project.",
                  code: `# Install the CLI
npm install -g xtra-cli

# Authenticate
xtra login

# Link your project
xtra projects set <your-project-id>

# Set your branch and environment
xtra checkout main --env development`,
                  details: ["Works on Windows, macOS, and Linux", "Node.js 16+ required", "Supports multiple projects and branches"],
                },
                {
                  step: 4,
                  title: "Run Your App with Injected Secrets",
                  description: "Use the xtra run command to securely inject environment variables into your application process. No .env files are created on disk — secrets exist only in memory during execution. Alternatively, use xtra local sync to generate a local .env.local file if your workflow requires it.",
                  code: `# Recommended: Inject secrets directly (no .env file created)
xtra run -e development -b main -- npm run dev

# Alternative: Sync to local .env.local file
xtra local sync -e development -b main`,
                  details: [
                    "Secrets injected as environment variables in memory",
                    "No .env files written to disk (xtra run)",
                    "Works with any framework: Next.js, Express, Django, Rails",
                    "CI/CD compatible: GitHub Actions, GitLab CI, Jenkins",
                  ],
                },
              ].map((item) => (
                <article key={item.step} className="grid grid-cols-1 lg:grid-cols-[120px_1fr] gap-6 items-start">
                  <div className="flex lg:flex-col items-center gap-4 lg:gap-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                      {item.step}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    {item.code && (
                      <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                        <code>{item.code}</code>
                      </pre>
                    )}
                    <ul className="space-y-1.5">
                      {item.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5">✓</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Overview */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Technical Architecture</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built with security at every layer. XtraSecurity uses modern, battle-tested technologies to protect your secrets.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "AES-256-GCM Encryption",
                  desc: "All secrets are encrypted at rest using AES-256 in Galois/Counter Mode (GCM), providing both confidentiality and authenticity. Encryption keys are managed separately from encrypted data in a zero-knowledge architecture.",
                  tech: "AES-256-GCM, TLS 1.3",
                },
                {
                  title: "Role-Based Access Control (RBAC)",
                  desc: "Four-tier permission system: Owner (full control), Admin (manage team + secrets), Developer (read/write secrets), Viewer (read-only). Just-in-Time access allows temporary elevated permissions that automatically expire.",
                  tech: "RBAC, JIT Access, JWT",
                },
                {
                  title: "Redis Caching Layer",
                  desc: "Frequently accessed secrets are cached in Redis (Upstash) for 40% faster retrieval. Cache invalidation happens automatically when secrets are updated, ensuring consistency without manual intervention.",
                  tech: "Redis, Upstash, Cache-aside",
                },
                {
                  title: "Audit Pipeline",
                  desc: "Every secret access, modification, rotation, and sharing event is logged with full context: user identity, timestamp, IP address, and change diff. Audit logs are immutable and searchable for compliance requirements.",
                  tech: "MongoDB, Immutable Logs",
                },
                {
                  title: "Automated Secret Rotation",
                  desc: "Schedule automatic rotation for database credentials, API keys, and tokens. XtraSecurity supports configurable rotation intervals (7, 30, 60, 90 days), webhook-triggered rotation, and shadow rotation for zero-downtime credential updates.",
                  tech: "Cron Jobs, Webhooks",
                },
                {
                  title: "CI/CD Integration",
                  desc: "Native integration with GitHub Actions, GitLab CI, Jenkins, and Bitbucket Pipelines. Use the xtra-cli or REST API to pull secrets during build and deployment stages. Secrets are never stored in CI/CD configuration files.",
                  tech: "REST API, CLI, SDK",
                },
              ].map((item, idx) => (
                <article key={idx} className="p-6 rounded-xl border bg-card hover:border-primary/30 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                  <div className="text-xs font-mono text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block">
                    {item.tech}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Performance & Reliability</h2>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "500+", label: "Environment Variables Managed" },
                { value: "5,000+", label: "Secure API Requests Daily" },
                { value: "40%", label: "Faster Retrieval with Redis" },
                { value: "60%", label: "Reduction in Config Errors" },
              ].map((stat, idx) => (
                <div key={idx} className="p-6 rounded-xl border bg-card">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Secure Your Secrets?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start managing your environment variables securely in under 10 minutes. Free plan available — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Get Started Free →
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
                Read Documentation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
