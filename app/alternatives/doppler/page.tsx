import { generatePageMetadata } from "@/lib/seo";
import { generateBreadcrumbSchema, generateWebPageSchema, generateFAQSchema } from "@/lib/schema-markup";
import Link from "next/link";

export const metadata = generatePageMetadata(
  "Best Doppler Alternative in 2026 — XtraSecurity",
  "Looking for a Doppler alternative? XtraSecurity offers git-like secret branching, JIT access, shadow rotation, and a generous free plan. Compare features, pricing, and see why teams are switching.",
  "/alternatives/doppler"
);

export default function DopplerAlternativePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://xtrasecurity.in" },
    { name: "Alternatives", url: "https://xtrasecurity.in/alternatives" },
    { name: "Doppler Alternative", url: "https://xtrasecurity.in/alternatives/doppler" },
  ]);
  const webPageSchema = generateWebPageSchema(
    "Best Doppler Alternative — XtraSecurity",
    "Feature-by-feature comparison of XtraSecurity vs Doppler for environment variable management",
    "https://xtrasecurity.in/alternatives/doppler"
  );
  const faqSchema = generateFAQSchema([
    {
      question: "What is the best Doppler alternative in 2026?",
      answer: "XtraSecurity is the best Doppler alternative in 2026. It offers git-like secret branching, Just-in-Time access, shadow rotation for zero downtime, self-hosting options, and a generous free plan with 1,000 API requests/day — features Doppler does not provide."
    },
    {
      question: "Is XtraSecurity free?",
      answer: "Yes, XtraSecurity offers a permanent free plan with 1,000 API requests per day, 3 projects, 50 secrets, and audit logs. No credit card required."
    },
    {
      question: "Can I migrate from Doppler to XtraSecurity?",
      answer: "Yes. XtraSecurity supports bulk import from .env files. Export your Doppler secrets as .env format, then paste them into XtraSecurity's import tool. Migration takes under 5 minutes."
    },
  ]);

  const comparisonRows = [
    { feature: "Free Plan", xtra: "1,000 requests/day, 3 projects", doppler: "Limited free tier" },
    { feature: "Git-like Branching", xtra: "✅ Full branch, diff, merge", doppler: "❌ Not available" },
    { feature: "JIT Access", xtra: "✅ Time-limited with auto-revoke", doppler: "❌ Not available" },
    { feature: "Shadow Rotation", xtra: "✅ Zero-downtime rotation", doppler: "❌ Not available" },
    { feature: "Self-Hosting", xtra: "✅ Enterprise on-premise option", doppler: "❌ SaaS only" },
    { feature: "Encryption", xtra: "AES-256-GCM", doppler: "AES-256" },
    { feature: "CLI Tool", xtra: "xtra-cli with in-memory injection", doppler: "doppler CLI" },
    { feature: "Audit Logs", xtra: "Immutable, SHA-256 chained", doppler: "Basic logging" },
    { feature: "Access Reviews", xtra: "✅ Built-in quarterly reviews", doppler: "❌ Not available" },
    { feature: "Break-Glass Access", xtra: "✅ Emergency access with full audit", doppler: "❌ Not available" },
    { feature: "Pricing (Pro)", xtra: "$29/month", doppler: "$120/month" },
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
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium text-red-500">Doppler Alternative</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              The Best <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Doppler Alternative</span> in 2026
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              XtraSecurity is the best Doppler alternative for teams that need git-like secret branching, Just-in-Time access, and zero-downtime rotation — all with a generous free plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Try XtraSecurity Free →
              </Link>
              <Link href="/comparisons" className="inline-flex items-center justify-center gap-2 rounded-md border px-8 py-3 text-sm font-medium hover:bg-accent transition-colors">
                See All Comparisons
              </Link>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Feature-by-Feature Comparison</h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              See exactly where XtraSecurity outperforms Doppler. Every row is a feature your team will benefit from.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-muted/50 border border-muted p-4 text-left font-semibold">Feature</th>
                    <th className="bg-primary/10 border border-muted p-4 text-center font-semibold text-primary">XtraSecurity</th>
                    <th className="bg-muted/50 border border-muted p-4 text-center font-semibold text-red-500">Doppler</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="border border-muted p-4 font-medium">{row.feature}</td>
                      <td className="border border-muted p-4 text-center text-sm">{row.xtra}</td>
                      <td className="border border-muted p-4 text-center text-sm text-muted-foreground">{row.doppler}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why Switch */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Why Teams Switch from Doppler to XtraSecurity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Git-like Secret Branching", desc: "Create feature branches for your secrets just like code. Test configuration changes in isolation before promoting to production. Doppler doesn't support this." },
                { title: "Just-in-Time Access", desc: "Grant temporary, time-limited access to sensitive secrets that auto-expires. Built-in approval workflows and audit trails. Doppler has no equivalent." },
                { title: "Shadow Rotation", desc: "Rotate credentials in the background with zero downtime. The old value stays active until the new one is confirmed working. Doppler doesn't offer this." },
                { title: "4x Lower Price", desc: "XtraSecurity Pro costs $29/month compared to Doppler's $120/month. You get more features for less — including JIT access, secret branching, and break-glass emergency access." },
              ].map((item, idx) => (
                <article key={idx} className="p-6 rounded-xl border bg-card hover:border-primary/30 transition-colors">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Switch from Doppler?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Migrate in under 5 minutes. Free plan available — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Start Free →
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
