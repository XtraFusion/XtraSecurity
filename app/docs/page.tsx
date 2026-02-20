"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code, Terminal, Shield, Key, FileText } from "lucide-react";

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Documentation</h3>
          <p className="text-muted-foreground">
            Learn how to integrate and use XtraSecurity features.
          </p>
        </div>

        <Tabs defaultValue="guides" className="space-y-4">
          <TabsList>
            <TabsTrigger value="guides" className="gap-2"><BookOpen className="h-4 w-4" /> Platform Guides</TabsTrigger>
            <TabsTrigger value="api" className="gap-2"><Code className="h-4 w-4" /> API Reference</TabsTrigger>
            <TabsTrigger value="sdks" className="gap-2"><Terminal className="h-4 w-4" /> SDKs & Tools</TabsTrigger>
          </TabsList>

          {/* GUIDES TAB */}
          <TabsContent value="guides" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Basic concepts, initial setup, and workspace configuration.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <Key className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Secret Management</CardTitle>
                  <CardDescription>How to store, retrieve, and rotate secrets securely.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Tracking platform activity and setting up custom alerts.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Access Reviews</CardTitle>
                  <CardDescription>Learn how to conduct periodic access certification cycles.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <Key className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Service Accounts</CardTitle>
                  <CardDescription>Create headless machine identities for API access.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          {/* API TAB */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>REST API Documentation</CardTitle>
                <CardDescription>Explore our interactive API endpoints.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* We embed the swagger UI here using an iframe to avoid CSS conflicts with Tailwind */}
                <div className="rounded-md border overflow-hidden" style={{ height: "600px" }}>
                  <iframe
                    src="/api-docs-raw"
                    className="w-full h-full bg-[#0a0a0f]"
                    title="Swagger UI"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SDKs TAB */}
          <TabsContent value="sdks" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Node.js SDK</CardTitle>
                      <CardDescription>Official client for Node.js and TypeScript.</CardDescription>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <Terminal className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    npm install @xtrasecurity/sdk
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Go SDK</CardTitle>
                      <CardDescription>Official client for Go applications.</CardDescription>
                    </div>
                    <div className="bg-muted p-2 rounded-md">
                      <Terminal className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    go get github.com/xtrasecurity/go-sdk
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
