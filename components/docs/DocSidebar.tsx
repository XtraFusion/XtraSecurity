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
  Github,
  MessageCircle,
  ExternalLink,
  LayoutDashboard,
  Zap,
  Code2
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
  { id: "cli", label: "CLI Reference", icon: Terminal, href: "/docs/cli" },
  { id: "vscode", label: "VS Code Extension", icon: Puzzle },
  { id: "integrations", label: "Integrations", icon: Layers, href: "/docs/integrations" },
  { id: "sdks", label: "SDKs", icon: Code2, href: "/docs/sdks" },
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
      "hidden md:flex bg-card h-screen w-72 flex-col fixed left-0 z-40 border-r border-border overflow-y-auto",
      className
    )}>
      {/* ── Brand / Logo ─────────── ──────────────────────── */}
      <div className="h-14 flex items-center px-6 mb-4 mt-2">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={24} height={24} className="rounded-md" />
          <span className="text-foreground">Xtra<span className="text-primary font-black italic">Security</span></span>
        </Link>
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="w-full bg-transparent border border-border text-sm rounded-md pl-9 pr-10 py-1.5 focus:ring-1 focus:ring-foreground focus:border-foreground transition-all outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          const Icon = section.icon

          return (
            <div key={section.id}>
              {section.href ? (
                <Link
                  href={section.href}
                  className={cn(
                    "w-full px-3 py-2 rounded-md transition-all flex items-center gap-3 text-sm font-medium",
                    "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4 text-muted-foreground")} />
                  {section.label}
                </Link>
              ) : (
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full px-3 py-2 rounded-md transition-all flex items-center gap-3 text-sm font-medium",
                    isActive
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  {section.label}
                </button>
              )}

              {/* Sub-sections */}
              <AnimatePresence>
                {isActive && subSections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-9 border-l border-border flex flex-col gap-1 py-1"
                  >
                    {subSections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-left px-4 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <Github className="h-4 w-4" /> Github Repository
          </a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Community Support
          </a>
          
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
