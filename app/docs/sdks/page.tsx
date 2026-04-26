"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Code } from "lucide-react";

export default function SDKsPage() {
  const sdks = [
    { name: "Node.js", status: "Stable", docs: "/docs/sdks/node" },
    { name: "Python", status: "Stable", docs: "/docs/sdks/python" },
    { name: "Go", status: "Stable", docs: "/docs/sdks/go" },
    { name: "Java", status: "Beta", docs: "#" },
    { name: ".NET", status: "Coming", docs: "#" },
    { name: "Rust", status: "Beta", docs: "#" }
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
        
        <h1 className="text-5xl font-bold mb-6">SDK Guides</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Load secrets in your application with our official SDKs
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sdks.map((sdk, idx) => (
            <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    {sdk.name}
                  </CardTitle>
                  <Badge variant={sdk.status === "Stable" ? "default" : sdk.status === "Beta" ? "secondary" : "outline"}>
                    {sdk.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={sdk.docs}>
                  <Button variant="outline" className="w-full">
                    View Documentation
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
