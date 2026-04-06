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
    Container
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

type CommandOption = { flag: string; desc: string };
type CommandEntry = { command: string; desc?: string; options?: CommandOption[]; section: string };
type DocSection = "quickstart" | "cli" | "sdks" | "integrations" | "security" | "best-practices";

// ── Content Intelligence ──────────────────────────────────────────────────────

const CLI_COMMANDS: CommandEntry[] = [
  { section: "Installation", command: "npm install -g xtra-cli", desc: "Install the XtraSecurity CLI globally via npm" },
  { section: "Security & Compliance", command: "xtra access", desc: "Manage Just-in-Time access requests", options: [{ flag: "-p, --project <projectId>", desc: "Project ID" }, { flag: "-s, --secret <secretId>", desc: "Specific Secret ID (optional)" }, { flag: "--pending", desc: "Show pending approvals" }] },
  { section: "Security & Compliance", command: "xtra audit", desc: "Manage and verify audit logs", options: [{ flag: "-f, --format <format>", desc: "Output format (json, csv)" }, { flag: "--start <date>", desc: "Start date" }, { flag: "--end <date>", desc: "End date" }] },
  { section: "Versioning & Rollback", command: "xtra branch", desc: "Manage workspace branches", options: [{ flag: "-p, --project <projectId>", desc: "Project ID" }] },
  { section: "Versioning & Rollback", command: "xtra checkout", desc: "Switch active branch context", options: [{ flag: "-p, --project <id>", desc: "Project ID" }, { flag: "-e, --env <env>", desc: "Active environment" }] },
  { section: "Administration & Utilities", command: "xtra ci", desc: "CI/CD headless mode — no prompts, machine token auth" },
  { section: "Authentication & Setup", command: "xtra init", desc: "Bootstrap new project — creates .xtrarc", options: [{ flag: "--project <id>", desc: "Skip prompt" }, { flag: "-y, --yes", desc: "Accept defaults" }] },
  { section: "Secret Management", command: "xtra secrets set", desc: "Set secrets (KEY=VALUE)", options: [{ flag: "-f, --force", desc: "Force overwrite" }] },
  { section: "Secret Management", command: "xtra secrets rotate", desc: "Zero-Downtime Shadow Mode rotation", options: [{ flag: "--promote", desc: "Promote shadow to active" }] },
  { section: "Runtime Injection", command: "xtra run", desc: "Inject secrets into process", options: [{ flag: "--shell", desc: "Enable shell mode" }] },
  { section: "Security & Compliance", command: "xtra scan", desc: "Scan for leaks", options: [{ flag: "--staged", desc: "Scan staged files only" }] },
];

const INTEGRATIONS = [
    { id: "github", name: "GitHub Actions", desc: "Automate secret injection in your CI/CD pipelines.", icon: Github, color: "text-[#24292e]" },
    { id: "k8s", name: "Kubernetes", desc: "Sync secrets directly to K8s ExternalSecrets or native Secrets.", icon: Container, color: "text-[#326ce5]" },
    { id: "aws", name: "AWS Secrets Manager", desc: "Bi-directional sync with AWS cloud infrastructure.", icon: Cloud, color: "text-[#FF9900]" },
    { id: "vercel", name: "Vercel", desc: "Deploy with zero-config environment variables.", icon: Triangle, color: "text-foreground" },
];

const SECTIONS = [
    { id: "quickstart", label: "Quickstart", icon: Zap, desc: "Get up and running in 5 minutes" },
    { id: "cli", label: "CLI Reference", icon: Terminal, desc: "Complete command line manual" },
    { id: "sdks", label: "SDKs & Libraries", icon: Code, desc: "Node.js, Python, and Go integration" },
    { id: "integrations", label: "Integrations", icon: Workflow, desc: "Connect your cloud stack" },
    { id: "security", label: "Security & JIT", icon: Shield, desc: "Access control and compliance" },
];

// ── Components ────────────────────────────────────────────────────────────────

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState<DocSection>("quickstart");
    const [searchQuery, setSearchQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Filtered CLI commands
    const filteredCommands = useMemo(() => {
        if (!searchQuery) return CLI_COMMANDS;
        const q = searchQuery.toLowerCase();
        return CLI_COMMANDS.filter(c => 
            c.command.toLowerCase().includes(q) || 
            c.desc?.toLowerCase().includes(q) ||
            c.section.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto flex gap-12 pb-20 items-start">
                
                {/* ── Left Sidebar Navigation ── */}
                <aside className="w-64 shrink-0 sticky top-24 hidden lg:block space-y-8">
                    <div className="space-y-4">
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Documentation</div>
                        <nav className="space-y-1">
                            {SECTIONS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id as DocSection)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-bold",
                                        activeSection === s.id 
                                            ? "bg-primary/5 text-primary border border-primary/10 shadow-sm" 
                                            : "text-muted-foreground hover:bg-muted opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <s.icon className={cn("h-4 w-4", activeSection === s.id ? "text-primary" : "text-muted-foreground")} />
                                    {s.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="space-y-4">
                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Core Concepts</div>
                        <nav className="space-y-1">
                            {["Architecture", "Secret Lifecycle", "Rollbacks", "Audit Engine"].map(concept => (
                                <button key={concept} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors text-left group">
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {concept}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/10 overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                               <Monitor className="h-4 w-4 text-primary" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Join our Slack</h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">Collaborate with our security engineers in the developer community.</p>
                            <Button size="sm" variant="outline" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5">Join Now</Button>
                        </CardContent>
                    </Card>
                </aside>

                {/* ── Main Content Area ── */}
                <main className="flex-1 min-w-0 space-y-12">
                    
                    {/* Top Doc Header */}
                    <header className="space-y-6">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
                           <BookOpen className="h-3.5 w-3.5" />
                           <span>Registry</span>
                           <ChevronRight className="h-3 w-3" />
                           <span className="text-primary">{activeSection.replace('-', ' ')}</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                               <h1 className="text-5xl font-black tracking-tight">{SECTIONS.find(s => s.id === activeSection)?.label}</h1>
                               <p className="text-muted-foreground font-medium text-lg">{SECTIONS.find(s => s.id === activeSection)?.desc}</p>
                            </div>
                            <div className="relative group max-w-xs w-full">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                               <Input 
                                  placeholder="Search documentation..." 
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-10 h-10 rounded-xl bg-muted/30 border-transparent focus:border-border transition-all" 
                               />
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30 px-1.5 py-0.5 border rounded">CMD K</span>
                            </div>
                        </div>
                    </header>

                    <Separator className="opacity-10" />

                    {/* Dynamic Content Sections */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-16"
                        >
                            {/* ── Quickstart Section ── */}
                            {activeSection === "quickstart" && (
                                <div className="space-y-20">
                                    <section className="space-y-8">
                                       <div className="space-y-3">
                                          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                             <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <Zap className="h-4 w-4 text-emerald-500" />
                                             </div>
                                             Getting Started
                                          </h2>
                                          <p className="text-muted-foreground leading-relaxed max-w-2xl">XtraSecurity provides a zero-config secrets engine. You can start managing secrets globally in less than 5 minutes by following these three steps.</p>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                          {[
                                              { step: "01", title: "Installation", body: "Deploy the high-performance CLI globally to your machine.", icon: Smartphone },
                                              { step: "02", title: "Authentication", body: "Secure your workspace using a personal access token.", icon: Shield },
                                              { step: "03", title: "Initialization", body: "Link your local repository to the Xtra cloud engine.", icon: Workflow },
                                          ].map((step, i) => (
                                              <Card key={i} className="group hover:border-primary/40 transition-all bg-card/40 backdrop-blur-sm relative overflow-hidden">
                                                 <div className="absolute -right-4 -top-4 text-6xl font-black opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">{step.step}</div>
                                                 <CardContent className="p-6 space-y-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                                       <step.icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                       <h4 className="font-bold text-sm">{step.title}</h4>
                                                       <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                                                    </div>
                                                 </CardContent>
                                              </Card>
                                          ))}
                                       </div>
                                    </section>

                                    <section className="space-y-8">
                                       <div className="space-y-2">
                                          <h3 className="text-xl font-bold">1. Install the CLI</h3>
                                          <p className="text-sm text-muted-foreground">The Xtra CLI is the primary engine for fetching and injecting secrets.</p>
                                       </div>
                                       <MultiLanguageSnippet 
                                          options={[
                                              { language: "npm", code: "npm install -g xtra-cli" },
                                              { language: "yarn", code: "yarn global add xtra-cli" },
                                              { language: "pnpm", code: "pnpm add -g xtra-cli" },
                                          ]} 
                                       />
                                       <Callout type="tip">
                                          Ensure your terminal is using Node.js v18 or higher for full encryption support.
                                       </Callout>
                                    </section>

                                    <DocNavButtons next={{ label: "CLI Reference", section: "cli" }} />
                                </div>
                            )}

                            {/* ── CLI Reference Section ── */}
                            {activeSection === "cli" && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 gap-6">
                                        {filteredCommands.map((cmd, i) => (
                                            <CommandCard key={i} cmd={cmd} />
                                        ))}
                                    </div>
                                    {filteredCommands.length === 0 && (
                                        <div className="text-center py-20 space-y-4">
                                           <Terminal className="h-12 w-12 mx-auto opacity-10" />
                                           <p className="text-muted-foreground font-medium">No commands matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Integrations Section ── */}
                            {activeSection === "integrations" && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {INTEGRATIONS.map((int) => (
                                            <IntegrationCard key={int.id} item={int} />
                                        ))}
                                    </div>
                                    <Callout type="note">
                                        Custom cloud provider? Use our <span className="text-primary font-bold cursor-pointer hover:underline">Webhook Engine</span> to build your own sync logic.
                                    </Callout>
                                </div>
                            )}

                            {/* Handle other sections similarly... */}
                        </motion.div>
                    </AnimatePresence>

                </main>

                {/* ── Right Table of Contents ── */}
                <aside className="w-48 shrink-0 sticky top-24 hidden xl:block">
                    <div className="space-y-6">
                        <div className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">On this page</div>
                        <nav className="space-y-3">
                           {activeSection === 'quickstart' && [
                               "Introduction", "Getting Started", "1. Installation", "2. Authentication", "3. Initialization"
                           ].map((item, i) => (
                               <a key={i} href="#" className={cn(
                                   "block px-2 text-xs font-semibold py-1 border-l-2 transition-all",
                                   i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                               )}>
                                  {item}
                               </a>
                           ))}
                           {activeSection === 'cli' && [
                               "Overview", "Common Flags", "Installation", "Auth Setup", "Secret Management", "Runtime Injection"
                           ].map((item, i) => (
                               <a key={i} href="#" className={cn(
                                   "block px-2 text-xs font-semibold py-1 border-l-2 transition-all",
                                   i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                               )}>
                                  {item}
                               </a>
                           ))}
                        </nav>
                        
                        <Separator className="opacity-10" />
                        
                        <div className="p-4 rounded-2xl bg-muted/30 border space-y-3">
                           <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                           </div>
                           <p className="text-[10px] text-muted-foreground leading-relaxed">Docs updated <span className="font-bold text-foreground">2 days ago</span> • v2.4.1</p>
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
        <div className="rounded-2xl border bg-[#0d1117] overflow-hidden shadow-2xl group">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/5 border-b border-white/5">
                <div className="flex gap-2">
                    {options.map((opt) => (
                        <button
                            key={opt.language}
                            onClick={() => setActiveLang(opt.language)}
                            className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-md",
                                activeLang === opt.language 
                                    ? "bg-white/10 text-white" 
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {opt.language}
                        </button>
                    ))}
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
                >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </div>
            <div className="p-6 font-mono text-sm overflow-x-auto">
                <div className="flex gap-4">
                    <span className="text-white/20 select-none">1</span>
                    <span className="text-[#79c0ff]">{activeCode}</span>
                </div>
            </div>
        </div>
    );
}

function CommandCard({ cmd }: { cmd: CommandEntry }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(cmd.command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="hover:border-primary/30 transition-all bg-card/60 rounded-2xl group overflow-hidden border">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg">
                           <Command className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-base font-black tracking-tight">{cmd.command}</h3>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black tracking-widest opacity-60 px-2 uppercase">{cmd.section}</Badge>
                </div>
                <CardDescription className="text-sm font-medium pt-2">{cmd.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="relative group/code">
                    <div className="bg-[#0d1117] p-4 rounded-xl font-mono text-xs text-[#79c0ff] overflow-x-auto border border-white/5">
                       {cmd.command}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 opacity-0 group-hover/code:opacity-100 transition-opacity hover:bg-white/20 text-white"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </div>

                {cmd.options && (
                    <div className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Available Options</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cmd.options.map((opt, i) => (
                                <div key={i} className="p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border transition-colors space-y-1">
                                    <code className="text-[11px] font-bold text-primary">{opt.flag}</code>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function IntegrationCard({ item }: { item: any }) {
    return (
        <Card className="hover:border-primary/40 transition-all bg-card/60 backdrop-blur-sm group cursor-pointer overflow-hidden rounded-2xl border">
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <div className={cn("p-4 rounded-2xl bg-muted/30 border border-border/50", item.color)}>
                      <item.icon className="h-8 w-8" />
                   </div>
                   <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-primary" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black tracking-tight">{item.name}</h3>
                   <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-4 flex items-center gap-4">
                   <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified</span>
                   </div>
                   <div className="flex items-center gap-1.5 border-l pl-4">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">High Perf</span>
                   </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Callout({ type, children }: { type: "info" | "warning" | "tip" | "note"; children: React.ReactNode }) {
    const config = {
        info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
        warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
        tip: { icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
        note: { icon: BookOpen, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
    }[type];

    return (
        <div className={cn("p-4 rounded-xl border flex items-start gap-4", config.bg, config.border)}>
            <div className={cn("h-8 w-8 rounded-lg bg-background border flex items-center justify-center shrink-0", config.border)}>
               <config.icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="text-sm font-medium leading-relaxed pt-1">{children}</div>
        </div>
    );
}

function DocNavButtons({ next, prev }: { next?: { label: string; section: string }, prev?: { label: string; section: string } }) {
    return (
        <div className="flex items-center justify-between gap-6 pt-10 border-t opacity-60 hover:opacity-100 transition-opacity">
            {prev ? (
                <button className="flex flex-col items-start text-left group">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Previous Section</span>
                    <span className="text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 rotate-180" /> {prev.label}
                    </span>
                </button>
            ) : <div />}
            {next ? (
                <button className="flex flex-col items-end text-right group">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Next Up</span>
                    <span className="text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                        {next.label} <ChevronRight className="h-4 w-4" />
                    </span>
                </button>
            ) : <div />}
        </div>
    );
}

function Triangle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2L1 21h22L12 2z"/></svg>
    )
}
