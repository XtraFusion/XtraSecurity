"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Building, User, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function BookDemoPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/book-demo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                setError(data.error || "Something went wrong. Please try again later.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080e1e] flex flex-col justify-center py-12 px-6">
            <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(14,165,233,0.15), transparent)",
            }} />

            <div className="w-full max-w-lg mx-auto relative z-10">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 bg-transparent border-none cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl"
                >
                    {success ? (
                        <div className="text-center py-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-4">Request Sent!</h2>
                            <p className="text-slate-400 mb-8 pt-2">
                                Thank you for your interest in XtraSecurity. Our team will review your request and get back to you shortly to schedule a live demo.
                            </p>
                            <Button onClick={() => router.push("/")} className="w-full h-12 text-md">
                                Return to Home
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2">Book a Demo</h1>
                                <p className="text-slate-400">
                                    See how XtraSecurity can secure your secrets and infrastructure. Tell us a bit about your needs.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            id="name"
                                            required
                                            placeholder="Jane Doe"
                                            className="pl-10 bg-black/20 border-white/10 h-12 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-300">Work Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            placeholder="jane@yourcompany.com"
                                            className="pl-10 bg-black/20 border-white/10 h-12 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company" className="text-slate-300">Company Name</Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            id="company"
                                            required
                                            placeholder="Acme Corp"
                                            className="pl-10 bg-black/20 border-white/10 h-12 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-300">How can we help? (Optional)</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <Textarea
                                            id="message"
                                            placeholder="Tell us about your infrastructure, compliance needs, or specific challenges..."
                                            className="pl-10 bg-black/20 border-white/10 min-h-[120px] text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50 resize-y"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 text-md font-semibold mt-4 transition-all"
                                    style={{
                                        background: "linear-gradient(135deg, hsl(220 90% 50%), hsl(220 90% 38%), hsl(45 100% 45%))",
                                        boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Sending Request...
                                        </>
                                    ) : (
                                        "Request Demo"
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
