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
import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { RateLimitResult, Tier, DAILY_LIMITS } from "@/lib/rate-limit-config";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";

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

export default function SubscriptionUI({ tier, stats, resourceUsage }: SubscriptionUIProps) {
    const router = useRouter();
    const { fetchUser, user } = useGlobalContext();
    const [isProcessing, setIsProcessing] = useState<Tier | null>(null);
    const [promoDialogOpen, setPromoDialogOpen] = useState(false);
    const [promoCode, setPromoCode] = useState("");

    const percentage = Math.min(100, Math.round(((stats.limit - stats.remaining) / stats.limit) * 100));

    const initiateUpgradeProcess = (tierKey: Tier) => {
        if (tierKey === 'free') {
            // Free tier requires no payment
            processFreeTierUpgrade(tierKey);
        } else if (tierKey === 'pro') {
            // Open promo code dialog for Pro
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
                alert("Failed to downgrade to free plan.");
            }
        } catch (err) {
            console.error("Free Plan Downgrade Error:", err);
            alert("An error occurred.");
        } finally {
            setIsProcessing(null);
        }
    }

    const handleProCheckout = async () => {
        setPromoDialogOpen(false);
        const tierKey = 'pro';
        setIsProcessing(tierKey);

        try {
            // 1. Create order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierKey, promoCode })
            });
            const { order, isFree, promoMessage } = await orderRes.json();

            // Show discount toast & confetti if applicable before proceeding
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

            // If the promo code made it free, skip razorpay
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
                    alert("Failed to apply promo and upgrade.");
                }
                setIsProcessing(null);
                return;
            }

            if (!order) {
                console.error("No order returned");
                setIsProcessing(null);
                alert("Could not initialize payment. Please check your connection.");
                return;
            }

            // 2. Initialize Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use Razorpay test key in NEXT_PUBLIC_...
                amount: order.amount,
                currency: order.currency,
                name: 'XtraSecurity',
                description: `Upgrade to ${tierKey.toUpperCase()} Plan`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        setIsProcessing(tierKey);
                        // 3. Verify Payment
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
                            fetchUser(); // Sync global client state
                            router.refresh(); // Reload server components
                        } else {
                            console.error("Verification failed:", verifyData);
                            alert("Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("Payment verification error.");
                    } finally {
                        setIsProcessing(null);
                    }
                },
                prefill: {
                    name: user?.name || "User",
                    email: user?.email || "",
                },
                theme: {
                    color: '#6366f1' // Premium Indigo
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                console.error("Payment Failed:", response.error);
                setIsProcessing(null);
                alert("Payment cancelled or failed");
            });

            rzp.open();
            // Important: we leave isProcessing as the tierKey so it shows loading while modal is open 
            // The handler/failed callbacks will clear it.
        } catch (error) {
            console.error("Checkout rendering failed", error);
            setIsProcessing(null);
        }
    };

    return (
        <div className="space-y-10">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Subscription & Usage</h1>
                <p className="text-muted-foreground">Manage your plan and monitor your API usage limits.</p>
            </div>

            {/* Current Usage */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Current Plan Usage</CardTitle>
                        <Badge variant={tier === 'free' ? 'secondary' : tier === 'pro' ? 'default' : 'destructive'} className="uppercase">
                            {tier} Plan
                        </Badge>
                    </div>
                    <CardDescription>
                        Your API request usage for the current 24-hour window.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* API Requests */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="flex items-center gap-2">Daily API Requests</span>
                            <span className="font-mono">{stats.limit - stats.remaining} / {stats.limit}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground italic">
                            {stats.reset > 0
                                ? `Usage resets in ${formatDistanceToNow(new Date(stats.reset * 1000))}.`
                                : 'Usage tracking not yet started (resets 24h after first request).'}
                        </p>
                    </div>

                    {/* Resources */}
                    {resourceUsage && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Workspaces</span>
                                    <span className="font-mono">{resourceUsage.workspaces.used} / {resourceUsage.workspaces.limit}</span>
                                </div>
                                <Progress value={Math.min(100, Math.round((resourceUsage.workspaces.used / resourceUsage.workspaces.limit) * 100))} className="h-2" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Teams</span>
                                    <span className="font-mono">{resourceUsage.teams.used} / {resourceUsage.teams.limit}</span>
                                </div>
                                <Progress value={Math.min(100, Math.round((resourceUsage.teams.used / resourceUsage.teams.limit) * 100))} className="h-2" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span title="Max projects used in a single workspace">Projects (per Workspace)</span>
                                    <span className="font-mono">{resourceUsage.projects.used} / {resourceUsage.projects.limit}</span>
                                </div>
                                <Progress value={Math.min(100, Math.round((resourceUsage.projects.used / resourceUsage.projects.limit) * 100))} className="h-2" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pricing Options */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(DAILY_LIMITS) as Tier[]).map((tierKey) => {
                        const config = DAILY_LIMITS[tierKey];
                        const isEnterprise = tierKey === 'enterprise';
                        const isCurrent = tier === tierKey;

                        // Prevent Pro users from downgrading to Free
                        const isProDowngradingToFree = tier === 'pro' && tierKey === 'free';
                        const isPlanDisabled = isCurrent || isProcessing !== null || isProDowngradingToFree;

                        let currentActionLabel: React.ReactNode = `Upgrade to ${tierKey}`;
                        if (isCurrent) currentActionLabel = "Active Plan";
                        else if (isProcessing === tierKey) currentActionLabel = <div className="flex items-center gap-2 justify-center w-full"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</div>;
                        else if (isEnterprise) currentActionLabel = "Contact Sales";
                        else if (isProDowngradingToFree) currentActionLabel = "Not Available";

                        return (
                            <PricingCard
                                key={tierKey}
                                title={tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
                                price={config.price}
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

            {/* Promo Code Dialog */}
            <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            Upgrade to Pro
                        </DialogTitle>
                        <DialogDescription>
                            You are about to upgrade to the Pro tier for $9/month. If you have a promotional code, enter it below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="promo">Promo Code (Optional)</Label>
                            <Input
                                id="promo"
                                placeholder="e.g. EARLYBIRD100"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2"
                        >
                            Continue to Payment
                        </Button>
                        <Button
                            onClick={() => handleProCheckout()}
                            className="sm:w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Apply & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function PricingCard({
    title, price, period = "", features, current, popular, actionLabel, onAction, disabled
}: any) {
    return (
        <Card className={`flex flex-col relative transition-all duration-300 hover:shadow-xl ${popular ? 'border-primary shadow-lg md:scale-105 z-10' : ''}`}>
            {popular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <Badge className="px-3 py-1 shadow-md">Most Popular</Badge>
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold tracking-tight">{price}</span>
                    <span className="text-muted-foreground text-sm font-medium">{period}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                    {features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center gap-3">
                            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
                                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full font-semibold"
                    variant={current ? "outline" : popular ? "default" : "outline"}
                    onClick={onAction}
                    disabled={disabled}
                >
                    {disabled && <Check className="mr-2 h-4 w-4" />}
                    {actionLabel}
                </Button>
            </CardFooter>
        </Card>
    )
}
