"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, 
    Shield, 
    Workflow, 
    ChevronRight, 
    Command, 
    Copy, 
    Check, 
    Search,
    BookOpen,
    Code2,
    Cpu,
    Zap,
    Lock,
    Puzzle,
    Blocks,
    Package,
    Github,
    Globe as GlobeIcon,
    Server,
    ShieldAlert,
    Key,
    ExternalLink,
    ArrowRight,
    Sparkles,
    Activity,
    Share2,
    Users,
    Settings,
    UserPlus,
    PlayCircle,
    Monitor,
    Cloud,
    LucideIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DocLayout } from "@/components/docs/DocLayout";
import { PremiumCodeBlock } from "@/components/docs/PremiumCodeBlock";
import { PremiumCallout } from "@/components/docs/PremiumCallout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommandOption {
    flag: string;
    desc: string;
    required?: boolean;
}

interface CommandEntry {
    name: string;
    description: string;
    command: string;
    section: string;
    longDesc?: string;
    options?: CommandOption[];
    icon?: string;
}



const VSCODE_FEATURES = [
    {
        id: "explorer",
        name: "Secrets Explorer",
        description: "Browse and manage your project secrets directly from the VS Code sidebar.",
        icon: "search",
        color: "#22d3ee",
        tip: "You can right-click a secret to copy its name or value directly to your editor.",
        commands: [
            { id: "xtra.explorer.refresh", name: "Refresh Explorer", desc: "Force a sync with Xtra cloud" },
            { id: "xtra.explorer.copy", name: "Copy Secret", desc: "Copy selected secret value" }
        ]
    },
    {
        id: "injection",
        name: "Debugger Injection",
        description: "Automatically inject secrets into your launch configurations and debug sessions.",
        icon: "bolt",
        color: "#f43f5e",
        tip: "Compatible with Node.js, Python, and Go debuggers.",
        commands: [
            { id: "xtra.debug.inject", name: "Enable Injection", desc: "Attach secrets to next debug run" }
        ]
    },
    {
        id: "scanner",
        name: "Leak Scanner",
        description: "Real-time scanning for hardcoded secrets as you type.",
        icon: "security",
        color: "#8b5cf6",
        tip: "Blocks git commits if leaks are detected in your staged changes.",
        commands: [
            { id: "xtra.scanner.run", name: "Scan Workspace", desc: "Run a full security audit" }
        ]
    }
];

const INTEGRATIONS = [
    { id: "github", name: "GitHub Actions", desc: "Sync secrets directly to GitHub environments.", logo: "https://cdn.simpleicons.org/github/white", color: "#ffffff" },
    { id: "vercel", name: "Vercel", desc: "Deploy with secure environment variables in one click.", logo: "https://cdn.simpleicons.org/vercel/white", color: "#ffffff" },
    { id: "aws", name: "AWS Secrets Manager", desc: "Bridge your Xtra vault with AWS infrastructure.", logo: "https://cdn.simpleicons.org/amazonaws/FF9900", color: "#FF9900" },
    { id: "docker", name: "Docker", desc: "Inject secrets into containerized builds securely.", logo: "https://cdn.simpleicons.org/docker/2496ED", color: "#2496ED" }
];

const SECTION_COLORS: Record<string, string> = {
    "Authentication": "cyan",
    "Execution": "rose",
    "Management": "violet",
    "Setup": "emerald"
};

// ── Main Page Component ───────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState("quickstart");
    const [searchQuery, setSearchQuery] = useState("");



    const sectionBadgeClass = (color?: string) => {
        return "bg-muted/50 border-border text-muted-foreground hover:text-foreground transition-colors";
    };

    const scrollToTop = () => {
        const el = document.getElementById('docs-content-top');
        el?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <DocLayout 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            subSections={
                activeSection === 'vscode' 
                    ? [
                        { id: "installation", label: "Installation" },
                        { id: "features", label: "Features" },
                      ] 
                    : activeSection === 'management'
                    ? [
                        { id: "projects", label: "Projects" },
                        { id: "teams", label: "Teams" },
                        { id: "permissions", label: "Permissions" },
                        { id: "tokens", label: "Access Tokens" },
                      ]
                    : activeSection === 'workflow'
                    ? [
                        { id: "run", label: "In-Memory Injection" },
                        { id: "watch", label: "Live Reloading" },
                        { id: "offline", label: "Offline Mode" },
                      ]
                    : activeSection === 'cicd'
                    ? [
                        { id: "github", label: "GitHub Actions" },
                        { id: "gitlab", label: "GitLab CI" },
                        { id: "docker", label: "Docker Integration" },
                      ]
                    : activeSection === 'security'
                    ? [
                        { id: "sharing", label: "Secret Sharing" },
                        { id: "jit", label: "JIT Access" },
                        { id: "rotation", label: "Secret Rotation" },
                        { id: "audit", label: "Audit Logs" },
                      ]
                    : []
            }
            tocItems={
                activeSection === 'quickstart' ? ["Introduction", "Install", "Authenticate", "Initialize"] :
                activeSection === 'management' ? ["Projects", "Teams", "Permissions", "Access Tokens"] :
                activeSection === 'workflow' ? ["In-Memory Injection", "Live Reloading", "Offline Mode"] :
                activeSection === 'cicd' ? ["GitHub Actions", "GitLab CI", "Docker Integration"] :
                activeSection === 'vscode' ? ["Installation", "Features"] : 
                activeSection === 'security' ? ["Secret Sharing", "JIT Access", "Secret Rotation", "Audit Logs"] : []
            }
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className="pb-24"
                >

                    {/* ══════════════════════════════════════════════
                        QUICKSTART SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "quickstart" && (
                        <div className="space-y-12">
                            
                            {/* Hero Header */}
                            <div id="introduction" className="space-y-6 scroll-mt-32">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] font-semibold tracking-tight text-primary">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Getting Started
                                </div>

                                {/* Title + desc */}
                                <div className="space-y-4">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
                                        Build without{" "}
                                        <span className="text-primary italic">
                                            secrets leaking
                                        </span>
                                    </h1>
                                    <div className="space-y-4 max-w-2xl">
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            XtraSecurity is a unified secrets management platform. It replaces insecure local config files with a <strong>Zero-Trust Injection Layer</strong> that works across your CLI, Team, and Production.
                                        </p>
                                        <PremiumCallout type="info" className="bg-primary/5 border-primary/20">
                                            <div className="flex items-center gap-2 font-bold text-foreground mb-1 italic">
                                                <Zap className="h-4 w-4 text-primary" /> New to Secrets Management?
                                            </div>
                                            XtraSecurity keeps your passwords (API keys, DB URLs) in the cloud. They are only "injected" into your app when you run it. If your computer is stolen or your code is leaked, your secrets remain safe.
                                        </PremiumCallout>
                                    </div>
                                </div>

                                {/* Quick stats row */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {[
                                        { label: "End-to-end encrypted", icon: Shield },
                                        { label: "Zero-trust access", icon: Lock },
                                        { label: "Audit every access", icon: Activity },
                                    ].map(({ label, icon: Icon }) => (
                                        <div key={label} className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/40 border border-border/50 text-xs font-medium text-muted-foreground">
                                            <Icon className="h-3 w-3 text-primary/70" />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-border/50" />

                            {/* Step 0 */}
                            <section className="space-y-6 scroll-mt-32">
                                <StepHeader number={0} title="Get the VS Code Extension" />
                                <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                                    Before we start, install the official extension to get real-time security scanning and secret auto-completion.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button 
                                        asChild
                                        className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-lg shadow-lg flex items-center gap-2"
                                    >
                                        <a href="https://marketplace.visualstudio.com/items?itemName=XtraSecurity.xtra-vscode" target="_blank" rel="noopener noreferrer">
                                            <Package className="h-4 w-4" /> Download for VS Code
                                        </a>
                                    </Button>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Step 1 */}
                            <section id="install" className="space-y-6 scroll-mt-32">
                                <StepHeader number={1} title="Install the CLI" />
                                <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                                    The XtraSecurity CLI is the primary interface for managing secrets across your entire environment.
                                </p>
                                <PremiumCodeBlock 
                                    options={[
                                        { language: "npm",  code: "npm install -g xtra-cli", filename: "Terminal" },
                                        { language: "pnpm", code: "pnpm add -g xtra-cli" },
                                        { language: "yarn", code: "yarn global add xtra-cli" },
                                    ]} 
                                />
                                {/* Verify install */}
                                <div className="text-xs font-semibold text-muted-foreground/60 pl-1 uppercase tracking-tight">
                                    Verify installation:
                                </div>
                                <PremiumCodeBlock 
                                    options={[
                                        { language: "Verify", code: "xtra --version\n# xtra-cli v2.4.0", filename: "Terminal" },
                                    ]} 
                                />
                            </section>

                            {/* Step 2 */}
                            <section id="authenticate" className="space-y-6 scroll-mt-32">
                                <StepHeader number={2} title="Authenticate" />
                                <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                                    Connect your local machine to XtraSecurity using SSO or a static access key.
                                </p>
                                <PremiumCodeBlock 
                                    options={[
                                        { language: "SSO", code: "xtra login --sso", filename: "Auth" },
                                        { language: "Key", code: "xtra login --key xs_your_access_key" },
                                    ]} 
                                />
                                <PremiumCallout type="tip">
                                    SSO is recommended for team environments. Use access keys only for CI/CD pipelines and service accounts.
                                </PremiumCallout>
                            </section>
                            <section id="initialize" className="space-y-6 scroll-mt-32">
                                <StepHeader number={3} title="Initialize Your Project" />
                                <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                                    Link your repository to the Xtra cloud secrets engine. This creates an <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">.xtra.json</code> config file.
                                </p>
                                <PremiumCodeBlock 
                                    options={[
                                        { language: "Interactive", code: "xtra init", filename: "Setup" },
                                        { language: "Silent", code: "xtra init --project proj_abc123 -y" },
                                    ]} 
                                />

                                {/* Callouts grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <PremiumCallout type="tip">
                                        Run <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">xtra secrets ls</code> to view your active secrets after initialization.
                                    </PremiumCallout>
                                    <PremiumCallout type="note">
                                        Secrets live only in the child process environment — never written to disk or exposed in logs.
                                    </PremiumCallout>
                                </div>
                            </section>

                            {/* Next Step Nav */}
                            <DocNavButtons next={{ label: "Workspace Management", section: "management" }} setActiveSection={setActiveSection} />
                        </div>
                    )}



                    {/* ══════════════════════════════════════════════
                        MANAGEMENT SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "management" && (
                        <div className="space-y-12">
                            {/* Hero card */}
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-8 lg:p-10 shadow-sm">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
                                    <div className="h-16 w-16 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm shrink-0">
                                        <Blocks className="h-8 w-8 text-blue-500" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                            <Workflow className="h-3 w-3" /> Workspace Management
                                        </div>
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Organize Your Workflow</h1>
                                        <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
                                            Master the core organizational features of XtraSecurity. Learn how to structure projects, collaborate with teams, and manage fine-grained permissions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Projects */}
                            <section id="projects" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Package} title="Projects" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Projects are the top-level containers for your secrets. Each project represents a specific application, service, or repository.
                                    </p>
                                    
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <Zap className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Project Creation</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Create a project via the Dashboard or CLI using <code className="bg-muted px-1 py-0.5 rounded text-primary">xtra project create</code>. Projects automatically get <strong>Development</strong>, <strong>Staging</strong>, and <strong>Production</strong> environments.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Environments & Branches</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Manage secrets per environment. You can also create branch-specific secrets to support feature-branch workflows without polluting main environments.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Teams */}
                            <section id="teams" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Users} title="Teams" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Teams allow you to group users and manage their access collectively across multiple projects.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <UserPlus className="h-4 w-4 text-primary" />
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Collaboration</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Invite teammates via email. Once they join, they can be added to specific teams or granted direct project access.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Organization</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Create separate teams for Frontend, Backend, and DevOps to ensure people only see the secrets they need.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Permissions */}
                            <section id="permissions" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Lock} title="Permissions & Access" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        XtraSecurity uses a robust RBAC (Role-Based Access Control) system to ensure zero-trust security.
                                    </p>

                                    <div className="rounded-xl border overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                                                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-muted-foreground">Capabilities</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                <tr>
                                                    <td className="px-4 py-3 font-bold text-foreground">Viewer</td>
                                                    <td className="px-4 py-3 text-muted-foreground">Can view and fetch secrets, but cannot edit or delete.</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-bold text-foreground">Editor</td>
                                                    <td className="px-4 py-3 text-muted-foreground">Can manage secrets, create branches, and trigger syncs.</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-bold text-foreground">Admin</td>
                                                    <td className="px-4 py-3 text-muted-foreground">Full control over project settings, team assignments, and audit logs.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <PremiumCallout type="tip">
                                        You can assign a team to a project with a specific role. For example, assign the "Frontend Team" as "Viewers" to the "API Project".
                                    </PremiumCallout>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Secret Rotation */}
                            <section id="rotation" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Workflow} title="Secret Rotation" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Rotate secrets without downtime using our <strong>Shadow Mode</strong> strategy. This allows you to test new credentials before promoting them to active.
                                    </p>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-foreground">1. Initiate Rotation</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Run <code className="bg-muted px-1 py-0.5 rounded text-primary">xtra rotate DB_PASS</code>. This creates a "Shadow" version of the secret.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-foreground">2. Verify & Promote</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Once verified in your staging environment, run <code className="bg-muted px-1 py-0.5 rounded text-primary">xtra rotate DB_PASS --promote</code> to make it the active version.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Access Tokens */}
                            <section id="tokens" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Key} title="Access Tokens" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Access Tokens are used for programmatic authentication in CI/CD pipelines, staging servers, and local development machines.
                                    </p>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">Creating Tokens</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Go to <strong>Settings &gt; Access Tokens</strong> to generate a new token. You can scope tokens to specific environments (e.g., a Production-only token for your web server).
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                <Terminal className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground italic">Usage in CI/CD</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Set your token as the <code className="bg-muted px-1 py-0.5 rounded text-primary">XTRA_ACCESS_KEY</code> environment variable in your CI provider (GitHub Actions, GitLab, etc.) to automate secret injection.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <DocNavButtons 
                                prev={{ label: "Quickstart", section: "quickstart" }}
                                next={{ label: "Development Workflow", section: "workflow" }}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    )}



                    {/* ══════════════════════════════════════════════
                        WORKFLOW SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "workflow" && (
                        <div className="space-y-12">
                            {/* Hero card */}
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-8 lg:p-10 shadow-sm">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
                                    <div className="h-16 w-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm shrink-0">
                                        <PlayCircle className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                                            <Zap className="h-3 w-3" /> Daily Workflows
                                        </div>
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Development Patterns</h1>
                                        <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
                                            Learn how to integrate XtraSecurity into your daily coding routine. From live-reloading to offline development.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* xtra run */}
                            <section id="run" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Terminal} title="In-Memory Injection" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        The <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">xtra run</code> command is the core of our platform. It fetches secrets and injects them directly into your application's memory.
                                    </p>
                                    <PremiumCodeBlock 
                                        options={[
                                            { language: "Node.js", code: "xtra run node index.js", filename: "Terminal" },
                                            { language: "Python", code: "xtra run python manage.py runserver" },
                                            { language: "Docker", code: "xtra run -- docker build -t myapp ." },
                                        ]} 
                                    />
                                    <PremiumCallout type="tip">
                                        Use the <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">--shell</code> flag if your command contains pipes, redirections, or environment variables.
                                    </PremiumCallout>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* xtra watch */}
                            <section id="watch" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Activity} title="Live Reloading" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Keep your dev server running. <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">xtra watch</code> polls for secret changes and automatically restarts your process when you update a value in the cloud.
                                    </p>
                                    <PremiumCodeBlock 
                                        options={[
                                            { language: "Watch", code: "xtra watch --interval 3 npm run dev", filename: "Terminal" },
                                        ]} 
                                    />
                                    <p className="text-xs text-muted-foreground italic">
                                        * Note: Watch mode is disabled for production environments to prevent accidental downtime.
                                    </p>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Offline Mode */}
                            <section id="offline" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Cloud} title="Offline Mode" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Coding on a plane? No problem. Use <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">xtra local sync</code> to pull cloud secrets into an encrypted local cache.
                                    </p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-4">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                <Monitor className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-foreground">Sync & Go</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Run <code className="bg-muted px-1 py-0.5 rounded text-primary">xtra local on</code> to force the CLI to read from your local cache instead of trying to reach the cloud API.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <DocNavButtons 
                                prev={{ label: "Workspace Management", section: "management" }}
                                next={{ label: "CI/CD Integration", section: "cicd" }}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    )}



                    {/* ══════════════════════════════════════════════
                        CI/CD SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "cicd" && (
                        <div className="space-y-12">
                            {/* Hero card */}
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-8 lg:p-10 shadow-sm">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
                                    <div className="h-16 w-16 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-sm shrink-0">
                                        <GlobeIcon className="h-8 w-8 text-purple-500" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/5 border border-purple-500/10 text-[10px] font-bold uppercase tracking-wider text-purple-500">
                                            <Server className="h-3 w-3" /> Automation
                                        </div>
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">CI/CD Pipelines</h1>
                                        <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
                                            Inject secrets into your builds and deployments without ever storing them in your CI provider's database.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* GitHub Actions */}
                            <section id="github" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Github} title="GitHub Actions" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Use the official XtraSecurity CLI in your GitHub workflows. Simply set your <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">XTRA_ACCESS_KEY</code> as a GitHub Secret.
                                    </p>
                                    <PremiumCodeBlock 
                                        options={[
                                            { language: "YAML", code: `jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Xtra CLI
        run: npm install -g xtra-cli
      - name: Deploy with Secrets
        env:
          XTRA_ACCESS_KEY: \${{ secrets.XTRA_ACCESS_KEY }}
        run: xtra run -e production -- npm run deploy`, filename: "workflow.yml" },
                                        ]} 
                                    />
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Docker */}
                            <section id="docker" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Package} title="Docker Integration" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        Inject secrets directly into Docker builds using build-args or during runtime via the entrypoint.
                                    </p>
                                    <PremiumCodeBlock 
                                        options={[
                                            { language: "Dockerfile", code: `FROM node:18
RUN npm install -g xtra-cli
COPY . .
# Secrets are injected only during this step
RUN xtra run -e staging -- npm run build`, filename: "Dockerfile" },
                                        ]} 
                                    />
                                </div>
                            </section>

                            <DocNavButtons 
                                prev={{ label: "Development Workflow", section: "workflow" }}
                                next={{ label: "VS Code Extension", section: "vscode" }}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    )}



                    {/* ══════════════════════════════════════════════
                        VS CODE SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "vscode" && (
                        <div className="space-y-12">
                            {/* Hero card */}
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-8 lg:p-10 shadow-sm">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
                                    <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
                                        <Puzzle className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                                            <Blocks className="h-3 w-3" /> VS Code Marketplace
                                        </div>
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">XtraSecurity Extension</h1>
                                        <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
                                            Bring secrets management directly into VS Code. Browse secrets, inject into debugger, scan for leaks, and manage JIT access — all without leaving your editor.
                                        </p>
                                    </div>
                                    <Button 
                                        asChild
                                        className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md shadow-md transition-all flex items-center gap-2 shrink-0"
                                    >
                                        <a href="https://marketplace.visualstudio.com/items?itemName=XtraSecurity.xtra-vscode" target="_blank" rel="noopener noreferrer">
                                            <Package className="h-4 w-4" /> Install Extension
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Installation */}
                            <section id="installation" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Package} title="Installation" />
                                <p className="text-sm text-muted-foreground">Install from the VS Code Marketplace or via the CLI extension manager.</p>
                                <PremiumCodeBlock
                                    options={[
                                        { language: "Marketplace", code: "# In VS Code:\n# Press Ctrl+Shift+X, search \"XtraSecurity\"\n# Click Install", filename: "Extensions" },
                                        { language: "CLI", code: "ext install xtra-security.xtra-vscode" },
                                    ]}
                                />
                            </section>

                            {/* Features */}
                            <section id="features" className="space-y-8 scroll-mt-32">
                                <SectionHeader icon={Sparkles} title="Features" />
                                <div className="space-y-6">
                                    {VSCODE_FEATURES.map((feature) => (
                                        <VscodeFeatureCard key={feature.id} feature={feature} />
                                    ))}
                                </div>
                            </section>

                            <DocNavButtons 
                                prev={{ label: "Quickstart", section: "quickstart" }}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    )}



                    {/* ══════════════════════════════════════════════
                        SECURITY & JIT SECTION
                    ══════════════════════════════════════════════ */}
                    {activeSection === "security" && (
                        <div className="space-y-12">
                            {/* Hero card */}
                            <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-8 lg:p-10 shadow-sm">
                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-7">
                                    <div className="h-16 w-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm shrink-0">
                                        <Shield className="h-8 w-8 text-amber-500" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                            <Lock className="h-3 w-3" /> Zero-Trust Security
                                        </div>
                                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Enterprise Security Suite</h1>
                                        <p className="text-muted-foreground max-w-lg leading-relaxed text-sm">
                                            XtraSecurity provides advanced tools to share secrets securely and manage temporary access without permanent credential exposure.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Secret Sharing */}
                            <section id="sharing" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Share2} title="Secret Sharing" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        <strong>Secret Sharing</strong> allows you to generate a unique, end-to-end encrypted link for a specific secret. This is the safest way to send a database password or API key to a teammate or external contractor.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                                        <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">When to use it?</h4>
                                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                                <li>Onboarding a new developer</li>
                                                <li>Sending credentials to a contractor</li>
                                                <li>One-time password transfers</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Security Guards</h4>
                                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                                <li>Self-destructing links</li>
                                                <li>Max view limits (e.g. 1 view)</li>
                                                <li>Passphrase protection</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <PremiumCallout type="note">
                                        Once a share link expires or hits its view limit, the underlying token is purged from our database. The original secret in your vault remains untouched.
                                    </PremiumCallout>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* JIT Access */}
                            <section id="jit" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Zap} title="JIT (Just-In-Time) Access" />
                                <div className="space-y-4 max-w-2xl">
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                                        <strong>JIT Access</strong> implements the principle of least privilege by granting temporary, auditable access to your entire secret vault or specific environments.
                                    </p>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-primary/5 border-primary/20">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                <Activity className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">The Workflow</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    An admin generates a JIT request link. A developer opens the link to request access. Once an admin approves the request, the developer gets access for a limited time (e.g., 60 minutes). Access is automatically revoked when the timer expires.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                <Terminal className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">CLI Injection</h4>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                    Developers can use a specialized CLI command to request and activate JIT access directly from their terminal, allowing them to run apps with production secrets without ever seeing the raw values.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-border/50" />

                            {/* Audit Logs */}
                            <section id="audit" className="space-y-6 scroll-mt-32">
                                <SectionHeader icon={Activity} title="Audit Logs" />
                                <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                                    Every interaction with a shared secret or a JIT session is logged. Admins can see exactly who accessed which secret, from what IP address, and at what time.
                                </p>
                                <div className="p-1 border rounded-xl bg-zinc-950 overflow-hidden shadow-2xl">
                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 border-b border-zinc-800">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                                        <span className="text-[10px] font-mono text-zinc-500 ml-2">audit_log_preview.txt</span>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] leading-relaxed">
                                        <div className="flex gap-4">
                                            <span className="text-zinc-600">[2024-05-01 10:24:12]</span>
                                            <span className="text-emerald-500">ACCESS_GRANTED</span>
                                            <span className="text-zinc-400">User: dev_alice | Secret: DB_PASSWORD | IP: 192.168.1.45</span>
                                        </div>
                                        <div className="flex gap-4 opacity-70">
                                            <span className="text-zinc-600">[2024-05-01 11:24:12]</span>
                                            <span className="text-rose-500">ACCESS_EXPIRED</span>
                                            <span className="text-zinc-400">Session: jit_req_892 | Auto-revoked by System</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <DocNavButtons 
                                prev={{ label: "VS Code Extension", section: "vscode" }}
                                next={{ label: "CLI Reference", section: "cli" }}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </DocLayout>
    );
}

// ── Supporting Components ─────────────────────────────────────────────────────

function StepHeader({ number, title }: { number: number; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {number}
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
                {title}
            </h2>
        </div>
    );
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-muted border border-border flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight uppercase">{title}</h2>
        </div>
    );
}

function CommandCard({ cmd }: { cmd: CommandEntry }) {
    const [copied, setCopied] = useState(false);
    const color = SECTION_COLORS[cmd.section];
    
    const handleCopy = () => {
        navigator.clipboard.writeText(cmd.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const badgeClass = "bg-muted/30 border-border/50 text-muted-foreground";

    return (
        <div className="group relative p-6 rounded-xl bg-transparent border border-border/50 shadow-sm hover:border-border transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 mb-5">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center">
                        <Terminal className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight uppercase">{cmd.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{cmd.description}</p>
                    </div>
                </div>
                <div className={cn("px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-tight", badgeClass)}>
                    {cmd.section}
                </div>
            </div>

            {/* Command line */}
            <div className="relative flex items-center justify-between bg-transparent rounded-md px-4 py-2.5 border border-border font-mono text-sm mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">$</span>
                    <code className="text-foreground font-medium text-[13px] tracking-tight">{cmd.command}</code>
                </div>
                <button 
                    onClick={handleCopy} 
                    className="text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
            </div>

            {/* Long description */}
            {cmd.longDesc && (
                <p className="text-[13px] text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20 mb-4">
                    {cmd.longDesc}
                </p>
            )}

            {/* Options grid */}
            {cmd.options && cmd.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cmd.options.map((opt, i) => (
                        <div key={i} className="px-3 py-2 rounded-md bg-muted/30 border border-border group-hover:border-border/60 transition-all">
                            <div className="flex items-center justify-between mb-1">
                                <code className="text-[10px] font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{opt.flag}</code>
                                {opt.required && <span className="text-[9px] font-medium uppercase text-foreground">Required</span>}
                            </div>
                            <p className="text-[10px] text-muted-foreground/80">{opt.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function VscodeFeatureCard({ feature }: { feature: typeof VSCODE_FEATURES[0] }) {
    return (
        <div className="group p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-5">
                <div className="h-12 w-12 rounded-lg border border-border flex items-center justify-center relative overflow-hidden flex-shrink-0 bg-muted">
                    <Puzzle className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-foreground uppercase tracking-tight">{feature.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-md">{feature.description}</p>
                </div>
            </div>

            {feature.commands && (
                <div className="space-y-2.5 mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">Extension Commands</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {feature.commands.map(cmd => (
                            <div key={cmd.id} className="px-3 py-2 rounded-md bg-muted/40 border border-border hover:bg-muted/60 transition-all">
                                <code className="text-[10px] font-mono font-bold text-primary block mb-1">{cmd.id}</code>
                                <div className="text-xs font-bold text-foreground mb-0.5">{cmd.name}</div>
                                <div className="text-[11px] text-muted-foreground/60">{cmd.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <PremiumCallout type="tip" className="mt-4">
                {feature.tip}
            </PremiumCallout>
        </div>
    );
}

function IntegrationCard({ item }: { item: any }) {
    return (
        <div className="group p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden relative">
            <div className="flex items-center justify-between mb-5">
                <div className="h-14 w-14 rounded-lg bg-transparent border border-border flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <img src={item.logo} className="h-8 w-8 object-contain" alt={item.name} />
                </div>
                <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight text-foreground bg-muted/50 border border-border">
                    Ready
                </div>
            </div>
            <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground tracking-tight">{item.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary/60 group-hover:text-primary transition-colors">
                View docs <ArrowRight className="h-3.5 w-3.5" />
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-20 space-y-3 rounded-xl border border-dashed border-border bg-muted/20">
            <Terminal className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground/50 font-bold uppercase tracking-widest text-[10px]">{message}</p>
        </div>
    );
}

function DocNavButtons({ 
    next, 
    prev,
    setActiveSection
}: { 
    next?: { label: string; section: string }, 
    prev?: { label: string; section: string },
    setActiveSection: (s: string) => void
}) {
    const scrollToTop = () => {
        document.getElementById('docs-content-top')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex items-center justify-between gap-6 pt-12 border-t border-border">
            {prev ? (
                <button 
                    onClick={() => { setActiveSection(prev.section); scrollToTop(); }}
                    className="flex flex-col items-start text-left group"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Previous</span>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2 uppercase">
                        <ChevronRight className="h-4 w-4 rotate-180 text-primary" />
                        {prev.label}
                    </span>
                </button>
            ) : <div />}
            
            {next ? (
                <button 
                    onClick={() => { setActiveSection(next.section); scrollToTop(); }}
                    className="flex flex-col items-end text-right group"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Next</span>
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2 uppercase">
                        {next.label}
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </span>
                </button>
            ) : <div />}
        </div>
    );
}
