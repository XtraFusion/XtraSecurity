"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SecurityScore } from "@/lib/compliance/score-engine";
import { Shield, ShieldAlert, ShieldCheck, ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";

export function SecurityScoreCard({ score }: { score: SecurityScore }) {
  const isHigh = score.total >= 80;
  const isMed = score.total >= 60;
  
  const scoreColor = isHigh ? "text-green-500" : isMed ? "text-yellow-500" : "text-destructive";

  return (
    <Card className="border-primary/20 bg-gradient-card relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Workspace Security Score
          <Badge variant={isHigh ? "default" : isMed ? "secondary" : "destructive"}>
             Grade {score.grade}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Score Gauge */}
            <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-background/50 relative">
               <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="64" cy="64" r="58"
                      stroke="currentColor" strokeWidth="8" fill="transparent"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64" cy="64" r="58"
                      stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray="364.4"
                      strokeDashoffset={364.4 - (364.4 * score.total) / 100}
                      className={`${scoreColor} transition-all duration-1000 ease-out`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${scoreColor}`}>{score.total}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Security Index</span>
                  </div>
               </div>
               <div className="mt-4 text-center">
                  <p className="text-sm font-medium">
                    {score.total >= 90 ? "Excellent Security Posture" : 
                     score.total >= 70 ? "Good, but needs improvement" : 
                     "Critical Vulnerabilities Found"}
                  </p>
               </div>
            </div>

            {/* Breakdown & Recommendations */}
            <div className="space-y-4">
               <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                     <ShieldCheck className="h-3 w-3" /> Score Breakdown
                  </h4>
                  <div className="space-y-3">
                    {score.factors.map(f => (
                       <div key={f.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                             <span>{f.label}</span>
                             <span className="font-mono">{f.score}/{f.maxScore}</span>
                          </div>
                          <Progress value={(f.score/f.maxScore) * 100} className="h-1.5" />
                       </div>
                    ))}
                  </div>
               </div>

               {score.total < 100 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                       <Zap className="h-3 w-3 text-yellow-500" /> Recommendations
                    </h4>
                    <ul className="text-[11px] space-y-1.5">
                       {score.factors.filter(f => f.score < f.maxScore).map(f => (
                         <li key={f.label} className="flex items-start gap-2 text-muted-foreground">
                            <ArrowRight className="h-3 w-3 mt-0.5 text-primary" />
                            <span>{getRecommendation(f.statusBy)}</span>
                         </li>
                       ))}
                    </ul>
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
        case "mfa": return "Enable MFA in settings for the workspace owner.";
        case "rotation": return "Review and fix overdue secret rotations in production.";
        case "audit": return "Enable 'Audit Logging' globally on all active projects.";
        case "restriction": return "Restict project access with IP Allowlisting.";
        default: return "Review security standards.";
    }
}

function Zap({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.5a3 3 0 0 1-1.34-5.34Q3.45 8.1 4.54 7.15A1 1 0 0 1 5 7h14a1 1 0 0 1 .46.11q1.09.95 1.88 2.01A3 3 0 0 1 20 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M12 2v4"/><path d="M12 14v4"/><path d="M16 14v2"/><path d="M8 14v2"/></svg>
  )
}
