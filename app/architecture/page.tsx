"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ArrowRight, Lock, Database, Network, Shield } from "lucide-react";
import Link from "next/link";

export default function SecurityArchitecturePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Security & Architecture</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Enterprise-Grade<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Security Architecture
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for Fortune 500 security standards. Transparent about our infrastructure, encryption, and threat model.
            </p>
          </div>
        </div>
      </section>

      {/* Encryption & Key Management */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Military-Grade Encryption</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Every secret is encrypted at rest and in transit using industry-standard algorithms.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { title: "AES-256-GCM", desc: "At-rest encryption for all secrets" },
                  { title: "TLS 1.3", desc: "All data in transit encrypted end-to-end" },
                  { title: "HMAC-SHA256", desc: "Integrity verification for all cryptographic operations" },
                  { title: "PBKDF2", desc: "Key derivation with industry-standard iterations" }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-black dark:text-white">{item.title}</p>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-primary/20 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Key Management
                </CardTitle>
                <CardDescription>How we protect your secrets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black/30 rounded p-4 font-mono text-sm text-green-400 overflow-auto">
                  {`// Master Key Hierarchy
├── Root HSM Keys
├── Regional Keys
├── Application Keys
└── Per-Secret Keys (rotating)`}
                </div>
                <p className="text-sm text-muted-foreground">
                  Master encryption keys are stored in hardware security modules (HSMs) in multiple regions with redundancy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Storage & Compliance */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Data Storage & Compliance</h2>
            <p className="text-muted-foreground text-lg">Meet your regulatory requirements with built-in compliance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              {
                icon: Database,
                title: "Data Residency",
                items: [
                  "US East & West regions",
                  "Europe (GDPR compliant)",
                  "Asia Pacific (SOC 2 certified)",
                  "Air-gapped deployments available"
                ]
              },
              {
                icon: Shield,
                title: "Compliance Certifications",
                items: [
                  "SOC 2 Type II",
                  "ISO 27001",
                  "GDPR & CCPA",
                  "HIPAA & PCI DSS ready"
                ]
              }
            ].map((section, idx) => {
              const Icon = section.icon;
              return (
                <Card key={idx} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-primary/20 bg-gradient-card">
            <CardHeader>
              <CardTitle>Where Your Data Lives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { region: "US (Primary)", desc: "us-east-1, us-west-2", uptime: "99.99%" },
                  { region: "Europe", desc: "eu-central-1, eu-west-1", uptime: "99.99%" },
                  { region: "Asia", desc: "ap-southeast-1", uptime: "99.95%" }
                ].map((region, idx) => (
                  <div key={idx} className="border border-primary/20 rounded p-4">
                    <p className="font-semibold mb-1">{region.region}</p>
                    <p className="text-sm text-muted-foreground mb-3">{region.desc}</p>
                    <Badge className="bg-success/20 text-success border-success/50">{region.uptime} SLA</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Threat Model & Security */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Threat Model & Defense Strategy</h2>

          <Tabs defaultValue="threats" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="threats">Known Threats</TabsTrigger>
              <TabsTrigger value="defenses">Our Defenses</TabsTrigger>
              <TabsTrigger value="incident">Incident Response</TabsTrigger>
            </TabsList>

            <TabsContent value="threats" className="mt-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Threats We Defend Against</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Unauthorized access to secrets database",
                    "Man-in-the-middle (MITM) attacks",
                    "Insider threats from malicious employees",
                    "Brute force attacks on authentication",
                    "Side-channel attacks on encryption",
                    "Data exfiltration during backups",
                    "Compromised developer machines",
                    "Supply chain attacks"
                  ].map((threat, idx) => (
                    <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                      <span className="text-primary font-bold">⚠</span>
                      <span className="text-sm">{threat}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="defenses" className="mt-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Defense Mechanisms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { threat: "Database compromise", defense: "Secrets remain encrypted with keys held separately in HSMs" },
                    { threat: "MITM attacks", defense: "TLS 1.3 with certificate pinning, mTLS for service-to-service" },
                    { threat: "Insider threats", defense: "All access logged, 0-trust architecture, encryption with 4-eye principle" },
                    { threat: "Brute force", defense: "Rate limiting, progressive backoff, IP-based blocking" },
                    { threat: "Side-channel attacks", defense: "Constant-time cryptographic operations" },
                    { threat: "Data exfiltration", defense: "Encrypted backups, geographic distribution, anomaly detection" }
                  ].map((item, idx) => (
                    <div key={idx} className="pb-4 border-b last:border-b-0 last:pb-0">
                      <p className="font-semibold text-sm mb-1">{item.threat}</p>
                      <p className="text-sm text-muted-foreground">{item.defense}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="incident" className="mt-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Incident Response Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {[
                      { step: 1, title: "Detection", desc: "24/7 monitoring with automated alerts for anomalies" },
                      { step: 2, title: "Containment", desc: "Immediate isolation of affected systems and accounts" },
                      { step: 3, title: "Investigation", desc: "Full forensic analysis of logs and affected secrets" },
                      { step: 4, title: "Notification", desc: "Customer notification within 24 hours if data affected" },
                      { step: 5, title: "Remediation", desc: "Fix root cause, force secret rotation, deploy patches" },
                      { step: 6, title: "Review", desc: "Post-incident review and security improvements" }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold">
                            {item.step}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Audit & Testing */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Audits & Penetration Testing</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Annual Pentest",
                desc: "Third-party security firm conducts comprehensive penetration testing",
                date: "Latest: Q4 2025",
                status: "No critical findings"
              },
              {
                title: "SOC 2 Audit",
                desc: "Independent audit of security, availability, and confidentiality",
                date: "Latest: Q2 2025",
                status: "Type II Certified"
              },
              {
                title: "Code Review",
                desc: "Regular security code reviews and static analysis scanning",
                date: "Continuous",
                status: "Zero high/critical"
              }
            ].map((audit, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{audit.title}</CardTitle>
                  <CardDescription>{audit.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Update</p>
                    <p className="font-semibold text-sm">{audit.date}</p>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/50 w-fit">
                    {audit.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/20 mt-8 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Security Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Security Whitepaper", date: "Updated Q1 2026" },
                  { name: "Threat Model (DREAD)", date: "Updated Q4 2025" },
                  { name: "Penetration Test Report", date: "Q4 2025" },
                  { name: "SOC 2 Type II Report", date: "Q2 2025" }
                ].map((doc, idx) => (
                  <Button key={idx} variant="outline" className="justify-start h-auto flex-col items-start p-4">
                    <span className="font-semibold">{doc.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">{doc.date}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Security */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">API Security</h2>

          <Card className="border-primary/20 max-w-4xl mx-auto mb-8">
            <CardHeader>
              <CardTitle>Authentication & Authorization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">API Key Management</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Keys stored hashed with bcrypt (cost factor 12)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Rotation every 90 days recommended</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Rate limiting per API key: 1000 req/min</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>All API calls over mTLS</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-primary/20 pt-6">
                <h4 className="font-semibold mb-3">OAuth 2.0 Support</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>PKCE protection against authorization code interception</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Refresh token rotation on every use</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Short-lived access tokens (15 minutes)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Security is Our Priority</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Questions about our security? We're happy to dive deeper.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:security@xtrasecurity.io">
              <Button size="lg" className="gap-2">
                Contact Security Team
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/docs/security">
              <Button size="lg" variant="outline">
                Security Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
