"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Key,
  FolderOpen,
  Users,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Layers,
  ShieldCheck,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";

export function openPlatformTour(stepIndex: number = 0) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-platform-tour", { detail: { step: stepIndex } })
    );
  }
}

export function usePlatformTour() {
  return {
    startTour: openPlatformTour
  };
}

export interface SpotlightStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  targetSelector: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right" | "auto";
  actionPrompt?: string;
  actionButtonText?: string;
  highlightTag?: string;
  icon: any;
  color: string;
  onEnter?: () => void;
  onLeave?: () => void;
}

export const TOUR_STEPS: SpotlightStep[] = [
  // Step 0: New Project Button Spotlight
  {
    id: "new-project-btn",
    badge: "Step 1 of 7 • Quick Start",
    title: "Click to Create Your Project",
    subtitle: "Initialize a Zero-Knowledge Project Vault",
    description:
      "This square highlights the 'New Project' button. Click on it to open the Project Configuration Dialog and initialize an isolated cryptographically protected environment.",
    targetSelector: '[data-tour="new-project-btn"]',
    preferredPlacement: "bottom",
    actionPrompt:
      "Click the highlighted 'New Project' button above, or use 'Open Project Creator' below to proceed!",
    actionButtonText: "Open Project Creator",
    highlightTag: "CLICK TO CREATE",
    icon: PlusCircle,
    color: "from-blue-600 to-indigo-600",
    onLeave: () => {
      // If advancing, open the dialog
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tour-open-create-project"));
      }
    }
  },

  // Step 1: Create Project Dialog Spotlight
  {
    id: "create-project-dialog",
    badge: "Step 2 of 7 • Project Setup",
    title: "Project Configuration Dialog",
    subtitle: "Isolated Development, Staging & Production",
    description:
      "Here you specify your project name and description. XtraSecurity automatically provisions separated Development, Staging, and Production environments with client-side Zero-Knowledge AES-256-GCM encryption.",
    targetSelector: '[data-tour="create-project-dialog"]',
    preferredPlacement: "bottom",
    actionPrompt:
      "Review the project setup parameters. Secrets in each environment will be sealed using workspace-derived key sentinels.",
    actionButtonText: "Next: Workspace Sentinel",
    highlightTag: "PROJECT DIALOG",
    icon: FolderOpen,
    color: "from-indigo-600 to-purple-600",
    onEnter: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tour-open-create-project"));
      }
    },
    onLeave: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tour-close-create-project"));
      }
    }
  },

  // Step 2: Workspace & Master Key Sentinel Spotlight
  {
    id: "workspace-switcher",
    badge: "Step 3 of 7 • Master Key & Vault",
    title: "Workspace Master Key & Sentinels",
    subtitle: "Level 3 Zero-Knowledge Cryptographic Isolation",
    description:
      "Switch between personal and organization workspaces. All project secrets in this workspace are unlocked using your 256-bit Master Key stored client-side. The server never has access to plaintext secrets.",
    targetSelector: '[data-tour="workspace-switcher"]',
    preferredPlacement: "right",
    actionPrompt:
      "Your 24-Word BIP-39 Recovery Mnemonic guarantees full cryptographic sovereignty even if infrastructure is compromised.",
    actionButtonText: "Next: Secrets & Environments",
    highlightTag: "WORKSPACE VAULT",
    icon: Key,
    color: "from-amber-500 to-orange-600"
  },

  // Step 3: Projects & Secrets Hub Spotlight
  {
    id: "sidebar-projects",
    badge: "Step 4 of 7 • Environments & Sync",
    title: "Project Creation & Environments",
    subtitle: "Staging, Production & Zero-Knowledge Sync",
    description:
      "Access all your projects, manage environment variables across Development, Staging, and Production, and sync encrypted secrets to GitHub Actions, Vercel, and AWS pipelines.",
    targetSelector: '[data-tour="sidebar-projects"]',
    preferredPlacement: "right",
    actionPrompt:
      "Manage real-time synchronization, versioned snapshots, and rollback trees with zero plaintext leak risks.",
    actionButtonText: "Next: Team Access Control",
    highlightTag: "PROJECTS HUB",
    icon: Layers,
    color: "from-emerald-600 to-teal-600"
  },

  // Step 4: Teams & Granular RBAC Spotlight
  {
    id: "sidebar-teams",
    badge: "Step 5 of 7 • Access Control",
    title: "Team Creation & Assigning Roles",
    subtitle: "Granular Role-Based Access Control (RBAC)",
    description:
      "Create teams, invite colleagues, and delegate granular role privileges (Owner, Admin, Member, Auditor). Asymmetric key wrapping ensures team members only decrypt environments they are authorized to access.",
    targetSelector: '[data-tour="sidebar-teams"]',
    preferredPlacement: "right",
    actionPrompt:
      "Configure team permissions, review role privileges, and enforce strict least-privilege policies across all workspaces.",
    actionButtonText: "Next: Secret Rotation",
    highlightTag: "TEAMS & RBAC",
    icon: Users,
    color: "from-cyan-600 to-blue-600"
  },

  // Step 5: Secret Rotation & Security Health Spotlight
  {
    id: "sidebar-secret-rotation",
    badge: "Step 6 of 7 • Automation & Audit",
    title: "Secret Rotation & Security Health",
    subtitle: "Automated rotation schedules & audit trail",
    description:
      "Schedule zero-downtime secret rotations, configure automated sentinels, and review tamper-evident audit logs. Maintain continuous SOC2 and ISO-27001 readiness with instant revocation.",
    targetSelector: '[data-tour="sidebar-secret-rotation"]',
    preferredPlacement: "right",
    actionPrompt:
      "Automated dual-phase rotations keep databases and external APIs online while refreshing credentials seamlessly.",
    actionButtonText: "Next: Final Overview",
    highlightTag: "AUTOMATED ROTATION",
    icon: RotateCcw,
    color: "from-rose-600 to-pink-600"
  },

  // Step 6: Platform Tour & Developer Workflow
  {
    id: "sidebar-tour",
    badge: "Step 7 of 7 • Ready to Build!",
    title: "You're Ready to Build Securely!",
    subtitle: "Developer CLI, SDKs & Continuous Help",
    description:
      "You can restart this interactive spotlight tour anytime by clicking 'Platform Tour' right here. Use our Developer CLI (`xtra run -- app`) and multi-language SDKs to inject secrets directly into your workflows.",
    targetSelector: '[data-tour="sidebar-tour"]',
    preferredPlacement: "right",
    actionPrompt:
      "Terminal workflows, pre-commit scanners, and zero-knowledge synchronization are configured and ready.",
    actionButtonText: "Get Started & Celebrate",
    highlightTag: "TOUR ACCESS",
    icon: Sparkles,
    color: "from-amber-400 to-yellow-500"
  }
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function PlatformTourModal() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [elementFound, setElementFound] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = user?.id
    ? `xtra_platform_tour_seen_${user.id}`
    : "xtra_platform_tour_seen_guest";

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  // Auto-open on initial login / first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const forceTour = urlParams?.get("tour") === "true";

    if (!hasSeenTour || forceTour) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  // Listen to open-platform-tour event
  useEffect(() => {
    const handleOpenTour = (e: any) => {
      const requestedStep = e.detail?.step ?? 0;
      setCurrentStepIndex(
        Math.min(Math.max(0, requestedStep), TOUR_STEPS.length - 1)
      );
      setIsOpen(true);
    };

    window.addEventListener("open-platform-tour", handleOpenTour);
    return () =>
      window.removeEventListener("open-platform-tour", handleOpenTour);
  }, []);

  // Listen for user clicking the real project button while on step 0
  useEffect(() => {
    const handleProjectBtnClicked = () => {
      if (isOpen && currentStepIndex === 0) {
        // Automatically advance to step 1 (dialog spotlight)
        setCurrentStepIndex(1);
      }
    };

    window.addEventListener("tour-project-btn-clicked", handleProjectBtnClicked);
    return () =>
      window.removeEventListener(
        "tour-project-btn-clicked",
        handleProjectBtnClicked
      );
  }, [isOpen, currentStepIndex]);

  // Measure and locate target element
  const measureTarget = useCallback(() => {
    if (!isOpen) return;

    const selector = currentStep.targetSelector;
    const element = document.querySelector(selector);

    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
      });
      setElementFound(true);
    } else {
      setTargetRect(null);
      setElementFound(false);
    }
  }, [isOpen, currentStep.targetSelector]);

  // Update target rect on step change or window resize/scroll
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    // Call onEnter lifecycle hook
    currentStep.onEnter?.();

    let retries = 0;
    const maxRetries = 20;

    const findAndScroll = () => {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest"
        });
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        });
        setElementFound(true);
      } else if (retries < maxRetries) {
        retries++;
        retryTimeoutRef.current = setTimeout(findAndScroll, 80);
      } else {
        setTargetRect(null);
        setElementFound(false);
      }
    };

    findAndScroll();

    const handleResizeOrScroll = () => {
      measureTarget();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, currentStepIndex, currentStep, measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    currentStep.onLeave?.();

    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    currentStep.onLeave?.();

    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    currentStep.onLeave?.();
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.6 }
    });
    toast.success("Welcome aboard! Platform Tour completed.");
  };

  const handleSkip = () => {
    currentStep.onLeave?.();
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const handleSpecialAction = () => {
    if (currentStep.id === "new-project-btn") {
      // Dispatches open dialog and advances to step 1
      window.dispatchEvent(new CustomEvent("tour-open-create-project"));
      setCurrentStepIndex(1);
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  // Padding around target element spotlight square
  const pad = currentStep.id === "create-project-dialog" ? 8 : 6;

  // Calculate coordinates for hole
  const holeTop = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const holeBottom = targetRect ? targetRect.bottom + pad : 0;
  const holeLeft = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const holeRight = targetRect ? targetRect.right + pad : 0;
  const holeWidth = targetRect ? targetRect.width + pad * 2 : 0;
  const holeHeight = targetRect ? targetRect.height + pad * 2 : 0;

  // Calculate Popover Position
  const popoverWidth = 420;
  const popoverHeight = 310;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let popoverTop = (vh - popoverHeight) / 2;
  let popoverLeft = (vw - popoverWidth) / 2;
  let arrowDirection: "top" | "bottom" | "left" | "right" | "none" = "none";

  if (targetRect) {
    const preferred = currentStep.preferredPlacement || "auto";

    if (preferred === "bottom" || (preferred === "auto" && holeBottom + popoverHeight + margin < vh)) {
      if (holeBottom + popoverHeight + margin < vh) {
        popoverTop = holeBottom + margin;
        popoverLeft = holeLeft + holeWidth / 2 - popoverWidth / 2;
        arrowDirection = "top";
      } else {
        popoverTop = Math.max(margin, holeTop - popoverHeight - margin);
        popoverLeft = holeLeft + holeWidth / 2 - popoverWidth / 2;
        arrowDirection = "bottom";
      }
    } else if (preferred === "right" || (preferred === "auto" && holeRight + popoverWidth + margin < vw)) {
      if (holeRight + popoverWidth + margin < vw) {
        popoverLeft = holeRight + margin;
        popoverTop = holeTop + holeHeight / 2 - popoverHeight / 2;
        arrowDirection = "left";
      } else if (holeLeft - popoverWidth - margin > 0) {
        popoverLeft = holeLeft - popoverWidth - margin;
        popoverTop = holeTop + holeHeight / 2 - popoverHeight / 2;
        arrowDirection = "right";
      } else {
        popoverTop = Math.min(vh - popoverHeight - margin, holeBottom + margin);
        popoverLeft = Math.max(margin, (vw - popoverWidth) / 2);
        arrowDirection = "none";
      }
    } else if (preferred === "top") {
      popoverTop = Math.max(margin, holeTop - popoverHeight - margin);
      popoverLeft = holeLeft + holeWidth / 2 - popoverWidth / 2;
      arrowDirection = "bottom";
    } else {
      popoverLeft = holeRight + margin;
      popoverTop = holeTop + holeHeight / 2 - popoverHeight / 2;
      arrowDirection = "left";
    }

    // Clamp inside viewport
    popoverLeft = Math.max(margin, Math.min(popoverLeft, vw - popoverWidth - margin));
    popoverTop = Math.max(margin, Math.min(popoverTop, vh - popoverHeight - margin));
  }

  const StepIcon = currentStep.icon;
  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[9990] overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Platform Spotlight Tour"
    >
      {/* 4-Panel Cutout Backdrop Overlay: Leaves the center hole 100% interactive and clickable */}
      {targetRect ? (
        <>
          {/* Top Panel */}
          <div
            className="fixed top-0 left-0 right-0 bg-background/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{ height: `${holeTop}px` }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Bottom Panel */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-background/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{ top: `${holeBottom}px` }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Left Panel */}
          <div
            className="fixed left-0 bg-background/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{
              top: `${holeTop}px`,
              height: `${holeHeight}px`,
              width: `${holeLeft}px`
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {/* Right Panel */}
          <div
            className="fixed right-0 bg-background/75 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
            style={{
              top: `${holeTop}px`,
              height: `${holeHeight}px`,
              left: `${holeRight}px`
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Luminous Spotlight Highlight Box around the target element */}
          <div
            style={{
              position: "fixed",
              left: `${holeLeft}px`,
              top: `${holeTop}px`,
              width: `${holeWidth}px`,
              height: `${holeHeight}px`
            }}
            data-testid="spotlight-highlight-box"
            className="z-[9992] pointer-events-none rounded-xl border-2 border-primary shadow-[0_0_0_4px_rgba(59,130,246,0.35),0_0_40px_rgba(59,130,246,0.7)] transition-all duration-300 ease-out"
          >
            {/* Animated Pulse Beacon on corner */}
            <div className="absolute -top-3.5 -right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/40 animate-bounce tracking-wider">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span data-testid="spotlight-beacon-tag">{currentStep.highlightTag || "FOCUS"}</span>
            </div>

            {/* Subtle inner pulse ring */}
            <div className="absolute inset-0 rounded-xl ring-2 ring-primary/40 animate-pulse pointer-events-none" />
          </div>
        </>
      ) : (
        /* Fallback Backdrop if target element is momentarily offscreen */
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9990] transition-opacity duration-300"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Floating Action Popover Card */}
      <div
        style={{
          position: "fixed",
          top: `${popoverTop}px`,
          left: `${popoverLeft}px`,
          width: `${popoverWidth}px`
        }}
        data-testid="spotlight-popover-card"
        className="z-[9995] rounded-2xl border border-primary/40 bg-card/95 p-6 text-card-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Directional Arrow pointing towards the spotlighted square */}
        {arrowDirection === "top" && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t border-primary/40 bg-card/95" />
        )}
        {arrowDirection === "bottom" && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-primary/40 bg-card/95" />
        )}
        {arrowDirection === "left" && (
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rotate-45 border-l border-b border-primary/40 bg-card/95" />
        )}
        {arrowDirection === "right" && (
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rotate-45 border-r border-t border-primary/40 bg-card/95" />
        )}

        {/* Card Header: Step Badge & Close */}
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {currentStep.badge}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full"
            aria-label="Close Tour"
            data-testid="spotlight-close-btn"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Title & Icon */}
        <div className="mt-3.5 flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentStep.color} text-white shadow-md shadow-primary/25 shrink-0`}>
            <StepIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs font-medium text-primary mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {currentStep.description}
        </p>

        {/* Action Prompt Callout */}
        {currentStep.actionPrompt && (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-foreground/90 leading-snug">
              {currentStep.actionPrompt}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            <span>Platform Onboarding</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 bg-muted" />
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  currentStep.onLeave?.();
                  setCurrentStepIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-5 bg-primary"
                    : idx < currentStepIndex
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/30"
                }`}
                title={`Jump to Step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 gap-1 text-xs"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSpecialAction}
              className="h-8 gap-1.5 text-xs font-semibold shadow-md shadow-primary/25"
            >
              {currentStep.actionButtonText ? (
                <>
                  {currentStep.actionButtonText}
                  <ArrowRight className="h-3 w-3" />
                </>
              ) : currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  Get Started <Sparkles className="h-3 w-3 text-amber-300" />
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlatformTourModal;
