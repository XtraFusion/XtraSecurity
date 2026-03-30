"use client";

import { getAllComparisons } from "@/lib/comparison-data";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComparisonsPage() {
  const comparisons = getAllComparisons();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Secrets Manager Comparison</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Finding the Right<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Secrets Manager
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Compare HashiCorp Vault, AWS Secrets Manager, Doppler, and XtraSecurity. See pricing, features, and which is best for your team.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Cards */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Platform Comparisons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {comparisons.map((comparison) => (
              <Link key={comparison.slug} href={`/comparisons/${comparison.slug}`}>
                <Card className="cursor-pointer h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Comparison
                      </Badge>
                    </div>
                    <CardTitle>
                      XtraSecurity vs {comparison.competitorName}
                    </CardTitle>
                    <CardDescription>{comparison.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-6">
                      {comparison.xtraSecurityAdvantages.slice(0, 3).map((advantage, idx) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span>{advantage}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full gap-2" size="sm">
                      View Comparison
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Feature Matrix */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Quick Feature Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-bold">Feature</th>
                  <th className="text-center py-4 px-4 font-bold">XtraSecurity</th>
                  <th className="text-center py-4 px-4 font-bold">Vault</th>
                  <th className="text-center py-4 px-4 font-bold">AWS</th>
                  <th className="text-center py-4 px-4 font-bold">Doppler</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Open Source', xs: true, vault: true, aws: false, doppler: false },
                  { feature: 'SaaS Option', xs: true, vault: false, aws: true, doppler: true },
                  { feature: 'Self-Hosted', xs: true, vault: true, aws: false, doppler: false },
                  { feature: 'Multi-Cloud', xs: true, vault: true, aws: false, doppler: true },
                  { feature: 'Secret Rotation', xs: true, vault: true, aws: true, doppler: false },
                  { feature: 'Kubernetes', xs: true, vault: true, aws: true, doppler: true },
                  { feature: 'RBAC', xs: true, vault: true, aws: true, doppler: true },
                  { feature: 'Audit Logs', xs: true, vault: true, aws: true, doppler: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="text-center py-4 px-4">
                      {row.xs ? (
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.vault ? (
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.aws ? (
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row.doppler ? (
                        <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Choose Your Secrets Manager?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start with XtraSecurity's free tier or compare in detail to find the perfect fit for your team.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                Talk to Sales
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
