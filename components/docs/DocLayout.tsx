"use client"

import { cn } from "@/lib/utils"
import { DocSidebar } from "./DocSidebar"
import { DocTOC } from "./DocTOC"
import { useState, useEffect } from "react"
import { Menu, X, Shield, LayoutDashboard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DocLayoutProps {
  children: React.ReactNode
  activeSection: string
  setActiveSection: (section: any) => void
  tocItems?: string[]
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  subSections?: { id: string, label: string, color?: string }[]
}

export function DocLayout({
  children,
  activeSection,
  setActiveSection,
  tocItems = [],
  searchQuery,
  setSearchQuery,
  subSections
}: DocLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close menu on section change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeSection])

  return (
    <div className="docs-container min-h-screen bg-background text-foreground selection:bg-foreground/20 selection:text-foreground relative overflow-hidden" style={{ fontFamily: 'var(--font-docs-body)' }}>
      
      {/* Premium ambient decorative glowing backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-primary/10 via-accent/5 to-transparent blur-[120px] pointer-events-none z-0 glow-bg" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-primary/8 via-accent/3 to-transparent blur-[100px] pointer-events-none z-0 glow-bg" />

      <div className="relative flex min-h-screen z-10">
        {/* ── Left Sidebar (Desktop) ─────────────────────── */}
        <DocSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          subSections={subSections}
        />

        {/* ── Main Content ─────────────────────────────────── */}
        <main className="flex-1 lg:ml-72 xl:mr-64 relative min-w-0 z-10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-12 pt-24 md:pt-16 pb-32 bg-transparent min-h-screen">
            {/* Content Container */}
            <div
              id="docs-content-top"
              className="scroll-mt-28"
            >
              {children}
            </div>
          </div>
        </main>

        {/* ── Right TOC ──────────────────────────────── ─ */}
        <DocTOC items={tocItems} activeId="introduction" />
      </div>

      {/* ── Mobile Top Bar ───────────────────────────────── */}
      <header className="lg:hidden fixed top-0 w-full z-50 h-16 bg-background flex justify-between items-center px-6 border-b border-border shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={24} height={24} className="rounded-md" />
          <span className="text-foreground">Xtra<span className="text-primary font-black italic">Security</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ───────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 h-full">
            <DocSidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              subSections={subSections}
              className="w-full h-full static flex border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
