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
    <div className="min-h-screen w-full bg-[#05090e] text-white flex flex-col justify-between p-6 sm:p-10 font-sans relative overflow-hidden select-none">
      
      {/* Top Left Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 z-10">
        <div className="w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
          <Home className="w-3 h-3" />
        </div>
        <Link href="/dashboard" className="hover:text-cyan-400 transition-colors text-slate-300 font-medium no-underline">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-400 font-semibold">Application Exception</span>
      </div>

      {/* Main Centered Bento Glass Card */}
      <div className="flex-1 flex items-center justify-center my-8 z-10">
        <div className="w-full max-w-[540px] bg-[#0a1117] border border-[#14232a] rounded-[28px] p-8 md:p-9 shadow-2xl space-y-6">
          
          {/* Card Header Info */}
          <div className="flex items-start gap-4">
            {/* Rose Squircle Icon Badge with Glowing Green Dot */}
            <div className="relative flex-shrink-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#1e1014] border border-[#3b1820] flex items-center justify-center text-rose-400 shadow-md">
                <ShieldAlert className="w-7 h-7 stroke-[1.75]" />
              </div>
              <span className="w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#0a1117] absolute -bottom-0.5 -right-0.5 shadow-sm" />
            </div>

            {/* Badge Labels */}
            <div className="flex flex-col justify-center pt-1 font-mono">
              <div className="text-rose-400 text-xs font-bold tracking-widest uppercase">
                500 · CLIENT EXCEPTION TRAPPED
              </div>
              <div className="text-slate-500 text-[10px] tracking-wider uppercase font-semibold mt-0.5">
                SYSTEM RUNTIME INSPECTION
              </div>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans leading-tight">
              Something Went Wrong
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed font-sans max-w-md">
              A client-side error occurred while rendering this component. Your plaintext secrets remain encrypted and safe.
            </p>
          </div>

          {/* CLI Terminal Box */}
          <div className="bg-[#05080c] border border-[#14232a] rounded-2xl p-5 font-mono text-xs space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-[#101b22] pb-2.5">
              <span className="text-[#00f2ff] font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                EXCEPTION LOG
              </span>
              <span className="text-[#10b981] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secrets Encrypted
              </span>
            </div>

            <p className="text-rose-400 font-medium text-xs break-words pt-0.5">
              Error: {error.message || "An unexpected client exception occurred."}
            </p>

            {error.digest && (
              <p className="text-slate-500 text-[11px]">
                Digest Code: <code className="text-[#00f2ff] font-mono font-semibold">{error.digest}</code>
              </p>
            )}

            <div className="border-t border-[#101b22] pt-2.5 text-[#00f2ff] text-[11px] font-mono flex items-center gap-1">
              <span>→ Session ID: 0x7f884a0a</span>
              <span className="text-slate-600">·</span>
              <span>Hardware Lock Active</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00d8a7] hover:bg-[#00c295] text-[#05090e] transition-all border-none shadow-md cursor-pointer font-[inherit]"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#111921] hover:bg-[#16212c] text-white border border-[#1b2a36] transition-all no-underline cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-slate-300" />
              Go to Dashboard
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all no-underline cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Documentation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

        </div>
      </div>

      {/* Empty footer space */}
      <div className="h-6" />

    </div>
  );
}
