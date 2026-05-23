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
    <div className={cn("group relative overflow-hidden rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800/60 shadow-xl transition-all duration-300 hover:border-zinc-700/80 hover:shadow-2xl/10", className)}>
      
      {/* Window Controls Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-850/50">
        <div className="flex items-center gap-6">
          {/* Terminal Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50" />
            <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
          </div>
          
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono font-medium tracking-tight">
            <span className="text-primary font-bold">&gt;_</span>
            <span>{activeSnippet.filename || "Terminal"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Optional Tabs Row inside header for spacing efficiency */}
          {options.length > 1 && (
            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800/50">
              {options.map((opt) => (
                <button
                  key={opt.language}
                  onClick={() => setActiveLang(opt.language)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-mono font-medium transition-all rounded-md cursor-pointer",
                    activeLang === opt.language
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-transparent text-zinc-500 border border-transparent hover:text-zinc-300"
                  )}
                >
                  {opt.language}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCopy}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer flex items-center justify-center"
            title="Copy code"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-500">
                <Check className="h-3.5 w-3.5" /> Copied
              </span>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="p-5 overflow-x-auto custom-scrollbar bg-zinc-950/40">
        <pre className="font-mono text-[13px] leading-relaxed text-zinc-300 selection:bg-zinc-800">
          <code className={cn("language-" + activeSnippet.language)}>
            {lines.map((line, i) => {
              // High-quality syntax highlighting for terminal commands and logs
              let lineClass = "text-zinc-300";
              if (line.startsWith("What is your") || line.startsWith("Would you like") || line.startsWith("?")) {
                lineClass = "text-zinc-100 font-semibold";
              } else if (line.startsWith("#")) {
                lineClass = "text-zinc-500 italic font-medium";
              } else if (line.includes("Yes") || line.includes("No") || line.startsWith(">")) {
                lineClass = "text-primary/90 font-medium";
              } else if (line.startsWith("xtra ")) {
                // Command highlight
                return (
                  <div key={i} className="whitespace-pre text-zinc-300">
                    <span className="text-primary font-bold mr-1.5">$</span>
                    <span className="text-zinc-100 font-semibold">{line}</span>
                  </div>
                );
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
