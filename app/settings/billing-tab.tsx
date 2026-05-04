"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle2, Zap, Shield, Crown, Building2, Server, Key, ExternalLink, ArrowUpCircle, History, Activity, ShieldCheck, Cpu } from "lucide-react";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageStats {
  workspaces: { used: number; limit: number };
  projects: { used: number; limit: number };
  secrets: { used: number; limit: number };
  dailyRequests: { used: number; limit: number };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function BillingTab({ currentTier }: { currentTier: Tier }) {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier })
      });

      const data = await res.json();

      if (data.isFree) {
        toast({ title: "Plan Updated", description: data.promoMessage });
        window.location.reload();
        return;
      }

      if (data.order) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "XtraSecurity",
          description: `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
          order_id: data.order.id,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                tier
              })
            });
            if (verifyRes.ok) {
              toast({ title: "Subscription Active", description: "You have successfully upgraded your plan." });
              window.location.reload();
            }
          },
          prefill: {
            name: "",
            email: ""
          },
          theme: { color: "#3b82f6" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to initiate checkout.", variant: "destructive" });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Plan Skeleton */}
          <Card className="h-[500px] border-border bg-white/[0.02]/80 rounded-3xl p-8 flex flex-col">
            <div className="space-y-2 mb-2">
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
            <Skeleton className="h-9 w-48 rounded-lg mt-2 mb-4" />
            <Skeleton className="h-4 w-64 rounded-lg mb-8" />
            
            <Skeleton className="h-14 w-32 rounded-lg mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                 </div>
              ))}
            </div>
            <div className="mt-auto pt-8">
               <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          </Card>

          {/* Usage Skeleton */}
          <Card className="h-[500px] border-border bg-white/[0.01]/50 rounded-3xl p-8 flex flex-col">
            <div className="space-y-2 mb-2">
              <Skeleton className="h-3 w-36 rounded-full" />
            </div>
            <Skeleton className="h-8 w-56 rounded-lg mt-2 mb-8" />
            
            <div className="space-y-8 flex-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                       <Skeleton className="h-10 w-10 rounded-xl" />
                       <Skeleton className="h-4 w-24 rounded-lg" />
                     </div>
                     <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentLimits = DAILY_LIMITS[currentTier];

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-2">
        
        {/* ── Current Plan Card ── */}
        <motion.div variants={itemVariants} className="h-full">
            <Card className="relative overflow-hidden border-border bg-white/[0.02]/80 backdrop-blur-xl h-full flex flex-col group rounded-3xl shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 pointer-events-none">
                    <Crown className="h-40 w-40 text-primary" />
                </div>
                
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                       <Zap className="h-3 w-3" /> Subscription Node
                    </div>
                    <CardTitle className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
                       <span className="capitalize">{currentTier}</span> Mode
                       {currentTier !== 'free' && <Badge variant="secondary" className="px-3 py-0.5 text-[9px] uppercase font-bold text-emerald-600 bg-emerald-500/5 border-none">Active</Badge>}
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground mt-2 leading-relaxed">
                    {currentTier === 'free'
                        ? "Limited development workspace with core security primitives."
                        : `Your ${currentTier} subscription is active and providing premium limits.`}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 p-8 pt-4">
                    <div className="text-5xl font-black tracking-tighter text-foreground italic flex items-baseline gap-2">
                        {currentLimits.price}<span className="text-sm font-bold uppercase tracking-widest text-muted-foreground not-italic opacity-60">/month</span>
                    </div>
                    <ul className="space-y-4 mt-8">
                    {currentLimits.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-3 group/item">
                           <CheckCircle2 className="h-4 w-4 text-primary shrink-0 transition-transform group-hover/item:scale-110" />
                           <span className="text-muted-foreground font-semibold text-sm group-hover/item:text-foreground transition-colors">{f}</span>
                        </li>
                    ))}
                    </ul>
                </CardContent>

                <CardFooter className="p-8 pt-0">
                    {currentTier === 'free' ? (
                    <Button size="lg" onClick={() => handleUpgrade('pro')} className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95" disabled={isUpgrading}>
                        <Zap className="h-4 w-4 mr-2" /> Upgrade Plan
                    </Button>
                    ) : (
                    <Button size="lg" variant="outline" className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-muted transition-all active:scale-95" asChild>
                        <Link href="/subscription">Manage Cycle <ExternalLink className="ml-2 h-4 w-4 opacity-40" /></Link>
                    </Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>

        {/* ── Resource Usage Card ── */}
        <motion.div variants={itemVariants} className="h-full">
            <Card className="h-full border border-border bg-white/[0.01]/50 backdrop-blur-sm rounded-3xl flex flex-col group shadow-sm">
               <CardHeader className="p-8 pb-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                     <History className="h-3 w-3" /> Consumption metrics
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Resource Utilization</CardTitle>
               </CardHeader>
               <CardContent className="space-y-8 flex-1 p-8 pt-0">
                  {usage ? (
                  <div className="space-y-8">
                     <CompactUsageMeterClean label="Workspaces" used={usage.workspaces.used} limit={usage.workspaces.limit} icon={<Building2 className="w-5 h-5" />} />
                     <CompactUsageMeterClean label="Projects" used={usage.projects.used} limit={usage.projects.limit} icon={<Server className="w-5 h-5" />} />
                     <CompactUsageMeterClean label="Secrets (Stored)" used={usage.secrets.used} limit={usage.secrets.limit} icon={<Key className="w-5 h-5" />} />
                     <CompactUsageMeterClean label="Daily API Signals" used={usage.dailyRequests.used} limit={usage.dailyRequests.limit} icon={<Activity className="w-5 h-5" />} />
                  </div>
                  ) : (
                  <div className="h-full flex items-center justify-center p-12 text-muted-foreground font-medium italic border border-dashed rounded-2xl">
                      Synchronizing with telemetry hub...
                  </div>
                  )}
               </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* ── Enterprise CTA ── */}
      <motion.div variants={itemVariants}>
         <Card className="border border-border bg-muted/20 rounded-3xl overflow-hidden relative shadow-sm group">
            <CardContent className="p-8 flex flex-col xl:flex-row items-center justify-between gap-10 relative z-10">
               <div className="flex items-center gap-8">
                  <div className="h-16 w-16 rounded-2xl bg-white/[0.05] border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
                     <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xl font-bold tracking-tight uppercase flex items-center gap-3">
                        Enterprise Protocols <Badge variant="secondary" className="px-2 py-0 font-bold text-[9px] uppercase tracking-widest opacity-60">SAML/SSO</Badge>
                     </h3>
                     <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed pr-6">
                        Self-hosting, dedicated cryptographic support, and cryptographically signed SOC2 compliance logs for critical security requirements.
                     </p>
                  </div>
               </div>
               <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all active:scale-95 shrink-0" asChild>
                  <Link href="/book-demo">Contact Core Sales</Link>
               </Button>
            </CardContent>
         </Card>
      </motion.div>
    </motion.div>
  );
}

function CompactUsageMeterClean({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: React.ReactNode }) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 70 && percentage < 90;
  
  const statusColor = isCritical ? "text-rose-500" : isWarning ? "text-amber-500" : "text-primary";
  const progressColor = isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-3 group/meter">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-xl bg-muted/40 border flex items-center justify-center shadow-sm group-hover/meter:scale-105 transition-transform text-muted-foreground", isCritical && "text-rose-500", isWarning && "text-amber-500")}>
                {icon}
            </div>
            <span className="text-sm font-bold text-foreground opacity-90">{label}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className={cn("text-base font-bold tracking-tight", statusColor)}>
               {used} <span className="text-muted-foreground/40 font-normal mx-1">/</span> {limit === Infinity ? '∞' : limit}
            </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden relative">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full relative transition-all rounded-full", progressColor)}
         >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
         </motion.div>
      </div>
    </div>
  );
}
