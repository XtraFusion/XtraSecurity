"use client"

import { cn } from "@/lib/utils"
import { DocSidebar } from "./DocSidebar"
import { DocTOC } from "./DocTOC"
import { useState, useEffect } from "react"
import { Menu, X, Shield } from "lucide-react"

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
    <div className="docs-container min-h-screen bg-background text-foreground selection:bg-foreground/20 selection:text-foreground" style={{ fontFamily: 'var(--font-docs-body)' }}>

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
        <main className="flex-1 lg:ml-72 xl:mr-64 relative min-w-0">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-12 pt-24 md:pt-16 pb-32 bg-background min-h-screen">
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
      <header className="lg:hidden fixed top-0 w-full z-50 h-16 bg-background flex justify-between items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-foreground" />
          <span className="font-bold text-lg tracking-tight">XtraSecurity</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-muted-foreground p-2"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
