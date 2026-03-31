"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle2, Zap, Shield, Crown, CreditCard, ExternalLink, ArrowUpCircle } from "lucide-react";
import { DAILY_LIMITS, Tier } from "@/lib/rate-limit-config";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface UsageStats {
  workspaces: { used: number; limit: number };
  projects: { used: number; limit: number };
  secrets: { used: number; limit: number };
  dailyRequests: { used: number; limit: number };
}

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
      // Reusing logic from the subscription page API if needed, 
      // but for settings, we might want a lightweight fetch
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
        // Razorpay logic (assuming razorpay is loaded in window)
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORRPAY_ID,
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
            name: "", // Will be filled by user session if available
            email: ""
          },
          theme: { color: "#000000" }
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

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

  const currentLimits = DAILY_LIMITS[currentTier];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* CURRENT PLAN CARD */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-card">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Crown className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan: <span className="capitalize">{currentTier}</span>
              {currentTier !== 'free' && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
            </CardTitle>
            <CardDescription>
              {currentTier === 'free'
                ? "You are currently on the Free tier. Upgrade for enterprise features."
                : `Your ${currentTier} subscription is active.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {currentLimits.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              {currentLimits.features.slice(0, 5).map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === 'free' ? (
              <Button onClick={() => handleUpgrade('pro')} className="w-full gap-2" disabled={isUpgrading}>
                <Zap className="h-4 w-4" /> Upgrade to Pro
              </Button>
            ) : (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/subscription">View All Plans <ExternalLink className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* RESOURCE USAGE CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>Metrics for your current workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usage && (
              <>
                <UsageMeter label="Workspaces" used={usage.workspaces.used} limit={usage.workspaces.limit} />
                <UsageMeter label="Projects" used={usage.projects.used} limit={usage.projects.limit} />
                <UsageMeter label="Secrets (Stored)" used={usage.secrets.used} limit={usage.secrets.limit} />
                <UsageMeter label="Daily API Requests" used={usage.dailyRequests.used} limit={usage.dailyRequests.limit} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PLAN COMPARISON TEASE */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-lg flex items-center gap-2 justify-center md:justify-start">
              <Shield className="h-5 w-5 text-primary" /> Need Enterprise Grade Controls?
            </p>
            <p className="text-muted-foreground text-sm max-w-lg">
              Our Enterprise plan includes SAML SSO, On-premise deployment, dedicated support, and SOC2 compliance reports.
            </p>
          </div>
          <Button variant="secondary" className="gap-2" asChild>
            <Link href="/book-demo">Contact Sales <ArrowUpCircle className="h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isHigh = percentage > 85;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={isHigh ? "text-destructive font-bold" : "text-muted-foreground"}>
          {used} / {limit}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
