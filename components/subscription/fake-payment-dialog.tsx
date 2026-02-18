"use client"

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Tier } from "@/lib/rate-limit";

interface FakePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tier: Tier;
    price: string;
    onSuccess: () => void;
}

export function FakePaymentDialog({ open, onOpenChange, tier, price, onSuccess }: FakePaymentDialogProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'success'>('form');

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/subscription/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier })
            });

            if (!res.ok) throw new Error("Payment failed");

            const data = await res.json();
            setStep('success');
            toast.success(`Successfully upgraded to ${tier}!`);

            // Wait a bit then close and refresh
            setTimeout(() => {
                onSuccess();
                onOpenChange(false);
                setStep('form');
            }, 2000);

        } catch (error) {
            toast.error("An error occurred during payment simulation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                {step === 'form' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Secure Checkout
                            </DialogTitle>
                            <DialogDescription>
                                Upgrade your account to the <span className="font-bold text-foreground">{tier}</span> plan for <span className="font-bold text-foreground">{price}</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handlePayment} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="card-number">Card Number</Label>
                                <Input id="card-number" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry Date</Label>
                                    <Input id="expiry" placeholder="MM/YY" defaultValue="12/28" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input id="cvc" placeholder="123" defaultValue="123" required />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                This is a payment simulation. No real money will be charged.
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Pay {price}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Payment Successful!</h3>
                            <p className="text-muted-foreground">Your account has been upgraded. Refreshing usage limits...</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
