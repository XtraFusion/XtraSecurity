"use client";

import { getAllIntegrations } from "@/lib/integrations-data";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const integrations = getAllIntegrations();

  const difficulty = {
    Easy: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400',
    Medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400',
    Advanced: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-primary">Integration Guides</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              XtraSecurity Setup<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Guides & Tutorials
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Step-by-step guides to integrate XtraSecurity with GitHub Actions, Docker, Kubernetes, Jenkins, AWS Lambda, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Integration Cards */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Choose Your Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Link key={integration.slug} href={`/setup/${integration.slug}`}>
                <Card className="cursor-pointer h-full hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{integration.icon}</span>
                      <Badge className={difficulty[integration.difficulty as keyof typeof difficulty]}>
                        {integration.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{integration.service}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {integration.setupTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {integration.difficulty}
                      </span>
                    </div>
                    <Button className="w-full gap-2" size="sm">
                      View Guide
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 border-b bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Most Popular</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {integrations.slice(0, 2).map((integration) => (
              <Link key={integration.slug} href={`/setup/${integration.slug}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <div className="text-5xl mb-4">{integration.icon}</div>
                    <CardTitle className="text-2xl">{integration.service}</CardTitle>
                    <CardDescription className="text-base">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-6">
                      <div className="text-sm text-muted-foreground">Setup Time: {integration.setupTime}</div>
                      <div className="text-sm text-muted-foreground">Difficulty: {integration.difficulty}</div>
                    </div>
                    <Button className="w-full gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Secrets?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Pick your integration guide above and get started in minutes.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="gap-2">
                Read Full Docs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
