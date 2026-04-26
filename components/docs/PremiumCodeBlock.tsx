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
    <div className={cn("group relative overflow-hidden rounded-xl bg-[#0a0a0a] border border-border/40 shadow-sm", className)}>
      
      {/* Optional Tabs Row */}
      {options.length > 1 && (
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          {options.map((opt) => (
            <button
              key={opt.language}
              onClick={() => setActiveLang(opt.language)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono font-medium transition-colors rounded-md border",
                activeLang === opt.language
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/20"
              )}
            >
              {opt.language}
            </button>
          ))}
        </div>
      )}

      {/* Terminal Sub-header */}
      <div className={cn("flex items-center justify-between px-4 pb-2 border-b border-border/20", options.length === 1 ? "pt-4" : "pt-2")}>
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono font-medium">
          <span className="font-bold">&gt;_</span>
          <span>{activeSnippet.filename || "Terminal"}</span>
        </div>

        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
          title="Copy code"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-[13px] leading-relaxed text-zinc-300">
          <code className={cn("language-" + activeSnippet.language)}>
            {lines.map((line, i) => {
              // Simple syntax highlighting for terminal output
              let lineClass = "text-zinc-100";
              if (line.startsWith("What is your") || line.startsWith("Would you like") || line.startsWith("?")) {
                lineClass = "text-foreground font-semibold";
              } else if (line.includes("Yes") || line.includes("No") || line.startsWith(">")) {
                lineClass = "text-muted-foreground";
              }

              return (
                <div key={i} className={cn("whitespace-pre", lineClass)}>
                  {line || " "}
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}
