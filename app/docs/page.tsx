"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { BookOpen, Code, Terminal, Shield, Key, FileText, Copy, Check, Search, X } from "lucide-react";
// import { DocumentationChatbot } from "@/components/documentation-chatbot"; // TODO: Implement on separate docs page

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
    "desc": "Switch the active branch and environment context",
    "options": [
      {
        "flag": "-p, --project <projectId>",
        "desc": "Project ID"
      },
      {
        "flag": "-e, --env <environment>",
        "desc": "Set the active environment (e.g. development, staging, production)"
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
    <div className="mb-4 last:mb-0 border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors">
      {desc && <p className="text-sm text-muted-foreground mb-2 font-medium">{desc}</p>}
      <div className="flex items-center justify-between gap-2">
        <code className="text-sm font-mono text-foreground flex-1 break-all">
          {command}
        </code>
        <button
          onClick={() => handleCopy(command)}
          className="p-2 rounded-md hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0"
          title="Copy command"
        >
          {copied === command ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {options && options.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</div>
          <ul className="space-y-1.5">
            {options.map((opt, i) => (
              <li key={i} className="flex flex-col text-xs leading-relaxed">
                <code className="font-mono text-foreground mb-0.5">{opt.flag}</code>
                <span className="text-muted-foreground">{opt.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Documentation</h1>
              <p className="text-muted-foreground text-sm">XtraSecurity CLI commands, guides, and references</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="guides" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="guides"><BookOpen className="h-4 w-4 mr-2" />Guides</TabsTrigger>
            <TabsTrigger value="cli">
              <Terminal className="h-4 w-4 mr-2" />CLI
              <Badge variant="outline" className="ml-2">
                {CLI_COMMANDS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sdk"><FileText className="h-4 w-4 mr-2" />SDK</TabsTrigger>
            <TabsTrigger value="vscode"><Code className="h-4 w-4 mr-2" />VS Code</TabsTrigger>
          </TabsList>

          {/* GUIDES TAB */}
          <TabsContent value="guides" className="space-y-6">
            {/* GETTING STARTED SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Getting Started</h2>
                  <p className="text-sm text-muted-foreground">Follow these steps to set up XtraSecurity in your environment</p>
                </div>
              </div>

              {/* STEP-BY-STEP GUIDE */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: 1,
                    title: "Install XtraSecurity",
                    items: [
                      "Install the CLI globally",
                      "npm install -g xtra-cli",
                      "Verify installation",
                    ]
                  },
                  {
                    step: 2,
                    title: "Create Your Profile",
                    items: [
                      "Authenticate with your account",
                      "Set up your access credentials",
                      "Configure default values",
                    ]
                  },
                  {
                    step: 3,
                    title: "Initialize a Project",
                    items: [
                      "Run xtra init",
                      "Link your project ID",
                      "Choose your environment",
                    ]
                  },
                  {
                    step: 4,
                    title: "Start Managing Secrets",
                    items: [
                      "Create your first secret",
                      "Set up secret rotation",
                      "Configure access controls",
                    ]
                  },
                ].map((item) => (
                  <Card key={item.step} className="hover:shadow-md transition-shadow hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </div>
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {item.items.map((listItem, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-semibold">•</span>
                            <span>{listItem}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* COMPREHENSIVE GUIDES */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Comprehensive Guides</h2>
                  <p className="text-sm text-muted-foreground">Deep dive into specific features and workflows</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    icon: <Key className="h-6 w-6" />,
                    color: "from-green-500/10 to-emerald-500/10",
                    title: "Secret Management",
                    desc: "How to store, retrieve, rotate, and manage secrets securely",
                    steps: [
                      "Create and configure secrets",
                      "Set up automatic rotation policies",
                      "Use shadow mode for zero-downtime rotation",
                      "Track secret history and versions",
                      "Export and import secrets in bulk",
                    ]
                  },
                  {
                    icon: <Shield className="h-6 w-6" />,
                    color: "from-purple-500/10 to-pink-500/10",
                    title: "Access Control & JIT",
                    desc: "Implement Just-in-Time access and sophisticated permission management",
                    steps: [
                      "Set up Just-in-Time access requests",
                      "Configure access approval workflows",
                      "Review and audit access requests",
                      "Set up time-based access expiration",
                      "Integrate with your identity provider",
                    ]
                  },
                  {
                    icon: <FileText className="h-6 w-6" />,
                    color: "from-blue-500/10 to-cyan-500/10",
                    title: "Audit & Compliance",
                    desc: "Track all activity, maintain compliance, and enable forensic analysis",
                    steps: [
                      "Enable comprehensive audit logging",
                      "Set up compliance reports",
                      "Configure data retention policies",
                      "Export audit logs for analysis",
                      "Set up real-time alerts for compliance violations",
                    ]
                  },
                  {
                    icon: <Terminal className="h-6 w-6" />,
                    color: "from-orange-500/10 to-red-500/10",
                    title: "CI/CD Integration",
                    desc: "Integrate XtraSecurity into your deployment and automation pipelines",
                    steps: [
                      "Set up machine tokens for CI/CD",
                      "Configure secret injection in pipelines",
                      "Use headless mode for automation",
                      "Implement automated secret rotation",
                      "Set up scanning for secret leaks",
                    ]
                  },
                  {
                    icon: <BookOpen className="h-6 w-6" />,
                    color: "from-indigo-500/10 to-blue-500/10",
                    title: "Service Accounts",
                    desc: "Create and manage API access for automated processes",
                    steps: [
                      "Create service account identities",
                      "Generate and rotate API keys",
                      "Configure role-based permissions",
                      "Set up audit logging for service accounts",
                      "Implement least privilege access",
                    ]
                  },
                  {
                    icon: <Terminal className="h-6 w-6" />,
                    color: "from-teal-500/10 to-green-500/10",
                    title: "Command Line Workflows",
                    desc: "Master CLI commands for efficient secret management",
                    steps: [
                      "Master basic commands (init, set, get)",
                      "Use branching for environment management",
                      "Implement secret rotation workflows",
                      "Set up pre-commit hooks for scanning",
                      "Handle error cases and troubleshooting",
                    ]
                  },
                ].map((guide) => (
                  <Card key={guide.title} className={`hover:shadow-lg transition-all hover:border-primary/50 bg-gradient-to-br ${guide.color} border-l-4 border-l-primary`}>
                    <CardHeader>
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-background">
                          {guide.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle>{guide.title}</CardTitle>
                          <CardDescription className="mt-1">{guide.desc}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Topics</div>
                        <ul className="space-y-2">
                          {guide.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary flex-shrink-0 text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <span className="text-muted-foreground pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* QUICK REFERENCE */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Terminal className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Quick Reference</h2>
                  <p className="text-sm text-muted-foreground">Common commands and workflows for daily tasks</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Authentication",
                    commands: [
                      { cmd: "xtra profile create", desc: "Create a new profile" },
                      { cmd: "xtra profile current", desc: "Show active profile" },
                      { cmd: "xtra profile delete", desc: "Delete a profile" },
                    ]
                  },
                  {
                    title: "Project Setup",
                    commands: [
                      { cmd: "xtra init", desc: "Initialize a new project" },
                      { cmd: "xtra project set <id>", desc: "Set default project" },
                      { cmd: "xtra project current", desc: "Show current project" },
                    ]
                  },
                  {
                    title: "Secret Operations",
                    commands: [
                      { cmd: "xtra set <key> <value>", desc: "Create a secret" },
                      { cmd: "xtra get <key>", desc: "Retrieve a secret" },
                      { cmd: "xtra delete <key>", desc: "Delete a secret" },
                    ]
                  },
                ].map((section) => (
                  <Card key={section.title}>
                    <CardHeader>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.commands.map((item, idx) => (
                        <div key={idx} className="border-b pb-2.5 last:border-b-0 last:pb-0">
                          <div className="bg-muted px-3 py-2 rounded font-mono text-xs text-foreground mb-1 break-all">
                            {item.cmd}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* BEST PRACTICES */}
            <Card className="border-amber-500/30 bg-amber-50/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-amber-600 text-xs">Best Practices</Badge>
                  Security & Performance Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: "🔐 Security",
                      items: [
                        "Rotate secrets regularly (recommended: every 90 days)",
                        "Use dedicated service accounts for CI/CD pipelines",
                        "Enable MFA for all administrative accounts",
                        "Regularly audit access logs for unauthorized activities",
                        "Use JIT access for sensitive operations",
                      ]
                    },
                    {
                      title: "⚡ Performance",
                      items: [
                        "Use caching for frequently accessed secrets",
                        "Batch imports/exports for large secret sets",
                        "Configure appropriate rotation windows",
                        "Use branching to organize environments",
                        "Implement automated secret scanning in CI/CD",
                      ]
                    },
                  ].map((section) => (
                    <div key={section.title} className="space-y-3">
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                            <span className="text-primary flex-shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLI TAB */}
          <TabsContent value="cli" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Terminal className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <CardTitle>XtraSecurity CLI</CardTitle>
                      <CardDescription>Complete command reference for the CLI tool</CardDescription>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-80">
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
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {ALL_SECTIONS.map(section => (
                      <a
                        key={section}
                        href={`#cli-${section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                        className="text-xs px-2.5 py-1 rounded-md border border-border bg-muted hover:bg-accent transition-colors"
                      >
                        {section}
                      </a>
                    ))}
                  </div>
                )}

                {/* Search result count */}
                {search && (
                  <p className="text-xs text-muted-foreground pt-2">
                    {filtered.length === 0
                      ? "No commands found."
                      : `${filtered.length} command${filtered.length > 1 ? "s" : ""} found`}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Terminal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No commands found</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedFiltered).map(([section, cmds]) => (
                      <section
                        key={section}
                        id={`cli-${section.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                      >
                        <h4 className="flex items-center gap-2 text-lg font-semibold mb-3 border-b pb-2">
                          {SECTION_ICONS[section] ?? <Terminal className="h-4 w-4 text-primary" />}
                          {section}
                          {search && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {cmds.length}
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
          <TabsContent value="sdk" className="space-y-4">
            <Card>
              <CardHeader className="text-center py-12">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Node.js SDK</CardTitle>
                <CardDescription>Documentation for xtra-sdk-node is under construction</CardDescription>
                <div className="mt-4">
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          {/* VS CODE TAB */}
          <TabsContent value="vscode" className="space-y-4">
            <Card>
              <CardHeader className="text-center py-12">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>VS Code Extension</CardTitle>
                <CardDescription>Documentation for our VS Code extension is under construction</CardDescription>
                <div className="mt-4">
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
