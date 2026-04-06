"use client"

import { useState } from 'react';
import Script from 'next/script';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Sparkles, AlertTriangle, TrendingUp, ShieldAlert, Zap, Crown, Building2, Server, Key, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { RateLimitResult, Tier, DAILY_LIMITS } from "@/lib/rate-limit-config";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Ensure Razorpay type is somewhat known
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
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
                    colors: ['#6366f1', '#a855f7', '#ec4899']
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
                theme: { color: '#6366f1' }
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
            className="space-y-12 pb-20 relative max-w-7xl mx-auto"
        >
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            
            {/* Background glowing effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-6 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-full w-fit mx-auto sm:mx-0 mb-2 border border-primary/20 shadow-inner">
                    <Crown className="h-4 w-4" /> Your Subscription
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Subscription &amp; Usage</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto sm:mx-0">Manage your plan, check your billing cycle, and monitor your resource limits.</p>
            </motion.div>

            {percentage >= 80 && (
                <motion.div variants={itemVariants}>
                    <div className={`flex flex-col sm:flex-row sm:items-center gap-5 p-6 rounded-3xl border backdrop-blur-md ${percentage >= 90
                        ? "bg-red-500/10 border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]"
                        : "bg-amber-500/10 border-amber-500/30 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]"
                        }`}>
                        <div className={`p-4 rounded-2xl shrink-0 ${percentage >= 90 ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"}`}>
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                            <p className={`text-xl font-bold ${percentage >= 90 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                                {percentage >= 90 ? "API limit almost exhausted" : "Approaching API limit"}
                            </p>
                            <p className={`text-base mt-1.5 ${percentage >= 90 ? "text-red-800/80 dark:text-red-300/80" : "text-amber-800/80 dark:text-amber-300/80"}`}>
                                You've used {percentage}% of your daily {stats.limit} requests.
                                {tier === 'free' && " Upgrade to Pro for 10× more capacity."}
                            </p>
                        </div>
                        {tier === 'free' && (
                            <Button className={`shrink-0 h-12 px-6 rounded-xl text-md font-semibold ${percentage >= 90 ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30" : ""}`} size="lg" onClick={() => initiateUpgradeProcess('pro')}>
                                <TrendingUp className="h-5 w-5 mr-2" /> Upgrade to Pro
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}

            <div className="space-y-6">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Current Usage</h2>
                    <Badge variant={tier === 'free' ? 'secondary' : tier === 'pro' ? 'default' : 'destructive'} className="uppercase px-4 py-1.5 text-sm font-bold shadow-sm">
                        {tier} Plan
                    </Badge>
                </motion.div>

                {resourceUsage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <UsageMetricCard 
                            title="API Requests" 
                            used={stats.limit - stats.remaining} 
                            limit={stats.limit} 
                            icon={Zap} 
                            percentage={percentage}
                            subtitle={stats.reset > 0 ? `Resets ${formatDistanceToNow(new Date(stats.reset * 1000))} from now` : undefined}
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
                            title="Projects" 
                            used={resourceUsage.projects.used} 
                            limit={resourceUsage.projects.limit} 
                            icon={Server} 
                            tooltip="Maximum projects used in a single workspace"
                        />
                    </div>
                )}
            </div>

            <div className="pt-12">
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Choose the perfect plan for your security needs. No hidden fees, cancel anytime.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {(Object.keys(DAILY_LIMITS) as Tier[]).map((tierKey) => {
                        const config = DAILY_LIMITS[tierKey];
                        const isEnterprise = tierKey === 'enterprise';
                        const isCurrent = tier === tierKey;
                        const isProDowngradingToFree = tier === 'pro' && tierKey === 'free';
                        const isPlanDisabled = isCurrent || isProcessing !== null || isProDowngradingToFree;

                        let currentActionLabel: React.ReactNode = `Upgrade to ${tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}`;
                        if (isCurrent) currentActionLabel = "Current Plan";
                        else if (isProcessing === tierKey) currentActionLabel = "Processing...";
                        else if (isEnterprise) currentActionLabel = "Contact Sales";
                        else if (isProDowngradingToFree) currentActionLabel = "Unavailable";

                        return (
                            <PricingCard
                                key={tierKey}
                                title={tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
                                price={config.price}
                                originalPrice={config.originalPrice}
                                period={tierKey === 'free' ? "" : "/month"}
                                features={config.features}
                                current={isCurrent}
                                popular={tierKey === 'pro'}
                                actionLabel={currentActionLabel}
                                onAction={() => {
                                    if (isProDowngradingToFree || isPlanDisabled) return;
                                    isEnterprise ? (window.location.href = "mailto:sales@xtrasecurity.com") : initiateUpgradeProcess(tierKey)
                                }}
                                disabled={isPlanDisabled}
                            />
                        );
                    })}
                </div>
            </div>

            <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-6 w-6 text-indigo-500" />
                            Upgrade to Pro
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            You are about to upgrade to the Pro tier for $9/month. If you have a promotional code, enter it below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="promo" className="text-muted-foreground font-semibold">Promo Code (Optional)</Label>
                            <Input
                                id="promo"
                                placeholder="e.g. EARLYBIRD100"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="font-mono uppercase tracking-widest text-center text-xl h-14 bg-muted/50 border-primary/20 focus:border-primary placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-3 sm:space-x-0 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2 h-12"
                        >
                            Skip & Pay
                        </Button>
                        <Button
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            Apply & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

function UsageMetricCard({ title, used, limit, icon: Icon, percentage: overridePct, subtitle, tooltip }: any) {
    const pct = overridePct !== undefined ? overridePct : Math.min(100, Math.round((used / limit) * 100));
    const isCritical = pct >= 90;
    const isWarning = pct >= 70 && pct < 90;
    
    const colorClass = isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-primary";
    const bgGlowClass = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary";
    const lightBgClass = isCritical ? "bg-red-500/10" : isWarning ? "bg-amber-500/10" : "bg-primary/10";
    const progressClass = isCritical ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary";

    return (
        <motion.div variants={itemVariants} className="h-full">
            <Card className="overflow-hidden bg-card/60 backdrop-blur-xl border-none ring-1 ring-border/50 transition-all hover:ring-primary/30 hover:shadow-xl hover:shadow-primary/5 h-full flex flex-col relative group cursor-default">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-10 -mt-10 transition-all duration-500 group-hover:opacity-40 group-hover:scale-150 rounded-full ${bgGlowClass}`} />
                <CardContent className="p-6 flex-1 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${lightBgClass} transition-colors group-hover:bg-background`}>
                            <Icon className={`w-6 h-6 ${colorClass}`} />
                        </div>
                        {isCritical && <Badge variant="destructive" className="animate-pulse shadow-sm">Critical</Badge>}
                        {isWarning && <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">Warning</Badge>}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5" title={tooltip}>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-extrabold tracking-tight text-foreground">{used}</span>
                            <span className="text-base font-semibold text-muted-foreground/70">/ {limit === Infinity ? '∞' : limit}</span>
                        </div>
                        {subtitle && <p className="text-xs text-muted-foreground mt-2 font-medium bg-muted/50 w-fit px-2 py-1 rounded-md">{subtitle}</p>}
                    </div>

                    <div className="space-y-2.5 mt-8">
                        <div className="flex justify-between text-sm font-semibold">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className={colorClass}>{pct}%</span>
                        </div>
                        <Progress value={pct} className={`h-2.5 ${progressClass} bg-secondary overflow-hidden`} />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function PricingCard({
    title, price, originalPrice, period = "", features, current, popular, actionLabel, onAction, disabled
}: any) {
    return (
        <motion.div variants={itemVariants} className="h-full">
            <Card className={`flex flex-col relative h-full transition-all duration-500 hover:shadow-2xl overflow-hidden group ${popular ? 'border-primary/50 ring-1 ring-primary/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] md:-translate-y-2 z-10 bg-gradient-to-b from-primary/10 via-card to-card dark:from-primary/5' : 'bg-card/50 backdrop-blur-xl border-none ring-1 ring-border/50 hover:bg-card hover:-translate-y-1'}`}>
                {popular && (
                    <>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                        <div className="absolute top-5 right-5 flex flex-col items-end gap-1.5 z-20">
                            <Badge className="px-2 py-0.5 text-[10px] shadow-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white font-bold animate-pulse">69% OFF</Badge>
                            <Badge className="px-3 py-1 text-xs shadow-md bg-primary text-primary-foreground border-none font-bold">Most Popular</Badge>
                        </div>
                    </>
                )}
                
                {current && !popular && (
                    <div className="absolute top-5 right-5 z-20">
                        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold shadow-sm">Active Plan</Badge>
                    </div>
                )}

                <CardHeader className="relative z-10 pb-4 pt-10 px-8">
                    <CardTitle className="text-2xl font-black tracking-tight">{title}</CardTitle>
                    <div className="flex items-baseline gap-2 mt-4 relative">
                        {originalPrice && (
                            <span className="absolute -top-6 left-0 text-lg text-muted-foreground line-through decoration-red-500/70 font-semibold opacity-80">
                                {originalPrice}
                            </span>
                        )}
                        <span className={`text-6xl font-black tracking-tighter ${popular ? 'bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60' : 'text-foreground'}`}>{price}</span>
                        <span className="text-muted-foreground text-sm font-bold tracking-wide">{period}</span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 relative z-10 px-8">
                    <ul className="space-y-4 text-sm mt-6">
                        {features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-4">
                                <div className={`rounded-full p-1.5 shrink-0 mt-0.5 ${popular ? 'bg-primary/20' : 'bg-muted'}`}>
                                    <Check className={`h-3 w-3 ${popular ? 'text-primary' : 'text-muted-foreground font-bold'}`} />
                                </div>
                                <span className={`${popular ? "font-semibold text-foreground/90" : "font-medium text-muted-foreground"} leading-tight`}>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter className="relative z-10 pt-8 pb-10 px-8">
                    <Button
                        size="lg"
                        className={`w-full font-bold text-md h-14 rounded-2xl transition-all duration-300 ${popular ? 'shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]' : 'hover:scale-[1.02]'}`}
                        variant={current ? "secondary" : popular ? "default" : "outline"}
                        onClick={onAction}
                        disabled={disabled}
                    >
                        {disabled && !current && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {current && <Check className="mr-2 h-5 w-5" />}
                        {actionLabel}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
