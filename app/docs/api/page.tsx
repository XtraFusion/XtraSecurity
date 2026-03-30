"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Code } from "lucide-react";

export default function APIPage() {
  const endpoints = [
    { method: "POST", path: "/v1/secrets", desc: "Create a new secret" },
    { method: "GET", path: "/v1/secrets/:id", desc: "Retrieve a secret" },
    { method: "PUT", path: "/v1/secrets/:id", desc: "Update a secret" },
    { method: "DELETE", path: "/v1/secrets/:id", desc: "Delete a secret" },
    { method: "GET", path: "/v1/audit", desc: "Get audit logs" }
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
        
        <h1 className="text-5xl font-bold mb-6">REST API Reference</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Direct API access for advanced use cases
        </p>
        
        <div className="space-y-4">
          {endpoints.map((endpoint, idx) => (
            <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <code className="text-sm px-3 py-1 rounded bg-primary/10 text-primary font-mono font-bold min-w-fit">
                      {endpoint.method}
                    </code>
                    <div>
                      <code className="font-mono text-sm text-muted-foreground">{endpoint.path}</code>
                      <p className="text-sm text-muted-foreground mt-1">{endpoint.desc}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Docs →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 bg-gradient-card mt-8">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>All API requests require authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black/30 rounded p-4 font-mono text-sm text-green-400 mb-4">
              curl -H "Authorization: Bearer YOUR_API_KEY" https://api.xtrasecurity.io/v1/secrets
            </div>
            <p className="text-sm text-muted-foreground">
              Generate API keys in the Dashboard under Settings → API Keys
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
