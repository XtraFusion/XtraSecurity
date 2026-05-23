"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface DocTOCProps {
  items: string[]
  activeId?: string
  className?: string
}

export function DocTOC({ items, activeId: initialActiveId, className }: DocTOCProps) {
  const [activeId, setActiveId] = useState(initialActiveId || "")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    )

    items.forEach((item) => {
      const id = item.toLowerCase().replace(/\s+/g, "-")
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  return (
    <aside className={cn(
      "hidden xl:flex bg-transparent h-screen w-64 fixed right-0 pt-24 border-l border-border/30 flex-col gap-4 pr-8 pl-6 z-30 transition-all duration-300",
      className
    )}>
      <div className="mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">ON THIS PAGE</h3>
        <p className="text-[10px] text-muted-foreground/75 font-mono italic">Quick Navigation</p>
      </div>

      <nav className="flex flex-col gap-3 text-[12px]">
        {items.map((item, i) => {
          const id = item.toLowerCase().replace(/\s+/g, "-")
          const isActive = activeId === id
          
          return (
            <a 
              key={i} 
              href={`#${id}`}
              className={cn(
                "pl-4 border-l-[3px] transition-all duration-300 relative flex items-center py-0.5 font-medium cursor-pointer",
                isActive 
                  ? "text-primary font-bold border-primary pl-4.5 scale-[1.02] origin-left" 
                  : "text-muted-foreground border-transparent hover:text-foreground hover:pl-4.5"
              )}
            >
              {item}
            </a>
          )
        })}
      </nav>

      <div className="mt-auto pb-10 pt-6 border-t border-border/30 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80">
          <span className="material-symbols-outlined text-[13px] text-primary">bolt</span>
          Dynamic Docs Engine
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>Sync status: Active</span>
        </div>
      </div>
    </aside>
  )
}
