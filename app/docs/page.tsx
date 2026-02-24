"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { BookOpen, Code, Terminal, Shield, Key, FileText, Copy, Check, Search, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type CommandOption = { flag: string; desc: string };
type CommandEntry = { command: string; desc?: string; options?: CommandOption[]; section: string };

// ─── All CLI commands (flat list with section label) ─────────────────────────
const CLI_COMMANDS: CommandEntry[] = [
  // Installation
  { section: "Installation", command: "npm install -g xtra-cli" },
  // Auth & Setup
  { section: "Authentication & Setup", command: "xtra login", desc: "Authenticate with the XtraSecurity platform" },
  { section: "Authentication & Setup", command: "xtra profile", desc: "Manage multiple connection profiles (e.g., personal vs work)", options: [{ flag: "--url <api_url>", desc: "Update the API URL for this profile" }, { flag: "--project <id>", desc: "Update the default project ID" }, { flag: "--token <token>", desc: "Update the authentication token" }] },
  { section: "Authentication & Setup", command: "xtra init", desc: "Bootstrap a new project and create an .xtrarc config file" },
  { section: "Authentication & Setup", command: "xtra status", desc: "View your current authentication and workspace status", options: [{ flag: "-p, --project <id>", desc: "Specify Project ID" }, { flag: "-e, --env <env>", desc: "Specify Environment (e.g., dev, stg, prod)" }, { flag: "-b, --branch <name>", desc: "Specify Branch Name" }] },
  // Runtime Injection
  { section: "Runtime Injection", command: "xtra run <command>", desc: "Run a command with secrets injected (e.g., xtra run npm start)", options: [{ flag: "-e, --env <env>", desc: "Environment (development, staging, production)" }, { flag: "-b, --branch <name>", desc: "Branch Name" }, { flag: "--shell", desc: "Enable shell mode (needed for npm run, shell built-ins on Windows)" }] },
  { section: "Runtime Injection", command: "xtra watch", desc: "Watch for secret changes and restart the application automatically", options: [{ flag: "-e, --env <env>", desc: "Environment to watch" }, { flag: "--interval <seconds>", desc: "Poll interval in seconds (default: 5)" }] },
  { section: "Runtime Injection", command: "xtra simulate", desc: "Simulate a run to see which secrets will be injected", options: [{ flag: "--show-values", desc: "Reveal secret values in output (default: masked)" }, { flag: "--diff", desc: "Highlight secrets that differ from local .env / process.env" }] },
  // Secret Management
  { section: "Secret Management", command: "xtra secrets", desc: "List, set, or delete secrets in an environment", options: [{ flag: "-e, --env <env>", desc: "Environment (development, staging, production)" }, { flag: "--show", desc: "Reveal secret values" }, { flag: "-f, --force", desc: "Force update (overwrite remote changes without warning)" }] },
  { section: "Secret Management", command: "xtra generate", desc: "Generate a secure random secret value" },
  { section: "Secret Management", command: "xtra template", desc: "Render a template file, replacing variables with secret values", options: [{ flag: "-o, --output <file>", desc: "Output file (default: stdout)" }, { flag: "--strict", desc: "Exit with error if any placeholder is unresolved" }] },
  // Environment & Project
  { section: "Environment & Project", command: "xtra env", desc: "Manage environments or clone secrets between them" },
  { section: "Environment & Project", command: "xtra project", desc: "Manage project linkages and configurations" },
  { section: "Environment & Project", command: "xtra local", desc: "Locally sync secrets to a .env file for offline development" },
  // Versioning & Rollback
  { section: "Versioning & Rollback", command: "xtra branch", desc: "Create and manage ephemeral secret branches" },
  { section: "Versioning & Rollback", command: "xtra checkout", desc: "Switch your local workspace to a different branch" },
  { section: "Versioning & Rollback", command: "xtra diff", desc: "View differences between environments or branches" },
  { section: "Versioning & Rollback", command: "xtra history", desc: "View full version history of a secret or environment" },
  { section: "Versioning & Rollback", command: "xtra rollback", desc: "Instantly revert an environment to a previous state" },
  // Security & Compliance
  { section: "Security & Compliance", command: "xtra scan", desc: "Scan your local repository for leaked or hardcoded secrets", options: [{ flag: "--staged", desc: "Scan only staged files (for pre-commit hooks)" }, { flag: "--install-hook", desc: "Install the git pre-commit hook" }] },
  { section: "Security & Compliance", command: "xtra audit", desc: "Run compliance checks against your secret configurations" },
  { section: "Security & Compliance", command: "xtra access", desc: "Request or grant Just-In-Time (JIT) access to specific environments" },
  { section: "Security & Compliance", command: "xtra rotate", desc: "Manually trigger automated secret rotation workflows", options: [{ flag: "--strategy <strategy>", desc: "Rotation strategy (e.g., shadow)" }, { flag: "--promote", desc: "Promote the shadow value to active" }, { flag: "--value <value>", desc: "New value for the secret (optional)" }] },
  { section: "Security & Compliance", command: "xtra logs", desc: "View real-time or historical audit logs from your terminal", options: [{ flag: "-n, --limit <number>", desc: "Number of logs to show (default: 20)" }, { flag: "--event <type>", desc: "Filter by event type (e.g. SECRET_UPDATE)" }] },
  // Admin & Utilities
  { section: "Administration & Utilities", command: "xtra admin", desc: "Perform workspace administrative functions" },
  { section: "Administration & Utilities", command: "xtra integration", desc: "Manage cloud integrations (AWS, Vercel, etc.)" },
  { section: "Administration & Utilities", command: "xtra kubernetes", desc: "Generate Kubernetes Secrets manifests" },
  { section: "Administration & Utilities", command: "xtra import", desc: "Import secrets from .env files or other formats" },
  { section: "Administration & Utilities", command: "xtra export", desc: "Export secrets safely to secure file formats" },
  { section: "Administration & Utilities", command: "xtra ci", desc: "Specialized command for headless CI/CD pipelines" },
  { section: "Administration & Utilities", command: "xtra doctor", desc: "Diagnose and troubleshoot CLI configuration issues" },
  { section: "Administration & Utilities", command: "xtra interface", desc: "Launch the interactive terminal user interface (TUI) Dashboard" },
  { section: "Administration & Utilities", command: "xtra completion", desc: "Generate shell autocomplete scripts" },
];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "Installation": <Terminal className="h-5 w-5 text-primary" />,
  "Authentication & Setup": <Shield className="h-5 w-5 text-primary" />,
  "Runtime Injection": <Terminal className="h-5 w-5 text-primary" />,
  "Secret Management": <Key className="h-5 w-5 text-primary" />,
  "Environment & Project": <BookOpen className="h-5 w-5 text-primary" />,
  "Versioning & Rollback": <FileText className="h-5 w-5 text-primary" />,
  "Security & Compliance": <Shield className="h-5 w-5 text-primary" />,
  "Administration & Utilities": <Terminal className="h-5 w-5 text-primary" />,
};

const ALL_SECTIONS = [...new Set(CLI_COMMANDS.map(c => c.section))];

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  // Filter commands based on search
  const filtered = useMemo(() => {
    if (!search.trim()) return CLI_COMMANDS;
    const q = search.toLowerCase();
    return CLI_COMMANDS.filter(
      c =>
        c.command.toLowerCase().includes(q) ||
        (c.desc && c.desc.toLowerCase().includes(q)) ||
        (c.options?.some(o => o.flag.toLowerCase().includes(q) || o.desc.toLowerCase().includes(q)))
    );
  }, [search]);

  // Group filtered commands by section
  const groupedFiltered = useMemo(() => {
    const map: Record<string, CommandEntry[]> = {};
    for (const cmd of filtered) {
      if (!map[cmd.section]) map[cmd.section] = [];
      map[cmd.section].push(cmd);
    }
    return map;
  }, [filtered]);

  const CodeBlock = ({ command, desc, options }: { command: string; desc?: string; options?: CommandOption[] }) => (
    <div className="mb-6 last:mb-0 group/block relative">
      {desc && <p className="text-[15px] text-muted-foreground mb-3 font-medium">{desc}</p>}
      <div className="relative flex flex-col bg-[#0a0f1e]/80 border border-white/[0.08] hover:border-white/[0.2] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-md">
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
            <TabsTrigger value="cli" className="gap-2 py-2">
              <Terminal className="h-4 w-4" /> CLI Tool
              <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-primary/20 text-primary border-0">
                {CLI_COMMANDS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sdk" className="gap-2 py-2"><FileText className="h-4 w-4" /> Node SDK</TabsTrigger>
            <TabsTrigger value="vscode" className="gap-2 py-2"><Code className="h-4 w-4" /> VS Code</TabsTrigger>
          </TabsList>

          {/* GUIDES TAB */}
          <TabsContent value="guides" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Shield className="h-8 w-8 text-primary mb-2" />, title: "Getting Started", desc: "Basic concepts, initial setup, and workspace configuration." },
                { icon: <Key className="h-8 w-8 text-primary mb-2" />, title: "Secret Management", desc: "How to store, retrieve, and rotate secrets securely." },
                { icon: <FileText className="h-8 w-8 text-primary mb-2" />, title: "Audit Logs", desc: "Tracking platform activity and setting up custom alerts." },
                { icon: <Shield className="h-8 w-8 text-primary mb-2" />, title: "Access Reviews", desc: "Learn how to conduct periodic access certification cycles." },
                { icon: <Key className="h-8 w-8 text-primary mb-2" />, title: "Service Accounts", desc: "Create headless machine identities for API access." },
              ].map((g) => (
                <Card key={g.title} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    {g.icon}
                    <CardTitle>{g.title}</CardTitle>
                    <CardDescription>{g.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CLI TAB */}
          <TabsContent value="cli" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Terminal className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <CardTitle className="text-2xl">XtraSecurity CLI</CardTitle>
                      <CardDescription>The ultimate developer tool for managing and injecting secrets.</CardDescription>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search commands…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-8 h-9 text-sm"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section jump links (only when not searching) */}
                {!search && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {ALL_SECTIONS.map(section => (
                      <a
                        key={section}
                        href={`#cli-${section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {section}
                      </a>
                    ))}
                  </div>
                )}

                {/* Search result count */}
                {search && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {filtered.length === 0
                      ? "No commands match your search."
                      : `${filtered.length} command${filtered.length > 1 ? "s" : ""} found for "${search}"`}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-8">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Terminal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No commands found</p>
                    <p className="text-sm mt-1">Try a different keyword like <code className="bg-muted px-1 rounded">run</code>, <code className="bg-muted px-1 rounded">secrets</code>, or <code className="bg-muted px-1 rounded">rotate</code>.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {Object.entries(groupedFiltered).map(([section, cmds]) => (
                      <section
                        key={section}
                        id={`cli-${section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                      >
                        <h4 className="flex items-center gap-2 text-xl font-bold mb-4 border-b border-border/50 pb-2">
                          {SECTION_ICONS[section] ?? <Terminal className="h-5 w-5 text-primary" />}
                          {section}
                          {search && (
                            <Badge variant="secondary" className="ml-auto text-xs font-normal">
                              {cmds.length} match{cmds.length > 1 ? "es" : ""}
                            </Badge>
                          )}
                        </h4>
                        {cmds.map(cmd => (
                          <CodeBlock key={cmd.command} command={cmd.command} desc={cmd.desc} options={cmd.options} />
                        ))}
                      </section>
                    ))}
                  </div>
                )}
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
                  <Badge variant="secondary">Coming Soon</Badge>
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
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
