"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ComparisonPage() {
  const comparisonData = [
    { feature: "Setup Time", xtra: "5 minutes", vault: "2 hours", doppler: "15 minutes", infisical: "20 minutes" },
    { feature: "Pricing Model", xtra: "Simple per-user", vault: "Complex licensing", doppler: "Per-app flat rate", infisical: "Fair open-source" },
    { feature: "Managed Service", xtra: "Yes (SaaS)", vault: "Self-hosted only", doppler: "Yes (SaaS)", infisical: "Both" },
    { feature: "Encryption", xtra: "AES-256-GCM", vault: "AES-256-GCM", doppler: "AES-256", infisical: "AES-256" },
    { feature: "Key Management", xtra: "HSM-backed", vault: "Complex config", doppler: "Cloud KMS", infisical: "Basic" },
    { feature: "Audit Logs", xtra: "Built-in + accessible", vault: "Detailed but complex", doppler: "Limited", infisical: "Basic" },
    { feature: "Secret Rotation", xtra: "Automated", vault: "Requires config", doppler: "Limited support", infisical: "Manual" },
    { feature: "Kubernetes Support", xtra: "Native CSI", vault: "Agent-based", doppler: "Non-native", infisical: "Operator" },
    { feature: "Compliance", xtra: "SOC 2 Type II, ISO 27001", vault: "Self-certified", doppler: "SOC 2 Type II", infisical: "Community-driven" },
    { feature: "Support", xtra: "24/7 Premium", vault: "Community or Enterprise", doppler: "24/7 for paid tiers", infisical: "Community" },
  ];

  const tools = [
    { name: "XtraSecurity", color: "from-primary to-blue-600" },
    { name: "HashiCorp Vault", color: "from-orange-500 to-orange-600" },
    { name: "Doppler", color: "from-red-500 to-red-600" },
    { name: "Infisical", color: "from-green-500 to-green-600" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Comparison Guide</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              How Does XtraSecurity<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Compare?
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Honest comparison with industry leaders. We win on simplicity, you'll see.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Verdict */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">The Verdict</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="text-2xl">Choose XtraSecurity If</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "You want secrets management in minutes, not days",
                  "You need transparent pricing without enterprise sales calls",
                  "You use Kubernetes and want native CSI support",
                  "Automated secret rotation is critical",
                  "You prefer SaaS over self-hosting maintenance",
                  "You need 24/7 support and compliance certifications"
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-muted/50">
              <CardHeader>
                <CardTitle className="text-2xl">Choose Alternatives If</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "You must self-host for data sovereignty",
                  "You need complex policy engine (Vault's Sentinel)",
                  "You have existing Vault investment ($$$)",
                  "You want strictest open-source licensing",
                  "You need advanced dynamic secrets (databases)",
                  "You require on-premises or air-gapped deployment"
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-muted/50 border border-muted p-4 text-left font-semibold sticky left-0 z-10 bg-background">
                    Feature
                  </th>
                  {tools.map((tool) => (
                    <th key={tool.name} className="bg-muted/50 border border-muted p-4 text-center font-semibold min-w-32">
                      <div className={`bg-gradient-to-r ${tool.color} bg-clip-text text-transparent font-bold`}>
                        {tool.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="border border-muted p-4 font-semibold sticky left-0 z-10 bg-background">
                      {row.feature}
                    </td>
                    <td className="border border-muted p-4 text-center text-sm">
                      <Badge className="bg-primary/20 text-primary border-primary/50 justify-center w-full">
                        {row.xtra}
                      </Badge>
                    </td>
                    <td className="border border-muted p-4 text-center text-sm text-muted-foreground">
                      {row.vault}
                    </td>
                    <td className="border border-muted p-4 text-center text-sm text-muted-foreground">
                      {row.doppler}
                    </td>
                    <td className="border border-muted p-4 text-center text-sm text-muted-foreground">
                      {row.infisical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Comparison */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Detailed Comparisons</h2>

          <div className="space-y-6">
            {/* Vault vs XtraSecurity */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-4">
                  <span className="text-orange-500">HashiCorp Vault</span>
                  <span className="text-muted-foreground text-sm font-normal">vs</span>
                  <span className="text-primary">XtraSecurity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-orange-500 mb-3">Vault Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Complex policy engine (Sentinel)",
                        "Dynamic secrets generation",
                        "PKI certificate management",
                        "Self-hosted option",
                        "10+ years of maturity"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-orange-500">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3">XtraSecurity Wins</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Set up in 5 minutes vs 2 hours",
                        "Transparent pricing (no enterprise calls)",
                        "Native Kubernetes CSI driver",
                        "Automated secret rotation built-in",
                        "24/7 support included in Pro"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doppler vs XtraSecurity */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-4">
                  <span className="text-red-500">Doppler</span>
                  <span className="text-muted-foreground text-sm font-normal">vs</span>
                  <span className="text-primary">XtraSecurity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-red-500 mb-3">Doppler Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Simple configuration UI",
                        "Good for small teams (< 10 people)",
                        "Fast onboarding",
                        "Friendly pricing"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-red-500">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3">XtraSecurity Wins</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Automated secret rotation",
                        "Full audit trail (who accessed what/when)",
                        "HSM-backed key management",
                        "Enterprise compliance (SOC 2, ISO 27001)",
                        "Kubernetes-native integration"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Infisical vs XtraSecurity */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-4">
                  <span className="text-green-500">Infisical</span>
                  <span className="text-muted-foreground text-sm font-normal">vs</span>
                  <span className="text-primary">XtraSecurity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-500 mb-3">Infisical Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "100% open source (MIT license)",
                        "Self-host option",
                        "No vendor lock-in",
                        "Community-driven"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-green-500">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-3">XtraSecurity Wins</h4>
                    <ul className="space-y-2 text-sm">
                      {[
                        "Enterprise-grade compliance",
                        "24/7 professional support",
                        "Automated rotation + audit",
                        "HSM security (Infisical doesn't have this)",
                        "Better for regulated industries"
                      ].map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Case Recommendations */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Recommendations by Use Case</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "🚀 Startup (< 50 people)",
                recommendation: "XtraSecurity",
                reason: "Fast setup, transparent pricing, no enterprise overhead"
              },
              {
                title: "🏢 Mid-Market (50-500 people)",
                recommendation: "XtraSecurity or Vault",
                reason: "XtraSecurity for simplicity + compliance, Vault if you need dynamic secrets"
              },
              {
                title: "🏛️ Enterprise (500+ people)",
                recommendation: "Vault or XtraSecurity Enterprise",
                reason: "Vault for complexity + policy, XtraSecurity if you want compliance + support"
              },
              {
                title: "🔒 Regulation-Heavy (Healthcare, Finance)",
                recommendation: "XtraSecurity",
                reason: "SOC 2 Type II, ISO 27001, HIPAA-ready + audit trail"
              }
            ].map((useCase, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Recommended</p>
                    <Badge className="bg-primary/20 text-primary border-primary/50 text-base p-2">
                      {useCase.recommendation}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{useCase.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Convinced?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Test drive XtraSecurity free for 30 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
