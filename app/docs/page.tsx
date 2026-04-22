"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
    BookOpen, 
    Code, 
    Terminal, 
    Shield, 
    Key, 
    FileText, 
    Copy, 
    Check, 
    Search, 
    X,
    ChevronRight,
    Zap,
    ExternalLink,
    Box,
    Cloud,
    Lock,
    Command,
    Info,
    AlertTriangle,
    CheckCircle2,
    Monitor,
    Smartphone,
    Laptop,
    Server,
    Cpu,
    Workflow,
    Activity,
    Layers,
    ArrowRight,
    Globe,
    Github,
    Container,
    GitBranch,
    RefreshCw,
    Play,
    LogIn,
    Settings,
    Users,
    ChevronDown,
    ChevronUp,
    Blocks,
    Package,
    Eye,
    Puzzle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

type CommandOption = { flag: string; desc: string; required?: boolean };
type CommandEntry = { 
    name: string;
    command: string; 
    description: string;
    longDesc?: string;
    example?: string;
    options?: CommandOption[];
    section: string;
    sectionColor?: string;
    icon?: any;
    subcommands?: SubCommandEntry[];
};

type SubCommandEntry = {
    name: string;
    command: string;
    description: string;
    example?: string;
    options?: CommandOption[];
};

type DocSection = "quickstart" | "cli" | "sdks" | "integrations" | "security" | "vscode";

// ── CLI Command Reference ────────────────────────────────────────────────────

const CLI_COMMANDS: CommandEntry[] = [
  // ── Installation ──────────────────────────────────────────────────────────
  {
    name: "Install CLI",
    command: "npm install -g xtra-cli",
    description: "Install the XtraSecurity CLI globally via npm",
    longDesc: "Installs the xtra CLI tool globally so you can run `xtra` commands from anywhere in your terminal. Requires Node.js v18+.",
    example: "npm install -g xtra-cli\n# Verify installation:\nxtra --version",
    section: "Installation",
    sectionColor: "cyan",
    icon: Package,
  },

  // ── Authentication & Setup ────────────────────────────────────────────────
  {
    name: "xtra login",
    command: "xtra login",
    description: "Authenticate with XtraSecurity using email, access key, or browser SSO",
    longDesc: "Authenticates your CLI session. Supports three methods: browser SSO (opens your default browser), Access Key (non-interactive), or Email & Password. Stores your token securely in the local config store.",
    example: "# Interactive (choose method):\nxtra login\n\n# Browser SSO:\nxtra login --sso\n\n# Access key (CI/CD):\nxtra login --key xs_your_access_key\n\n# Email + Password:\nxtra login --email you@company.com",
    options: [
      { flag: "-k, --key <key>", desc: "Authenticate using an Access Key (non-interactive)" },
      { flag: "-e, --email <email>", desc: "Authenticate using email (prompts for password)" },
      { flag: "--sso", desc: "Open browser for Single Sign-On (SSO) login" },
    ],
    section: "Authentication & Setup",
    sectionColor: "violet",
    icon: LogIn,
  },
  {
    name: "xtra init",
    command: "xtra init",
    description: "Bootstrap a new project — creates .xtrarc config file",
    longDesc: "Initialises XtraSecurity for your repository. Fetches your projects and branches from the cloud, lets you pick an environment and branch, and writes a .xtrarc config file. Optionally adds .xtrarc to .gitignore.",
    example: "# Interactive setup:\nxtra init\n\n# Silent / Accept all defaults:\nxtra init --project proj_abc123 -y\n\n# Specify project and environment:\nxtra init --project proj_abc123 --env staging --branch main",
    options: [
      { flag: "--project <id>", desc: "Project ID — skips the selection prompt" },
      { flag: "--env <env>", desc: "Default environment (development | staging | production)" },
      { flag: "--branch <branch>", desc: "Default branch name" },
      { flag: "-y, --yes", desc: "Accept all defaults without interactive prompts" },
    ],
    section: "Authentication & Setup",
    sectionColor: "violet",
    icon: Settings,
  },

  // ── Secret Management ─────────────────────────────────────────────────────
  {
    name: "xtra secrets list",
    command: "xtra secrets list",
    description: "List all secrets for a project/environment",
    longDesc: "Fetches and displays secrets for the configured project and environment. Values are masked by default. Use --show to reveal them (note: values will appear in terminal and shell history).",
    example: "# List secrets for the default env:\nxtra secrets list\n\n# Show secret values for production:\nxtra secrets list -e production --show\n\n# List for a specific project:\nxtra secrets list -p proj_abc123 -e staging",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID (reads from .xtrarc if omitted)" },
      { flag: "-e, --env <env>", desc: "Environment: development | staging | production" },
      { flag: "-b, --branch <branch>", desc: "Branch name" },
      { flag: "--show", desc: "⚠ Reveal secret values in plaintext" },
    ],
    section: "Secret Management",
    sectionColor: "emerald",
    icon: Key,
  },
  {
    name: "xtra secrets set",
    command: "xtra secrets set KEY=VALUE",
    description: "Set one or more secrets using KEY=VALUE pairs",
    longDesc: "Sets or updates secrets in the vault. Uses optimistic locking to detect concurrent remote changes — if a conflict is detected you are shown the remote value and asked to confirm an overwrite. Writing to production requires an explicit confirmation prompt.",
    example: "# Set a single secret:\nxtra secrets set API_KEY=abc123\n\n# Set multiple secrets:\nxtra secrets set DB_USER=admin DB_PASS=secret\n\n# Set in a specific environment:\nxtra secrets set API_KEY=xyz -e staging\n\n# Force overwrite (skip conflict check):\nxtra secrets set API_KEY=new -f",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-e, --env <env>", desc: "Target environment" },
      { flag: "-b, --branch <branch>", desc: "Target branch" },
      { flag: "-f, --force", desc: "Force overwrite — skips optimistic conflict detection" },
    ],
    section: "Secret Management",
    sectionColor: "emerald",
    icon: Key,
  },
  {
    name: "xtra secrets link",
    command: "xtra secrets link KEY --source proj/env/KEY",
    description: "Create a secret reference that points to another secret",
    longDesc: "Links a secret key in your project to a canonical secret in another project/environment. Useful for sharing a single source-of-truth secret (e.g. a shared database URL) across multiple projects without duplicating it.",
    example: "# Link a shared DB URL from another project:\nxtra secrets link SHARED_DB_URL \\\n  --source shared-proj/production/DB_URL\n\n# Link within same project across envs:\nxtra secrets link STRIPE_KEY \\\n  --source myproject/production/STRIPE_KEY",
    options: [
      { flag: "--source <path>", desc: "Source path in format projectId/env/KEY", required: true },
      { flag: "-p, --project <id>", desc: "Destination project ID" },
      { flag: "-e, --env <env>", desc: "Destination environment" },
    ],
    section: "Secret Management",
    sectionColor: "emerald",
    icon: Key,
  },
  {
    name: "xtra rotate",
    command: "xtra rotate <KEY>",
    description: "Zero-downtime secret rotation using Shadow Mode",
    longDesc: "Initiates a zero-downtime secret rotation. A new 'shadow' value is written alongside the existing active value — both are served simultaneously so your running app can transition gracefully. Once you have verified the new value, promote it to active with --promote.",
    example: "# Start rotation — creates shadow value:\nxtra rotate DATABASE_URL\n\n# Rotate with an explicit new value:\nxtra rotate API_KEY --value new_key_123\n\n# Promote shadow to active after verification:\nxtra rotate DATABASE_URL --promote\n\n# Rotate in production:\nxtra rotate DATABASE_URL -e production",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-e, --env <env>", desc: "Target environment (default: development)" },
      { flag: "--strategy <strategy>", desc: "Rotation strategy (default: shadow)" },
      { flag: "--promote", desc: "Promote the shadow value to be the active value" },
      { flag: "--value <value>", desc: "Provide the new secret value directly" },
    ],
    section: "Secret Management",
    sectionColor: "emerald",
    icon: RefreshCw,
  },

  // ── Runtime Injection ─────────────────────────────────────────────────────
  {
    name: "xtra run",
    command: "xtra run <command>",
    description: "Inject secrets as environment variables and run a command",
    longDesc: "Fetches your secrets from the vault and injects them into the child process environment. Secrets are never written to disk. Includes offline fallback using an encrypted local cache. Production runs require explicit confirmation.",
    example: "# Start a Node.js app:\nxtra run node app.js\n\n# Run npm scripts:\nxtra run npm start\n\n# Run in production:\nxtra run -e production -- npm run build\n\n# Run with specific project/branch:\nxtra run -p proj_abc123 -b feature-branch -- python script.py\n\n# Shell mode (required for shell built-ins on Windows):\nxtra run --shell \"echo $SECRET_KEY\"",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-e, --env <env>", desc: "Environment (default: development)" },
      { flag: "-b, --branch <branch>", desc: "Branch name" },
      { flag: "--shell", desc: "Enable shell mode (needed for npm run, shell built-ins on Windows)" },
    ],
    section: "Runtime Injection",
    sectionColor: "orange",
    icon: Play,
  },

  // ── Security & Compliance ─────────────────────────────────────────────────
  {
    name: "xtra scan",
    command: "xtra scan",
    description: "Scan project files for secrets and configuration leaks",
    longDesc: "Scans your repository for leaked secrets — checks if .env files are tracked by git and searches file contents for exposed API keys. Can be run as a pre-commit hook to prevent accidental commits.",
    example: "# Full scan of all tracked git files:\nxtra scan\n\n# Scan only staged files (pre-commit):\nxtra scan --staged\n\n# Install as a git pre-commit hook:\nxtra scan --install-hook",
    options: [
      { flag: "--staged", desc: "Scan only staged files (ideal for git pre-commit hooks)" },
      { flag: "--install-hook", desc: "Install xtra scan as a git pre-commit hook automatically" },
    ],
    section: "Security & Compliance",
    sectionColor: "rose",
    icon: Shield,
  },
  {
    name: "xtra audit verify",
    command: "xtra audit verify",
    description: "Verify the tamper-evident integrity of the audit log chain",
    longDesc: "Performs a cryptographic verification of the audit log chain. Each audit log entry is linked to the previous one via a hash — this command verifies the chain is unbroken. If tampering is detected, the broken log ID and reason are reported.",
    example: "# Verify audit chain integrity:\nxtra audit verify",
    options: [],
    section: "Security & Compliance",
    sectionColor: "rose",
    icon: Shield,
  },
  {
    name: "xtra audit export",
    command: "xtra audit export",
    description: "Export audit logs for compliance reporting (SOC2 / ISO 27001)",
    longDesc: "Exports audit logs in JSON or CSV format. Supports date-range filtering. The output can be piped to a file for compliance storage (SOC2, ISO 27001, GDPR). If --output is omitted, the export is streamed to stdout.",
    example: "# Export all logs as JSON:\nxtra audit export\n\n# Export as CSV for a date range:\nxtra audit export -f csv --start 2026-01-01 --end 2026-03-31\n\n# Save to file:\nxtra audit export -f csv -o audit_q1_2026.csv",
    options: [
      { flag: "-f, --format <format>", desc: "Output format: json (default) or csv" },
      { flag: "--start <date>", desc: "Filter start date (YYYY-MM-DD)" },
      { flag: "--end <date>", desc: "Filter end date (YYYY-MM-DD)" },
      { flag: "-o, --output <file>", desc: "Save output directly to a file path" },
    ],
    section: "Security & Compliance",
    sectionColor: "rose",
    icon: FileText,
  },

  // ── JIT Access Control ────────────────────────────────────────────────────
  {
    name: "xtra access request",
    command: "xtra access request",
    description: "Submit a Just-in-Time (JIT) access request to a project or secret",
    longDesc: "Submits a time-limited access request that requires admin approval. Specify a duration (in minutes) and a reason. Access is automatically revoked when the duration expires.",
    example: "# Request 30-minute access with reason:\nxtra access request \\\n  -p proj_abc123 \\\n  -d 30 \\\n  -r \"Debugging production issue\"\n\n# Request access to a specific secret:\nxtra access request \\\n  -p proj_abc123 \\\n  -s secret_id \\\n  -d 60 \\\n  -r \"Onboarding new team member\"",
    options: [
      { flag: "-p, --project <id>", desc: "Target project ID" },
      { flag: "-s, --secret <id>", desc: "Specific secret ID (optional — scopes request)" },
      { flag: "-d, --duration <minutes>", desc: "Duration in minutes", required: true },
      { flag: "-r, --reason <text>", desc: "Reason for the access request", required: true },
    ],
    section: "JIT Access Control",
    sectionColor: "amber",
    icon: Users,
  },
  {
    name: "xtra access list",
    command: "xtra access list",
    description: "List your access requests or view pending approvals (admin)",
    longDesc: "Without flags, lists your own submitted access requests and their statuses. With --pending, shows all pending requests that require your approval (requires admin/owner role).",
    example: "# View your own requests:\nxtra access list\n\n# View all pending requests (admin):\nxtra access list --pending",
    options: [
      { flag: "--pending", desc: "Show all pending requests awaiting admin approval" },
    ],
    section: "JIT Access Control",
    sectionColor: "amber",
    icon: Users,
  },
  {
    name: "xtra access approve",
    command: "xtra access approve <requestId>",
    description: "Approve or reject a JIT access request (admin only)",
    longDesc: "Admin-only command to approve or reject a pending JIT access request by its ID. Approved requests grant time-limited, read-only access that expires automatically.",
    example: "# Approve a request:\nxtra access approve req_abc123 --decision approved\n\n# Reject a request:\nxtra access approve req_abc123 --decision rejected",
    options: [
      { flag: "--decision <decision>", desc: "Decision: approved or rejected", required: true },
    ],
    section: "JIT Access Control",
    sectionColor: "amber",
    icon: Users,
  },
  {
    name: "xtra access jit-generate",
    command: "xtra access jit-generate",
    description: "Generate a shareable JIT access link for a project",
    longDesc: "Creates a one-time (or limited-use) shareable URL that allows an external user to request scoped, time-limited read-only access to a project or specific secrets. The link expires after the specified hours.",
    example: "# Generate a basic JIT link (30 min access, 1 use):\nxtra access jit-generate \\\n  -p proj_abc123 \\\n  -d 30\n\n# Scoped to production, max 3 uses:\nxtra access jit-generate \\\n  -p proj_abc123 \\\n  -d 60 \\\n  -e production \\\n  --max-uses 3 \\\n  --label \"Contractor Access\"",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-d, --duration <minutes>", desc: "Access duration in minutes", required: true },
      { flag: "-b, --branch <id>", desc: "Scope to a specific branch ID" },
      { flag: "-e, --env <environment>", desc: "Scope to an environment" },
      { flag: "-s, --secrets <ids>", desc: "Comma-separated secret IDs to scope access" },
      { flag: "--label <text>", desc: "Human-readable label for the JIT link" },
      { flag: "--max-uses <count>", desc: "Maximum number of times the link can be claimed (default: 1)" },
      { flag: "--expires <hours>", desc: "Link expiry window in hours (default: 24)" },
    ],
    section: "JIT Access Control",
    sectionColor: "amber",
    icon: Users,
  },

  // ── Versioning & Branches ─────────────────────────────────────────────────
  {
    name: "xtra branch list",
    command: "xtra branch list",
    description: "List all workspace branches for a project",
    longDesc: "Lists all secret branches for the configured (or specified) project, showing their name, ID, and creator.",
    example: "# List branches:\nxtra branch list\n\n# For a specific project:\nxtra branch list -p proj_abc123",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
    ],
    section: "Versioning & Branches",
    sectionColor: "sky",
    icon: GitBranch,
  },
  {
    name: "xtra branch create",
    command: "xtra branch create <name>",
    description: "Create a new secret branch for isolated environment configuration",
    longDesc: "Creates a new branch within a project, allowing you to maintain isolated sets of secrets for features, experiments, or environments.",
    example: "# Create a branch:\nxtra branch create feature/oauth-refactor\n\n# With a description:\nxtra branch create hotfix/db-creds -d \"Emergency DB creds rotation\"",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-d, --description <text>", desc: "Optional description for the branch" },
    ],
    section: "Versioning & Branches",
    sectionColor: "sky",
    icon: GitBranch,
  },
  {
    name: "xtra branch delete",
    command: "xtra branch delete <name>",
    description: "Delete a branch (cannot delete 'main')",
    longDesc: "Deletes a branch by name after confirming. The 'main' branch is protected and cannot be deleted.",
    example: "# Delete with confirmation:\nxtra branch delete feature/oauth-refactor\n\n# Skip confirmation:\nxtra branch delete old-branch -y",
    options: [
      { flag: "-p, --project <id>", desc: "Project ID" },
      { flag: "-y, --yes", desc: "Skip the confirmation prompt" },
    ],
    section: "Versioning & Branches",
    sectionColor: "sky",
    icon: GitBranch,
  },
];

// ── VS Code Extension Commands ─────────────────────────────────────────────

const VSCODE_FEATURES = [
  {
    id: "sidebar",
    icon: Layers,
    name: "Secrets Sidebar",
    description: "Browse all your project secrets in a dedicated VS Code sidebar panel. Secrets are grouped by environment and masked by default.",
    color: "#22d3ee",
    commands: [
      { id: "xtra.openSidebar", name: "XtraSecurity: Open Sidebar", desc: "Opens the XtraSecurity secrets panel in the activity bar." },
      { id: "xtra.refreshSecrets", name: "XtraSecurity: Refresh Secrets", desc: "Manually refreshes the secrets list from the cloud." },
    ],
    tip: "Click the shield icon in the activity bar to reveal the XtraSecurity panel.",
  },
  {
    id: "reveal",
    icon: Eye,
    name: "Reveal / Copy Secrets",
    description: "View or copy individual secret values directly from the sidebar without leaving your editor. Values auto-hide after 10 seconds.",
    color: "#8b5cf6",
    commands: [
      { id: "xtra.revealSecret", name: "XtraSecurity: Reveal Secret Value", desc: "Temporarily reveals the masked value of the selected secret." },
      { id: "xtra.copySecret", name: "XtraSecurity: Copy Secret Value", desc: "Copies the plaintext secret value to the clipboard." },
    ],
    tip: "Right-click any secret in the sidebar and choose 'Reveal Value' or 'Copy Value'.",
  },
  {
    id: "inject",
    icon: Play,
    name: "Debug with Secrets Injection",
    description: "Launch your debugger with secrets automatically injected into the launch environment — no .env files required.",
    color: "#f43f5e",
    commands: [
      { id: "xtra.injectDebug", name: "XtraSecurity: Inject Secrets into Debug Launch", desc: "Wraps your debug launch config to inject secrets at runtime." },
    ],
    tip: "Add `\"envFile\": \"${workspaceFolder}/.xtra/.env.local\"` to your launch.json, or use the command to inject automatically.",
    codeSnippet: `// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch with XtraSecurity",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/index.js",
      "runtimeExecutable": "xtra",
      "runtimeArgs": ["run", "node"]
    }
  ]
}`,
  },
  {
    id: "status",
    icon: Activity,
    name: "Status Bar Indicator",
    description: "A live status bar item shows your active project, environment, and connection status. Clickable to switch projects.",
    color: "#10b981",
    commands: [
      { id: "xtra.switchProject", name: "XtraSecurity: Switch Project", desc: "Opens a quick-pick list to switch your active project." },
      { id: "xtra.switchEnvironment", name: "XtraSecurity: Switch Environment", desc: "Switch between development, staging, and production environments." },
    ],
    tip: "The status bar shows format: `⚡ ProjectName [env]`. Click to switch environments.",
  },
  {
    id: "scan",
    icon: Shield,
    name: "Secret Leak Scanner",
    description: "Inline diagnostics warn you in real-time if a secret value is hardcoded in your current editor file.",
    color: "#f59e0b",
    commands: [
      { id: "xtra.scanWorkspace", name: "XtraSecurity: Scan Workspace for Leaks", desc: "Runs xtra scan across the workspace and shows results in the Problems panel." },
      { id: "xtra.scanFile", name: "XtraSecurity: Scan Current File", desc: "Runs a quick scan on the currently open file." },
    ],
    tip: "Enable 'xtra.autoScanOnSave' in settings to automatically scan on every file save.",
  },
  {
    id: "settings",
    icon: Settings,
    name: "Extension Settings",
    description: "Configure the extension behaviour directly from VS Code settings. All settings are prefixed with `xtra.*`.",
    color: "#6366f1",
    settings: [
      { key: "xtra.apiUrl", type: "string", default: "https://www.xtrasecurity.in/api", desc: "Base URL of the XtraSecurity API" },
      { key: "xtra.autoRefreshInterval", type: "number", default: "60", desc: "Auto-refresh interval for secrets in seconds (0 = disabled)" },
      { key: "xtra.maskSecrets", type: "boolean", default: "true", desc: "Mask secret values in the sidebar by default" },
      { key: "xtra.autoScanOnSave", type: "boolean", default: "false", desc: "Automatically scan for leaks every time a file is saved" },
      { key: "xtra.defaultEnvironment", type: "string", default: "development", desc: "Default environment to use when no .xtrarc is found" },
    ],
  },
];

const INTEGRATIONS = [
    { id: "github", name: "GitHub Actions", desc: "Automate secret injection in your CI/CD pipelines.", logo: "https://cdn.simpleicons.org/github/white", color: "text-white" },
    { id: "k8s", name: "Kubernetes", desc: "Sync secrets directly to K8s ExternalSecrets or native Secrets.", logo: "https://cdn.simpleicons.org/kubernetes/white", color: "text-white" },
    { id: "aws", name: "AWS Secrets Manager", desc: "Bi-directional sync with AWS cloud infrastructure.", logo: "https://cdn.simpleicons.org/amazonservices/white", color: "text-white" },
    { id: "vercel", name: "Vercel", desc: "Deploy with zero-config environment variables.", logo: "https://cdn.simpleicons.org/vercel/white", color: "text-white" },
    { id: "google", name: "Google Cloud Secret Manager", desc: "Securely store and manage sensitive data in GCP.", logo: "https://cdn.simpleicons.org/googlecloud/white", color: "text-white" },
    { id: "slack", name: "Slack", desc: "Real-time security alerts and JIT access notifications.", logo: "https://cdn.simpleicons.org/slack/white", color: "text-white" },
];

const SECTIONS = [
    { id: "quickstart", label: "Quickstart", icon: Zap, desc: "Get up and running in 5 minutes" },
    { id: "cli", label: "CLI Reference", icon: Terminal, desc: "Complete command line manual" },
    { id: "vscode", label: "VS Code Extension", icon: Puzzle, desc: "Editor integration & features" },
    { id: "sdks", label: "SDKs & Libraries", icon: Code, desc: "Node.js, Python, and Go integration" },
    { id: "integrations", label: "Integrations", icon: Workflow, desc: "Connect your cloud stack" },
    { id: "security", label: "Security & JIT", icon: Shield, desc: "Access control and compliance" },
];

const SECTION_COLORS: Record<string, string> = {
  Installation: "cyan",
  "Authentication & Setup": "violet",
  "Secret Management": "emerald",
  "Runtime Injection": "orange",
  "Security & Compliance": "rose",
  "JIT Access Control": "amber",
  "Versioning & Branches": "sky",
};

function sectionBadgeClass(color: string) {
  const map: Record<string, string> = {
    cyan:    "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    violet:  "bg-violet-400/10 text-violet-400 border-violet-400/20",
    emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    orange:  "bg-orange-400/10 text-orange-400 border-orange-400/20",
    rose:    "bg-rose-400/10 text-rose-400 border-rose-400/20",
    amber:   "bg-amber-400/10 text-amber-400 border-amber-400/20",
    sky:     "bg-sky-400/10 text-sky-400 border-sky-400/20",
  };
  return map[color] ?? "bg-white/[0.05] text-slate-400 border-white/[0.1]";
}

function sectionIconClass(color: string) {
  const map: Record<string, string> = {
    cyan:    "text-cyan-400",
    violet:  "text-violet-400",
    emerald: "text-emerald-400",
    orange:  "text-orange-400",
    rose:    "text-rose-400",
    amber:   "text-amber-400",
    sky:     "text-sky-400",
  };
  return map[color] ?? "text-white";
}

// Group commands by section
const groupedCommands = CLI_COMMANDS.reduce((acc, cmd) => {
  if (!acc[cmd.section]) acc[cmd.section] = [];
  acc[cmd.section].push(cmd);
  return acc;
}, {} as Record<string, CommandEntry[]>);

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState<DocSection>("quickstart");
    const [searchQuery, setSearchQuery] = useState("");
    const contentRef = useRef<HTMLDivElement>(null);

    const filteredCommands = useMemo(() => {
        if (!searchQuery) return CLI_COMMANDS;
        const q = searchQuery.toLowerCase();
        return CLI_COMMANDS.filter(c => 
            c.command.toLowerCase().includes(q) || 
            c.name.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q) ||
            c.longDesc?.toLowerCase().includes(q) ||
            c.section.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const filteredGrouped = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            if (!acc[cmd.section]) acc[cmd.section] = [];
            acc[cmd.section].push(cmd);
            return acc;
        }, {} as Record<string, CommandEntry[]>);
    }, [filteredCommands]);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto flex gap-12 pb-32 items-start px-6 pt-12 relative">
                
                {/* ── Background Effects ── */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                   <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
                   <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full" />
                </div>

                {/* ── Left Sidebar Navigation ── */}
                <aside className="w-72 shrink-0 sticky top-24 hidden lg:block space-y-8 no-scrollbar max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
                    <div className="space-y-6">
                        <div className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">Documentation</div>
                        <nav className="space-y-1.5">
                            {SECTIONS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id as DocSection)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group relative",
                                        activeSection === s.id 
                                            ? "bg-white/[0.03] text-white border border-white/[0.08] shadow-[0_0_20px_rgba(255,255,255,0.02)]" 
                                            : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                                    )}
                                >
                                    {activeSection === s.id && (
                                       <motion.div layoutId="nav-glow" className="absolute inset-0 rounded-2xl bg-primary/5 ring-1 ring-primary/20" />
                                    )}
                                    <s.icon className={cn("h-4 w-4 relative z-10", activeSection === s.id ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
                                    <span className="text-sm font-black tracking-tight relative z-10">{s.label}</span>
                                    {activeSection === s.id && (
                                       <div className="absolute right-4 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* CLI Section sub-nav when CLI is active */}
                    {activeSection === "cli" && (
                        <div className="space-y-2 pt-4 border-t border-white/[0.05]">
                            <div className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">Sections</div>
                            <nav className="space-y-1">
                                {Object.keys(groupedCommands).map(section => (
                                    <div key={section} className="flex items-center gap-3 px-5 py-2 text-sm font-bold text-slate-400 text-left group">
                                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", `bg-${SECTION_COLORS[section] || "slate"}-400`)} />
                                        <span className="text-[11px]">{section}</span>
                                        <Badge className={cn("ml-auto text-[9px] font-black px-1.5 py-0 border", sectionBadgeClass(SECTION_COLORS[section]))}>
                                            {groupedCommands[section].length}
                                        </Badge>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* VS Code sub-nav */}
                    {activeSection === "vscode" && (
                        <div className="space-y-2 pt-4 border-t border-white/[0.05]">
                            <div className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">Features</div>
                            <nav className="space-y-1">
                                {VSCODE_FEATURES.map(f => (
                                    <div key={f.id} className="flex items-center gap-3 px-5 py-2 text-sm font-bold text-slate-400 text-left group cursor-pointer hover:text-white transition-colors">
                                        <f.icon className="h-3.5 w-3.5 shrink-0" style={{ color: f.color }} />
                                        <span className="text-[11px]">{f.name}</span>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    )}

                    <div className="pt-8">
                       <Card className="bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.08] overflow-hidden rounded-3xl relative backdrop-blur-3xl group cursor-pointer">
                           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                           <CardContent className="p-6 space-y-4">
                               <div className="h-12 w-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
                                  <Monitor className="h-6 w-6 text-white" />
                               </div>
                               <h4 className="text-sm font-black text-white tracking-tight uppercase">Developer Slack</h4>
                               <p className="text-xs text-slate-400 leading-relaxed font-medium">Collaborate directly with our security engineers in the core community.</p>
                               <Button size="sm" variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-white/[0.02] border-white/[0.1] hover:bg-white/10 rounded-xl transition-all">Join Community</Button>
                           </CardContent>
                       </Card>
                    </div>
                </aside>

                {/* ── Main Content Area ── */}
                <main className="flex-1 min-w-0 space-y-16">
                    
                    {/* Top Doc Header */}
                    <header className="space-y-8">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                           <BookOpen className="h-3 w-3" />
                           <span>Docs</span>
                           <ChevronRight className="h-3 w-3 opacity-30" />
                           <span className="text-cyan-400 font-black">{SECTIONS.find(s => s.id === activeSection)?.label}</span>
                        </div>
                        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                            <div className="space-y-3">
                               <h1 className="text-7xl font-black tracking-tighter text-white">
                                  {SECTIONS.find(s => s.id === activeSection)?.label}
                               </h1>
                               <p className="text-slate-400 font-bold text-xl leading-relaxed max-w-2xl">
                                  {SECTIONS.find(s => s.id === activeSection)?.desc}
                               </p>
                            </div>
                            {(activeSection === "cli") && (
                                <div className="relative group max-w-sm w-full">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                   <Input 
                                      placeholder="Search commands..." 
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      className="pl-12 h-14 rounded-3xl bg-white/[0.02] border-white/[0.08] focus:border-white/[0.2] transition-all text-sm font-bold shadow-2xl backdrop-blur-xl" 
                                   />
                                   {searchQuery && (
                                       <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                           <X className="h-4 w-4 text-slate-500 hover:text-white transition-colors" />
                                       </button>
                                   )}
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="h-[1px] w-full bg-gradient-to-r from-white/[0.1] via-white/[0.03] to-transparent" />

                    {/* Dynamic Content Sections */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="space-y-24 pb-20"
                        >
                            {/* ── Quickstart Section ── */}
                            {activeSection === "quickstart" && (
                                <div className="space-y-24">
                                    <section className="space-y-10">
                                       <div className="space-y-4">
                                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                             <Zap className="h-3 w-3" /> Step-by-Step Guide
                                          </div>
                                          <h2 className="text-3xl font-black tracking-tight text-white">Getting Started</h2>
                                          <p className="text-slate-400 font-bold leading-relaxed max-w-2xl text-lg">XtraSecurity provides a zero-config secrets engine. You can start managing secrets globally in less than 5 minutes.</p>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                          {[
                                              { step: "01", title: "Installation", body: "Deploy the high-performance CLI globally to your environment.", icon: Smartphone, color: "#22d3ee" },
                                              { step: "02", title: "Authentication", body: "Secure your workspace using a personal developer token or SSO.", icon: Shield, color: "#8b5cf6" },
                                              { step: "03", title: "Initialization", body: "Link your repository to the Xtra cloud secrets engine.", icon: Workflow, color: "#f43f5e" },
                                          ].map((step, i) => (
                                              <Card key={i} className="group hover:scale-[1.02] transition-all duration-500 bg-white/[0.03] border-white/[0.1] rounded-[2rem] relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                                                 <div className="absolute right-[-10%] top-[-10%] text-[8rem] font-black text-white/[0.02] group-hover:text-white/[0.05] transition-all duration-700 select-none italic tracking-tighter">
                                                    {step.step}
                                                 </div>
                                                 <CardContent className="p-8 space-y-6 relative z-10">
                                                    <div className="h-14 w-14 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-xl"
                                                         style={{ color: step.color }}>
                                                       <step.icon className="h-6 w-6" />
                                                    </div>
                                                    <div className="space-y-2">
                                                       <h4 className="font-black text-white text-lg tracking-tight uppercase">{step.title}</h4>
                                                       <p className="text-sm text-slate-400 leading-relaxed font-bold">{step.body}</p>
                                                    </div>
                                                 </CardContent>
                                              </Card>
                                          ))}
                                       </div>
                                    </section>

                                    <section className="space-y-8">
                                       <div className="space-y-3">
                                          <h3 className="text-xl font-black text-white uppercase tracking-wider">1. Install the CLI</h3>
                                          <p className="text-base text-slate-400 font-bold">The Xtra CLI is the primary engine for fetching and injecting secrets into your dev environment.</p>
                                       </div>
                                       <MultiLanguageSnippet 
                                          options={[
                                              { language: "npm", code: "npm install -g xtra-cli" },
                                              { language: "yarn", code: "yarn global add xtra-cli" },
                                              { language: "pnpm", code: "pnpm add -g xtra-cli" },
                                          ]} 
                                       />
                                       <Callout type="tip">
                                          Ensure your terminal is using Node.js v18+ for hardware-accelerated AES-256 encryption.
                                       </Callout>
                                    </section>

                                    <section className="space-y-8">
                                       <div className="space-y-3">
                                          <h3 className="text-xl font-black text-white uppercase tracking-wider">2. Authenticate</h3>
                                          <p className="text-base text-slate-400 font-bold">Log in with browser SSO, an access key, or email and password.</p>
                                       </div>
                                       <MultiLanguageSnippet 
                                          options={[
                                              { language: "SSO", code: "xtra login --sso" },
                                              { language: "Key", code: "xtra login --key xs_your_access_key" },
                                              { language: "Email", code: "xtra login --email you@company.com" },
                                          ]} 
                                       />
                                    </section>

                                    <section className="space-y-8">
                                       <div className="space-y-3">
                                          <h3 className="text-xl font-black text-white uppercase tracking-wider">3. Initialize your Project</h3>
                                          <p className="text-base text-slate-400 font-bold">Run <code className="text-cyan-400 bg-white/[0.05] px-2 py-0.5 rounded-lg text-sm">xtra init</code> inside your repository to link it to the Xtra cloud and create a .xtrarc config file.</p>
                                       </div>
                                       <MultiLanguageSnippet 
                                          options={[
                                              { language: "Interactive", code: "xtra init" },
                                              { language: "Silent", code: "xtra init --project proj_abc123 -y" },
                                          ]} 
                                       />
                                    </section>

                                    <section className="space-y-8">
                                       <div className="space-y-3">
                                          <h3 className="text-xl font-black text-white uppercase tracking-wider">4. Inject Secrets & Run</h3>
                                          <p className="text-base text-slate-400 font-bold">Use <code className="text-cyan-400 bg-white/[0.05] px-2 py-0.5 rounded-lg text-sm">xtra run</code> to inject your secrets into any command — no .env files needed.</p>
                                       </div>
                                       <MultiLanguageSnippet 
                                          options={[
                                              { language: "Node", code: "xtra run node app.js" },
                                              { language: "npm", code: "xtra run npm start" },
                                              { language: "Python", code: "xtra run python main.py" },
                                          ]} 
                                       />
                                       <Callout type="note">
                                           Secrets are never written to disk. They live only in the child process environment for the duration of the command.
                                       </Callout>
                                    </section>

                                    <DocNavButtons next={{ label: "CLI Reference", section: "cli" }} />
                                </div>
                            )}

                            {/* ── CLI Reference Section ── */}
                            {activeSection === "cli" && (
                                <div className="space-y-16">
                                    {/* Stats bar */}
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(groupedCommands).map(([section, cmds]) => (
                                            <div key={section} className={cn("px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-2", sectionBadgeClass(SECTION_COLORS[section]))}>
                                                <span>{section}</span>
                                                <span className="opacity-60">×{cmds.length}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {searchQuery ? (
                                        // Flat filtered results
                                        <div className="space-y-8">
                                            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                {filteredCommands.length} result{filteredCommands.length !== 1 ? "s" : ""} for "{searchQuery}"
                                            </div>
                                            {filteredCommands.map((cmd, i) => (
                                                <CommandCard key={i} cmd={cmd} />
                                            ))}
                                            {filteredCommands.length === 0 && (
                                                <div className="text-center py-32 space-y-6 rounded-[3rem] border border-dashed border-white/10 bg-white/[0.02]">
                                                   <Terminal className="h-16 w-16 mx-auto text-slate-700" />
                                                   <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No commands matching "{searchQuery}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Grouped by section
                                        <div className="space-y-20">
                                            {Object.entries(groupedCommands).map(([section, cmds]) => (
                                                <div key={section} className="space-y-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("h-px flex-1 opacity-20", `bg-${SECTION_COLORS[section] || "slate"}-400`)} />
                                                        <div className={cn("px-5 py-2 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2", sectionBadgeClass(SECTION_COLORS[section]))}>
                                                            {section}
                                                        </div>
                                                        <div className={cn("h-px flex-1 opacity-20", `bg-${SECTION_COLORS[section] || "slate"}-400`)} />
                                                    </div>
                                                    <div className="space-y-8">
                                                        {cmds.map((cmd, i) => (
                                                            <CommandCard key={i} cmd={cmd} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <DocNavButtons 
                                        prev={{ label: "Quickstart", section: "quickstart" }}
                                        next={{ label: "VS Code Extension", section: "vscode" }} 
                                    />
                                </div>
                            )}

                            {/* ── VS Code Extension Section ── */}
                            {activeSection === "vscode" && (
                                <div className="space-y-16">
                                    {/* Hero */}
                                    <div className="relative rounded-[3rem] overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#1e1b4b]/60 via-[#0f172a]/40 to-transparent p-10 backdrop-blur-3xl">
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                                            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/[0.1] flex items-center justify-center shadow-2xl shrink-0">
                                                <Puzzle className="h-10 w-10 text-white" />
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-400/10 border border-violet-400/20 text-[10px] font-black uppercase tracking-widest text-violet-400">
                                                    <Blocks className="h-3 w-3" /> VS Code Marketplace
                                                </div>
                                                <h2 className="text-3xl font-black text-white tracking-tight">XtraSecurity VS Code Extension</h2>
                                                <p className="text-slate-400 font-bold leading-relaxed max-w-2xl">
                                                    Bring your secrets management directly into VS Code. Browse secrets, inject into debugger, scan for leaks, and manage JIT access — all without leaving your editor.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 shrink-0">
                                                <Button className="h-12 px-6 bg-violet-600 hover:bg-violet-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center gap-3">
                                                    <Package className="h-4 w-4" /> Install Extension
                                                </Button>
                                                <Button variant="outline" className="h-12 px-6 border-white/[0.1] font-black text-sm rounded-2xl flex items-center gap-3">
                                                    <Github className="h-4 w-4" /> View Source
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Installation */}
                                    <section className="space-y-8">
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-black text-white uppercase tracking-wider">Installation</h3>
                                            <p className="text-base text-slate-400 font-bold">Install the extension from the VS Code Marketplace or directly via the CLI.</p>
                                        </div>
                                        <MultiLanguageSnippet
                                            options={[
                                                { language: "Marketplace", code: "# In VS Code:\n# Press Ctrl+Shift+X, search \"XtraSecurity\"\n# Click Install" },
                                                { language: "VSIX", code: "# From .vsix file:\ncode --install-extension xtra-vscode-1.0.0.vsix" },
                                                { language: "CLI", code: "ext install xtra-security.xtra-vscode" },
                                            ]}
                                        />
                                        <Callout type="tip">
                                            You must be logged in via <code className="text-cyan-400 bg-white/[0.05] px-1.5 py-0.5 rounded text-xs">xtra login</code> in your terminal before the VS Code extension can connect to the XtraSecurity API.
                                        </Callout>
                                    </section>

                                    {/* Feature Cards */}
                                    <div className="space-y-10">
                                        {VSCODE_FEATURES.map((feature) => (
                                            <VscodeFeatureCard key={feature.id} feature={feature} />
                                        ))}
                                    </div>

                                    <DocNavButtons 
                                        prev={{ label: "CLI Reference", section: "cli" }}
                                        next={{ label: "Integrations", section: "integrations" }} 
                                    />
                                </div>
                            )}

                            {/* ── Integrations Section ── */}
                            {activeSection === "integrations" && (
                                <div className="space-y-16">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {INTEGRATIONS.map((int) => (
                                            <IntegrationCard key={int.id} item={int} />
                                        ))}
                                    </div>
                                    <Callout type="note">
                                        Can't find your provider? Use the <span className="text-cyan-400 font-black cursor-pointer hover:underline">Webhook Web Engine</span> to build custom sync logic.
                                    </Callout>
                                </div>
                            )}

                            {/* ── SDKs Section (placeholder) ── */}
                            {activeSection === "sdks" && (
                                <div className="space-y-16">
                                    <Callout type="info">
                                        SDK documentation is coming soon. Install the Node.js SDK with <code className="text-blue-400 font-black">npm install xtra-sdk</code>.
                                    </Callout>
                                </div>
                            )}

                            {/* ── Security & JIT Section (placeholder) ── */}
                            {activeSection === "security" && (
                                <div className="space-y-16">
                                    <Callout type="tip">
                                        See the <button onClick={() => setActiveSection("cli")} className="text-cyan-400 font-black underline underline-offset-2">CLI Reference</button> for JIT access commands, or the <button onClick={() => setActiveSection("vscode")} className="text-cyan-400 font-black underline underline-offset-2">VS Code Extension</button> section for editor integration.
                                    </Callout>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                </main>

                {/* ── Right Table of Contents ── */}
                <aside className="w-56 shrink-0 sticky top-24 hidden xl:block pl-6">
                    <div className="space-y-8">
                        <div className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6">On this page</div>
                        <nav className="space-y-4 relative border-l border-white/[0.05]">
                           {activeSection === 'quickstart' && [
                                "Introduction", "1. Install CLI", "2. Authenticate", "3. Initialize", "4. Run"
                           ].map((item, i) => (
                              <a key={i} href="#" className={cn(
                                  "block px-4 text-[11px] font-black uppercase tracking-widest py-1 transition-all relative",
                                  i === 0 ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                              )}>
                                 {i === 0 && (
                                    <div className="absolute left-[-1px] top-0 h-full w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                 )}
                                 {item}
                              </a>
                           ))}
                           {activeSection === 'cli' && Object.keys(groupedCommands).map((section, i) => (
                              <a key={i} href="#" className={cn(
                                  "block px-4 text-[11px] font-black uppercase tracking-widest py-1 transition-all relative truncate",
                                  i === 0 ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                              )}>
                                 {i === 0 && (
                                    <div className="absolute left-[-1px] top-0 h-full w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                 )}
                                 {section}
                              </a>
                           ))}
                           {activeSection === 'vscode' && [
                                "Installation", "Sidebar", "Reveal Secrets", "Debug Injection", "Status Bar", "Leak Scanner", "Settings"
                           ].map((item, i) => (
                              <a key={i} href="#" className={cn(
                                  "block px-4 text-[11px] font-black uppercase tracking-widest py-1 transition-all relative",
                                  i === 0 ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
                              )}>
                                 {i === 0 && (
                                    <div className="absolute left-[-1px] top-0 h-full w-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                 )}
                                 {item}
                              </a>
                           ))}
                        </nav>
                        
                        <div className="pt-8 border-t border-white/[0.05] space-y-4">
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-2xl">
                               <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live Agent v2.4</span>
                           </div>
                           <p className="text-[9px] text-slate-500 font-bold leading-relaxed px-2">Knowledge base updated <br /><span className="text-slate-300">April 09, 2026</span></p>
                        </div>
                    </div>
                </aside>

            </div>
        </DashboardLayout>
    );
}

// ── Supporting Components ───────────────────────────────────────────────────

function MultiLanguageSnippet({ options }: { options: { language: string; code: string }[] }) {
    const [activeLang, setActiveLang] = useState(options[0].language);
    const [copied, setCopied] = useState(false);

    const activeCode = options.find(o => o.language === activeLang)?.code || "";

    const handleCopy = () => {
        navigator.clipboard.writeText(activeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-[2.5rem] border border-white/[0.08] bg-[#09090b]/80 overflow-hidden shadow-2xl backdrop-blur-3xl group relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            
            <div className="flex items-center justify-between px-8 py-4 bg-white/[0.02] border-b border-white/[0.05]">
                <div className="flex gap-4">
                    {options.map((opt) => (
                        <button
                            key={opt.language}
                            onClick={() => setActiveLang(opt.language)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg relative overflow-hidden",
                                activeLang === opt.language 
                                    ? "text-cyan-400 bg-cyan-400/10 shadow-inner" 
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {opt.language}
                        </button>
                    ))}
                </div>
                <button 
                  onClick={handleCopy}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
                >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-cyan-400" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>
            <div className="p-10 font-mono text-sm overflow-x-auto custom-scrollbar">
                <div className="flex gap-8 relative">
                    <div className="flex flex-col gap-1 text-slate-700 select-none text-right min-w-[1.5rem] font-black group-hover:text-slate-500 transition-colors">
                        {activeCode.split('\n').map((_, i) => (
                           <span key={i}>{i + 1}</span>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1">
                        {activeCode.split('\n').map((line, i) => (
                           <span key={i} className="text-slate-300 font-bold tracking-tight">
                              {line.startsWith('#') ? (
                                  <span className="text-slate-500">{line}</span>
                              ) : (
                                  <>
                                    <span className="text-cyan-400 opacity-60 mr-2">$</span>
                                    {line}
                                  </>
                              )}
                           </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CommandCard({ cmd }: { cmd: CommandEntry }) {
    const [copied, setCopied] = useState(false);
    const [exCopied, setExCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const IconComponent = cmd.icon ?? Command;
    const color = SECTION_COLORS[cmd.section] || "slate";
    const iconColorClass = sectionIconClass(color);
    const badgeClass = sectionBadgeClass(color);

    const handleCopy = () => {
        navigator.clipboard.writeText(cmd.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExCopy = () => {
        if (!cmd.example) return;
        navigator.clipboard.writeText(cmd.example);
        setExCopied(true);
        setTimeout(() => setExCopied(false), 2000);
    };

    return (
        <Card className="hover:border-white/[0.2] transition-all duration-500 bg-white/[0.02]/80 backdrop-blur-3xl rounded-[3rem] group overflow-hidden border-white/[0.08] shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            {/* Header */}
            <CardHeader className="pb-0 p-10 pt-10 relative z-10">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={cn("h-14 w-14 bg-white/[0.03] border border-white/[0.08] rounded-[1.5rem] flex items-center justify-center shadow-xl transition-colors shrink-0", `group-hover:bg-${color}-400/10`)}>
                           <IconComponent className={cn("h-7 w-7 transition-colors", iconColorClass)} />
                        </div>
                        <div className="space-y-1.5">
                           <h3 className="text-xl font-black tracking-tight text-white">{cmd.name}</h3>
                           <p className="text-slate-400 font-bold text-base leading-relaxed">{cmd.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={cn("text-[10px] font-black tracking-[0.15em] px-3 py-1.5 rounded-full uppercase border", badgeClass)}>
                            {cmd.section}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-10 pt-6 space-y-8 relative z-10">
                {/* Long description */}
                {cmd.longDesc && (
                    <p className="text-slate-500 font-bold text-sm leading-relaxed border-l-2 border-white/[0.08] pl-4">
                        {cmd.longDesc}
                    </p>
                )}

                {/* Command snippet with copy */}
                <div className="relative group/code">
                    <div className="bg-[#09090b] px-6 py-4 rounded-2xl font-mono text-sm text-cyan-400 overflow-x-auto border border-white/[0.08] shadow-2xl flex items-center justify-between gap-4">
                       <span className="font-bold tracking-tight flex-1">
                           <span className="opacity-30 mr-3">❯</span>
                           {cmd.command}
                       </span>
                       <button 
                           onClick={handleCopy}
                           title="Copy command"
                           className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-400 hover:text-white transition-all shadow-xl"
                       >
                           {copied ? <Check className="h-4 w-4 text-cyan-400" /> : <Copy className="h-4 w-4" />}
                       </button>
                    </div>
                </div>

                {/* Options table */}
                {cmd.options && cmd.options.length > 0 && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                           <div className="h-px flex-1 bg-white/[0.05]" />
                           <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Options & Flags</div>
                           <div className="h-px flex-1 bg-white/[0.05]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cmd.options.map((opt, i) => (
                                <div key={i} className="p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 space-y-2 group/opt shadow-lg">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <code className="text-xs font-black text-white px-2 py-1 bg-white/[0.05] rounded-lg border border-white/[0.08]">{opt.flag}</code>
                                        {opt.required && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2 py-0.5 rounded-full">required</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 group-hover/opt:text-slate-400 transition-colors font-bold leading-relaxed">{opt.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Example snippet */}
                {cmd.example && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                           <div className="h-px flex-1 bg-white/[0.05]" />
                           <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Examples</div>
                           <div className="h-px flex-1 bg-white/[0.05]" />
                        </div>
                        <div className="relative rounded-2xl bg-[#09090b] border border-white/[0.08] overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                                <div className="flex gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500/60" />
                                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                                </div>
                                <button
                                    onClick={handleExCopy}
                                    title="Copy examples"
                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                                >
                                    {exCopied ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <div className="p-6 font-mono text-sm overflow-x-auto">
                                {cmd.example.split('\n').map((line, i) => (
                                    <div key={i} className="leading-7">
                                        {line.startsWith('#') ? (
                                            <span className="text-slate-600 font-bold">{line}</span>
                                        ) : line === '' ? (
                                            <span>&nbsp;</span>
                                        ) : (
                                            <span className="text-slate-300 font-bold">
                                                <span className="text-emerald-400/60 mr-2">$</span>
                                                {line}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function VscodeFeatureCard({ feature }: { feature: typeof VSCODE_FEATURES[0] }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!feature.codeSnippet) return;
        navigator.clipboard.writeText(feature.codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="bg-white/[0.02] border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-white/[0.15] transition-all duration-500 relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <CardContent className="p-10 space-y-8 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-xl shrink-0" style={{ color: feature.color }}>
                            <feature.icon className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white tracking-tight">{feature.name}</h3>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                    >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>

                {/* Tip */}
                {feature.tip && (
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm">
                        <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-400 font-bold">{feature.tip}</span>
                    </div>
                )}

                {/* Commands */}
                {feature.commands && (
                    <div className="space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">VS Code Commands (Command Palette)</div>
                        {feature.commands.map((cmd) => (
                            <div key={cmd.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.12] transition-all group/cmd">
                                <code className="text-xs font-black text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-1 rounded-lg shrink-0 mt-0.5">{cmd.id}</code>
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-white">{cmd.name}</div>
                                    <div className="text-xs text-slate-500 font-bold">{cmd.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Settings */}
                {feature.settings && expanded && (
                    <div className="space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Extension Settings</div>
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Setting Key</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Type</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Default</th>
                                        <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feature.settings.map((s, i) => (
                                        <tr key={i} className={cn("border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors", i === feature.settings!.length - 1 && "border-0")}>
                                            <td className="px-5 py-3"><code className="text-xs font-black text-cyan-400">{s.key}</code></td>
                                            <td className="px-5 py-3"><span className="text-xs font-bold text-slate-400">{s.type}</span></td>
                                            <td className="px-5 py-3"><code className="text-xs font-bold text-emerald-400">{s.default}</code></td>
                                            <td className="px-5 py-3"><span className="text-xs font-bold text-slate-500">{s.desc}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Code Snippet */}
                {feature.codeSnippet && expanded && (
                    <div className="space-y-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Example Configuration</div>
                        <div className="relative rounded-2xl bg-[#09090b] border border-white/[0.08] overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                                <div className="flex gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500/60" />
                                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                                </div>
                                <button onClick={handleCopy} className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white transition-all">
                                    {copied ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                            <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto leading-7">{feature.codeSnippet}</pre>
                        </div>
                    </div>
                )}

                {/* Expand toggle for settings features only */}
                {(feature.settings || feature.codeSnippet) && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300"
                    >
                        {expanded ? (
                            <><ChevronUp className="h-3.5 w-3.5" /> Show Less</>
                        ) : (
                            <><ChevronDown className="h-3.5 w-3.5" /> Show Details</>
                        )}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}

function IntegrationCard({ item }: { item: any }) {
    return (
        <Card className="hover:scale-[1.03] transition-all duration-500 bg-white/[0.02] border-white/[0.08] backdrop-blur-3xl group cursor-pointer overflow-hidden rounded-[2.5rem] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <CardContent className="p-10 space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                   <div className="h-20 w-20 rounded-3xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-primary/50 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20" />
                      <img src={item.logo} className="h-10 w-10 relative z-10 group-hover:scale-110 transition-transform duration-500 brightness-110" />
                   </div>
                   <div className="h-12 w-12 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className="h-5 w-5 text-white" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-2xl font-black tracking-tight text-white uppercase">{item.name}</h3>
                   <p className="text-base text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-6 border-t border-white/[0.05] flex items-center gap-6">
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Verified</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">v2.4 Ready</span>
                   </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip" | "note"; children: React.ReactNode }) {
    const config = {
        info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]" },
        warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/20", glow: "shadow-[0_0_15px_rgba(251,191,36,0.1)]" },
        tip: { icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/5", border: "border-cyan-400/20", glow: "shadow-[0_0_15px_rgba(34,211,238,0.1)]" },
        note: { icon: BookOpen, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", glow: "shadow-[0_0_15px_rgba(255,255,255,0.05)]" },
    }[type];

    return (
        <div className={cn("p-6 rounded-[2rem] border flex items-center gap-6 relative overflow-hidden backdrop-blur-xl transition-all hover:scale-[1.01]", config.bg, config.border, config.glow)}>
            <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
            <div className={cn("h-12 w-12 rounded-2xl bg-white/[0.05] border flex items-center justify-center shrink-0 shadow-2xl", config.border)}>
               <config.icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="text-base font-bold leading-relaxed text-slate-300">{children}</div>
        </div>
    );
}

function DocNavButtons({ next, prev }: { next?: { label: string; section: string }, prev?: { label: string; section: string } }) {
    const [, setActive] = useState<DocSection>("quickstart");
    return (
        <div className="flex items-center justify-between gap-8 pt-20 border-t border-white/[0.05]">
            {prev ? (
                <button className="flex flex-col items-start text-left group">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Previous</span>
                    <span className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors flex items-center gap-3">
                        <ChevronRight className="h-5 w-5 rotate-180 text-cyan-400" /> {prev.label}
                    </span>
                </button>
            ) : <div />}
            {next ? (
                <button className="flex flex-col items-end text-right group">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Next</span>
                    <span className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors flex items-center gap-3">
                        {next.label} <ChevronRight className="h-5 w-5 text-cyan-400" />
                    </span>
                </button>
            ) : <div />}
        </div>
    );
}
