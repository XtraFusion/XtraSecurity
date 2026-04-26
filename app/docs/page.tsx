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
    Globe,
    Server,
    ShieldAlert,
    Key,
    ExternalLink,
    ArrowRight,
    Sparkles,
    Activity,
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
                    : []
            }
            tocItems={
                activeSection === 'quickstart' ? ["Introduction", "Install", "Authenticate", "Initialize"] :
                activeSection === 'vscode' ? ["Installation", "Features"] : []
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
                            <DocNavButtons next={{ label: "VS Code Extension", section: "vscode" }} setActiveSection={setActiveSection} />
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
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-[11px] font-semibold tracking-tight text-foreground">
                                    <Shield className="h-3.5 w-3.5" />
                                    Security & JIT
                                </div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">Zero-Trust Security</h1>
                                <p className="text-muted-foreground max-w-2xl">Just-in-time access, rotated credentials, and full audit trails for every secret access.</p>
                            </div>
                            <PremiumCallout type="tip">
                                See the{" "}
                                <button onClick={() => setActiveSection("cli")} className="text-primary font-bold underline underline-offset-2">
                                    CLI Reference
                                </button>{" "}
                                for JIT access commands like <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">xtra jit request</code>.
                            </PremiumCallout>
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
