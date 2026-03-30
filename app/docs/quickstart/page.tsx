"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function QuickstartPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6 text-black dark:text-white">
            Get Started in 5 Minutes
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Install XtraSecurity, authenticate, and load your first secret.
          </p>
          <Badge className="bg-success/20 text-success border-success/50">Free forever tier available</Badge>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-2xl font-bold">Install the CLI</h2>
              </div>
              <p className="text-muted-foreground mb-4">Install using npm (or use the binary installer for other systems)</p>
              <Card className="border-primary/20 bg-gradient-card">
                <CardContent className="p-4 relative">
                  <code className="font-mono text-sm text-green-400 block">
                    npm install -g xtra-cli
                  </code>
                  <button
                    onClick={() => copyToClipboard("npm install -g xtra-cli", "step1")}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedCode === "step1" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                ✓ Installs CLI globally | ✓ Works on macOS, Linux, Windows | ✓ Requires Node.js 18+
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-2xl font-bold">Create a Free Account</h2>
              </div>
              <p className="text-muted-foreground mb-4">Sign up for your free XtraSecurity workspace</p>
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <Button size="lg" className="w-full">
                    Create Free Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    No credit card required. Get 1000 requests/day on Free tier.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h2 className="text-2xl font-bold">Authenticate with CLI</h2>
              </div>
              <p className="text-muted-foreground mb-4">Login to link your CLI with your XtraSecurity account</p>
              <Card className="border-primary/20 bg-gradient-card">
                <CardContent className="p-4 relative">
                  <code className="font-mono text-sm text-green-400 block">
                    xtra login
                  </code>
                  <button
                    onClick={() => copyToClipboard("xtra login", "step3")}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedCode === "step3" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                ✓ Opens browser for OAuth | ✓ Stores credentials locally | ✓ No password stored
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h2 className="text-2xl font-bold">Create Your First Secret</h2>
              </div>
              <p className="text-muted-foreground mb-4">Create an API key secret in your default environment</p>
              <Card className="border-primary/20 bg-gradient-card">
                <CardContent className="p-4 relative">
                  <code className="font-mono text-sm text-green-400 block">
                    xtra secret set api-key "sk_live_abc123xyz"
                  </code>
                  <button
                    onClick={() => copyToClipboard('xtra secret set api-key "sk_live_abc123xyz"', "step4")}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedCode === "step4" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                ✓ Encrypted at rest with AES-256 | ✓ Version history automatically maintained | ✓ Instant access
              </p>
            </div>

            {/* Step 5 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <h2 className="text-2xl font-bold">Retrieve the Secret</h2>
              </div>
              <p className="text-muted-foreground mb-4">Fetch your secret anytime from the CLI or your app</p>
              <Card className="border-primary/20 bg-gradient-card">
                <CardContent className="p-4 relative">
                  <code className="font-mono text-sm text-green-400 block">
                    xtra secret get api-key
                  </code>
                  <button
                    onClick={() => copyToClipboard("xtra secret get api-key", "step5")}
                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedCode === "step5" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground">
                Output: sk_live_abc123xyz
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Load Secrets in Your App",
                desc: "Use the Node.js SDK to load secrets in your application",
                link: "/docs/sdks"
              },
              {
                title: "Setup Integrations",
                desc: "Connect with GitHub, Docker, Kubernetes, and more",
                link: "/docs/integrations"
              },
              {
                title: "Configure Teams",
                desc: "Invite team members and setup role-based access",
                link: "/docs/permissions"
              },
              {
                title: "Explore Tutorials",
                desc: "Follow step-by-step guides for common workflows",
                link: "/tutorials"
              }
            ].map((item, idx) => (
              <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="gap-2">
                    Explore →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Common Issues */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Troubleshooting</h2>
          <div className="space-y-6">
            {[
              {
                q: "npm command not found?",
                a: "Make sure Node.js 18+ is installed. Run `node --version` to check."
              },
              {
                q: "Login page doesn't open?",
                a: "Run `xtra login --help` for alternative authentication methods or contact support."
              },
              {
                q: "How do I switch projects?",
                a: "Use `xtra project select` to switch between projects or `xtra project list` to see all projects."
              },
              {
                q: "Can I use API tokens instead?",
                a: "Yes! Generate an API token in the web console and use `xtra login --api-key <token>`."
              }
            ].map((faq, idx) => (
              <Card key={idx} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {faq.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
