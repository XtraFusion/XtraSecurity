"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address")
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            if (res.ok) {
                setSent(true)
            } else {
                const data = await res.json()
                setError(data.message || "Something went wrong")
            }
        } catch {
            setError("Failed to connect. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6">

                {/* Logo */}
                <div className="flex justify-center">
                    <Link href="/login" className="flex items-center gap-2 text-lg font-bold">
                        <Image src="/apple-touch-icon.png" alt="XtraSecurity" width={36} height={36} className="rounded-xl" />
                        <span>Xtra<span className="text-sky-500">Security</span></span>
                    </Link>
                </div>

                <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
                    {!sent ? (
                        <>
                            <div className="space-y-1 text-center">
                                <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                                <p className="text-sm text-muted-foreground">
                                    Enter your email and we&apos;ll send you a reset link.
                                    <br />
                                    Works for Google / GitHub accounts too — set a password for the first time.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                </div>
                                <Button className="w-full text-white bg-primary hover:bg-primary/90" disabled={isLoading}>
                                    {isLoading ? (
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Mail className="mr-2 h-4 w-4" />
                                    )}
                                    Send reset link
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/10 p-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold">Check your inbox</h2>
                            <p className="text-sm text-muted-foreground">
                                If <span className="font-medium text-foreground">{email}</span> is registered,
                                you&apos;ll receive a password reset link shortly.
                                <br /><br />
                                Didn&apos;t get it? Check your spam folder or{" "}
                                <button
                                    onClick={() => setSent(false)}
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    try again
                                </button>.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
