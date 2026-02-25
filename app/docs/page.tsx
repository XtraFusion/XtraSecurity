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
  {
    "section": "Installation",
    "command": "npm install -g xtra-cli",
    "desc": "Install the XtraSecurity CLI globally via npm"
  },
  {
    "section": "Security & Compliance",
    "command": "xtra access",
    "desc": "Manage Just-in-Time access requests",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-s, --secret <secretId>",
        "desc": "Specific Secret ID (optional)"
      },
      {
        "flag": "--pending",
        "desc": "Show pending approvals (for admins)"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra admin",
    "desc": "Admin commands for user and role management"
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra admin list",
    "desc": "List all available roles"
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra admin roles",
    "desc": "Alias for 'role list'"
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra admin users",
    "desc": "List all users with their roles",
    "options": [
      {
        "flag": "-t, --team <teamId>",
        "desc": "Filter by team ID"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra admin set-role",
    "desc": "Change a user's role (owner, admin, developer, viewer, guest)",
    "options": [
      {
        "flag": "-t, --team <teamId>",
        "desc": "Team ID (for team-specific role)"
      }
    ]
  },
  {
    "section": "Security & Compliance",
    "command": "xtra audit",
    "desc": "Manage and verify audit logs",
    "options": [
      {
        "flag": "-f, --format <format>",
        "desc": "Output format (json, csv)"
      },
      {
        "flag": "--start <date>",
        "desc": "Start date (YYYY-MM-DD)"
      },
      {
        "flag": "--end <date>",
        "desc": "End date (YYYY-MM-DD)"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file path"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra branch",
    "desc": "Manage branches",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra branch list",
    "desc": "List all branches"
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra branch create",
    "desc": "Create a new branch",
    "options": [
      {
        "flag": "-d, --description <text>",
        "desc": "Description"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra branch delete",
    "desc": "Delete a branch",
    "options": [
      {
        "flag": "-y, --yes",
        "desc": "Skip confirmation prompt"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra branch update",
    "desc": "Update a branch",
    "options": [
      {
        "flag": "-n, --new-name <newName>",
        "desc": "New branch name"
      },
      {
        "flag": "-d, --description <description>",
        "desc": "New description"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra checkout",
    "desc": "Switch the active branch context",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci",
    "desc": "CI/CD headless mode — JSON output, no prompts, XTRA_MACHINE_TOKEN auth"
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci secrets",
    "desc": "Fetch secrets as JSON (pipe-friendly)",
    "options": [
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      },
      {
        "flag": "--keys <keys>",
        "desc": "Comma-separated list of keys to include (default: all)"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci set",
    "desc": "Set one or more secrets in CI mode (KEY=VALUE ...)",
    "options": [
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci export",
    "desc": "Export secrets to a file (dotenv, json, or github-actions format)",
    "options": [
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      },
      {
        "flag": "-f, --format <format>",
        "desc": "Output format: dotenv | json | github"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file path (default: stdout)"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci run",
    "desc": "Run a command with secrets injected as environment variables",
    "options": [
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ci validate",
    "desc": "Validate that XTRA_MACHINE_TOKEN is set and working"
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra completion",
    "desc": "Generate shell completion scripts (bash, zsh, powershell)",
    "options": [
      {
        "flag": "--install",
        "desc": "Automatically install completion into your shell profile"
      }
    ]
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra diff",
    "desc": "Show differences between local cache and remote secrets",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (dev, stg, prod)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      },
      {
        "flag": "--show",
        "desc": "Show actual value differences (sensitive)"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra doctor",
    "desc": "Diagnose CLI configuration and API connectivity",
    "options": [
      {
        "flag": "--json",
        "desc": "Output results as JSON"
      }
    ]
  },
  {
    "section": "Environment & Project",
    "command": "xtra env clone",
    "desc": "Clone secrets from one environment to another",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-b, --branch <name>",
        "desc": "Branch Name"
      },
      {
        "flag": "--overwrite",
        "desc": "Overwrite existing secrets"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra export",
    "desc": "Export secrets to a file (JSON, Dotenv, CSV)",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (development, staging, production)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      },
      {
        "flag": "-f, --format <format>",
        "desc": "Output format (json, dotenv, csv)"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file path (default: stdout)"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra generate",
    "desc": "Generate local configuration files from secrets",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (dev, stg, prod)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      },
      {
        "flag": "-o, --output <path>",
        "desc": "Output file path (forces complete overwrite)"
      },
      {
        "flag": "-f, --format <format>",
        "desc": "Output format (env, json, yaml)"
      },
      {
        "flag": "--force",
        "desc": "Skip confirmation prompts"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra import",
    "desc": "Import secrets from a file (JSON, Dotenv, CSV)",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (development, staging, production)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      },
      {
        "flag": "-f, --format <format>",
        "desc": "Input format (json, dotenv, csv). Auto-detected if omitted."
      },
      {
        "flag": "--prefix <prefix>",
        "desc": "Add prefix to all imported keys"
      },
      {
        "flag": "--overwrite",
        "desc": "Overwrite existing secrets (default: merged, but API usually upserts)"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra init",
    "desc": "Bootstrap a new project — creates .xtrarc and recommended structure",
    "options": [
      {
        "flag": "--project <id>",
        "desc": "Project ID (skip prompt)"
      },
      {
        "flag": "--env <env>",
        "desc": "Default environment"
      },
      {
        "flag": "--branch <branch>",
        "desc": "Default branch"
      },
      {
        "flag": "-y, --yes",
        "desc": "Accept all defaults without prompting"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra integration sync",
    "desc": "Sync secrets to external integrations (GitHub)",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID (defaults to current directory config)"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (development, staging, production)"
      },
      {
        "flag": "--github",
        "desc": "Sync to GitHub"
      },
      {
        "flag": "--repo <owner/repo>",
        "desc": "GitHub repository (e.g., owner/repo)"
      },
      {
        "flag": "--prefix <prefix>",
        "desc": "Prefix for secret keys"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra integration export",
    "desc": "Export secrets as Kubernetes manifest",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "-n, --namespace <namespace>",
        "desc": "Kubernetes namespace"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file path"
      },
      {
        "flag": "--name <name>",
        "desc": "Secret resource name"
      }
    ]
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra integration apply",
    "desc": "Apply secrets directly to Kubernetes cluster (requires kubectl)",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "-n, --namespace <namespace>",
        "desc": "Kubernetes namespace"
      }
    ]
  },
  {
    "section": "Environment & Project",
    "command": "xtra local",
    "desc": "Toggle cloud/local mode for offline development"
  },
  {
    "section": "Environment & Project",
    "command": "xtra local status",
    "desc": "Show current cloud/local mode"
  },
  {
    "section": "Environment & Project",
    "command": "xtra local on",
    "desc": "Enable local mode — secrets read from .env.local"
  },
  {
    "section": "Environment & Project",
    "command": "xtra local off",
    "desc": "Disable local mode — secrets fetched from cloud again"
  },
  {
    "section": "Environment & Project",
    "command": "xtra local sync",
    "desc": "Pull cloud secrets to .env.local for offline use",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file"
      },
      {
        "flag": "--overwrite",
        "desc": "Overwrite existing file without prompt"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra login",
    "desc": "Authenticate with XtraSecurity",
    "options": [
      {
        "flag": "-k, --key <key>",
        "desc": "Login using an Access Key"
      },
      {
        "flag": "-e, --email <email>",
        "desc": "Login using Email"
      },
      {
        "flag": "--sso",
        "desc": "Login via Web (SSO)"
      }
    ]
  },
  {
    "section": "Security & Compliance",
    "command": "xtra logs",
    "desc": "View local audit logs",
    "options": [
      {
        "flag": "-n, --limit <number>",
        "desc": "Number of logs to show"
      },
      {
        "flag": "--sync",
        "desc": "Sync logs to cloud"
      },
      {
        "flag": "--event <type>",
        "desc": "Filter by event type (e.g. SECRET_UPDATE, SECRET_ROTATE)"
      },
      {
        "flag": "--project <projectId>",
        "desc": "Filter by project ID"
      },
      {
        "flag": "--since <duration>",
        "desc": "Show logs since (e.g. 1h, 24h, 7d, 30d)"
      },
      {
        "flag": "--json",
        "desc": "Output raw JSON instead of table"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile",
    "desc": "Manage named configuration profiles (token, apiUrl, project per profile)"
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile list",
    "desc": "List all saved profiles"
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile create",
    "desc": "Create a new profile",
    "options": [
      {
        "flag": "--url <apiUrl>",
        "desc": "XtraSecurity API URL for this profile"
      },
      {
        "flag": "--project <projectId>",
        "desc": "Default project ID for this profile"
      },
      {
        "flag": "--token <token>",
        "desc": "Auth token for this profile"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile use",
    "desc": "Switch to a different profile (persists across sessions)"
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile set",
    "desc": "Update a value in an existing profile",
    "options": [
      {
        "flag": "--url <apiUrl>",
        "desc": "Update the API URL"
      },
      {
        "flag": "--project <projectId>",
        "desc": "Update the default project ID"
      },
      {
        "flag": "--token <token>",
        "desc": "Update the auth token"
      },
      {
        "flag": "--env <environment>",
        "desc": "Update the default environment"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile current",
    "desc": "Show the currently active profile"
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra profile delete",
    "desc": "Delete a profile",
    "options": [
      {
        "flag": "-y, --yes",
        "desc": "Skip confirmation prompt"
      }
    ]
  },
  {
    "section": "Environment & Project",
    "command": "xtra project set",
    "desc": "Set the default project ID"
  },
  {
    "section": "Environment & Project",
    "command": "xtra project current",
    "desc": "Show the current default project"
  },
  {
    "section": "Versioning & Rollback",
    "command": "xtra rollback",
    "desc": "Rollback a secret to a previous version",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (dev, stg, prod)"
      }
    ]
  },
  {
    "section": "Security & Compliance",
    "command": "xtra rotate",
    "desc": "Rotate a secret (Zero-Downtime Shadow Mode)",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "--strategy <strategy>",
        "desc": "Rotation strategy"
      },
      {
        "flag": "--promote",
        "desc": "Promote the shadow value to active"
      },
      {
        "flag": "--value <value>",
        "desc": "New value for the secret (optional)"
      }
    ]
  },
  {
    "section": "Runtime Injection",
    "command": "xtra run",
    "desc": "Run a command with injected secrets",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (development, staging, production)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      },
      {
        "flag": "--shell",
        "desc": "Enable shell mode (needed for npm run, shell built-ins on Windows)"
      }
    ]
  },
  {
    "section": "Security & Compliance",
    "command": "xtra scan",
    "desc": "Scan project for secrets and configuration leaks",
    "options": [
      {
        "flag": "--staged",
        "desc": "Scan only staged files (for pre-commit hooks)"
      },
      {
        "flag": "--install-hook",
        "desc": "Install the git pre-commit hook"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra secrets",
    "desc": "Manage secrets (List, Set, Delete)",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (development, staging, production)"
      },
      {
        "flag": "-b, --branch <branchName>",
        "desc": "Branch Name"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra secrets list",
    "desc": "List all secrets for a project/environment",
    "options": [
      {
        "flag": "--show",
        "desc": "Reveal secret values"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra secrets set",
    "desc": "Set one or more secrets (KEY=VALUE)",
    "options": [
      {
        "flag": "-f, --force",
        "desc": "Force update (overwrite remote changes without warning)"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra secrets link",
    "desc": "Link a secret to another secret (Reference)"
  },
  {
    "section": "Runtime Injection",
    "command": "xtra simulate",
    "desc": "Dry-run: show what 'xtra run' would inject without executing the command",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch"
      },
      {
        "flag": "--show-values",
        "desc": "Reveal secret values in output (default: masked)"
      },
      {
        "flag": "--diff",
        "desc": "Highlight secrets that differ from local .env / process.env"
      }
    ]
  },
  {
    "section": "Authentication & Setup",
    "command": "xtra status",
    "desc": "View your current authentication and workspace status",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Specify Project ID"
      },
      {
        "flag": "-e, --env <env>",
        "desc": "Specify Environment (e.g., dev, stg, prod)"
      },
      {
        "flag": "-b, --branch <name>",
        "desc": "Specify Branch Name"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra template render",
    "desc": "Render a template file by injecting secrets and environment variables",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment (default: development)"
      },
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      },
      {
        "flag": "-o, --output <file>",
        "desc": "Output file (default: stdout)"
      },
      {
        "flag": "--strict",
        "desc": "Exit with error if any placeholder is unresolved"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra template check",
    "desc": "Validate that all template placeholders have matching secrets (dry-run)",
    "options": [
      {
        "flag": "-p, --project <id>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment"
      },
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch name"
      }
    ]
  },
  {
    "section": "Secret Management",
    "command": "xtra template list",
    "desc": "List all placeholders found in a template file (no API call needed)"
  },
  {
    "section": "Administration & Utilities",
    "command": "xtra ui",
    "desc": "Launch the interactive Terminal User Interface (TUI) Dashboard"
  },
  {
    "section": "Runtime Injection",
    "command": "xtra watch",
    "desc": "Live reload — auto-restart process when secrets change in cloud",
    "options": [
      {
        "flag": "-e, --env <environment>",
        "desc": "Environment to watch"
      },
      {
        "flag": "-b, --branch <branch>",
        "desc": "Branch to watch"
      },
      {
        "flag": "--interval <seconds>",
        "desc": "Poll interval in seconds (default: 5)"
      },
      {
        "flag": "--shell",
        "desc": "Use shell mode for the child process (for npm run etc.)"
      }
    ]
  }
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
