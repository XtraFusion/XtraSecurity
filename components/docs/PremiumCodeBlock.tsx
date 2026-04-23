"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeOption {
  language: string
  code: string
  filename?: string
}

interface PremiumCodeBlockProps {
  options: CodeOption[]
  className?: string
}

export function PremiumCodeBlock({ options, className }: PremiumCodeBlockProps) {
  const [activeLang, setActiveLang] = useState(options[0].language)
  const [copied, setCopied] = useState(false)

  const activeSnippet = options.find((o) => o.language === activeLang) || options[0]
  const lines = activeSnippet.code.split("\n")

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-lg bg-zinc-950 border border-border/50 shadow-md", className)}>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/80"></div>
      
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-border/30">
        <div className="flex gap-4">
          {options.map((opt) => (
            <button
              key={opt.language}
              onClick={() => setActiveLang(opt.language)}
              className={cn(
                "text-[11px] font-mono font-medium transition-colors pb-0.5 border-b-2",
                activeLang === opt.language
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {opt.language}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-primary transition-colors p-1"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs sm:text-sm text-zinc-300">
          <code className={cn("language-" + activeSnippet.language)}>
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line || " "}
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Tonal Shift on Hover */}
      <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}
