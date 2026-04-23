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
      "hidden xl:flex bg-transparent h-screen w-64 fixed right-0 pt-24 border-l border-border flex-col gap-4 pr-8 pl-6",
      className
    )}>
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">ON THIS PAGE</h3>
        <p className="text-[10px] text-muted-foreground/60 font-mono">Quick Navigation</p>
      </div>

      <nav className="flex flex-col gap-2.5 text-sm">
        {items.map((item, i) => {
          const id = item.toLowerCase().replace(/\s+/g, "-")
          const isActive = activeId === id
          
          return (
            <a 
              key={i} 
              href={`#${id}`}
              className={cn(
                "pl-4 border-l-2 transition-all duration-200 relative flex items-center py-0.5",
                isActive 
                  ? "text-primary font-semibold border-primary" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {item}
            </a>
          )
        })}
      </nav>

      <div className="mt-12 pt-6 border-t border-border/40 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          Dynamic Docs Engine
        </div>
        <div className="text-[10px] text-muted-foreground/50 font-mono">
          Sync status: Active
        </div>
      </div>
    </aside>
  )
}
