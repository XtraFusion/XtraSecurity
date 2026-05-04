"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Docs", href: "/docs" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Compare", href: "/comparison" },
  { label: "About", href: "/about" },
];

const STATS = [
  { num: "500+", label: "Engineering teams trust XtraSecurity" },
  { num: "99.99%", label: "Uptime SLA maintained" },
  { num: "0", label: "Confirmed breaches in production" },
  { num: "<50ms", label: "Average secret fetch latency" },
];

const FEATURES = [
  {
    icon: "lock",
    title: "Centralized Secret Vault",
    desc: "One encrypted home for all your secrets. Organized by project & environment with instant rollback.",
    details: "Built with AES-256-GCM encryption, our vault ensures no plaintext ever touches the disk. Versioning is immutable by default, allowing you to trace ogni mutazione with SHA-256 integrity checks.",
    chips: ["AES-256-GCM", "Versioning", "Shadow Rotation"],
    color: "#3b82f6",
  },
  {
    icon: "leaf",
    title: "Git-like Versioning",
    desc: "Branching, diffs, and merges for secrets. Safely test changes in ephemeral branches.",
    details: "XtraSecurity introduces real-time secret comparisons and branch isolation. Promote changes from staging to prod with confidence using our 'Dry-run merge' CLI feature.",
    chips: ["Branching", "Diff Visualization", "Rollback"],
    color: "#10b981",
  },
  {
    icon: "search",
    title: "Security Intelligence",
    desc: "Automated scanning for leaked secrets. Real-time health dashboards & stale warnings.",
    details: "Our scan engine matches against 140+ secret types and custom patterns. Integrated with GitHub Webhooks for automated PR scanning before merge.",
    chips: ["Secret Scanning", "Health Dashboard", "Stale Warnings"],
    color: "#a855f7",
  },
  {
    icon: "puzzle",
    title: "Developer First",
    desc: "Native VS Code extension, multi-env sync, and a CLI that injects secrets in-memory.",
    details: "The xtra-cli connects directly to your app's process memory — zero storage reliance. The official VS Code extension provides live intellisense, leak scanning, and drift detection.",
    chips: ["VS Code Ext", "Direct CLI", "Multi-Env Sync"],
    link: "https://marketplace.visualstudio.com/items?itemName=XtraSecurity.xtra-vscode",
    color: "#f97316",
  },
  {
    icon: "users",
    title: "Enterprise Governance",
    desc: "Fine-grained RBAC with IP-level controls. Service accounts and JIT access reviews.",
    details: "Implement JIT (Just-In-Time) access that auto-expires after use. Our engine supports attribute-based access control (ABAC) for complex multi-regional teams.",
    chips: ["RBAC + ABAC", "JIT Access", "Service Accounts"],
    color: "#06b6d4",
  },
  {
    icon: "eye",
    title: "Immutable Compliance",
    desc: "Tamper-proof, SHA-256 audit logs. SOC 2 and ISO 27001 reports with one click.",
    details: "XtraSecurity logs are chained and cryptographically signed. No admin — not even yours — can modify past activity, making us ready for any audit out-of-the-box.",
    chips: ["SHA-256 Logs", "SOC 2 Export", "Audit Chain"],
    color: "#ec4899",
  },
];

const STEPS = [
  {
    num: "01",
    icon: "hard-drive",
    title: "Create & Store",
    body: "Add secrets to the encrypted vault. Organize by project and environment. RBAC & IP restrictions applied immediately.",
  },
  {
    num: "02",
    icon: "key",
    title: "Authenticate",
    body: "Humans use CLI with SSO/MFA. Machines use IP-restricted service accounts. Access denied by default.",
  },
  {
    num: "03",
    icon: "zap",
    title: "Fetch & Inject",
    body: "SDK decrypts secrets in-memory at startup. Zero disk exposure. Apps get live secrets, no .env files.",
  },
  {
    num: "04",
    icon: "clipboard-list",
    title: "Audit & Rotate",
    body: "Every access is logged permanently. Auto-rotate on schedule. Quarterly access reviews keep permissions fresh.",
  },
];

const SECURITY_PILLARS = [
  { icon: "lock", title: "AES-256-GCM Encryption", body: "All secrets encrypted at rest and in transit. Zero plaintext ever stored in the database or in memory beyond the active process." },
  { icon: "globe", title: "IP Allowlisting", body: "Every API request is checked against workspace-level and per-project IP allowlists. Unauthorized IPs are rejected before any auth check." },
  { icon: "refresh-cw", title: "Auto Secret Rotation", body: "Stale credentials auto-rotate on a configurable schedule. Shadow rotation swaps values in the background with zero downtime." },
  { icon: "alert-circle", title: "Real-Time Alerts", body: "Slack and webhook alerts for logins, revocations, anomalies, and critical events. Anomaly detection with risk scoring on every API event." },
  { icon: "clipboard-list", title: "Immutable Audit Trail", body: "Tamper-proof, append-only, SHA-256 chained log of every action. No admin — including yours — can delete or modify past events." },
  { icon: "home", title: "On-Premise Deployment", body: "Enterprise teams can self-host entirely inside their own infrastructure. Full control, no cloud dependency, no data leaves your perimeter." },
];

const METRICS = [
  { num: "99.99%", label: "Uptime SLA" },
  { num: "500+", label: "Engineering Teams" },
  { num: "<50ms", label: "Secret Fetch Latency" },
  { num: "0", label: "Confirmed Breaches" },
];

const PRICING = [
  {
    plan: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for personal projects and small teams getting started.",
    featured: false,
    cta: "Upgrade now",
    features: [
      { label: "1000 API requests / day", ok: true },
      { label: "1 Workspace & 1 Team", ok: true },
      { label: "3 Projects", ok: true },
      { label: "50 secrets per project", ok: true },
      { label: "20 branch limit", ok: true },
      { label: "30-day audit logs", ok: true },
      { label: "CLI & SDK access", ok: true },
      { label: "RBAC & Slack alerts", ok: true },
      { label: "JIT Access", ok: false },
      { label: "IP Allowlisting", ok: false },
    ],
  },
  {
    plan: "Pro",
    price: "$29",
    originalPrice: "$49",
    period: "/ month",
    desc: "For engineering teams who need serious security controls and compliance automation.",
    featured: true,
    badge: "Most Popular - 40% Off",
    cta: "Start free trial",
    features: [
      { label: "10,000 API requests / day", ok: true },
      { label: "3 Workspaces (5 projects each)", ok: true },
      { label: "100 secrets per project", ok: true },
      { label: "30 branch limit", ok: true },
      { label: "1-year audit logs", ok: true },
      { label: "JIT Access & Secret Rotation", ok: true },
      { label: "IP Blocking & DDoS Detection", ok: true },
      { label: "RBAC + Slack Alerts", ok: true },
      { label: "SSO / SAML", ok: false },
    ],
  },
  {
    plan: "Enterprise",
    price: "Custom",
    period: "pricing",
    desc: "Full control and enterprise-grade features for critical security requirements.",
    featured: false,
    cta: "Talk to sales →",
    features: [
      { label: "100,000+ API requests / day", ok: true },
      { label: "Unlimited everything", ok: true },
      { label: "SSO / SAML", ok: true },
      { label: "On-Premise Deployment", ok: true },
      { label: "SOC 2 / ISO 27001 Reports", ok: true },
      { label: "Dedicated Support", ok: true },
      { label: "SLA Guarantee", ok: true },
      { label: "Custom audit log retention", ok: true },
    ],
  },
];

const AWS_ROWS = [
  { feature: "Setup complexity", competitor: "High — IAM, KMS, VPCs", us: "✓ Under 2 minutes" },
  { feature: "Pricing", competitor: "$0.40/secret/month + API costs", us: "✓ Flat $9/mo, unlimited secrets" },
  { feature: "Versioning", competitor: "Simple numeric versioning", us: "✓ Git-like branching & diffs" },
  { feature: "Developer CLI", competitor: "AWS CLI (generic)", us: "✓ xtra run — purpose-built" },
  { feature: "Audit Logs", competitor: "CloudTrail (extra cost)", us: "✓ Included, tamper-proof" },
];

const DOPPLER_ROWS = [
  { feature: "Versioning", competitor: "✗ Simple log only", us: "✓ Git-like branching & diffs" },
  { feature: "JIT Access", competitor: "✗ No time-bound access", us: "✓ Full JIT + auto-revocation" },
  { feature: "Access Reviews", competitor: "✗ No formal reviews", us: "✓ Built-in quarterly reviews" },
  { feature: "Shadow Rotation", competitor: "✗ Not available", us: "✓ Zero-downtime background swap" },
  { feature: "On-premise", competitor: "✗ Not available", us: "✓ Enterprise self-hosting" },
];

const INTEGRATIONS = [
  { label: "GitHub", logo: "https://img.icons8.com/fluency/48/github.png" },
  { label: "AWS", logo: "https://img.icons8.com/color/48/amazon-web-services.png" },
  { label: "Slack", logo: "https://img.icons8.com/color/48/slack-new.png" },
  { label: "Vercel", logo: "https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" },
  { label: "Google Cloud", logo: "https://img.icons8.com/color/48/google-cloud.png" },
  { label: "Azure", logo: "/azure-logo.svg" },
  { label: "GitLab", logo: "https://img.icons8.com/color/48/gitlab.png" },
];

const FORTRESS_FEATURES = [
  {
    title: "Decentralized Encryption",
    body: "Even if XtraSecurity servers are breached, your secrets remain encrypted. The master key is never stored in one place; it's split across hardware HSMs.",
    icon: "shield",
  },
  {
    title: "Zero-Knowledge Architecture",
    body: "Our engineers cannot see your secrets. Plaintext values are only reconstructed inside your authenticated client process or isolated workers.",
    icon: "eye",
  },
  {
    title: "Hardware-Bound Access",
    body: "Access is tied to the unique hardware ID of your machine. A stolen CLI token is useless on another device, creating an unbreakable link.",
    icon: "cpu",
  },
  {
    title: "JIT Isolation",
    body: "Secrets aren't accessible by default. High-stakes credentials require temporary Just-In-Time approval, with windows as small as 15 minutes.",
    icon: "zap",
  },
];

const LOGS = [
  { platform: "GitHub", message: "Secret \"PROD_DB_URL\" synced to 12 environments", time: "2s ago", icon: "github", color: "#24292e" },
  { platform: "AWS", message: "Key rotation completed for \"IAM_ACCESS_KEY\" (Shadow Mode)", time: "15s ago", icon: "cloud", color: "#FF9900" },
  { platform: "Slack", message: "Alert: JIT access granted to developer @alex (Duration: 2h)", time: "45s ago", icon: "message-circle", color: "#4A154B" },
  { platform: "Vercel", message: "48 secrets injected into build \"prj_123456\"", time: "1m ago", icon: "triangle", color: "white" },
  { platform: "Azure", message: "Security scan: 0 leaked secrets found in repo \"xtra-core\"", time: "3m ago", icon: "shield", color: "#0078D4" },
  { platform: "GitLab", message: "Project \"api-gateway\" secrets synchronized", time: "5m ago", icon: "github", color: "#FC6D26" },
  { platform: "Terraform", message: "Plan: 5 secrets to be updated in \"tf-prod-vpc\"", time: "8m ago", icon: "box", color: "#7B42BC" },
  { platform: "K8s", message: "ExternalSecrets sync successful in namespace \"default\"", time: "12m ago", icon: "container", color: "#326ce5" },
];

const FAQs = [
  {
    q: "How is XtraSecurity different from AWS Secrets Manager?",
    a: "XtraSecurity is purpose-built for teams. We offer Git-like versioning, zero-downtime shadow rotation, and a purpose-built CLI—not a generic cloud tool. AWS Secrets Manager is lower-level infra; XtraSecurity is your team's vault."
  },
  {
    q: "Can I rotate secrets without downtime?",
    a: "Yes. Our Shadow Rotation feature swaps secret values in the background while your app continues running. The new value is live instantly with zero disruption."
  },
  {
    q: "Do I need to store secrets in .env files?",
    a: "No. Our SDK fetches secrets at startup and injects them into memory. No plaintext files on disk, ever. The CLI supports direct injection into your process."
  },
  {
    q: "What if I'm on a free plan and want to upgrade?",
    a: "Upgrade anytime with one click. No downtime. Full access to your secrets, history, and audit logs remains intact. We'll pro-rate your first billing cycle."
  },
  {
    q: "Can we self-host XtraSecurity?",
    a: "Yes. Enterprise customers can deploy XtraSecurity entirely on-premises. Full control, no cloud dependency, data never leaves your network."
  },
  {
    q: "Is there a trial period?",
    a: "Our free plan is permanent with 1000 API requests/day and basic RBAC. Teams can start for free and upgrade to paid plans anytime. No credit card needed."
  },
];

const TERMINAL_LINES = [
  { type: "cmd", text: "" },
  { type: "success", text: "✓ Found 12 secrets for environment: production" },
  { type: "success", text: "✓ Branch 'fix/api-keys' merged into 'main'" },
  { type: "success", text: "✓ Injecting secrets into process memory..." },
  { type: "success", text: "✓ Running application without .env files" },
  { type: "warn", text: "⚑ Audit log entry: secrets accessed by UserID: 412" },
  { type: "dim", text: "→ Server started on port 3000" },
];

// ─────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const fadeUpStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Loader2, Lock, Leaf, Search, Puzzle, Users, Eye, Globe, RefreshCw, AlertCircle, ClipboardList, Home, HardDrive, Key, Zap, Github, Cloud, MessageCircle, Link as LinkIcon, Shield, Folder, Workflow, Cpu, History, ShieldCheck, GitBranch, ArrowRight, Layers } from "lucide-react";

// ─────────────────────────────────────────────
// ICON HELPER
// ─────────────────────────────────────────────

function getIcon(iconName: string, size: number = 24) {
  const iconMap: { [key: string]: string } = {
    lock: "lock",
    leaf: "natural-food",
    search: "search",
    puzzle: "puzzle",
    users: "groups",
    eye: "visible",
    globe: "globe",
    "refresh-cw": "refresh",
    "alert-circle": "error",
    "clipboard-list": "list",
    home: "home",
    "hard-drive": "hard-drive",
    key: "key",
    zap: "lightning-bolt",
    github: "github",
    cloud: "cloud",
    "message-circle": "speech-bubble",
    link: "link",
    shield: "shield",
    folder: "folder",
    workflow: "workflow",
    cpu: "cpu",
    history: "past",
    "shield-check": "verified-badge",
    "git-branch": "git-branch",
    settings: "settings"
  };

  const name = iconMap[iconName] || iconName;
  // Use fluency as primary, but some icons are better in 'color' style
  const style = ["git-branch", "github"].includes(name) ? "color" : "fluency";
  
  return (
    <img 
      src={`https://img.icons8.com/fluency/96/${name}.png`} 
      width={size} 
      height={size}
      alt={`${iconName} icon - Environment Manager feature`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = `https://img.icons8.com/color/96/${name}.png`;
      }}
      style={{ width: size, height: size, filter: "drop-shadow(0 0 10px rgba(14,165,233,0.3))" }}
    />
  );
}

// ─────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
      {children}
    </div>
  );
}

function SectionHeader({
  label,
  title,
  sub,
  icon,
}: {
  label: string;
  title: React.ReactNode;
  sub?: string;
  icon?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUpStagger}
      className="text-center mb-16"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-4">
        {icon && <div className="text-cyan-400 flex items-center justify-center">{getIcon(icon, 24)}</div>}
        <SectionLabel>{label}</SectionLabel>
      </motion.div>
      <motion.h2
        variants={fadeUp}
        className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4 leading-[1.1] max-w-2xl mx-auto"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          variants={fadeUp}
          className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto"
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      // Anchor link — smooth scroll
      const el = document.querySelector(href);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else {
      // Page route — navigate
      router.push(href);
    }
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 transition-all duration-300 ${scrolled
        ? "bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl"
        : "bg-transparent"
        }`}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white no-underline">
        <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo - The Ultimate Environment Manager" width={28} height={28} className="rounded-md" />
        <span className="text-white">Xtra<span className="text-cyan-400">Security</span></span>
      </Link>

      {/* Desktop Nav */}
      <ul className="hidden md:flex items-center gap-1 list-none">
        {NAV_LINKS.map((l) => (
          <li key={l.href}>
            <button
              onClick={() => handleNav(l.href)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer bg-transparent border-none font-[inherit]"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-2">

        {status === "loading" ? (
          <div className="hidden md:flex px-4 py-2 h-9 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : session ? (
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all no-underline"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 0 20px rgba(14,165,233,0.3)" }}>
              Go to Dashboard →
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer bg-transparent"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/login" className="hidden md:flex px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all no-underline"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: "0 0 20px rgba(14,165,233,0.3)" }}>
            Get started →
          </Link>
        )}

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] text-white flex items-center justify-center cursor-pointer bg-transparent"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-[#0d1526]/95 backdrop-blur-xl border-b border-white/[0.06] p-4 flex flex-col gap-2"
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNav(l.href)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] text-left transition-all cursor-pointer bg-transparent border-none font-[inherit]"
              >
                {l.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              {status === "loading" ? (
                <div className="flex-1 flex justify-center py-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : session ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white no-underline"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>Dashboard</Link>
                  <button
                    onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 bg-red-500/10 cursor-pointer font-[inherit]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white no-underline"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>Get started</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function Terminal() {
  const [lines, setLines] = useState(0);

  useEffect(() => {
    TERMINAL_LINES.forEach((_, i) => {
      setTimeout(() => setLines(i + 1), 500 + i * 380);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto mt-16 rounded-2xl overflow-hidden border border-white/[0.08]"
      style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)" }}
    >
      {/* Bar */}
      <div className="flex items-center gap-2 px-5 py-3.5 bg-[#111827] border-b border-white/[0.06]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="flex-1 text-center text-xs text-slate-500 font-mono">xtra — terminal</span>
      </div>
      {/* Body */}
      <div className="bg-[#0d1117] p-6 min-h-[200px] font-mono text-sm leading-8">
        <AnimatePresence>
          {TERMINAL_LINES.slice(0, lines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {line.type === "cmd" ? (
                <div className="flex gap-3">
                  <span className="text-cyan-400">$</span>
                  <span className="text-slate-200">
                    <span className="text-cyan-400">xtra</span>
                    <span className="text-slate-200"> run </span>
                    <span className="text-amber-400">--env production</span>
                    <span className="text-slate-500"> -- npm start</span>
                  </span>
                </div>
              ) : (
                <div className={`pl-5 ${line.type === "success" ? "text-emerald-400" :
                  line.type === "warn" ? "text-amber-400" : "text-slate-500"
                  }`}>
                  {line.text}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {lines <= TERMINAL_LINES.length && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-600 font-mono text-sm">$</span>
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[900px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, rgba(6,182,212,0.07) 40%, transparent 70%)" }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur text-xs font-semibold text-slate-400 mb-8"
      >
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: "linear-gradient(135deg, hsl(220 90% 50%), hsl(45 100% 45%))" }}>✦</span>
        Ultimate Environment Manager & .env Security Tool
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-5xl md:text-8xl font-black tracking-tight leading-[0.9] max-w-4xl mb-8"
      >
        <span className="text-white">The Environment Manager</span>
        <br />
        <span style={{
          background: "linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Built for .env Security.
        </span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed font-medium"
      >
        Manage your environment variables and .env files securely. 
        Collaborate with your team using an encrypted vault designed for modern engineering.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-3 mb-10"
      >
        <motion.a
          href="/login"
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white no-underline"
          style={{
            background: "linear-gradient(135deg, hsl(220 90% 50%), hsl(220 90% 38%), hsl(45 100% 45%))",
            boxShadow: "0 4px 24px rgba(37,99,235,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          Start for free
        </motion.a>
        <motion.a
          href="/login"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white border border-white/15 hover:border-white/25 hover:bg-white/[0.04] transition-all no-underline"
        >
          Log into workspace →
        </motion.a>
      </motion.div>

      {/* Trust */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-5 mb-0"
      >
        {[
          "✓ No credit card required",
          "✓ Free plan forever",
          "✓ SOC 2 compliant",
          "✓ AES-256 encrypted",
          "✓ 500+ teams trust us"
        ].map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            {t}
          </div>
        ))}
      </motion.div>

      <Terminal />
    </section>
  );
}

// ─────────────────────────────────────────────
// TRUST BANNER
// ─────────────────────────────────────────────

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative z-10 border-t border-b border-white/[0.04] bg-[#0a0f1e] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Trusted by teams shipping to production
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-white/[0.04]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-center px-4"
          >
            <div className="text-xl md:text-2xl font-black text-white mb-1.5">AES-256-GCM</div>
            <div className="text-xs text-slate-400">Zero-Knowledge Encryption</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center px-4"
          >
            <div className="text-2xl md:text-3xl font-black text-white mb-1.5">50+</div>
            <div className="text-xs text-slate-400">Platform integrations</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center px-4"
          >
            <div className="text-2xl md:text-3xl font-black text-white mb-1.5">2 min</div>
            <div className="text-xs text-slate-400">Setup time</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center px-4"
          >
            <div className="text-2xl md:text-3xl font-black text-white mb-1.5">100%</div>
            <div className="text-xs text-slate-400">Audit trail coverage</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FEATURES BENTO GRID
// ─────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-32 px-6 bg-[#0a0f1e]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight">
            Best environment variable manager for developers
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Built for how modern teams actually work. Where humans, pipelines, and AI agents all need secrets to operate.
          </p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Large image card */}
          <motion.div variants={fadeUp} className="md:col-span-2 relative group flex flex-col rounded-3xl border border-white/10 bg-[#111318] hover:border-white/20 transition-all overflow-hidden h-[420px] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/40 to-transparent z-10 pointer-events-none" />
            
            <div className="absolute top-0 left-0 w-full h-[320px] overflow-hidden rounded-t-3xl">
              <img 
                src="/landing page hero image.png" 
                alt="XtraSecurity Environment Manager Dashboard - Securely manage .env files and API keys" 
                className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-700"
              />
            </div>

            <div className="relative z-20 mt-auto p-8 pt-12">
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Centralized Secret Vault</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed max-w-md">
                One encrypted home for all your secrets. Organized by project & environment with instant rollback and granular access controls.
              </p>
              <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-cyan-400 transition-colors">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Permissions UI */}
          <motion.div variants={fadeUp} className="relative group flex flex-col rounded-3xl border border-white/10 bg-[#111318] hover:border-white/20 transition-all overflow-hidden h-[420px] shadow-2xl">
            
            <div className="absolute top-0 left-0 w-full h-[250px] flex items-center justify-center p-6 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="relative w-full h-full max-w-[280px]">
                {/* Back Panel */}
                <div className="absolute top-4 left-0 right-12 bg-[#1a1d24] rounded-xl border border-white/10 p-5 shadow-2xl opacity-60">
                   <div className="text-xs font-bold text-white mb-4">Workspace Permissions</div>
                   <div className="space-y-3">
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-cyan-500/80 flex items-center justify-center text-[10px] text-white">-</div><div className="text-[11px] font-medium text-slate-300">All Permissions</div></div>
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-cyan-500/80 flex items-center justify-center text-[10px] text-white">✓</div><div className="text-[11px] font-medium text-slate-300">Project Access</div></div>
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-cyan-500/80 flex items-center justify-center text-[10px] text-white">✓</div><div className="text-[11px] font-medium text-slate-300">Admin on All Projects</div></div>
                   </div>
                </div>
                {/* Front Panel */}
                <div className="absolute bottom-4 right-0 left-12 bg-[#20242d] rounded-xl border border-white/20 p-5 shadow-2xl backdrop-blur-xl group-hover:-translate-y-2 group-hover:shadow-cyan-500/10 transition-all duration-500">
                   <div className="text-xs font-bold text-white mb-4">Project Permissions</div>
                   <div className="space-y-3">
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-cyan-500/80 flex items-center justify-center text-[10px] text-white font-medium">-</div><div className="text-[11px] text-white font-bold">All Permissions</div></div>
                     <div className="flex items-center gap-3 pl-2"><div className="w-4 h-4 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/50">-</div><div className="text-[11px] font-medium text-slate-400">Environments</div></div>
                     <div className="flex items-center gap-3 pl-4"><div className="w-4 h-4 rounded-md bg-cyan-500/80 flex items-center justify-center text-[10px] text-white">✓</div><div className="text-[11px] font-medium text-slate-300">Create Environments</div></div>
                   </div>
                </div>
              </div>
            </div>

            <div className="relative z-20 mt-auto p-8">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Eliminate secrets sprawl</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                49% of breaches involve credentials. Secure your infrastructure with strict RBAC policies.
              </p>
              <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-cyan-400 transition-colors">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Card 3: Automate your APIs */}
          <motion.div variants={fadeUp} className="relative group flex flex-col rounded-3xl border border-white/10 bg-[#111318] hover:border-white/20 transition-all overflow-hidden h-[420px] shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[250px] flex items-center justify-center bg-gradient-to-b from-white/[0.02] to-transparent">
               <div className="flex items-center gap-4 group-hover:gap-6 transition-all duration-500">
                 <div className="w-16 h-16 rounded-3xl bg-[#1a1d24] border border-white/10 flex items-center justify-center shadow-2xl relative">
                   <div className="absolute inset-0 bg-white/5 rounded-3xl blur-md" />
                   <RefreshCw className="w-6 h-6 text-slate-400 relative z-10" />
                 </div>
                 <div className="text-slate-600 text-lg">→</div>
                 <div className="w-20 h-20 rounded-3xl bg-[#20242d] border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] relative z-10">
                   <div className="absolute inset-0 bg-cyan-500/10 rounded-3xl blur-md" />
                   <Layers className="w-8 h-8 text-cyan-400 relative z-10" />
                 </div>
                 <div className="text-slate-600 text-lg">→</div>
                 <div className="w-16 h-16 rounded-3xl bg-[#1a1d24] border border-white/10 flex items-center justify-center shadow-2xl relative">
                   <div className="absolute inset-0 bg-white/5 rounded-3xl blur-md" />
                   <Zap className="w-6 h-6 text-slate-400 relative z-10" />
                 </div>
               </div>
            </div>

            <div className="relative z-20 mt-auto p-8">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Automate your APIs</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                Empower your growing teams and ensure your DevOps infrastructure scales efficiently.
              </p>
              <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-cyan-400 transition-colors">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
          
          {/* Card 4: Audit Logs (spanning 2 cols) */}
          <motion.div variants={fadeUp} className="md:col-span-2 relative group flex flex-col rounded-3xl border border-white/10 bg-[#111318] hover:border-white/20 transition-all overflow-hidden h-[420px] shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/2 h-full p-8 flex items-center justify-end">
              <div className="w-[120%] h-[80%] bg-[#1a1d24] rounded-xl border border-white/10 overflow-hidden relative shadow-2xl transform translate-x-12 group-hover:translate-x-8 transition-transform duration-700">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111318] z-10 pointer-events-none" />
                 <div className="p-6 space-y-4 opacity-80">
                   {LOGS.slice(0,5).map((log, i) => (
                     <div key={i} className="flex items-start gap-4">
                       <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-xs text-cyan-400 font-bold">✓</div>
                       <div>
                         <div className="text-xs font-medium text-slate-200 mb-1">{log.message}</div>
                         <div className="text-[10px] text-slate-500 font-mono">{log.time}</div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            <div className="relative z-20 mt-auto p-8 w-full md:w-1/2 h-full flex flex-col justify-end">
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Immutable Audit Logs</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed max-w-sm">
                Cryptographically verifiable logs of every read, write, and sync action. Tamper-proof by design, making SOC 2 compliance effortless.
              </p>
              <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:text-cyan-400 transition-colors">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-[#0a0f1e] overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">
            HOW XTRASECURITY WORKS
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight">
            Four steps to absolute security
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4 relative"
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center group"
            >
              {/* SVG Arrow connecting to the next step */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[40px] pointer-events-none z-0">
                  <svg viewBox="0 0 100 40" fill="none" preserveAspectRatio="none" className="w-full h-full text-white/[0.05] group-hover:text-cyan-500/30 transition-colors duration-500">
                    <path d="M0,35 C30,-5 70,-5 100,35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" fill="none" />
                    <path d="M92,25 L102,36 L88,38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}

              {/* 3D Number */}
              <div 
                className="text-[80px] font-black italic mb-10 relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:-translate-x-2"
                style={{
                  color: "#f8fafc",
                  textShadow: `
                    1px 1px 0px #cbd5e1,
                    2px 2px 0px #94a3b8,
                    3px 3px 0px #64748b,
                    4px 4px 0px #475569,
                    5px 5px 0px #0ea5e9,
                    6px 6px 0px #0284c7,
                    7px 7px 0px #0369a1,
                    8px 8px 0px #075985,
                    15px 15px 25px rgba(0,0,0,0.6)
                  `,
                  WebkitTextStroke: "1px #ffffff"
                }}
              >
                {parseInt(s.num, 10)}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-4 tracking-tight px-4">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed px-4 md:px-2">
                {s.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────

function SecurityFortress() {
  return (
    <section id="fortress" className="py-32 px-6 relative overflow-hidden bg-[#0a0f1e]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="max-w-[1300px] mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          
          {/* Left Side: Text & CTAs */}
          <div className="w-full lg:w-[40%] xl:w-[35%]">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4 text-cyan-500" fill="currentColor" fillOpacity={0.2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
                Explore Features
              </span>
            </div>
            
            <h2 className="text-4xl md:text-[3.25rem] font-medium text-white mb-6 leading-[1.1] tracking-tight">
              Assume Breach.<br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-cyan-400">Stay Secure.</span>
            </h2>
            
            <p className="text-[15px] text-slate-400 mb-10 leading-relaxed max-w-[400px]">
              XtraSecurity is architected on the principle of <strong className="text-slate-200 font-semibold">Zero-Knowledge</strong>. Our infrastructure is mathematically incapable of accessing your plaintext secrets.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/docs" className="px-6 py-3 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-black text-white font-bold text-sm transition-colors shadow-xl">
                Try for free!
              </Link>
              <Link href="/docs/cli" className="px-6 py-3 rounded-lg bg-transparent hover:bg-white/5 text-slate-300 font-bold text-sm transition-colors">
                View Demo &gt;
              </Link>
            </div>
          </div>

          {/* Right Side: Climbing Cards (3 items) */}
          <div className="w-full lg:w-[60%] xl:w-[65%] relative mt-16 lg:mt-0">
            <div className="flex flex-col sm:flex-row items-end justify-center gap-6 pb-24">
              {FORTRESS_FEATURES.slice(0, 3).map((f, i) => {
                // Determine styling based on index to match the 3 icons in the image
                let iconUrl = "";
                let glowColor = "";
                if (i === 0) {
                  // Orange icon
                  iconUrl = "https://img.icons8.com/fluency/96/lock.png";
                  glowColor = "bg-orange-500/20";
                } else if (i === 1) {
                  // Pink icon
                  iconUrl = "https://img.icons8.com/fluency/96/shield.png";
                  glowColor = "bg-pink-500/20";
                } else {
                  // Blue icon
                  iconUrl = "https://img.icons8.com/fluency/96/visible.png";
                  glowColor = "bg-blue-500/20";
                }

                // Climbing offsets: 1st is lowest (translate-y-24), 2nd middle (translate-y-12), 3rd highest (translate-y-0)
                const translateY = i === 0 ? "sm:translate-y-24" : i === 1 ? "sm:translate-y-12" : "sm:translate-y-0";

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.15 }}
                    key={f.title} 
                    className={`group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-500 shadow-2xl flex flex-col items-center text-center hover:-translate-y-2 w-full sm:w-[280px] h-[320px] ${translateY}`}
                  >
                    {/* Glowing Squircle Icon Container */}
                    <div className="mb-8 mt-4 relative">
                      {/* Diffuse colored glow behind icon */}
                      <div className={`absolute inset-0 ${glowColor} blur-2xl rounded-full scale-[2] group-hover:scale-[2.5] transition-all duration-500 pointer-events-none`} />
                      
                      <div className="w-20 h-20 rounded-[1.25rem] bg-white border border-white/20 flex items-center justify-center relative z-10 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
                        <img 
                          src={iconUrl} 
                          alt={f.title} 
                          className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </div>

                    <h4 className="text-white font-bold mb-3 text-[16px] whitespace-nowrap">{f.title}</h4>
                    <p className="text-[13px] text-slate-400 leading-relaxed mx-auto line-clamp-3">{f.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────
// METRICS BAR
// ─────────────────────────────────────────────

function MetricsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="border-t border-b border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="py-10 px-6 text-center border-r border-white/[0.06] last:border-r-0"
          >
            <div className="text-4xl font-black text-cyan-400 mb-1.5">{m.num}</div>
            <div className="text-sm text-slate-500">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="💳 Pricing"
          title={<>Simple, flat pricing.<br /><span className="text-cyan-400">No per-secret fees.</span></>}
          sub="No vendor lock-in. No hidden fees. Start for free and scale when you're ready."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {PRICING.map((plan) => (
            <div key={plan.plan} className="relative flex flex-col" style={{ paddingTop: plan.featured ? "28px" : "0" }}>

              {/* Most Popular badge — floats above the card */}
              {plan.featured && (
                <motion.div
                  initial={{ y: -8, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{
                    background: "linear-gradient(90deg, #b8860b, #f5c842, #b8860b)",
                    color: "#1a1000",
                    boxShadow: "0 2px 16px rgba(196,160,32,0.4)",
                  }}
                >
                  ★ Most Popular
                </motion.div>
              )}

              <motion.div
                variants={scaleIn}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl border overflow-hidden h-full flex flex-col"
                style={plan.featured ? {
                  background: "#0d1017",
                  borderColor: "rgba(196,160,32,0.55)",
                  boxShadow: "0 0 0 1px rgba(196,160,32,0.15), 0 24px 48px -12px rgba(0,0,0,0.6)",
                } : {
                  background: "rgba(255,255,255,0.025)",
                  borderColor: "rgba(255,255,255,0.07)",
                  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.3)",
                }}
              >
                {/* Gold top line for featured */}
                {plan.featured && (
                  <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                    style={{ background: "linear-gradient(90deg, transparent, #f5c842, #d4a017, #f5c842, transparent)" }} />
                )}

                <div className="relative z-10 p-8 flex flex-col h-full">
                  {/* Plan label + discount chip */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: plan.featured ? "#d4a017" : "#64748b" }}>
                      {plan.plan}
                    </span>
                    {plan.featured && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: "rgba(212,160,23,0.15)", color: "#f5c842", border: "1px solid rgba(212,160,23,0.3)" }}>
                        69% off
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-end gap-2.5 mb-1">
                    {plan.originalPrice && (
                      <span className="text-lg line-through mb-1.5 font-medium" style={{ color: "#475569" }}>
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="font-black tracking-tight leading-none text-white"
                      style={{ fontSize: plan.featured ? "60px" : "48px" }}>
                      {plan.price}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mb-5 font-medium">{plan.period}</div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{plan.desc}</p>

                  {/* Divider */}
                  <div className="h-px mb-6"
                    style={{ background: plan.featured ? "linear-gradient(90deg, rgba(212,160,23,0.25), rgba(212,160,23,0.06), transparent)" : "rgba(255,255,255,0.07)" }} />

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 list-none p-0 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-0.5 flex-shrink-0 text-[11px]"
                          style={{ color: f.ok ? (plan.featured ? "#d4a017" : "#34d399") : "#334155" }}>
                          {f.ok ? "✓" : "−"}
                        </span>
                        <span style={{ color: f.ok ? (plan.featured ? "#e2c97e" : "#cbd5e1") : "#334155" }}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.a
                    href={plan.plan === "Enterprise" ? "/contact" : "/login"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold no-underline transition-all"
                    style={plan.featured ? {
                      background: "linear-gradient(90deg, #b8860b, #f5c842, #d4a017)",
                      color: "#0d0b00",
                      boxShadow: "0 4px 20px rgba(196,160,32,0.3)",
                      letterSpacing: "0.02em",
                    } : {
                      background: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {plan.cta}
                  </motion.a>

                  {plan.featured && (
                    <p className="text-center mt-3 text-[10px]" style={{ color: "#4a3e18" }}>
                      No credit card required · Cancel anytime
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          {["No hidden fees", "No vendor lock-in", "Cancel any time", "AES-256 encrypted", "SOC 2 compliant"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-emerald-400">✓</span> {t}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// COMPARE
// ─────────────────────────────────────────────

function CompareSection() {
  const [tab, setTab] = useState<"aws" | "doppler">("aws");
  const rows = tab === "aws" ? AWS_ROWS : DOPPLER_ROWS;
  const name = tab === "aws" ? "AWS Secrets Manager" : "Doppler";

  return (
    <section id="compare" className="py-28 px-6 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="🏆 Why XtraSecurity"
          title={<>We&apos;re not just another<br /><span className="text-cyan-400">secrets manager</span></>}
          sub="See how XtraSecurity stacks up against the alternatives."
        />

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 p-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
            {(["aws", "doppler"] as const).map((t) => (
              <motion.button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-colors font-[inherit]"
                style={{ color: tab === t ? "white" : "#64748b" }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative z-10">{t === "aws" ? "vs AWS Secrets Manager" : "vs Doppler"}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.07]">
                  <th className="py-4 px-6 text-left text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Feature</th>
                  <th className="py-4 px-6 text-left text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{name}</th>
                  <th className="py-4 px-6 text-left text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">XtraSecurity ✦</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-white">{r.feature}</td>
                    <td className="py-4 px-6 text-sm">
                      <CompCell value={r.competitor} />
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <CompCell value={r.us} isUs />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function CompCell({ value, isUs }: { value: string; isUs?: boolean }) {
  if (value.startsWith("✓")) return (
    <span><span className="text-emerald-400 mr-1">✓</span><span className={isUs ? "text-slate-200" : "text-slate-400"}>{value.slice(1)}</span></span>
  );
  if (value.startsWith("✗")) return (
    <span><span className="text-slate-600 mr-1">✗</span><span className="text-slate-600">{value.slice(1)}</span></span>
  );
  if (value.startsWith("⚠")) return (
    <span><span className="text-amber-500 mr-1">⚠</span><span className="text-slate-400">{value.slice(1)}</span></span>
  );
  return <span className={isUs ? "text-slate-200" : "text-slate-400"}>{value}</span>;
}

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────

function IntegrationLogsMarquee() {
  return (
    <section className="py-12 border-t border-b border-white/[0.04] bg-[#0a0f1e] overflow-hidden whitespace-nowrap relative group">
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10 pointer-events-none" />
      
      <div className="flex animate-[marquee_50s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[...LOGS, ...LOGS].map((log, i) => (
          <div key={i} className="inline-flex items-center gap-4 px-8 py-4 border-r border-white/[0.03]">
             <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] text-cyan-400">
               {getIcon(log.icon === 'triangle' ? 'zap' : log.icon, 16)}
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{log.platform}</span>
                   <span className="text-[9px] font-medium text-slate-600">{log.time}</span>
                </div>
                <p className="text-sm font-bold text-slate-300">{log.message}</p>
             </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-28 px-6 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          label="❓ FAQs"
          title={<>Common questions answered</>}
          sub="Everything you need to know about XtraSecurity, security, and getting started."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="space-y-4"
        >
          {FAQs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer bg-transparent border-none font-[inherit]"
              >
                <h3 className="font-bold text-white text-base pr-4">{faq.q}</h3>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 text-cyan-400 text-xl"
                >
                  ▼
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/[0.05]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// INTEGRATIONS
// ─────────────────────────────────────────────

function IntegrationsSection() {
  return (
    <section className="py-24 px-6 relative">
      {/* Background glow to unify section */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="Unified Integrations"
          icon="puzzle"
          title="Connect your entire cloud stack"
          sub="Official integrations for your favorite platforms, with more added weekly."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUpStagger}
          className="flex flex-wrap items-center justify-center gap-6"
        >
          {INTEGRATIONS.map((item) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.15] cursor-pointer transition-all duration-300 group shadow-lg"
            >
              <div className="w-10 h-10 flex items-center justify-center transition-all">
                 <img src={item.logo} alt={item.label} className="w-8 h-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="relative py-32 px-6 text-center overflow-hidden">
      {/* Static centred glow — no JS scroll recalculation */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(14,165,233,0.1), transparent)" }} />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUpStagger}
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>🚨 Stop leaking secrets</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-5xl md:text-6xl font-black tracking-tight text-white mb-5 leading-[1.05]"
          >
            Stop leaking secrets to GitHub{" "}
            <span style={{
              background: "linear-gradient(135deg, hsl(220 90% 60%), hsl(45 100% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              today.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-slate-400 mb-12 leading-relaxed">
            Join 500+ engineering teams who have eliminated secrets sprawl and are sleeping soundly knowing their credentials are safe.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white no-underline"
              style={{
                background: "linear-gradient(135deg, hsl(220 90% 50%), hsl(220 90% 38%), hsl(45 100% 45%))",
                boxShadow: "0 4px 32px rgba(37,99,235,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              Start for free — no card needed
            </motion.a>
            <motion.a
              href="/book-demo"
              whileHover={{ scale: 1.02, y: -1 }}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white border border-white/[0.12] hover:border-white/25 hover:bg-white/[0.04] transition-all no-underline"
            >
              Book a demo →
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function Footer() {
  const handleNav = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="border-t border-white/[0.06] bg-white/[0.015] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white no-underline">
            <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={28} height={28} className="rounded-md" />
            <span className="text-white">Xtra<span className="text-cyan-400">Security</span></span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {[...NAV_LINKS, { label: "Docs", href: "#" }].map((l) => (
              <button
                key={l.label}
                onClick={() => handleNav(l.href)}
                className="px-3 py-2 text-sm text-slate-500 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none font-[inherit]"
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600">
            © 2026 XtraSecurity. All rights reserved. The Secrets Manager Built for Modern Teams.
          </p>
          <div className="flex gap-4 text-xs">
            <Link href="/terms-and-conditions" className="text-slate-500 hover:text-slate-200 transition-colors underline underline-offset-2">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-200 transition-colors underline underline-offset-2">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────

export default function Page() {

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#080e1e",
        color: "#f1f5f9",
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::selection { background: rgba(14,165,233,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080e1e; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.3); border-radius: 3px; }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>

      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecurityFortress />

      <MetricsBar />
      <PricingSection />
      <IntegrationLogsMarquee />
      <CompareSection />
      <FAQSection />
      <IntegrationsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}