"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Shield, Rocket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/hooks/useUser";
import { RateLimitResult, Tier, DAILY_LIMITS } from "@/lib/rate-limit-config";
import { FakePaymentDialog } from "@/components/subscription/fake-payment-dialog";
import { formatDistanceToNow } from "date-fns";

interface SubscriptionUIProps {
    tier: Tier;
    stats: RateLimitResult;
}

export default function SubscriptionUI({ tier, stats }: SubscriptionUIProps) {
    const router = useRouter();
    const { fetchUser } = useGlobalContext();
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const percentage = Math.min(100, Math.round(((stats.limit - stats.remaining) / stats.limit) * 100));

    const handleUpgrade = (tierKey: Tier) => {
        setSelectedTier(tierKey);
        setPaymentOpen(true);
    };

    const handleSuccess = () => {
        fetchUser(); // Sync global client state
        router.refresh(); // Reload server components to get new tier/stats
    };

    return (
        <div className="space-y-10">
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
                <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Daily Requests Capacity</span>
                        <span className="font-mono">{stats.limit - stats.remaining} / {stats.limit}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground italic">
                        {stats.reset > 0
                            ? `Usage resets in ${formatDistanceToNow(new Date(stats.reset * 1000))}.`
                            : 'Usage tracking not yet started (resets 24h after first request).'}
                    </p>
                </CardContent>
            </Card>

            {/* Pricing Options */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(DAILY_LIMITS) as Tier[]).map((tierKey) => {
                        const config = DAILY_LIMITS[tierKey];
                        const isCurrent = tier === tierKey;
                        const isEnterprise = tierKey === 'enterprise';

                        return (
                            <PricingCard
                                key={tierKey}
                                title={tierKey.charAt(0).toUpperCase() + tierKey.slice(1)}
                                price={config.price}
                                period={tierKey === 'free' ? "" : "/month"}
                                features={config.features}
                                current={isCurrent}
                                popular={tierKey === 'pro'}
                                actionLabel={isCurrent ? "Active Plan" : isEnterprise ? "Contact Sales" : `Upgrade to ${tierKey}`}
                                onAction={() => isEnterprise ? (window.location.href = "mailto:sales@xtrasecurity.com") : handleUpgrade(tierKey)}
                                disabled={isCurrent}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Fake Payment Modal */}
            {selectedTier && (
                <FakePaymentDialog
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    tier={selectedTier}
                    price={DAILY_LIMITS[selectedTier].price}
                    onSuccess={handleSuccess}
                />
            )}
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
