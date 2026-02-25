"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, ArrowLeft, Eye, EyeOff, ShieldAlert } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }
        if (password !== confirm) {
            setError("Passwords do not match")
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess(true)
            } else {
                setError(data.message || "Something went wrong")
            }
        } catch {
            setError("Failed to connect. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // No token in URL
    if (!token) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <ShieldAlert className="w-10 h-10 text-destructive" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold">Invalid reset link</h2>
                <p className="text-sm text-muted-foreground">
                    This password reset link is missing or malformed.<br />
                    Please request a new one.
                </p>
                <Link href="/forgot-password">
                    <Button variant="outline" className="mt-2">Request new link</Button>
                </Link>
            </div>
        )
    }

    if (success) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-500/10 p-4">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold">Password updated!</h2>
                <p className="text-sm text-muted-foreground">
                    Your password has been reset successfully.<br />
                    You can now log in with your new password.
                </p>
                <Link href="/login">
                    <Button className="mt-2 text-white bg-primary hover:bg-primary/90">Go to login</Button>
                </Link>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-semibold">Set new password</h1>
                <p className="text-sm text-muted-foreground">
                    Choose a strong password. This link expires in 1 hour.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="pr-10"
                            autoFocus
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword
                                ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                                : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Password strength hints */}
                {password.length > 0 && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                        <li className={password.length >= 8 ? "text-green-500" : ""}>
                            {password.length >= 8 ? "✓" : "○"} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
                            {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
                        </li>
                        <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>
                            {/[0-9]/.test(password) ? "✓" : "○"} One number
                        </li>
                    </ul>
                )}

                <Button className="w-full text-white bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Reset password
                </Button>
            </form>
        </>
    )
}

export default function ResetPasswordPage() {
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
                    <Suspense fallback={<div className="text-center text-muted-foreground text-sm">Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>

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
