"use client";

import { useState, useMemo } from "react";
import { PremiumCallout } from "@/components/docs/PremiumCallout";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, Shield, Workflow, Key, Layers, Code2, Bolt, Database, GitBranch, Search, ChevronRight, Copy, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CommandOption {
  flag: string;
  desc: string;
}

interface CommandExample {
  language: string;
  code: string;
}

interface CliCommand {
  name: string;
  syntax: string;
  desc: string;
  promptOutput?: string;
  explanation?: string;
  examples?: CommandExample[];
  options?: CommandOption[];
}

interface CliSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  commands: CliCommand[];
}

const CLI_SECTIONS: CliSection[] = [
  {
    id: "core-workflow",
    title: "Core Workflow",
    icon: Workflow,
    description: "Essential commands for bootstrapping projects and injecting secrets.",
    commands: [
      {
        name: "init",
        syntax: "xtra init [options]",
        desc: "Bootstraps a new project by creating an .xtrarc config file and linking it to the cloud.",
        promptOutput: "What is your project named? my-project\nWould you like to link an existing XtraSecurity project?\n> Yes, link existing project\n  No, create a new project",
        explanation: "After the prompts, xtra init will create an .xtrarc file in your directory and authenticate your environment.",
        examples: [{ language: "Terminal", code: "xtra init --project prj_abc123 -y" }],
        options: [
          { flag: "-y, --yes", desc: "Skip interactive prompts" },
          { flag: "--project <id>", desc: "Specify existing project ID" }
        ]
      },
      {
        name: "login",
        syntax: "xtra login [options]",
        desc: "Authenticates your CLI session. Opens browser for SSO by default.",
        promptOutput: "> Opening browser to https://xtrasecurity.com/auth/device\n> Successfully authenticated as user@example.com",
        explanation: "This command securely stores a session token in your local OS keychain.",
        examples: [{ language: "Headless", code: "xtra login --key xs_prod_123456789" }],
        options: [
          { flag: "--sso", desc: "Force SSO flow" },
          { flag: "--key <token>", desc: "Machine identity authentication for CI/CD" }
        ]
      },
      {
        name: "logout",
        syntax: "xtra logout",
        desc: "Terminates session and securely purges all local encrypted caches.",
        promptOutput: "> Successfully logged out.\n> Local caches securely purged.",
        explanation: "This removes your session token and clears any local fallback secrets to ensure complete security.",
        examples: [{ language: "Terminal", code: "xtra logout" }]
      },
      {
        name: "run",
        syntax: "xtra run [options] <command> [args...]",
        desc: "Fetches secrets and injects them securely into a child process memory.",
        explanation: "This is the most common command. It securely fetches your environment variables and runs the specified child process (e.g. your dev server) without writing secrets to the disk.",
        examples: [{ language: "Terminal", code: "xtra run --env production -- npm run start" }],
        options: [
          { flag: "--env <name>", desc: "Target environment (e.g., production)" },
          { flag: "--project <id>", desc: "Override .xtrarc project context" }
        ]
      },
      {
        name: "secrets",
        syntax: "xtra secrets <command> [options]",
        desc: "Manage secrets. Subcommands: ls, get, set, rm.",
        examples: [
          { language: "Set", code: "xtra secrets set API_KEY [VALUE]" },
          { language: "Get", code: "xtra secrets get STRIPE_KEY" }
        ],
        options: [
          { flag: "--env <name>", desc: "Target environment" },
          { flag: "--json", desc: "JSON output for 'ls'" },
          { flag: "-y, --yes", desc: "Skip confirmation for 'rm'" }
        ]
      }
    ]
  },
  {
    id: "environments-context",
    title: "Environments & Context",
    icon: GitBranch,
    description: "Manage project contexts, environments, and secret branching.",
    commands: [
      {
        name: "project",
        syntax: "xtra project <command> [options]",
        desc: "Manage and list project contexts.",
        explanation: "Lists all projects you have access to, or modifies the active project link.",
        examples: [{ language: "List", code: "xtra project ls --json" }]
      },
      {
        name: "env",
        syntax: "xtra env <command> [options]",
        desc: "List and manage environments within the active project.",
        explanation: "Lists or modifies environments like staging, dev, prod.",
        examples: [{ language: "List", code: "xtra env ls" }]
      },
      {
        name: "branch",
        syntax: "xtra branch <command> [options]",
        desc: "Create and list isolated secret branches for feature development.",
        explanation: "Secret branching works just like git branching. It isolates your secret changes before merging them to the main environment.",
        examples: [{ language: "Create", code: "xtra branch create feat/new-payment-gateway" }]
      },
      {
        name: "checkout",
        syntax: "xtra checkout [options] [branchName]",
        desc: "Switch the active branch context. All subsequent 'xtra run' commands will pull from this branch.",
        promptOutput: "> Switched to branch 'feat/new-payment-gateway'\n> 14 secrets loaded in local context.",
        explanation: "Sets the active branch context for your current terminal session.",
        examples: [{ language: "Switch", code: "xtra checkout feat/new-payment-gateway" }]
      },
      {
        name: "profile",
        syntax: "xtra profile <command> [options]",
        desc: "Manage named configuration profiles for multiple XtraSecurity instances.",
        explanation: "Useful when switching between personal and work accounts without logging out.",
        examples: [{ language: "Use", code: "xtra profile use personal" }]
      },
      {
        name: "local",
        syntax: "xtra local <command>",
        desc: "Toggle cloud/local mode for offline development. Uses fallback .env if cloud is unreachable.",
        explanation: "Enables a fallback for offline development. If the cloud is unreachable, it will use a locally cached, encrypted fallback.",
        examples: [{ language: "Terminal", code: "xtra local enable" }]
      }
    ]
  },
  {
    id: "advanced-execution",
    title: "Advanced Execution",
    icon: Bolt,
    description: "Powerful developer experience features for live-reloading and dry-runs.",
    commands: [
      {
        name: "watch",
        syntax: "xtra watch [options] <command> [args...]",
        desc: "Live reload. Automatically restarts your child process whenever secrets change in the cloud.",
        explanation: "Great for hot-reloading frontend apps when a teammate updates a shared secret.",
        examples: [{ language: "Terminal", code: "xtra watch -- npm run dev" }]
      },
      {
        name: "simulate",
        syntax: "xtra simulate [options] [command]",
        desc: "Dry-run mode. Shows exactly what variables would be injected without executing the actual command.",
        promptOutput: "> STRIPE_KEY=sk_test_***\n> DB_URL=postgres://***\n> 2 variables would be injected. Process execution skipped.",
        explanation: "Verify your injection pipeline without side effects.",
        examples: [{ language: "Terminal", code: "xtra simulate -- npm run build" }]
      },
      {
        name: "ui",
        syntax: "xtra ui",
        desc: "Launches an interactive, terminal-based (TUI) secrets dashboard.",
        explanation: "Provides a rich, interactive terminal UI if you prefer not to use the web interface.",
        examples: [{ language: "Terminal", code: "xtra ui" }]
      },
      {
        name: "ci",
        syntax: "xtra ci <command> [options]",
        desc: "Strict headless mode tailored for CI/CD pipelines. Disables all interactive prompts.",
        explanation: "Bypasses all prompts, failing immediately on errors. Perfect for GitHub Actions or GitLab CI.",
        examples: [{ language: "CI Pipeline", code: "xtra ci run -- npm test" }]
      },
      {
        name: "completion",
        syntax: "xtra completion [options] [shell]",
        desc: "Generate auto-completion scripts for your shell (bash, zsh, powershell).",
        explanation: "Install autocomplete for your specific shell to speed up your workflow.",
        examples: [{ language: "Zsh", code: "xtra completion zsh > ~/.xtra-completion" }]
      }
    ]
  },
  {
    id: "security-compliance",
    title: "Security & Compliance",
    icon: Shield,
    description: "Auditing, zero-downtime rotation, and Just-In-Time access controls.",
    commands: [
      {
        name: "access",
        syntax: "xtra access <command> [options]",
        desc: "Submit a Just-In-Time (JIT) access request for a sensitive environment.",
        promptOutput: "Requesting JIT access for Production...\n> Request sent to admins.\n> Approved by admin@company.com\n> Access granted for 1h.",
        explanation: "This workflow integrates directly with your team's Slack or email approvals.",
        examples: [{ language: "Request", code: "xtra access request --env prod --reason \"Debug\" --duration 1h" }]
      },
      {
        name: "audit / logs",
        syntax: "xtra logs [options]",
        desc: "View cryptographically verified audit logs for secret access and modifications.",
        explanation: "Fetches tamper-proof audit trails from the server for compliance reporting.",
        examples: [{ language: "Terminal", code: "xtra logs --days 7" }]
      },
      {
        name: "scan",
        syntax: "xtra scan [options]",
        desc: "Scan your local codebase for hardcoded secrets or misconfigured .env files.",
        promptOutput: "> Scanning .\n> Found 1 exposed AWS key in .env.local\n> Action Required: Rotate immediately",
        explanation: "Detects over 100+ patterns of exposed secrets before you commit them.",
        examples: [{ language: "Terminal", code: "xtra scan . --strict" }]
      },
      {
        name: "history",
        syntax: "xtra history [options] <key>",
        desc: "View the version history of a specific secret.",
        explanation: "View past versions, who changed them, and when they were changed.",
        examples: [{ language: "Terminal", code: "xtra history DATABASE_URL" }]
      },
      {
        name: "rollback",
        syntax: "xtra rollback [options] <key>",
        desc: "Instantly revert a secret to a previous version.",
        explanation: "Immediately restore a prior version if a bad secret deployment breaks production.",
        examples: [{ language: "Terminal", code: "xtra rollback STRIPE_KEY --version 3" }]
      },
      {
        name: "rotate",
        syntax: "xtra rotate [options] <key>",
        desc: "Zero-Downtime Shadow Mode rotation. Updates a secret and slowly drains traffic from the old one.",
        explanation: "Perform zero-downtime rotation. Extremely useful for high-availability database credential rotation.",
        examples: [{ language: "Terminal", code: "xtra rotate AWS_ACCESS_KEY" }]
      }
    ]
  },
  {
    id: "utility-ecosystem",
    title: "Utility & Ecosystem",
    icon: Database,
    description: "Exporting, templating, and diagnosing connectivity issues.",
    commands: [
      {
        name: "export",
        syntax: "xtra export [options]",
        desc: "Bulk migrate secrets in various formats (JSON, Dotenv, CSV).",
        explanation: "Backup your secrets or migrate them locally.",
        examples: [{ language: "Terminal", code: "xtra export --format dotenv > .env.backup" }]
      },
      {
        name: "import",
        syntax: "xtra import [options] <file>",
        desc: "Bulk import secrets from a file.",
        explanation: "Upload multiple secrets at once from existing dotenv files.",
        examples: [{ language: "Terminal", code: "xtra import --format dotenv .env.backup" }]
      },
      {
        name: "template / generate",
        syntax: "xtra template [options]",
        desc: "Secret templating engine. Injects secrets into static configuration files (e.g., docker-compose.yml).",
        explanation: "Inject secrets into a static template file before deployment.",
        examples: [{ language: "Terminal", code: "xtra template ./config.tpl.yaml > ./config.yaml" }]
      },
      {
        name: "diff",
        syntax: "xtra diff [options] [env1] [env2]",
        desc: "Compare secrets between two environments or between local cache and remote.",
        explanation: "See exactly what changed between staging and production environments.",
        examples: [{ language: "Terminal", code: "xtra diff staging production" }]
      },
      {
        name: "doctor",
        syntax: "xtra doctor [options]",
        desc: "Diagnose common setup issues, network connectivity, and token validity.",
        promptOutput: "> Checking connection... OK\n> Verifying token... OK\n> Checking workspace context... OK\n\nAll systems operational.",
        explanation: "Run this command first if you're experiencing any authentication or network issues.",
        examples: [{ language: "Terminal", code: "xtra doctor" }]
      }
    ]
  }
];

export default function CliDocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter sections and commands based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return CLI_SECTIONS;
    
    const query = searchQuery.toLowerCase();
    return CLI_SECTIONS.map(section => {
      const filteredCommands = section.commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.desc.toLowerCase().includes(query) ||
        cmd.syntax.toLowerCase().includes(query)
      );
      
      return {
        ...section,
        commands: filteredCommands
      };
    }).filter(section => section.commands.length > 0);
  }, [searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
      
      {/* Header Area */}
      <div className="mb-16">
        <Link href="/docs" className="inline-block mb-10">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] font-semibold tracking-tight text-primary mb-4">
              <Terminal className="h-3.5 w-3.5" />
              CLI Reference
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              XtraSecurity CLI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Complete reference for all 32+ commands. Search below to find specific syntax, options, and usage examples.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-80 relative group shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
              placeholder="Search commands (e.g. 'rotate', 'jit')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 min-w-0">
          {/* Global Installation */}
          {!searchQuery && (
        <section className="mb-20">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-card to-background border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" /> Installation
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 text-muted-foreground text-sm leading-relaxed space-y-4">
                <p>
                  The CLI is distributed as an npm package. You can install it globally using your preferred package manager.
                </p>
                <PremiumCallout type="info" title="Verify Installation">
                  Run <code className="text-xs font-mono font-bold text-foreground">xtra --version</code> to ensure the CLI is correctly installed.
                </PremiumCallout>
              </div>
              <div className="flex-1">
                <PremiumCodeBlock 
                  options={[
                    { language: "npm", code: "npm install -g xtra-cli", filename: "Terminal" },
                    { language: "yarn", code: "yarn global add xtra-cli", filename: "Terminal" },
                    { language: "pnpm", code: "pnpm add -g xtra-cli", filename: "Terminal" },
                  ]} 
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results / Empty State */}
      {searchQuery && filteredSections.length === 0 && (
        <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-muted/10">
          <Terminal className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No commands found</h3>
          <p className="text-muted-foreground">Try adjusting your search query.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSearchQuery("")}>Clear Search</Button>
        </div>
      )}

      {/* Dynamic Sections */}
      <div className="space-y-24">
        <AnimatePresence>
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.section 
                key={section.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="scroll-mt-24" 
                id={section.id}
              >
                <div className="mb-8 border-b border-border pb-4">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground pl-10">{section.description}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {section.commands.map((cmd) => (
                    <div key={cmd.name} id={`cmd-${cmd.name}`} className="py-12 border-b border-border/20 last:border-0 scroll-mt-24">
                      
                      {/* Command Header */}
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-2 text-foreground font-bold text-2xl mb-3">
                          xtra {cmd.name}
                        </div>
                        <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
                          {cmd.desc}
                        </p>
                      </div>

                      {/* Syntax Code Block */}
                      <div className="mb-8 max-w-4xl">
                        <PremiumCodeBlock 
                          options={[{ language: "Terminal", code: cmd.syntax }]} 
                        />
                      </div>

                      {/* Interactive Prompts / Output */}
                      {cmd.promptOutput && (
                        <div className="mb-8 max-w-4xl">
                          <p className="text-foreground font-medium mb-4">On execution, you'll see the following prompts:</p>
                          <PremiumCodeBlock 
                            options={[{ language: "Terminal", code: cmd.promptOutput }]} 
                          />
                        </div>
                      )}

                      {/* Explanation */}
                      {cmd.explanation && (
                        <div className="mb-8 max-w-3xl">
                          <p className="text-muted-foreground leading-relaxed">
                            {cmd.explanation}
                          </p>
                        </div>
                      )}

                      {/* Options Table */}
                      {cmd.options && cmd.options.length > 0 && (
                        <div className="space-y-4 max-w-4xl">
                          <h4 className="text-sm font-bold text-foreground">Options</h4>
                          <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
                            <Table>
                              <TableBody>
                                {cmd.options.map((opt, i) => (
                                  <TableRow key={i} className="hover:bg-muted/10 border-border/50">
                                    <TableCell className="font-mono text-xs font-semibold py-3.5 whitespace-nowrap w-[200px] text-foreground">
                                      {opt.flag}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground py-3.5">
                                      {opt.desc}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Examples (if different from syntax) */}
                      {cmd.examples && cmd.examples.length > 0 && (
                        <div className="mt-8 space-y-4 max-w-4xl">
                          <h4 className="text-sm font-bold text-foreground">Examples</h4>
                          <PremiumCodeBlock options={cmd.examples} />
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </AnimatePresence>
      </div>
        </div>

        {/* Right Sidebar (Table of Contents) */}
        {!searchQuery && (
          <div className="hidden xl:block w-64 shrink-0 pl-6 xl:border-l border-border/50">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 pb-10 custom-scrollbar">
              <h4 className="text-sm font-bold text-foreground mb-4">On this page</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {CLI_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="hover:text-foreground font-semibold transition-colors">
                      {section.title}
                    </a>
                    <ul className="pl-3 mt-2.5 space-y-2 border-l border-border/50">
                      {section.commands.map((cmd) => (
                        <li key={cmd.name}>
                          <a 
                            href={`#cmd-${cmd.name}`} 
                            className="hover:text-foreground text-xs font-mono transition-colors block -ml-[1px] pl-3 border-l border-transparent hover:border-primary text-muted-foreground/80 hover:text-foreground"
                          >
                            xtra {cmd.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
