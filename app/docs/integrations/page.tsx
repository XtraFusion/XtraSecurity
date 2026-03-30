"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    { name: "GitHub Actions", desc: "Load secrets in CI/CD workflows" },
    { name: "Kubernetes", desc: "Kubernetes CSI driver for secret injection" },
    { name: "Docker", desc: "Docker Compose and container secrets" },
    { name: "AWS", desc: "AWS Lambda and EC2 integration" },
    { name: "GitLab CI", desc: "GitLab CI/CD pipeline integration" },
    { name: "CircleCI", desc: "CircleCI orb for secret management" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link href="/docs" className="inline-block mb-6">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Button>
        </Link>
        
        <h1 className="text-5xl font-bold mb-6">Integration Guides</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Step-by-step setup for popular platforms and tools
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((integration, idx) => (
            <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <CardDescription>{integration.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/tutorials/${integration.name.toLowerCase().replace(" ", "-")}`}>
                  <Button variant="outline" className="w-full">
                    View Setup Guide
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
