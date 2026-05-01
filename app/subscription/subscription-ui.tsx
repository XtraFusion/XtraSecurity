"use client"

import { useState } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Sparkles, TrendingUp, ShieldAlert, Zap, Crown, Building2, Server, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { RateLimitResult, Tier, DAILY_LIMITS } from "@/lib/rate-limit-config";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface ResourceUsage {
    used: number;
    limit: number;
}

interface SubscriptionUIProps {
    tier: Tier;
    stats: RateLimitResult;
    resourceUsage?: {
        workspaces: ResourceUsage;
        teams: ResourceUsage;
        projects: ResourceUsage;
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function SubscriptionUI({ tier, stats, resourceUsage }: SubscriptionUIProps) {
    const router = useRouter();
    const { fetchUser, user } = useGlobalContext();
    const [isProcessing, setIsProcessing] = useState<Tier | null>(null);
    const [promoDialogOpen, setPromoDialogOpen] = useState(false);
    const [promoCode, setPromoCode] = useState("");

    const percentage = Math.min(100, Math.round(((stats.limit - stats.remaining) / stats.limit) * 100));

    const initiateUpgradeProcess = (tierKey: Tier) => {
        if (tierKey === 'free') {
            processFreeTierUpgrade(tierKey);
        } else if (tierKey === 'pro') {
            setPromoCode("");
            setPromoDialogOpen(true);
        }
    };

    const processFreeTierUpgrade = async (tierKey: Tier) => {
        setIsProcessing(tierKey);
        try {
            const res = await fetch('/api/subscription/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey })
            });

            if (res.ok) {
                fetchUser();
                router.refresh();
            } else {
                toast({ title: "Failed to downgrade", variant: "destructive" });
            }
        } catch (err) {
            console.error("Free Plan Downgrade Error:", err);
            toast({ title: "An error occurred", variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    }

    const handleProCheckout = async () => {
        setPromoDialogOpen(false);
        const tierKey = 'pro';
        setIsProcessing(tierKey);

        try {
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey, promoCode })
            });
            const { order, isFree, promoMessage } = await orderRes.json();

            if (promoMessage && promoMessage.includes("discount")) {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']
                });

                toast({
                    title: "Promo Code Applied! 🎉",
                    description: promoMessage,
                    duration: 5000,
                });
            }

            if (isFree) {
                const res = await fetch('/api/subscription/upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tier: tierKey })
                });

                if (res.ok) {
                    fetchUser();
                    router.refresh();
                } else {
                    toast({ title: "Failed to apply promo and upgrade", variant: "destructive" });
                }
                setIsProcessing(null);
                return;
            }

            if (!order) {
                console.error("No order returned");
                setIsProcessing(null);
                toast({ title: "Could not initialize payment", description: "Please check your connection.", variant: "destructive" });
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: order.amount,
                currency: order.currency,
                name: 'XtraSecurity',
                description: `Upgrade to ${tierKey.toUpperCase()} Plan`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        setIsProcessing(tierKey);
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                tier: tierKey
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            fetchUser(); 
                            router.refresh(); 
                        } else {
                            console.error("Verification failed:", verifyData);
                            toast({ title: "Payment verification failed", description: "Please contact support.", variant: "destructive" });
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        toast({ title: "Payment verification error", variant: "destructive" });
                    } finally {
                        setIsProcessing(null);
                    }
                },
                prefill: {
                    name: user?.name || "User",
                    email: user?.email || "",
                },
                theme: { color: 'hsl(var(--primary))' }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment Failed:", response.error);
                setIsProcessing(null);
                toast({ title: "Payment cancelled or failed", variant: "destructive" });
            });

            rzp.open();
        } catch (error) {
            console.error("Checkout rendering failed", error);
            setIsProcessing(null);
        }
    };

    return (
        <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants} 
            className="space-y-16 pb-24 relative max-w-[1400px] mx-auto px-4"
        >
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            
            {/* Architectural Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-10 border-b border-border/40 pb-8">
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold uppercase text-primary bg-primary/10 rounded-sm w-fit border border-primary/20">
                        <Crown className="h-3 w-3" /> Account Status
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold">Subscription Profile</h1>
                    <p className="text-muted-foreground text-sm max-w-xl font-medium">Monitor usage quotas and manage platform tier provisioning.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-card px-5 py-3 rounded-md ring-1 ring-border/50 text-right">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Current Tier</p>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-bold text-lg leading-none uppercase">{tier} Plan</span>
                    </div>
                </motion.div>
            </div>

            { percentage >= 80 && (
                <motion.div variants={itemVariants}>
                    <div className={`flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-md border backdrop-blur-md ${percentage >= 90
                        ? "bg-destructive/10 border-destructive/30 shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.2)]"
                        : "bg-amber-500/10 border-amber-500/30 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]"
                        }`}>
                        <div className={`p-3 rounded-md shrink-0 ${percentage >= 90 ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-500"}`}>
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className={`text-lg font-bold ${percentage >= 90 ? "text-destructive" : "text-amber-500"}`}>
                                {percentage >= 90 ? "API Capacity Critical" : "API Capacity Warning"}
                            </p>
                            <p className="text-sm mt-1 text-muted-foreground font-medium">
                                You have consumed {percentage}% of your daily allocation ({stats.limit} requests).
                                {tier === 'free' && " Consider tier elevation for 10x throughput capacity."}
                            </p>
                        </div>
                        {tier === 'free' && (
                            <Button className={`shrink-0 h-10 px-6 rounded-sm text-sm font-bold ${percentage >= 90 ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`} onClick={() => initiateUpgradeProcess('pro')}>
                                <TrendingUp className="h-4 w-4 mr-2" /> Elevate to Pro
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}

            <div className="space-y-8">
                <motion.div variants={itemVariants}>
                    <h2 className="text-xl font-bold mb-6">Resource Allocation</h2>
                </motion.div>

                {resourceUsage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <UsageMetricCard 
                            title="API Operations" 
                            used={stats.limit - stats.remaining} 
                            limit={stats.limit} 
                            icon={Zap} 
                            percentage={percentage}
                            subtitle={stats.reset > 0 ? `Cycle reset in ${formatDistanceToNow(new Date(stats.reset * 1000))}` : undefined}
                            glow={percentage >= 80 ? (percentage >= 90 ? 'destructive' : 'amber-500') : 'primary'}
                        />
                        <UsageMetricCard 
                            title="Workspaces" 
                            used={resourceUsage.workspaces.used} 
                            limit={resourceUsage.workspaces.limit} 
                            icon={Building2} 
                        />
                        <UsageMetricCard 
                            title="Teams" 
                            used={resourceUsage.teams.used} 
                            limit={resourceUsage.teams.limit} 
                            icon={Users} 
                        />
                        <UsageMetricCard 
                            title="Projects Topology" 
                            used={resourceUsage.projects.used} 
                            limit={resourceUsage.projects.limit} 
                            icon={Server} 
                            tooltip="Maximum active projects globally across all workspaces"
                        />
                    </div>
                )}
            </div>

            <div className="pt-16 border-t border-border/40">
                <motion.div variants={itemVariants} className="mb-10">
                    <h2 className="text-3xl font-extrabold mb-2">Service Topologies</h2>
                    <p className="text-muted-foreground text-sm font-medium">Select a provisioning framework that aligns with your operational scale.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(DAILY_LIMITS) as Tier[]).map((tierKey) => {
                        const config = DAILY_LIMITS[tierKey];
                        const isEnterprise = tierKey === 'enterprise';
                        const isCurrent = tier === tierKey;
                        const isProDowngradingToFree = tier === 'pro' && tierKey === 'free';
                        const isPlanDisabled = isCurrent || isProcessing !== null || isProDowngradingToFree;

                        let currentActionLabel: React.ReactNode = tierKey === 'free' ? "Activate Free Plan" : "Upgrade to Pro Plan";
                        if (isCurrent) currentActionLabel = "Active Plan";
                        else if (isProcessing === tierKey) currentActionLabel = "Processing...";
                        else if (isEnterprise) currentActionLabel = "Contact Sales";
                        else if (isProDowngradingToFree) currentActionLabel = "Locked";

                        return (
                            <PricingCard
                                key={tierKey}
                                title={tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
                                price={config.price}
                                originalPrice={config.originalPrice}
                                period={tierKey === 'free' ? "" : "/mo"}
                                features={config.features}
                                current={isCurrent}
                                popular={tierKey === 'pro'}
                                actionLabel={currentActionLabel}
                                onAction={() => {
                                    if (isProDowngradingToFree || isPlanDisabled) return;
                                    isEnterprise ? (window.location.href = "mailto:sales@xtrasecurity.com") : initiateUpgradeProcess(tierKey)
                                }}
                                disabled={isPlanDisabled}
                                isLoading={isProcessing === tierKey}
                            />
                        );
                    })}
                </div>
            </div>

            <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-background border-border/50 rounded-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Upgrade to Pro Plan
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            Upgrade to Pro configuration for unified security management ($29/mo). Apply authentication key if available.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="grid gap-2">
                            <Label htmlFor="promo" className="text-xs uppercase font-bold text-muted-foreground">Authentication Key</Label>
                            <Input
                                id="promo"
                                placeholder="E.g. SYSADMIN100"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="font-mono uppercase tracking-[0.2em] text-center text-lg h-12 bg-muted/30 border-border/50 rounded-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-3 sm:space-x-0 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2 h-10 rounded-sm text-sm font-bold"
                        >
                            Verify & Upgrade
                        </Button>
                        <Button
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm"
                        >
                            Upgrade Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

function UsageMetricCard({ title, used, limit, icon: Icon, percentage: overridePct, subtitle, tooltip, glow }: any) {
    const pct = overridePct !== undefined ? overridePct : Math.min(100, Math.round((used / limit) * 100));
    const isCritical = pct >= 90;
    
    // Ghost borders and dark backgrounds
    return (
        <motion.div variants={itemVariants} className="h-full">
            <Card className="flex flex-col relative h-full bg-card rounded-md border-0 ring-1 ring-border/40 hover:ring-border hover:bg-muted/10 transition-all">
                {glow && <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 bg-${glow} -mr-6 -mt-6 pointer-events-none`} />}
                <CardContent className="p-5 flex-1 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="opacity-70 text-muted-foreground">
                            <Icon className="w-5 h-5" />
                        </div>
                        {isCritical && <Badge variant="destructive" className="h-5 text-[10px] rounded-sm animate-pulse font-bold">CRITICAL</Badge>}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5" title={tooltip}>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase">{title}</p>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-medium text-foreground">{used}</span>
                            <span className="text-sm font-medium text-muted-foreground/50">/ {limit === Infinity ? '∞' : limit}</span>
                        </div>
                        {subtitle && <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase">{subtitle}</p>}
                    </div>

                    <div className="mt-8">
                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                            <span>CAPACITY</span>
                            <span className={isCritical ? "text-destructive" : ""}>{pct}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted overflow-hidden">
                            <div 
                                className={`h-full opacity-80 ${isCritical ? 'bg-destructive' : "bg-primary"} transition-all duration-500 ease-out`} 
                                style={{ width: `${pct}%` }} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function PricingCard({
    title, price, originalPrice, period = "", features, current, popular, actionLabel, onAction, disabled, isLoading
}: any) {
    return (
        <motion.div variants={itemVariants} className="h-full">
            <Card className={`flex flex-col relative h-full transition-all overflow-hidden rounded-md ${popular ? 'bg-background ring-1 ring-amber-500/50 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] z-10' : 'bg-card border-none ring-1 ring-border/40 hover:bg-muted/10'}`}>
                {popular && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-500/80" />
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-20">
                            <Badge className="px-1.5 py-0 text-[9px] uppercase rounded-sm bg-amber-500 text-amber-950 font-bold shadow-none">Most Selected</Badge>
                        </div>
                    </>
                )}
                
                {current && !popular && (
                    <div className="absolute top-4 right-4 z-20">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase rounded-sm font-bold shadow-none">Active</Badge>
                    </div>
                )}

                <CardHeader className="relative z-10 pb-4 pt-8 px-6">
                    <CardTitle className="text-xl font-bold uppercase">{title}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-6 relative">
                        {originalPrice && (
                            <span className="absolute -top-5 left-0 text-sm text-muted-foreground line-through decoration-destructive/70 font-medium">
                                {originalPrice}
                            </span>
                        )}
                        <span className={`text-4xl font-medium ${popular ? 'text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'text-foreground'}`}>{price}</span>
                        <span className="text-muted-foreground text-xs uppercase ml-1">{period}</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 relative z-10 px-6">
                    <ul className="space-y-4 text-sm mt-4 font-medium">
                        {features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                <Check className={`h-4 w-4 shrink-0 mt-0.5 ${popular ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'opacity-50'}`} />
                                <span className="leading-snug">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter className="relative z-10 pt-6 pb-8 px-6">
                    <Button
                        className={`w-full font-bold text-sm h-11 rounded-sm transition-all ${popular ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 text-shadow-sm shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]' : ''}`}
                        variant={current ? "secondary" : popular ? "default" : "outline"}
                        onClick={onAction}
                        disabled={disabled}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {current && <Check className="mr-2 h-4 w-4" />}
                        {actionLabel}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
