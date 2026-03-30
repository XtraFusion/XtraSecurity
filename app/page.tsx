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
    desc: "One encrypted home for API keys, DB passwords, and OAuth tokens. Organized by project and environment with full version history and instant rollback.",
    chips: ["AES-256-GCM", "Versioning", "Shadow Rotation"],
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
  },
  {
    icon: "leaf",
    title: "Git-like Versioning",
    desc: "Branching, diffs, and merges for your secrets. Safely test changes in ephemeral branches before promoting to production. Roll back instantly if things go wrong.",
    chips: ["Branching", "Diff Visualization", "Rollback"],
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    icon: "search",
    title: "Security Intelligence",
    desc: "Automated scanning for leaked secrets in your repos. Real-time health dashboards and stale secret warnings. Proactive protection against accidental exposure.",
    chips: ["Secret Scanning", "Health Dashboard", "Stale Warnings"],
    color: "#a855f7",
    glow: "rgba(168,85,247,0.15)",
  },
  {
    icon: "puzzle",
    title: "Developer First",
    desc: "Seamlessly integrate with your workflow. Native VS Code extension, multi-environment secret comparison, and a CLI that injects secrets in-memory.",
    chips: ["VS Code Ext", "Direct CLI", "Multi-Env Sync"],
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
  },
  {
    icon: "users",
    title: "Enterprise Governance",
    desc: "Fine-grained RBAC with IP-level controls. Service accounts for CI/CD, JIT access for developers, and automated quarterly access reviews.",
    chips: ["RBAC + ABAC", "JIT Access", "Service Accounts"],
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.15)",
  },
  {
    icon: "eye",
    title: "Immutable Compliance",
    desc: "Tamper-proof, SHA-256 chained audit logs. SOC 2 and ISO 27001 audit reports generated with one click. Every action is permanently recorded.",
    chips: ["SHA-256 Logs", "SOC 2 Export", "Audit Chain"],
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
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
    cta: "Get started free",
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
    price: "$9",
    originalPrice: "$29",
    period: "/ month",
    desc: "For engineering teams who need serious security controls and compliance automation.",
    featured: true,
    badge: "Most Popular - 69% Off",
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
  { icon: "github", label: "GitHub" },
  { icon: "cloud", label: "AWS" },
  { icon: "message-circle", label: "Slack" },
  { icon: "link", label: "Webhooks" },
  { icon: "package", label: "Node.js SDK" },
  { icon: "package", label: "Python SDK" },
  { icon: "package", label: "Go SDK" },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    title: "Lead DevOps Engineer",
    company: "TechFlow Inc.",
    avatar: "👩‍💼",
    quote: "XtraSecurity eliminated our secrets sprawl overnight. The CLI is so intuitive that our entire team adopted it within a day.",
    highlight: "Team adoption in 1 day"
  },
  {
    name: "Marcus Johnson",
    title: "Security Lead",
    company: "FinanceCore",
    avatar: "👨‍💼",
    quote: "We needed SOC 2 compliance fast. XtraSecurity's audit logs and built-in compliance reports saved us months of work.",
    highlight: "SOC 2 ready in weeks"
  },
  {
    name: "Emily Rodriguez",
    title: "Engineering Manager",
    company: "CloudScale",
    avatar: "👩‍💻",
    quote: "The JIT access feature gives us security without killing developer velocity. Best of both worlds.",
    highlight: "Security + Developer velocity"
  },
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
import { useTheme } from "next-themes";
import { Loader2, Lock, Leaf, Search, Puzzle, Users, Eye, Globe, RefreshCw, AlertCircle, ClipboardList, Home, HardDrive, Key, Zap, Github, Cloud, MessageCircle, Link as LinkIcon, Shield, Folder } from "lucide-react";

// ─────────────────────────────────────────────
// ICON HELPER
// ─────────────────────────────────────────────

function getIcon(iconName: string, size: number = 24) {
  const iconProps = { size, strokeWidth: 1.5 };
  const icons: { [key: string]: React.ReactNode } = {
    lock: <Lock {...iconProps} />,
    leaf: <Leaf {...iconProps} />,
    search: <Search {...iconProps} />,
    puzzle: <Puzzle {...iconProps} />,
    users: <Users {...iconProps} />,
    eye: <Eye {...iconProps} />,
    globe: <Globe {...iconProps} />,
    "refresh-cw": <RefreshCw {...iconProps} />,
    "alert-circle": <AlertCircle {...iconProps} />,
    "clipboard-list": <ClipboardList {...iconProps} />,
    home: <Home {...iconProps} />,
    "hard-drive": <HardDrive {...iconProps} />,
    key: <Key {...iconProps} />,
    zap: <Zap {...iconProps} />,
    github: <Github {...iconProps} />,
    cloud: <Cloud {...iconProps} />,
    "message-circle": <MessageCircle {...iconProps} />,
    link: <LinkIcon {...iconProps} />,
    shield: <Shield {...iconProps} />,
    folder: <Folder {...iconProps} />,
  };
  return icons[iconName] || null;
}

// ─────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-cyan-400 font-mono">
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
        <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={28} height={28} className="rounded-md" />
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
        Zero-Trust Secrets Management Platform
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-5xl md:text-7xl font-black tracking-tight leading-[1.02] max-w-4xl mb-6"
      >
        <span className="text-white">Secrets Management</span>
        <br />
        <span style={{
          background: "linear-gradient(135deg, #38bdf8, #0ea5e9, #6366f1, #a855f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Reimagined for DevOps.
        </span>
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-10 text-base md:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed"
      >
        Stop hardcoding API keys. Stop pasting secrets in Slack. XtraSecurity gives your team
        a centralized, zero-trust vault — with built-in RBAC, audit logs, and one-click SOC 2.
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
// STATS
// ─────────────────────────────────────────────

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative z-10 border-t border-b border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="py-10 px-8 text-center border-r border-white/[0.06] last:border-r-0 hover:bg-white/[0.02] transition-colors"
          >
            <div className="text-3xl md:text-4xl font-black mb-2 tracking-tight" style={{
              background: "linear-gradient(135deg, hsl(220 90% 60%), hsl(45 100% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {s.num}
            </div>
            <div className="text-sm text-slate-400 leading-snug max-w-[160px] mx-auto">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="Core Features"
          icon="settings"
          title={<>Everything your team needs<br /><span className="text-cyan-400">to stop secrets from leaking</span></>}
          sub="Six layers of security, developer tooling, and compliance — all in one platform."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative h-full rounded-2xl overflow-hidden cursor-default"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                willChange: "transform",
              }}
            >
              {/* Top gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] opacity-40 transition-all duration-300"
                style={{
                  background: `linear-gradient(90deg, ${f.color}, transparent)`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-7 h-full flex flex-col">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${f.color}25, ${f.color}08)`,
                    border: `2px solid ${f.color}40`,
                    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.1)`,
                    color: f.color,
                  }}>
                  {getIcon(f.icon, 28)}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white mb-3 leading-tight tracking-tight">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed mb-6 flex-grow">{f.desc}</p>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {f.chips.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
                      style={{
                        color: f.color,
                        background: `${f.color}18`,
                        border: `1.5px solid ${f.color}30`,
                      }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
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
    <section id="how-it-works" className="py-28 px-6 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="How it Works"
          icon="refresh-cw"
          title="Four simple steps to zero-trust"
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="max-w-2xl mx-auto"
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              variants={fadeUp}
              className="flex gap-6 mb-10 last:mb-0"
            >
              {/* Left: Number & Icon */}
              <div className="flex flex-col items-center gap-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold font-mono flex-shrink-0 border-2"
                  style={{
                    background: "linear-gradient(135deg, hsl(220 90% 50%), hsl(220 90% 38%))",
                    borderColor: "rgba(14,165,233,0.4)",
                    color: "white",
                  }}>
                  {s.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-1 h-16 bg-gradient-to-b from-cyan-400/40 to-cyan-400/10 rounded-full" />
                )}
              </div>

              {/* Right: Content */}
              <div className="pt-2 pb-8 border-l border-dashed border-white/[0.15] pl-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-cyan-400 flex items-center justify-center leading-none" style={{ color: "#0ea5e9" }}>
                    {getIcon(s.icon, 20)}
                  </div>
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">{s.body}</p>
              </div>
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

function SecuritySection() {
  return (
    <section id="security" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="Security Architecture"
          icon="shield"
          title={<>Defense in depth —<br /><span className="text-cyan-400">six independent layers</span></>}
          sub="One breach doesn't equal total compromise. Each layer operates independently so your secrets stay safe."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14"
        >
          {SECURITY_PILLARS.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group relative h-full rounded-2xl overflow-hidden cursor-default"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                willChange: "transform",
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-30 transition-all duration-300"
                style={{ background: "linear-gradient(90deg, rgba(14,165,233,0.6), transparent)" }}
              />

              <div className="relative z-10 p-7">
                <div className="mb-5 transition-transform duration-300 flex items-center justify-center w-10 h-10" style={{ color: "#06b6d4" }}>
                  {getIcon(p.icon, 32)}
                </div>
                <h4 className="text-base font-bold text-white mb-3 leading-tight">{p.title}</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <motion.a
            href="#pricing"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white no-underline"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              boxShadow: "0 4px 24px rgba(14,165,233,0.35)",
            }}
          >
            Start securing your secrets →
          </motion.a>
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

function TestimonialsSection() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="What Teams Say"
          title={<>Loved by engineering leaders<br /><span className="text-cyan-400">at scale-ups and enterprises</span></>}
          sub="See why teams are ditching spreadsheets and homegrown solutions for XtraSecurity."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUpStagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="group relative h-full rounded-2xl overflow-hidden cursor-default transition-all flex flex-col"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Top accent line - cyan */}
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-30 transition-all duration-300"
                style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.6), transparent)" }}
              />

              <div className="relative z-10 p-7 flex flex-col h-full">
                {/* Avatar & Info */}
                <div className="flex items-start gap-4 mb-5">
                  <span className="text-4xl flex-shrink-0 transition-transform duration-300">{t.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm leading-tight">{t.name}</div>
                    <div className="text-xs text-slate-400 font-medium">{t.title}</div>
                    <div className="text-xs text-slate-500">{t.company}</div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm text-slate-300 leading-relaxed mb-5 flex-grow italic">&ldquo;{t.quote}&rdquo;</p>

                {/* Highlight Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-bold tracking-wide uppercase w-fit"
                  style={{
                    color: "#06b6d4",
                    background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))",
                    border: "1.5px solid rgba(6,182,212,0.3)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  ✓ {t.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
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
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          label="Integrations"
          icon="folder"
          title="Works with your existing stack"
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUpStagger}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {INTEGRATIONS.map((item) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              whileHover={{ y: -3, borderColor: "rgba(14,165,233,0.4)" }}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.08] bg-white/[0.025] cursor-default transition-colors"
            >
              <div className="text-cyan-400 flex items-center justify-center leading-none">{getIcon(item.icon, 18)}</div>
              <span className="text-sm font-semibold text-slate-300">{item.label}</span>
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
  const { theme, toggle } = useTheme();

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

      <Navbar theme={theme} toggleTheme={toggle} />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <MetricsBar />
      <PricingSection />
      <TestimonialsSection />
      <CompareSection />
      <FAQSection />
      <IntegrationsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}