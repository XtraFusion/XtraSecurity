"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SecurityScore } from "@/lib/compliance/score-engine";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  CircleDashed,
  Zap,
  Info,
  ChevronRight,
  ShieldQuestion
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function SecurityScoreCard({ score, onNavigate }: { score: SecurityScore, onNavigate?: (tab: string) => void }) {
  const isHigh = score.total >= 80;
  const isMed = score.total >= 60;
  
  const scoreColor = isHigh ? "text-emerald-500" : isMed ? "text-amber-500" : "text-rose-500";
  const strokeColor = isHigh ? "stroke-emerald-500" : isMed ? "stroke-amber-500" : "stroke-rose-500";

  return (
    <Card className="border border-border bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Workspace Security Health
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-2 font-mono h-6 px-3 rounded-full",
                  isHigh ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
                  isMed ? "bg-amber-50 border-amber-200 text-amber-700" : 
                  "bg-rose-50 border-rose-200 text-rose-700"
                )}
              >
                Grade {score.grade}
              </Badge>
            </CardTitle>
            <CardDescription>Comprehensive assessment of your security configuration</CardDescription>
          </div>
          <div className="p-2.5 rounded-full bg-muted/30">
            {isHigh ? <ShieldCheck className="h-6 w-6 text-emerald-600" /> : <ShieldAlert className="h-6 w-6 text-amber-600" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="grid md:grid-cols-12 gap-10 items-center">
            
            {/* Score Gauge Visual */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-8 border rounded-2xl bg-muted/10 relative group">
               <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="80" cy="80" r="72"
                      stroke="currentColor" strokeWidth="10" fill="transparent"
                      className="text-muted/20"
                    />
                    <motion.circle
                      cx="80" cy="80" r="72"
                      stroke="currentColor" strokeWidth="10" fill="transparent"
                      strokeDasharray="452.4"
                      initial={{ strokeDashoffset: 452.4 }}
                      animate={{ strokeDashoffset: 452.4 - (452.4 * score.total) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={cn(strokeColor, "transition-all")}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn("text-5xl font-black tracking-tighter", scoreColor)}
                    >
                      {score.total}
                    </motion.span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Security Index</span>
                  </div>
               </div>
               <div className="mt-6 text-center space-y-1">
                  <h3 className="font-semibold text-lg">
                    {score.total >= 90 ? "Excellent" : 
                     score.total >= 70 ? "Healthy" : 
                     "Attention Required"}
                  </h3>
                  <p className="text-xs text-muted-foreground px-4 text-balance">
                    {score.total >= 90 ? "Your workspace follows all current security best practices." : 
                     score.total >= 70 ? "Most critical protections are active. See recommendations below." : 
                     "Immediate action needed to secure your primary workspace resources."}
                  </p>
               </div>
            </div>

            {/* Breakdown & Actionable Metrics */}
            <div className="md:col-span-7 flex flex-col h-full justify-between gap-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4 text-primary" /> Core Security Metrics
                    </h4>
                    <span className="text-xs text-muted-foreground font-medium">Weighted Score</span>
                  </div>
                  
                  <div className="space-y-5">
                    {score.factors.map((f, i) => (
                       <div key={f.label} className="space-y-2 group/metric">
                          <div className="flex justify-between items-end">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{f.label}</span>
                                {f.score === f.maxScore ? (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  </motion.div>
                                ) : (
                                  <ShieldQuestion className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                             </div>
                             <span className="font-mono text-xs font-bold tabular-nums">
                                <span className={cn(f.score < f.maxScore ? "text-amber-600" : "text-emerald-600")}>{f.score}</span>
                                <span className="text-muted-foreground/40 mx-1">/</span>
                                <span className="text-muted-foreground">{f.maxScore}</span>
                             </span>
                          </div>
                          <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(f.score/f.maxScore) * 100}%` }}
                               transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                               className={cn(
                                 "absolute h-full rounded-full transition-colors",
                                 f.score === f.maxScore ? "bg-emerald-500" : 
                                 f.score > f.maxScore * 0.5 ? "bg-amber-500" : "bg-rose-500"
                               )}
                             />
                          </div>
                       </div>
                    ))}
                  </div>
               </div>

               {score.total < 100 && (
                  <div className="p-5 border border-primary/10 bg-primary/5 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                       <h4 className="text-xs font-bold uppercase text-primary tracking-widest">Priority Hardening</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                       {score.factors.filter(f => f.score < f.maxScore).map((f) => {
                         const rec = getRecommendation(f.statusBy);
                         return (
                          <button 
                            key={f.label}
                            onClick={() => onNavigate?.(rec.tab)}
                            className="flex items-start gap-2.5 text-left p-2.5 rounded-lg border border-transparent hover:border-primary/20 hover:bg-background transition-all group/item"
                          >
                             <div className="h-5 w-5 bg-primary/10 rounded flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                <ChevronRight className="h-3.5 w-3.5" />
                             </div>
                             <div className="space-y-0.5">
                               <p className="text-[11px] font-bold leading-tight">{f.label}</p>
                               <p className="text-[10px] text-muted-foreground leading-tight">{rec.msg}</p>
                             </div>
                          </button>
                         );
                       })}
                    </div>
                  </div>
               )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRecommendation(type: string) {
    switch(type) {
        case "mfa": return { msg: "Enable multi-factor auth for owner", tab: "overview" };
        case "rotation": return { msg: "Fix overdue production rotations", tab: "secrets" };
        case "audit": return { msg: "Enable logging on all projects", tab: "audit" };
        case "restriction": return { msg: "Restrict API with IP allowlisting", tab: "overview" };
        default: return { msg: "Review security health report", tab: "overview" };
    }
}
