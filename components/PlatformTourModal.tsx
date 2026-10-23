"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Key,
  FolderOpen,
  Users,
  Terminal,
  Zap,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Cloud,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  BookOpen,
  Eye,
  GitBranch,
  Layers,
  FileCode,
  UserCheck,
  Activity,
  X
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

export function openPlatformTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-platform-tour"));
  }
}

export function usePlatformTour() {
  return {
    startTour: openPlatformTour
  };
}

interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  renderContent: (ctx: {
    copied: string | null;
    copyToClipboard: (text: string, id: string) => void;
    router: any;
    onClose: () => void;
  }) => React.ReactNode;
}

export function PlatformTourModal() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const storageKey = user?.id
    ? `xtra_platform_tour_seen_${user.id}`
    : "xtra_platform_tour_seen_guest";

  useEffect(() => {
    // Check if user has already seen the tour
    const hasSeenTour = localStorage.getItem(storageKey);
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const forceTour = urlParams?.get("tour") === "true";

    if (!hasSeenTour || forceTour) {
      // Small timeout to allow dashboard to render cleanly before opening
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleOpenTour = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("open-platform-tour", handleOpenTour);
    return () => window.removeEventListener("open-platform-tour", handleOpenTour);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
    toast.success("Welcome aboard! Platform Tour completed.");
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const TOUR_STEPS: TourStep[] = [
    // Step 0: Welcome & Level 3 E2EE Zero-Knowledge Architecture
    {
      id: "welcome",
      badge: "Welcome",
      title: "Welcome to XtraSecurity",
      subtitle: "The Level 3 Zero-Knowledge Secrets Orchestration Platform",
      icon: Shield,
      color: "from-blue-600 to-indigo-600",
      renderContent: () => (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">
                  True Client-Side End-to-End Encryption (Level 3 Zero-Knowledge)
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unlike traditional secret managers where the cloud provider holds your private keys,
                  XtraSecurity encrypts every secret in your browser or local terminal before it ever touches our servers.
                  Even in a database breach, your plaintext secrets are mathematically impossible to decrypt.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/40 bg-card/60 p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-medium text-foreground text-sm">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>Zero-Knowledge</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Decryption keys remain strictly on your machine. Server never sees your raw passphrase.
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-card/60 p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-medium text-foreground text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Granular RBAC</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Teams, project scopes, and Just-In-Time (JIT) access controls prevent internal privilege creep.
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-card/60 p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 mb-2 font-medium text-foreground text-sm">
                <Terminal className="h-4 w-4 text-purple-500" />
                <span>Native CLI & SDKs</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Inject secrets into memory with zero <code className="text-[11px] bg-muted px-1 rounded">.env</code> files written to disk.
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Step 1: Workspace & Zero-Knowledge Vault Master Key
    {
      id: "vault",
      badge: "Step 1 of 6",
      title: "Workspace Master Key & Sentinels",
      subtitle: "Deterministic AES-256-GCM derivation & emergency recovery",
      icon: Key,
      color: "from-amber-500 to-orange-600",
      renderContent: ({ copied, copyToClipboard }) => (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wider text-amber-500 uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> 24-Word BIP-39 Recovery Mnemonic
              </span>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                Hardware Sentinel Protected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When unlocking your workspace vault, your 24-word recovery phrase generates a cryptographically isolated 256-bit symmetric AES key.
              You can unlock your vault once per session, store it in your hardware keychain, or use dedicated project keys.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border/40 font-sans">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-500" /> Cryptographic Key Hierarchy
              </span>
              <span className="text-[11px] text-emerald-500 font-semibold">HKDF-SHA256 Audited</span>
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>1. Workspace Master Passphrase</span>
                <span className="text-foreground">→ Salted with Workspace ID</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Derived Project Keys</span>
                <span className="text-foreground">→ Isolated per Project HKDF</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Vault Sentinel Verification</span>
                <span className="text-emerald-500">→ Zero-Leak Auth Proof</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-card/60 border border-border/40 p-3 text-xs">
            <span className="text-muted-foreground">Generate phrase anytime via CLI:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 font-mono text-[11px]"
              onClick={() => copyToClipboard("xtra vault generate", "vault-gen")}
            >
              {copied === "vault-gen" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              xtra vault generate
            </Button>
          </div>
        </div>
      )
    },

    // Step 2: Project Creation & Multi-Environment Hierarchy
    {
      id: "projects",
      badge: "Step 2 of 6",
      title: "Project Creation & Environments",
      subtitle: "Structure microservices with Development, Staging, & Production isolation",
      icon: FolderOpen,
      color: "from-blue-500 to-cyan-600",
      renderContent: ({ router, onClose }) => (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every repository or microservice lives inside a <strong>Project</strong>. Within each project, secrets are segmented across three isolated environments:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-[10px]">
                  Development
                </Badge>
                <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Local engineer testing & sandbox mocks. Can be branched for preview PRs.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[10px]">
                  Staging
                </Badge>
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Integration testing with cloud dependencies. Restricted to QA & dev leads.
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-rose-600/20 text-rose-400 border-rose-500/30 text-[10px]">
                  Production
                </Badge>
                <Lock className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                Live customer workloads. Strict RBAC enforcement and JIT access approvals.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-card/40 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">Flexible Key Scoping</div>
              <div className="text-[11px] text-muted-foreground">
                Projects can inherit the <strong>Workspace Master Key</strong> or use a <strong>Dedicated Project Key</strong> for zero-trust isolation.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                router.push("/projects");
              }}
              className="h-8 gap-1 text-xs"
            >
              View Projects <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )
    },

    // Step 3: Managing Secrets & Cloud Sync
    {
      id: "secrets",
      badge: "Step 3 of 6",
      title: "Encrypted Secrets & Sync",
      subtitle: "Zero-Knowledge key-value store with real-time cloud synchronizers",
      icon: Zap,
      color: "from-emerald-500 to-teal-600",
      renderContent: () => (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border/40 font-sans">
              <span className="font-medium text-foreground">Encrypted Secret Row Preview</span>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> AES-256-GCM Active
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-1 items-center">
              <div className="col-span-4 text-foreground font-semibold">DATABASE_URL</div>
              <div className="col-span-6 text-muted-foreground">••••••••••••••••••••••••••••••••</div>
              <div className="col-span-2 text-right">
                <Badge variant="secondary" className="text-[10px] font-sans">v3</Badge>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 py-1 items-center">
              <div className="col-span-4 text-foreground font-semibold">STRIPE_SECRET_KEY</div>
              <div className="col-span-6 text-muted-foreground">••••••••••••••••••••••••••••••••</div>
              <div className="col-span-2 text-right">
                <Badge variant="secondary" className="text-[10px] font-sans">v1</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-primary" /> Supported Sync Targets
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sync encrypted secrets automatically with AWS Secrets Manager, Google Cloud Secret Manager, Azure Key Vault,
              GitHub Actions Secrets, and Kubernetes ConfigMaps in one click without exposing plaintext tokens.
            </p>
          </div>
        </div>
      )
    },

    // Step 4: Teams & Granular RBAC Permissions
    {
      id: "teams",
      badge: "Step 4 of 6",
      title: "Team Creation & Assigning Roles",
      subtitle: "Enforce least privilege with granular project and environment assignments",
      icon: Users,
      color: "from-purple-500 to-indigo-600",
      renderContent: ({ router, onClose }) => (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Never share credentials over Slack, email, or unencrypted text again. Structure your organization into functional teams with precise access controls:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-sm text-foreground">Role Privileges</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div><strong className="text-foreground">Owner / Admin:</strong> Rotate master keys, manage billing, & approve access.</div>
                <div><strong className="text-foreground">Member:</strong> Read & write development/staging secrets.</div>
                <div><strong className="text-foreground">Viewer:</strong> Read-only access for audits & compliance.</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-sm text-foreground">Team Assignments</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Assign teams to specific projects with environment boundaries. For example, assign the <em>Frontend Team</em> exclusively to <code className="text-foreground bg-muted px-1 rounded">dev</code> while restricting <code className="text-foreground bg-muted px-1 rounded">prod</code> to <em>SecOps</em>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/40 p-3 text-xs">
            <span className="text-muted-foreground">Manage your organization:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                router.push("/teams");
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Users className="h-3.5 w-3.5 text-purple-400" /> Open Teams Console
            </Button>
          </div>
        </div>
      )
    },

    // Step 5: JIT & Emergency Break-Glass Access
    {
      id: "jit",
      badge: "Step 5 of 6",
      title: "Just-In-Time (JIT) & Break-Glass",
      subtitle: "Zero standing privileges with time-bounded, auto-expiring emergency access",
      icon: Clock,
      color: "from-rose-500 to-pink-600",
      renderContent: () => (
        <div className="space-y-6">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-500" />
                <span className="font-semibold text-sm text-foreground">Zero Standing Privileges</span>
              </div>
              <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[10px]">
                SOC2 / ISO-27001 Ready
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanent production access is the #1 vector for data breaches. With XtraSecurity JIT, developers request temporary access for incident response. Access automatically expires after a predefined window (e.g. 15 to 60 minutes).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border/50 bg-card/60 p-3 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Multi-Party Approvals
              </div>
              <p className="text-muted-foreground">
                Requests notify Workspace Admins for dual-authorization before production decryption is granted.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-card/60 p-3 space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500" /> Immutable Audit Trail
              </div>
              <p className="text-muted-foreground">
                Every request, approval, secret view, and expiration is permanently recorded in tamper-evident logs.
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Step 6: Developer CLI & Multi-Language SDKs
    {
      id: "developer",
      badge: "Step 6 of 6",
      title: "Developer CLI & Multi-Language SDKs",
      subtitle: "Inject secrets in memory without writing .env files to disk",
      icon: Terminal,
      color: "from-indigo-600 to-blue-600",
      renderContent: ({ copied, copyToClipboard }) => (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/70 bg-zinc-950 p-4 font-mono text-xs text-zinc-100 space-y-3">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2 font-sans">
              <span className="flex items-center gap-1.5 text-xs text-zinc-200">
                <Terminal className="h-4 w-4 text-emerald-400" /> Terminal Workflow
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-zinc-400 hover:text-white"
                onClick={() => copyToClipboard("npm install -g xtra-cli\nxtra login\nxtra run -- npm start", "cli-workflow")}
              >
                {copied === "cli-workflow" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>

            <div className="space-y-1 leading-relaxed">
              <div className="text-zinc-500"># 1. Install CLI globally</div>
              <div className="text-emerald-400 font-semibold">$ npm install -g xtra-cli</div>
              <div className="text-zinc-500 pt-1"># 2. Authenticate securely</div>
              <div className="text-emerald-400 font-semibold">$ xtra login</div>
              <div className="text-zinc-500 pt-1"># 3. Inject secrets directly into runtime memory</div>
              <div className="text-emerald-400 font-semibold">$ xtra run -- npm start</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-border/40 bg-card/60 p-2.5">
              <div className="font-semibold text-foreground">Node.js SDK</div>
              <code className="text-[10px] text-muted-foreground block mt-1">npm i @xtrasecurity/sdk</code>
            </div>
            <div className="rounded-lg border border-border/40 bg-card/60 p-2.5">
              <div className="font-semibold text-foreground">Python SDK</div>
              <code className="text-[10px] text-muted-foreground block mt-1">pip install xtra-sdk</code>
            </div>
            <div className="rounded-lg border border-border/40 bg-card/60 p-2.5">
              <div className="font-semibold text-foreground">Go SDK</div>
              <code className="text-[10px] text-muted-foreground block mt-1">go get xtrasecurity-go</code>
            </div>
          </div>
        </div>
      )
    },

    // Final Celebration Step
    {
      id: "finish",
      badge: "Tour Complete",
      title: "You're Ready to Build Securely!",
      subtitle: "Start organizing your projects, secrets, and team members",
      icon: Sparkles,
      color: "from-emerald-500 to-indigo-600",
      renderContent: ({ router, onClose }) => (
        <div className="space-y-6 text-center py-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-foreground">
              Level 3 Zero-Knowledge Security Activated
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You can reopen this tour at any time from the sidebar or help menu. Here are your recommended next steps:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              onClick={() => {
                onClose();
                router.push("/projects");
              }}
              className="p-3.5 rounded-xl border border-border/60 bg-card/70 hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Create First Project
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Initialize an isolated vault for your backend or frontend.
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/teams");
              }}
              className="p-3.5 rounded-xl border border-border/60 bg-card/70 hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Invite Team Members
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Assign teammates with granular role-based permissions.
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/docs");
              }}
              className="p-3.5 rounded-xl border border-border/60 bg-card/70 hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Developer Documentation
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Explore full API, CLI, and integration guides.
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/dashboard");
              }}
              className="p-3.5 rounded-xl border border-border/60 bg-card/70 hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Enter Security Dashboard
                </div>
                <div className="text-[11px] text-muted-foreground">
                  View real-time audit logs and threat posture.
                </div>
              </div>
            </button>
          </div>
        </div>
      )
    }
  ];

  const currentStep = TOUR_STEPS[currentStepIndex];
  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-border/70 shadow-2xl bg-card/95 backdrop-blur-2xl">
        {/* Header with gradient strip and progress */}
        <div className="relative border-b border-border/50 bg-muted/20 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg bg-gradient-to-tr ${currentStep.color} text-white shadow-md shadow-primary/20`}>
                <currentStep.icon className="h-5 w-5" />
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] font-mono tracking-wider uppercase mb-1">
                  {currentStep.badge}
                </Badge>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {currentStep.title}
                </DialogTitle>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>
          </div>

          <DialogDescription className="text-xs text-muted-foreground">
            {currentStep.subtitle}
          </DialogDescription>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progressPercent} className="h-1.5 bg-muted" />
          </div>
        </div>

        {/* Step Dynamic Content */}
        <div className="p-6 max-h-[62vh] overflow-y-auto">
          {currentStep.renderContent({
            copied,
            copyToClipboard,
            router,
            onClose: () => setIsOpen(false)
          })}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border/50 bg-muted/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-6 bg-primary"
                    : idx < currentStepIndex
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/30"
                }`}
                title={`Jump to Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              className="h-9 gap-1.5 text-xs font-semibold shadow-md shadow-primary/20"
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  Get Started <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PlatformTourModal;
