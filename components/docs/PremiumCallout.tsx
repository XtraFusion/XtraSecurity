"use client"

import { Info, AlertTriangle, Zap, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type CalloutType = "info" | "warning" | "tip" | "note"

interface PremiumCalloutProps {
  type: CalloutType
  children: React.ReactNode
  title?: string
  className?: string
}

const CALLOUT_CONFIG = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-l-4 border-blue-500",
    label: "NOTE"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-l-4 border-amber-500",
    label: "WARNING"
  },
  tip: {
    icon: Zap,
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-l-4 border-emerald-500",
    label: "TIP"
  },
  note: {
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/5",
    border: "border-l-4 border-primary",
    label: "REFERENCE"
  },
}

export function PremiumCallout({ type, children, title, className }: PremiumCalloutProps) {
  const config = CALLOUT_CONFIG[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "mt-6 p-4 rounded-lg flex gap-4 items-start relative group overflow-hidden shadow-sm ring-1 ring-inset ring-border/10",
        config.bg,
        config.border,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", config.color)} />
      
      <div className="flex-1 min-w-0">
        <h4 className={cn("font-semibold text-sm tracking-tight mb-1", config.color)}>
          {title || config.label}
        </h4>
        <div className="text-sm text-foreground/80 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
