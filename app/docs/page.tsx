"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { BookOpen, Code, Terminal, Shield, Key, FileText, Copy, Check } from "lucide-react";

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  type CommandOption = { flag: string; desc: string };

  const CodeBlock = ({ command, desc, options }: { command: string, desc?: string, options?: CommandOption[] }) => (
    <div className="mb-6 last:mb-0 group/block relative">
      {desc && <p className="text-[15px] text-muted-foreground mb-3 font-medium">{desc}</p>}
      <div className="relative flex flex-col bg-[#0a0f1e]/80 border border-white/[0.08] hover:border-white/[0.2] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-md">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 pointer-events-none opacity-50 group-hover/block:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center justify-between p-4">
          <code className="relative z-10 text-[15px] font-mono text-cyan-50 flex items-center">
            <span className="text-emerald-500/80 mr-3 select-none text-base font-bold">❯</span>
            <span className="tracking-wide">{command}</span>
          </code>

          <button
            onClick={() => handleCopy(command)}
            className="absolute z-20 right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-white/[0.05] text-slate-300 opacity-0 group-hover/block:opacity-100 transition-all hover:bg-white/[0.15] hover:text-white cursor-pointer hover:scale-105 active:scale-95 border border-white/[0.05] hover:border-white/[0.2] shadow-sm flex items-center justify-center gap-2"
            title="Copy command"
          >
            {copied === command ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied === command ? <span className="text-xs font-semibold text-emerald-400 pr-1">Copied</span> : <span className="text-xs font-semibold pr-1">Copy</span>}
          </button>
        </div>

        {options && options.length > 0 && (
          <div className="border-t border-white/[0.04] bg-white/[0.01] px-4 py-3 relative z-10">
            <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Options</div>
            <ul className="space-y-2">
              {options.map((opt, i) => (
                <li key={i} className="flex items-start text-[13px] leading-relaxed">
                  <code className="text-emerald-400/90 font-mono w-48 shrink-0">{opt.flag}</code>
                  <span className="text-slate-400">{opt.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="guides" className="gap-2 py-2"><BookOpen className="h-4 w-4" /> Guides</TabsTrigger>
            <TabsTrigger value="cli" className="gap-2 py-2"><Terminal className="h-4 w-4" /> CLI Tool</TabsTrigger>
            <TabsTrigger value="sdk" className="gap-2 py-2"><FileText className="h-4 w-4" /> Node SDK</TabsTrigger>
            <TabsTrigger value="vscode" className="gap-2 py-2"><Code className="h-4 w-4" /> VS Code</TabsTrigger>
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

          {/* GUIDES TAB */}

          {/* CLI TAB */}
          <TabsContent value="cli" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Terminal className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">XtraSecurity CLI</CardTitle>
                    <CardDescription>The ultimate developer tool for managing and injecting secrets.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">


                <div className="space-y-12">
                  {/* Installation */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Terminal className="h-5 w-5 text-primary" /> Installation
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Install the XtraSecurity CLI globally via npm to make the <code className="bg-muted px-1.5 py-0.5 rounded text-primary">xtra</code> command available system-wide.
                    </p>
                    <CodeBlock command="npm install -g xtra-cli" />
                  </section>

                  {/* Authentication & Setup */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Shield className="h-5 w-5 text-primary" /> Authentication & Setup
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Connect your machine to your XtraSecurity workspace and set up local project configurations.
                    </p>
                    <CodeBlock command="xtra login" desc="Authenticate with the XtraSecurity platform" />
                    <CodeBlock
                      command="xtra profile"
                      desc="Manage multiple connection profiles (e.g., personal vs work)"
                      options={[
                        { flag: "--url <api_url>", desc: "Update the API URL for this profile" },
                        { flag: "--project <id>", desc: "Update the default project ID" },
                        { flag: "--token <token>", desc: "Update the authentication token" }
                      ]}
                    />
                    <CodeBlock command="xtra init" desc="Bootstrap a new project and create an .xtrarc config file" />
                    <CodeBlock
                      command="xtra status"
                      desc="View your current authentication and workspace status"
                      options={[
                        { flag: "-p, --project <id>", desc: "Specify Project ID" },
                        { flag: "-e, --env <env>", desc: "Specify Environment (e.g., dev, stg, prod)" },
                        { flag: "-b, --branch <name>", desc: "Specify Branch Name" }
                      ]}
                    />
                  </section>

                  {/* Runtime Injection */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Terminal className="h-5 w-5 text-primary" /> Runtime Injection
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Run your applications securely by injecting secrets directly into memory without writing them to disk.
                    </p>
                    <CodeBlock
                      command="xtra run <command>"
                      desc="Run a command with secrets injected (e.g., xtra run npm start)"
                      options={[
                        { flag: "-e, --env <env>", desc: "Environment (development, staging, production)" },
                        { flag: "-b, --branch <name>", desc: "Branch Name" },
                        { flag: "--shell", desc: "Enable shell mode (needed for npm run, shell built-ins on Windows)" }
                      ]}
                    />
                    <CodeBlock
                      command="xtra watch"
                      desc="Watch for secret changes and restart the application automatically"
                      options={[
                        { flag: "-e, --env <env>", desc: "Environment to watch" },
                        { flag: "--interval <seconds>", desc: "Poll interval in seconds (default: 5)" }
                      ]}
                    />
                    <CodeBlock
                      command="xtra simulate"
                      desc="Simulate a run to see which secrets will be injected"
                      options={[
                        { flag: "--show-values", desc: "Reveal secret values in output (default: masked)" },
                        { flag: "--diff", desc: "Highlight secrets that differ from local .env / process.env" }
                      ]}
                    />
                  </section>

                  {/* Secret Management */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Key className="h-5 w-5 text-primary" /> Secret Management
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Manage project secrets directly from your terminal.
                    </p>
                    <CodeBlock
                      command="xtra secrets"
                      desc="List, set, or delete secrets in an environment"
                      options={[
                        { flag: "-e, --env <env>", desc: "Environment (development, staging, production)" },
                        { flag: "--show", desc: "Reveal secret values" },
                        { flag: "-f, --force", desc: "Force update (overwrite remote changes without warning)" }
                      ]}
                    />
                    <CodeBlock command="xtra generate" desc="Generate a secure random secret value" />
                    <CodeBlock
                      command="xtra template"
                      desc="Render a template file, replacing variables with secret values"
                      options={[
                        { flag: "-o, --output <file>", desc: "Output file (default: stdout)" },
                        { flag: "--strict", desc: "Exit with error if any placeholder is unresolved" }
                      ]}
                    />
                  </section>

                  {/* Environment & Project */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <BookOpen className="h-5 w-5 text-primary" /> Environment & Project
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Manage environments and project linkages.
                    </p>
                    <CodeBlock command="xtra env" desc="Manage environments or clone secrets between them" />
                    <CodeBlock command="xtra project" desc="Manage project linkages and configurations" />
                    <CodeBlock command="xtra local" desc="Locally sync secrets to a .env file for offline development" />
                  </section>

                  {/* Versioning & Rollback */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <FileText className="h-5 w-5 text-primary" /> Versioning & Rollback
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Git-like capabilities for your secrets to ensure safety and track changes.
                    </p>
                    <CodeBlock command="xtra branch" desc="Create and manage ephemeral secret branches" />
                    <CodeBlock command="xtra checkout" desc="Switch your local workspace to a different branch" />
                    <CodeBlock command="xtra diff" desc="View differences between environments or branches" />
                    <CodeBlock command="xtra history" desc="View full version history of a secret or environment" />
                    <CodeBlock command="xtra rollback" desc="Instantly revert an environment to a previous state" />
                  </section>

                  {/* Security & Compliance */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Shield className="h-5 w-5 text-primary" /> Security & Compliance
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Ensure your repositories are clean and track platform activity.
                    </p>
                    <CodeBlock
                      command="xtra scan"
                      desc="Scan your local repository for leaked or hardcoded secrets"
                      options={[
                        { flag: "--staged", desc: "Scan only staged files (for pre-commit hooks)" },
                        { flag: "--install-hook", desc: "Install the git pre-commit hook" }
                      ]}
                    />
                    <CodeBlock command="xtra audit" desc="Run compliance checks against your secret configurations" />
                    <CodeBlock command="xtra access" desc="Request or grant Just-In-Time (JIT) access to specific environments" />
                    <CodeBlock
                      command="xtra rotate"
                      desc="Manually trigger automated secret rotation workflows"
                      options={[
                        { flag: "--strategy <strategy>", desc: "Rotation strategy (e.g., shadow)" },
                        { flag: "--promote", desc: "Promote the shadow value to active" },
                        { flag: "--value <value>", desc: "New value for the secret (optional)" }
                      ]}
                    />
                    <CodeBlock
                      command="xtra logs"
                      desc="View real-time or historical audit logs from your terminal"
                      options={[
                        { flag: "-n, --limit <number>", desc: "Number of logs to show (default: 20)" },
                        { flag: "--event <type>", desc: "Filter by event type (e.g. SECRET_UPDATE)" }
                      ]}
                    />
                  </section>

                  {/* Administration & Integrations */}
                  <section>
                    <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                      <Terminal className="h-5 w-5 text-primary" /> Administration, Import & Utilities
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Tools for advanced users and automation pipelines.
                    </p>
                    <CodeBlock command="xtra admin" desc="Perform workspace administrative functions" />
                    <CodeBlock command="xtra integration" desc="Manage cloud integrations (AWS, Vercel, etc.)" />
                    <CodeBlock command="xtra kubernetes" desc="Generate Kubernetes Secrets manifests" />
                    <CodeBlock command="xtra import" desc="Import secrets from .env files or other formats" />
                    <CodeBlock command="xtra export" desc="Export secrets safely to secure file formats" />
                    <CodeBlock command="xtra ci" desc="Specialized command for headless CI/CD pipelines" />
                    <CodeBlock command="xtra doctor" desc="Diagnose and troubleshoot CLI configuration issues" />
                    <CodeBlock command="xtra interface" desc="Launch the interactive terminal user interface (TUI) Dashboard" />
                    <CodeBlock command="xtra completion" desc="Generate shell autocomplete scripts" />
                  </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NODE SDK TAB */}
          <TabsContent value="sdk" className="space-y-6">
            <Card>
              <CardHeader className="text-center py-16">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Node.js SDK</CardTitle>
                <CardDescription className="text-base mt-2">Comprehensive documentation for <code className="bg-muted px-1.5 py-0.5 rounded">xtra-sdk-node</code> is currently under construction.</CardDescription>
                <div className="mt-6">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Coming Soon
                  </span>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* VS CODE TAB */}
          <TabsContent value="vscode" className="space-y-6">
            <Card>
              <CardHeader className="text-center py-16">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">VS Code Extension</CardTitle>
                <CardDescription className="text-base mt-2">Documentation and guides for our official VS Code extension are currently under construction.</CardDescription>
                <div className="mt-6">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Coming Soon
                  </span>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
