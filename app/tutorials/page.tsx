"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Code, Database, Layers, Zap, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TutorialsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const tutorials = [
    {
      id: "nodejs-secrets",
      title: "Secure API Keys in Node.js",
      difficulty: "Beginner",
      time: "5 min",
      description: "Load and use secrets safely in Node.js applications",
      code: `// 1. Install CLI
npm install -g xtra-cli

// 2. Authenticate
xtra login

// 3. Load secret in Node.js
const { XtraClient } = require('@xtrasecurity/sdk-node');

const client = new XtraClient({
  projectId: process.env.PROJECT_ID,
  apiKey: process.env.API_KEY,
});

// Get secret
const apiKey = await client.getSecret('stripe-live-key');

// Use in your app
const stripe = require('stripe')(apiKey);
`,
      tags: ["Node.js", "API Keys", "Environment Variables"],
      icon: Code
    },
    {
      id: "docker-secrets",
      title: "Docker Secrets Management",
      difficulty: "Intermediate",
      time: "10 min",
      description: "Inject secrets into Docker containers securely",
      code: `# Dockerfile with XtraSecurity init
FROM node:18-alpine

# Install XtraSecurity CLI
RUN npm install -g xtra-cli

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Load secrets at runtime
CMD ["xtra", "run", "--", "node", "app.js"]

# In your app.js:
const secret = await client.getSecret('db-password');
console.log('Connected to database');
`,
      tags: ["Docker", "Containers", "Orchestration"],
      icon: Layers
    },
    {
      id: "github-actions",
      title: "CI/CD with GitHub Actions",
      difficulty: "Intermediate",
      time: "8 min",
      description: "Use XtraSecurity in your GitHub Actions workflows",
      code: `name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Load secrets from XtraSecurity
      - name: Get Deployment Secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
          XTRA_PROJECT_ID: \${{ secrets.XTRA_PROJECT_ID }}
        run: |
          xtra login --api-key \$XTRA_API_KEY --project \$XTRA_PROJECT_ID
          PROD_DB_PASSWORD=\$(xtra get prod-db-password)
          echo "DB_PASS=\$PROD_DB_PASSWORD" >> \$GITHUB_ENV

      - name: Deploy to Production
        env:
          DB_PASSWORD: \${{ env.DB_PASS }}
        run: ./deploy.sh
`,
      tags: ["GitHub", "CI/CD", "Automation"],
      icon: Zap
    },
    {
      id: "kubernetes-secrets",
      title: "Kubernetes Secret Injection",
      difficulty: "Advanced",
      time: "15 min",
      description: "Inject XtraSecurity secrets into Kubernetes pods",
      code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: xtra-init
data:
  init.sh: |
    #!/bin/sh
    xtra get prod-db-password > /secrets/db-password
    xtra get stripe-api-key > /secrets/stripe-key
---
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: XTRA_API_KEY
      valueFrom:
        secretKeyRef:
          name: xtra-creds
          key: api-key
    volumeMounts:
    - name: secrets
      mountPath: /secrets
  initContainers:
  - name: xtra-init
    image: node:18-alpine
    command: ["/bin/sh", "/scripts/init.sh"]
    env:
    - name: XTRA_API_KEY
      valueFrom:
        secretKeyRef:
          name: xtra-creds
          key: api-key
    volumeMounts:
    - name: scripts
      mountPath: /scripts
    - name: secrets
      mountPath: /secrets
  volumes:
  - name: scripts
    configMap:
      name: xtra-init
  - name: secrets
    emptyDir: {}
`,
      tags: ["Kubernetes", "K8s", "Orchestration"],
      icon: Database
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
              <span className="text-sm font-medium text-primary">Developer Tutorials</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
              Learn by Doing<br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Copy-Paste Ready Examples
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Step-by-step tutorials with working code examples for every platform
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">5-Minute Quick Start</h2>
            <p className="text-muted-foreground text-lg">Get your first secret loaded in 5 minutes</p>
          </div>

          <Card className="border-primary/20 bg-gradient-card max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Installation & First Secret</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  step: 1,
                  title: "Install the CLI",
                  code: "npm install -g xtra-cli"
                },
                {
                  step: 2,
                  title: "Authenticate",
                  code: "xtra login"
                },
                {
                  step: 3,
                  title: "Create a Secret",
                  code: 'xtra secret create --name "api-key" --value "your-secret-here"'
                },
                {
                  step: 4,
                  title: "Retrieve the Secret",
                  code: 'xtra secret get api-key'
                }
              ].map((item) => (
                <div key={item.step}>
                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.title}</p>
                      <div className="mt-2 relative bg-black/50 rounded p-4 font-mono text-sm text-green-400">
                        <code>{item.code}</code>
                        <button
                          onClick={() => copyToClipboard(item.code, `quick-${item.step}`)}
                          className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded transition-colors"
                        >
                          {copiedCode === `quick-${item.step}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tutorials Grid */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Platform-Specific Tutorials</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutorials.map((tutorial) => {
              const Icon = tutorial.icon;
              return (
                <Card key={tutorial.id} className="border-primary/20 hover:border-primary/50 transition-colors flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {tutorial.difficulty}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/20">
                          {tutorial.time}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{tutorial.title}</CardTitle>
                    <CardDescription>{tutorial.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tutorial.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-secondary/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="bg-black/50 rounded p-4 font-mono text-xs text-green-400 max-h-64 overflow-auto mb-4">
                      <code>{tutorial.code}</code>
                    </div>

                    <Button
                      onClick={() => copyToClipboard(tutorial.code, tutorial.id)}
                      variant="outline"
                      size="sm"
                      className="w-full mb-2 gap-2"
                    >
                      {copiedCode === tutorial.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Link href={`/tutorials/${tutorial.id}`}>
                      <Button variant="outline" className="w-full gap-2">
                        View Full Tutorial
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Video Walkthroughs</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Getting Started with XtraSecurity",
                duration: "3:45",
                views: "12.5K"
              },
              {
                title: "Rotating Secrets in Production",
                duration: "8:20",
                views: "8.3K"
              },
              {
                title: "Kubernetes Integration Setup",
                duration: "15:10",
                views: "5.2K"
              }
            ].map((video, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors overflow-hidden">
                <div className="bg-black/50 aspect-video flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">▶</span>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <p className="font-semibold mb-2">{video.title}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{video.duration}</span>
                    <span>{video.views} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Best Practices</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "🔄 Rotate Regularly",
                items: [
                  "Rotate secrets every 90 days minimum",
                  "Auto-rotate critical secrets every 30 days",
                  "Keep audit trail of all rotations"
                ]
              },
              {
                title: "🔐 Never Hardcode",
                items: [
                  "Always load from environment variables",
                  "Use .env.example without actual values",
                  "Never commit secrets to git"
                ]
              },
              {
                title: "📝 Audit Everything",
                items: [
                  "Enable audit logging for all secret access",
                  "Review access patterns monthly",
                  "Alert on unusual activity"
                ]
              },
              {
                title: "🔑 Manage Permissions",
                items: [
                  "Use least-privilege access control",
                  "Separate prod and dev secrets",
                  "Review team membership quarterly"
                ]
              }
            ].map((practice, idx) => (
              <Card key={idx} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">{practice.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {practice.items.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-primary font-bold">✓</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Follow one of our tutorials to secure your first secret in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                View Full Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
