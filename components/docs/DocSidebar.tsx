"use client"

import { cn } from "@/lib/utils"
import {
  BookOpen,
  Terminal,
  Layers,
  Puzzle,
  Shield,
  Search,
  Command,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Zap,
  Code2,
  PlayCircle,
  Globe
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

interface DocSidebarProps {
  activeSection: string
  setActiveSection: (section: any) => void
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  subSections?: { id: string, label: string, color?: string }[]
  className?: string
}

const SECTIONS = [
  { id: "quickstart", label: "Getting Started", icon: Zap },
  { id: "management", label: "Workspace Management", icon: Layers },
  { id: "workflow", label: "Development Workflow", icon: PlayCircle },
  { id: "cicd", label: "CI/CD Integration", icon: Globe },
  { id: "cli", label: "CLI Reference", icon: Terminal, href: "/docs/cli" },
  { id: "vscode", label: "VS Code Extension", icon: Puzzle },
  { id: "security", label: "Security Features", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Layers, href: "/docs/integrations" },
  { id: "sdks", label: "SDKs", icon: Code2, href: "/docs/sdks" },
  { id: "tutorials", label: "Tutorials", icon: PlayCircle, href: "/tutorials", comingSoon: true },
]

export function DocSidebar({
  activeSection,
  setActiveSection,
  searchQuery,
  setSearchQuery,
  subSections = [],
  className
}: DocSidebarProps) {
  return (
    <aside className={cn(
      "hidden md:flex bg-card/65 dark:bg-zinc-950/65 backdrop-blur-xl h-screen w-72 flex-col fixed left-0 z-40 border-r border-border/40 overflow-y-auto custom-scrollbar transition-all duration-300",
      className
    )}>
      {/* ── Brand / Logo ────────────────────────────────── */}
      <div className="h-16 flex items-center px-6 mb-4 mt-2">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={20} height={20} className="rounded" />
          </div>
          <span className="text-foreground tracking-tight">Xtra<span className="text-primary font-black italic">Security</span></span>
        </Link>
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-250" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="w-full bg-muted/30 hover:bg-muted/50 border border-border/40 text-xs rounded-lg pl-9.5 pr-10 py-2.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/5 transition-all outline-none text-foreground placeholder:text-muted-foreground/70"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
            <kbd className="font-mono text-[9px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/60">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-1.5 px-3">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          const Icon = section.icon

          return (
            <div key={section.id} className="relative">
              {section.href ? (
                <Link
                  href={section.href}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-lg transition-all flex items-center gap-3 text-xs font-semibold cursor-pointer border-l-2 border-transparent",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:pl-4"
                  )}
                >
                  <Icon className={cn("h-4 w-4 text-muted-foreground/80 group-hover:text-foreground")} />
                  <span className="flex-1 tracking-tight">{section.label}</span>
                  {(section as any).comingSoon && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Soon
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-lg transition-all flex items-center gap-3 text-xs font-semibold cursor-pointer border-l-2 text-left",
                    isActive
                      ? "text-primary bg-primary/10 border-primary font-bold shadow-inner"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:pl-4 border-transparent"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/80")} />
                  <span className="flex-1 tracking-tight">{section.label}</span>
                </button>
              )}

              {/* Sub-sections */}
              <AnimatePresence>
                {isActive && subSections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="ml-5.5 border-l border-border/50 flex flex-col gap-1 py-1.5 mt-1"
                  >
                    {subSections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-left px-5 py-1.5 text-[11px] font-medium text-muted-foreground/75 hover:text-primary hover:border-primary/50 border-l border-transparent -ml-px transition-all cursor-pointer truncate"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* ── Footer / Support ───────────────────────────────────────── */}
      <div className="mt-auto p-4 border-t border-border bg-background">
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mt-2 bg-primary/5 py-2 px-3 rounded-md border border-primary/10">
            <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 mt-2 py-1.5 px-2 bg-transparent rounded border border-border w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground opacity-50"></div>
            <span className="text-[10px] font-mono text-muted-foreground">v2.4.0-stable</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
