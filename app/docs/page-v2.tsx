"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Code, Terminal, Zap, Database, Shield } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      icon: Zap,
      title: "Quickstart",
      description: "Get up and running in 5 minutes",
      href: "/docs/quickstart",
      badge: "Start Here"
    },
    {
      icon: Terminal,
      title: "CLI Reference",
      description: "Complete command-line interface documentation",
      href: "/docs/cli",
    },
    {
      icon: Code,
      title: "SDK Guides",
      description: "Node.js, Python, Go, and more",
      href: "/docs/sdks",
    },
    {
      icon: Shield,
      title: "Security Architecture",
      description: "Encryption, key management, and threat model",
      href: "/architecture",
    },
    {
      icon: Database,
      title: "Integration Guides",
      description: "GitHub, GitLab, Kubernetes, Docker, and more",
      href: "/docs/integrations",
    },
    {
      icon: BookOpen,
      title: "API Reference",
      description: "REST API endpoints and authentication",
      href: "/docs/api",
    }
  ];

  const guides = [
    {
      category: "Getting Started",
      items: [
        { title: "Installation", time: "2 min" },
        { title: "First Secret", time: "3 min" },
        { title: "Team Setup", time: "5 min" },
        { title: "Permissions & Access Control", time: "8 min" }
      ]
    },
    {
      category: "Integrations",
      items: [
        { title: "GitHub Actions", time: "5 min" },
        { title: "Kubernetes CSI", time: "10 min" },
        { title: "Docker Compose", time: "5 min" },
        { title: "CI/CD Pipelines", time: "7 min" }
      ]
    },
    {
      category: "Advanced Topics",
      items: [
        { title: "Secret Rotation", time: "8 min" },
        { title: "Audit Logs", time: "10 min" },
        { title: "Multi-Region Deployment", time: "12 min" },
        { title: "Compliance Reporting", time: "6 min" }
      ]
    }
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
              <span className="text-sm font-medium text-primary">Documentation</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Everything You Need<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                To Get Started
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Comprehensive guides, API reference, and tutorials for every use case
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full px-6 py-3 rounded-lg border border-primary/30 bg-white/5 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
              />
              <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Documentation Sections</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg h-full cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="w-8 h-8 text-primary" />
                        {section.badge && (
                          <Badge className="bg-success/20 text-success border-success/50">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="gap-2 p-0 h-auto text-primary hover:text-primary hover:bg-transparent">
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guides by Category */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Popular Guides</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guides.map((guide, idx) => (
              <div key={idx}>
                <h3 className="text-xl font-bold mb-4 text-primary">{guide.category}</h3>
                <div className="space-y-3">
                  {guide.items.map((item, i) => (
                    <Link key={i} href="#" className="block">
                      <Card className="border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{item.title}</p>
                            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                              {item.time}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Reference Cards */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Quick References</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Common CLI Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { cmd: "xtra login", desc: "Authenticate with XtraSecurity" },
                  { cmd: "xtra secret get KEY", desc: "Retrieve a secret" },
                  { cmd: "xtra secret set KEY VALUE", desc: "Create or update secret" },
                  { cmd: "xtra audit --start DATE", desc: "View audit logs" }
                ].map((item, idx) => (
                  <div key={idx} className="font-mono text-sm">
                    <code className="text-primary bg-black/30 px-2 py-1 rounded block mb-1">
                      {item.cmd}
                    </code>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Environment Variables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { var: "XTRA_API_KEY", desc: "Authentication token" },
                  { var: "XTRA_PROJECT_ID", desc: "Your project ID" },
                  { var: "XTRA_REGION", desc: "Deployment region" },
                  { var: "XTRA_CACHE_TTL", desc: "Cache duration in seconds" }
                ].map((item, idx) => (
                  <div key={idx} className="font-mono text-sm">
                    <code className="text-primary bg-black/30 px-2 py-1 rounded block mb-1">
                      {item.var}
                    </code>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SDK Support */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Supported Languages & Platforms</h2>
            <p className="text-muted-foreground text-lg">Choose your language of choice</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { name: "Node.js", status: "Stable" },
              { name: "Python", status: "Stable" },
              { name: "Go", status: "Stable" },
              { name: "Java", status: "Beta" },
              { name: "Rust", status: "Beta" },
              { name: ".NET", status: "Coming" },
              { name: "Ruby", status: "Coming" },
              { name: "PHP", status: "Coming" }
            ].map((sdk, idx) => (
              <Card key={idx} className="border-primary/20 text-center">
                <CardContent className="p-4">
                  <p className="font-bold text-sm mb-2">{sdk.name}</p>
                  <Badge 
                    variant={sdk.status === "Stable" ? "default" : sdk.status === "Beta" ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {sdk.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Didn't Find What You're Looking For?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our support team is here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://slack.xtrasecurity.io" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Join Community Slack
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
