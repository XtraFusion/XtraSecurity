"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle2, Zap, Shield, Crown, Building2, Server, Key, ExternalLink, ArrowUpCircle } from "lucide-react";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";

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
          theme: { color: "#6366f1" }
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

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;

  const currentLimits = DAILY_LIMITS[currentTier];

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CURRENT PLAN CARD */}
        <motion.div variants={itemVariants} className="h-full">
            <Card className="relative overflow-hidden border-primary/20 bg-card/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-primary/5 h-full flex flex-col group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500 group-hover:-rotate-12">
                    <Crown className="h-32 w-32" />
                </div>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                
                <CardHeader className="relative z-10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                    <span className="capitalize">{currentTier}</span> Plan
                    {currentTier !== 'free' && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
                    </CardTitle>
                    <CardDescription className="text-base">
                    {currentTier === 'free'
                        ? "You are currently on the Free tier. Upgrade for enterprise features."
                        : `Your ${currentTier} subscription is active and providing premium limits.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 relative z-10">
                    <div className="text-4xl font-black tracking-tight">
                        {currentLimits.price}<span className="text-sm font-semibold text-muted-foreground ml-1">/month</span>
                    </div>
                    <ul className="space-y-3 mt-6 text-sm">
                    {currentLimits.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground font-medium">{f}</span>
                        </li>
                    ))}
                    </ul>
                </CardContent>
                <CardFooter className="relative z-10">
                    {currentTier === 'free' ? (
                    <Button size="lg" onClick={() => handleUpgrade('pro')} className="w-full gap-2 font-bold shadow-lg shadow-primary/20 h-12 rounded-xl" disabled={isUpgrading}>
                        <Zap className="h-4 w-4" /> Upgrade to Pro
                    </Button>
                    ) : (
                    <Button size="lg" variant="outline" className="w-full font-bold h-12 rounded-xl" asChild>
                        <Link href="/subscription">Manage Subscription <ExternalLink className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>

        {/* RESOURCE USAGE CARD */}
        <motion.div variants={itemVariants} className="h-full">
            <Card className="h-full bg-card/40 backdrop-blur-sm border-white/5">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Resource Usage</CardTitle>
                <CardDescription>Current consumption metrics for your overall account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {usage ? (
                <>
                    <CompactUsageMeter label="Workspaces" used={usage.workspaces.used} limit={usage.workspaces.limit} icon={<Building2 className="w-4 h-4 text-primary" />} />
                    <CompactUsageMeter label="Projects" used={usage.projects.used} limit={usage.projects.limit} icon={<Server className="w-4 h-4 text-primary" />} />
                    <CompactUsageMeter label="Secrets (Stored)" used={usage.secrets.used} limit={usage.secrets.limit} icon={<Key className="w-4 h-4 text-primary" />} />
                    <CompactUsageMeter label="Daily API Requests" used={usage.dailyRequests.used} limit={usage.dailyRequests.limit} icon={<Zap className="w-4 h-4 text-primary" />} />
                </>
                ) : (
                <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
                    Failed to load usage data.
                </div>
                )}
            </CardContent>
            </Card>
        </motion.div>
      </div>

      {/* PLAN COMPARISON TEASE */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-card to-secondary/30 ring-1 ring-border/50 overflow-hidden relative">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-3xl rounded-full" />
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left relative z-10">
            <div>
                <p className="font-extrabold text-2xl flex items-center gap-2 justify-center md:justify-start mb-2">
                <Shield className="h-6 w-6 text-primary" /> Need Enterprise Controls?
                </p>
                <p className="text-muted-foreground font-medium max-w-xl">
                Our Enterprise plan includes SAML SSO, On-premise deployment, dedicated support, and SOC2 compliance reports.
                </p>
            </div>
            <Button size="lg" className="gap-2 shrink-0 font-bold px-8 h-12 rounded-xl border-primary bg-background hover:bg-primary/5 hover:text-primary transition-all text-primary border" asChild>
                <Link href="/book-demo">Contact Sales <ArrowUpCircle className="h-4 w-4" /></Link>
            </Button>
            </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function CompactUsageMeter({ label, used, limit, icon }: { label: string; used: number; limit: number; icon: React.ReactNode }) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isCritical = percentage >= 90;
  const isWarning = percentage >= 70 && percentage < 90;
  
  const colorClass = isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-primary";
  const bgClass = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary";
  const progressClass = isCritical ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm items-center">
        <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md bg-secondary flex items-center justify-center`}>
                {icon}
            </div>
            <span className="font-semibold text-foreground/90">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className={isCritical ? "text-red-500 font-bold" : isWarning ? "text-amber-500 font-bold" : "text-muted-foreground font-medium"}>
            {used} <span className="text-muted-foreground font-normal mx-0.5">/</span> {limit === Infinity ? '∞' : limit}
            </span>
        </div>
      </div>
      <Progress value={percentage} className={`h-2 ${progressClass} bg-secondary/50`} />
    </div>
  );
}
