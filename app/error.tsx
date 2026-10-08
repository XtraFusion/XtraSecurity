"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  Home, 
  ChevronRight, 
  ShieldAlert, 
  Terminal, 
  RotateCcw, 
  LayoutGrid, 
  BookOpen, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Caught client-side application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none">
      
      {/* Top Left Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-400 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 hover:text-cyan-400 transition-colors text-slate-400 no-underline">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-white font-semibold">Application Exception</span>
      </div>

      {/* Main Centered Box */}
      <div className="flex-1 flex items-center justify-center my-8 z-10">
        <div className="w-full max-w-[600px] bg-[#0a0d14] border border-white/5 rounded-2xl p-10 shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Subtle Glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          {/* Card Header Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="text-rose-500 text-xs font-bold tracking-widest uppercase">
                500 · Client Exception Trapped
              </div>
              <div className="text-slate-400 text-sm mt-1">
                System Runtime Inspection
              </div>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-3 pt-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Something Went Wrong
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              A client-side error occurred while rendering this component. Your plaintext secrets remain encrypted and safe.
            </p>
          </div>

          {/* CLI Terminal Box */}
          <div className="bg-[#030712] border border-white/5 rounded-xl p-5 font-mono text-sm space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-3">
              <span className="text-cyan-400 font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                EXCEPTION LOG
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Secrets Encrypted
              </span>
            </div>

            <p className="text-rose-400 font-medium break-words pt-2">
              Error: {error.message || "An unexpected client exception occurred."}
            </p>

            {error.digest && (
              <p className="text-slate-500 text-xs mt-2">
                Digest Code: <code className="text-cyan-400 font-mono font-bold">{error.digest}</code>
              </p>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white hover:bg-slate-200 text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer border-none"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all no-underline"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <LayoutGrid className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>

        </div>
      </div>

      {/* Empty footer space */}
      <div className="h-6" />

    </div>
  );
}
