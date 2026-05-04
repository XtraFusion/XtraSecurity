import { generatePageMetadata } from "@/lib/seo";
import { generateTechArticleSchema, generateBreadcrumbSchema } from "@/lib/schema-markup";
import Link from "next/link";

export const metadata = generatePageMetadata(
  "Developer Guide — XtraSecurity SDK, API & CLI Integration",
  "Quick start guide for integrating XtraSecurity into your applications. Install the CLI, use the REST API, and integrate with CI/CD pipelines. Code examples for Node.js, Python, React, GitHub Actions, and more.",
  "/developers"
);

export default function DevelopersPage() {
  const techArticleSchema = generateTechArticleSchema(
    "XtraSecurity Developer Integration Guide",
    "Complete developer guide for integrating XtraSecurity secrets management into applications using the CLI, REST API, and SDK. Includes code examples for Node.js, Python, React, and CI/CD pipelines.",
    "https://xtrasecurity.in/developers"
  );
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "https://xtrasecurity.in" },
    { name: "Developers", url: "https://xtrasecurity.in/developers" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <span className="font-mono text-sm text-primary">npm install -g xtra-cli</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Developer <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Quick Start</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Integrate XtraSecurity into your application in 3 minutes. Use the CLI for local development, 
              the REST API for programmatic access, or the SDK for framework-native integration.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/docs" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Full Documentation →
              </Link>
              <Link href="/docs/api" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                API Reference
              </Link>
              <Link href="/docs/cli" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                CLI Guide
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Quick Start (3 Steps)</h2>
              <p className="text-muted-foreground">Get from zero to secure secret injection in under 3 minutes.</p>
            </header>

            <div className="space-y-8">
              <article>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Install the CLI
                </h3>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`npm install -g xtra-cli`}</code>
                </pre>
              </article>

              <article>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Authenticate & Link Project
                </h3>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# Login to your XtraSecurity account
xtra login

# Link your current directory to a project
xtra projects set <your-project-id>

# Set branch and environment
xtra checkout main --env development`}</code>
                </pre>
              </article>

              <article>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Run with Injected Secrets
                </h3>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# Inject secrets into your process (recommended — no .env file created)
xtra run -e development -b main -- npm run dev

# Or sync to a local .env.local file
xtra local sync -e development -b main`}</code>
                </pre>
              </article>
            </div>
          </div>
        </section>

        {/* REST API Overview */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              <h2 className="text-3xl font-bold mb-4">REST API</h2>
              <p className="text-muted-foreground">
                Programmatic access to all XtraSecurity features. Authenticate with API keys or JWT tokens.
              </p>
            </header>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Authentication</h3>
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                <code>{`# All API requests require a Bearer token
curl -X GET https://xtrasecurity.in/api/secret?branchId=<branch-id> \\
  -H "Authorization: Bearer <your-api-token>" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Core Endpoints</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-semibold">Method</th>
                      <th className="text-left px-4 py-3 font-semibold">Endpoint</th>
                      <th className="text-left px-4 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { method: "GET", endpoint: "/api/secret?branchId=:id", desc: "List all secrets in a branch" },
                      { method: "POST", endpoint: "/api/secret", desc: "Create a new secret" },
                      { method: "PUT", endpoint: "/api/secret?id=:id", desc: "Update an existing secret" },
                      { method: "DELETE", endpoint: "/api/secret?id=:id", desc: "Delete a secret" },
                      { method: "GET", endpoint: "/api/branch?projectId=:id", desc: "List branches in a project" },
                      { method: "POST", endpoint: "/api/branch", desc: "Create a new branch" },
                      { method: "GET", endpoint: "/api/projects", desc: "List all projects" },
                      { method: "POST", endpoint: "/api/projects", desc: "Create a new project" },
                      { method: "GET", endpoint: "/api/audit?projectId=:id", desc: "Get audit logs for a project" },
                      { method: "POST", endpoint: "/api/access/request", desc: "Request JIT access to a secret" },
                      { method: "POST", endpoint: "/api/access/approve", desc: "Approve or reject an access request" },
                      { method: "POST", endpoint: "/api/rotation/schedules", desc: "Create a rotation schedule" },
                    ].map((api, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            api.method === "GET" ? "bg-blue-500/10 text-blue-500" :
                            api.method === "POST" ? "bg-emerald-500/10 text-emerald-500" :
                            api.method === "PUT" ? "bg-amber-500/10 text-amber-500" :
                            "bg-red-500/10 text-red-500"
                          }`}>
                            {api.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{api.endpoint}</td>
                        <td className="px-4 py-3 text-muted-foreground">{api.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold">Example: Create a Secret</h3>
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                <code>{`curl -X POST https://xtrasecurity.in/api/secret \\
  -H "Authorization: Bearer <your-api-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "DATABASE_URL",
    "value": "postgresql://user:pass@host:5432/db",
    "branchId": "<branch-id>",
    "environmentType": "production",
    "description": "Primary PostgreSQL connection string"
  }'`}</code>
              </pre>

              <h3 className="text-lg font-semibold mt-6">Example Response</h3>
              <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                <code>{`{
  "id": "sec_abc123",
  "key": "DATABASE_URL",
  "type": "credential",
  "environmentType": "production",
  "version": 1,
  "createdAt": "2025-06-01T12:00:00Z",
  "description": "Primary PostgreSQL connection string"
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Framework Integration Examples */}
        <section className="py-16 lg:py-20 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Framework Integration</h2>
              <p className="text-muted-foreground">
                XtraSecurity works with any framework. Here are quick examples for popular tech stacks.
              </p>
            </header>

            <div className="space-y-10">
              {/* Node.js / Express */}
              <article>
                <h3 className="text-lg font-semibold mb-1">Node.js / Express</h3>
                <p className="text-sm text-muted-foreground mb-3">Use the CLI to inject env vars, then access them with <code className="bg-muted px-1 rounded">process.env</code>:</p>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# Terminal: Start your Express server with injected secrets
xtra run -e production -b main -- node server.js

# server.js — access secrets normally via process.env
const express = require('express');
const app = express();

const dbUrl = process.env.DATABASE_URL;     // Injected by xtra-cli
const apiKey = process.env.STRIPE_API_KEY;   // Injected by xtra-cli

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`}</code>
                </pre>
              </article>

              {/* Next.js / React */}
              <article>
                <h3 className="text-lg font-semibold mb-1">Next.js / React</h3>
                <p className="text-sm text-muted-foreground mb-3">Sync secrets to <code className="bg-muted px-1 rounded">.env.local</code> for Next.js development:</p>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# Sync secrets to .env.local (Next.js reads this automatically)
xtra local sync -e development -b main

# Or inject directly without .env.local
xtra run -e development -b main -- npm run dev

# Access in your Next.js code:
# Server components: process.env.DATABASE_URL
# Client components: process.env.NEXT_PUBLIC_API_URL`}</code>
                </pre>
              </article>

              {/* Python / Django */}
              <article>
                <h3 className="text-lg font-semibold mb-1">Python / Django / Flask</h3>
                <p className="text-sm text-muted-foreground mb-3">The CLI injects secrets as environment variables, accessible via <code className="bg-muted px-1 rounded">os.environ</code>:</p>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# Terminal: Run your Python app with injected secrets
xtra run -e production -b main -- python manage.py runserver

# settings.py — access secrets normally
import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ.get('DB_HOST'),
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
    }
}`}</code>
                </pre>
              </article>
            </div>
          </div>
        </section>

        {/* CI/CD Integration */}
        <section className="py-16 lg:py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              <h2 className="text-3xl font-bold mb-4">CI/CD Integration</h2>
              <p className="text-muted-foreground">
                Pull secrets at build time without storing them in CI/CD configuration files.
              </p>
            </header>

            <div className="space-y-10">
              {/* GitHub Actions */}
              <article>
                <h3 className="text-lg font-semibold mb-1">GitHub Actions</h3>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install xtra-cli
        run: npm install -g xtra-cli

      - name: Authenticate with XtraSecurity
        run: xtra login --token \${{ secrets.XTRA_API_TOKEN }}

      - name: Set project
        run: xtra projects set \${{ vars.XTRA_PROJECT_ID }}

      - name: Build with injected secrets
        run: xtra run -e production -b main -- npm run build

      - name: Deploy
        run: npm run deploy`}</code>
                </pre>
              </article>

              {/* GitLab CI */}
              <article>
                <h3 className="text-lg font-semibold mb-1">GitLab CI</h3>
                <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 text-sm font-mono overflow-x-auto border border-zinc-800">
                  <code>{`# .gitlab-ci.yml
deploy:
  stage: deploy
  image: node:20
  script:
    - npm install -g xtra-cli
    - xtra login --token $XTRA_API_TOKEN
    - xtra projects set $XTRA_PROJECT_ID
    - xtra run -e production -b main -- npm run build
    - npm run deploy
  only:
    - main`}</code>
                </pre>
              </article>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start integrating XtraSecurity into your project today. Free plan includes 3 projects and 50 secrets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Get Started Free →
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
                Full Documentation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
