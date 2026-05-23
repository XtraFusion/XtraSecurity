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
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/5 dark:bg-blue-950/15 backdrop-blur-sm",
    border: "border-l-4 border-blue-500 dark:border-blue-400/80 ring-1 ring-blue-500/10",
    label: "NOTE"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500 dark:text-amber-450",
    bg: "bg-amber-500/5 dark:bg-amber-950/15 backdrop-blur-sm",
    border: "border-l-4 border-amber-500 dark:border-amber-500/80 ring-1 ring-amber-500/10",
    label: "WARNING"
  },
  tip: {
    icon: Zap,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/5 dark:bg-emerald-950/15 backdrop-blur-sm",
    border: "border-l-4 border-emerald-500 dark:border-emerald-400/80 ring-1 ring-emerald-500/10",
    label: "TIP"
  },
  note: {
    icon: BookOpen,
    color: "text-primary dark:text-primary-foreground",
    bg: "bg-primary/5 dark:bg-primary/10 backdrop-blur-sm",
    border: "border-l-4 border-primary ring-1 ring-primary/10",
    label: "REFERENCE"
  },
}

export function PremiumCallout({ type, children, title, className }: PremiumCalloutProps) {
  const config = CALLOUT_CONFIG[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "my-8 p-5 rounded-xl flex gap-4 items-start relative group overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md",
        config.bg,
        config.border,
        className
      )}
    >
      <div className={cn("p-1.5 rounded-lg bg-background/50 border border-border/40 flex-shrink-0 flex items-center justify-center")}>
        <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={cn("font-bold text-sm tracking-tight mb-1.5 uppercase", config.color)}>
          {title || config.label}
        </h4>
        <div className="text-[13px] text-muted-foreground leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
