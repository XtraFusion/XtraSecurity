"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Moon, Sun, Github } from "lucide-react"
import { useTheme } from "next-themes"
import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<1 | 2>(1)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  // fixed hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (session?.user?.email) {
      window.location.replace('/dashboard')
    }
  }, [session])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    if (!email || !password) { setError("Please fill in all fields"); setIsLoading(false); return }
    if (!email.includes("@")) { setError("Please enter a valid email address"); setIsLoading(false); return }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Invalid credentials")
      if (data.requireOtp) {
        if (data.isNewUser) setIsNewUser(true)
        setStep(2)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    if (!otp) { setError("Please enter the verification code"); setIsLoading(false); return }
    try {
      const result = await signIn("credentials", { email, otp, redirect: false })
      if (result?.error) {
        setError("Invalid or expired verification code")
      } else if (result?.ok) {
        window.location.href = isNewUser ? "/subscription" : "/dashboard"
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">

      {/* ── Left Panel: Animated Security Visualization ── */}
      <div className="relative hidden h-full flex-col bg-[#0a0f1e] p-10 text-white lg:flex dark:border-r overflow-hidden">

        {/* Animated gradient background */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 20% 50%, #1e3a5f 0%, #0a0f1e 60%), radial-gradient(ellipse at 80% 20%, #0d2137 0%, transparent 50%)"
        }} />

        {/* Floating particles */}
        {[...Array(22)].map((_, i) => (
          <span key={i} className="absolute rounded-full opacity-20" style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#818cf8" : "#34d399",
            left: `${(i * 4.5) % 100}%`,
            top: `${(i * 6.7 + 10) % 90}%`,
            animation: `float ${6 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 3}s`,
          }} />
        ))}

        {/* Center: Solar System Logo Animation */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">

          {/* Scanning Line */}
          <div className="absolute w-[340px] h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent z-10"
            style={{ animation: "scan-line 4s ease-in-out infinite" }} />

          {/* Orbits Container */}
          <div className="relative flex items-center justify-center w-full h-full">

            {/* Outer Orbit (360px) — Docker, GitLab, AWS, Vercel */}
            <div className="absolute rounded-full border border-white/25"
              style={{ width: 360, height: 360, animation: "spin 28s linear infinite" }}>

              {/* Docker — top */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ animation: "spin-reverse 28s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#2496ed]/40 shadow-[0_0_14px_rgba(36,150,237,0.45)]">
                  <Image src="https://img.icons8.com/?size=100&id=22813&format=png&color=000000" alt="Docker" width={20} height={20} unoptimized />
                </div>
              </div>

              {/* GitLab — right */}
              <div className="absolute top-1/2 -right-4 -translate-y-1/2" style={{ animation: "spin-reverse 28s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#e36c41]/40 shadow-[0_0_14px_rgba(227,108,65,0.45)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e36c41">
                    <path d="M23.955 13.587l-1.342-4.135L19.722 2.1c-.118-.363-.63-.363-.747 0l-2.89 8.887H7.915L5.025 2.1c-.118-.363-.63-.363-.747 0L1.387 9.452.045 13.587c-.11.34.013.711.306.924L12 23l11.65-8.489c.292-.213.415-.584.305-.924z" />
                  </svg>
                </div>
              </div>

              {/* AWS — bottom */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2" style={{ animation: "spin-reverse 28s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#FF9900]/40 shadow-[0_0_14px_rgba(255,153,0,0.45)]">
                  <Image src="https://img.icons8.com/?size=100&id=wU62u24brJ44&format=png&color=000000" alt="AWS" width={20} height={20} unoptimized />
                </div>
              </div>

              {/* Vercel — left */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2" style={{ animation: "spin-reverse 28s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-white/30 shadow-[0_0_14px_rgba(255,255,255,0.2)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M24 22.525H0l12-21.05 12 21.05z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mid Orbit (245px) — GitHub, Node.js, Kubernetes */}
            <div className="absolute rounded-full border border-white/25"
              style={{ width: 245, height: 245, animation: "spin 18s linear infinite reverse" }}>

              {/* GitHub — top-right (45°) */}
              <div className="absolute" style={{ top: "2%", right: "15%", animation: "spin 18s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-white/25 shadow-[0_0_14px_rgba(255,255,255,0.15)]">
                  <Github size={18} className="text-white" />
                </div>
              </div>

              {/* Node.js — bottom-left */}
              <div className="absolute" style={{ bottom: "2%", left: "12%", animation: "spin 18s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#83cd29]/40 shadow-[0_0_14px_rgba(131,205,41,0.4)]">
                  <Image src="https://img.icons8.com/?size=100&id=hsPbhkOH4FMe&format=png&color=000000" alt="Node.js" width={20} height={20} unoptimized />
                </div>
              </div>

              {/* Kubernetes — left */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2" style={{ animation: "spin 18s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#326CE5]/40 shadow-[0_0_14px_rgba(50,108,229,0.45)]">
                  <Image src="https://img.icons8.com/?size=100&id=cvzmaEA4kC0o&format=png&color=000000" alt="Kubernetes" width={20} height={20} unoptimized />
                </div>
              </div>
            </div>

            {/* Inner Orbit (148px) — React & Express */}
            <div className="absolute rounded-full border border-white/25"
              style={{ width: 148, height: 148, animation: "spin 12s linear infinite" }}>

              {/* React — top */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2" style={{ animation: "spin-reverse 12s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-[#61DAFB]/40 shadow-[0_0_14px_rgba(97,218,251,0.45)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#61DAFB">
                    <circle cx="12" cy="11.748" r="1.856" />
                    <path d="M12 7.565c-3.854 0-7.232.596-9.584 1.566C.36 10.19-.484 11.61.263 12.74c.745 1.126 2.804 1.584 5.739 1.315.32 1.433.822 2.73 1.474 3.797.98 1.603 2.239 2.488 3.524 2.488 1.285 0 2.544-.885 3.524-2.488.652-1.067 1.154-2.364 1.474-3.797 2.935.269 4.994-.189 5.739-1.315.747-1.13-.097-2.55-2.153-3.609C17.232 8.16 13.854 7.565 12 7.565zm0 1.5c3.615 0 6.737.566 8.834 1.473 1.73.762 2.226 1.615 1.906 2.098-.32.484-1.396.8-3.188.695a20.42 20.42 0 0 0-.334-1.78c-.23-1.002-.548-1.904-.932-2.686zm-9.634 1.473C4.463 9.631 7.585 9.065 12 9.065a27.5 27.5 0 0 0-1.286 2.486 20.42 20.42 0 0 0-.334 1.78c-1.792.105-2.868-.21-3.188-.695-.32-.483.176-1.336 1.174-2.098zM12 12.748c-.34.822-.628 1.71-.853 2.64a18.922 18.922 0 0 1-.852-2.64H12zm-1.54 3.074a17.424 17.424 0 0 0 1.54.071c.524 0 1.04-.025 1.54-.071.308 1.253.763 2.406 1.338 3.351.716 1.172 1.602 1.888 2.622 1.888 1.02 0 1.906-.716 2.622-1.888.575-.945 1.03-2.098 1.338-3.351-.5.046-1.016.071-1.54.071-.524 0-1.04-.025-1.54-.071a17.424 17.424 0 0 1-1.54.071c-.524 0-1.04-.025-1.54-.071a17.424 17.424 0 0 1-1.54.071 17.424 17.424 0 0 1-1.54-.071 17.424 17.424 0 0 1-1.54-.071c.308 1.253.763 2.406 1.338 3.351.716 1.172 1.602 1.888 2.622 1.888 1.02 0 1.906-.716 2.622-1.888.575-.945 1.03-2.098 1.338-3.351z" />
                  </svg>
                </div>
              </div>

              {/* Express — bottom */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2" style={{ animation: "spin-reverse 12s linear infinite" }}>
                <div className="p-2 rounded-lg bg-[#060c1a]/90 border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                  <div className="w-[18px] h-[18px] flex items-center justify-center font-black text-[8px] text-white/90 tracking-tighter">EX</div>
                </div>
              </div>
            </div>

            {/* Center: Brand Logo — no background card */}
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-full" style={{
                width: 110, height: 110,
                background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)",
                animation: "pulse-glow 3s ease-in-out infinite"
              }} />
              <Image src="/apple-touch-icon.png" alt="XtraSecurity" width={48} height={48} className="relative z-10 rounded-xl" />
            </div>

          </div>
        </div>

        {/* Brand label — top left */}
        <div className="relative z-20 flex items-center text-lg font-bold tracking-tight">
          <Image src="/apple-touch-icon.png" alt="XtraSecurity Logo" width={32} height={32} className="rounded-lg mr-3 shadow-lg" />
          <span>Xtra<span className="text-sky-400">Security</span></span>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-18px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes spin-reverse {
            from { transform: rotate(0deg); }
            to   { transform: rotate(-360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.2); }
          }
          @keyframes scan-line {
            0%, 100% { transform: translateY(-230px); opacity: 0; }
            10%, 90% { opacity: 1; }
            50%       { transform: translateY(230px); }
          }
        `}</style>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

          <div className="flex justify-end absolute top-4 right-4 md:top-8 md:right-8">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </Button>
          </div>

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 1 ? "Welcome back" : "Verify Your Identity"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? "Log in or create a new account to continue" : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={step === 1 ? handlePasswordSubmit : handleOtpSubmit}>
              <div className="grid gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {step === 1 ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" placeholder="name@example.com" type="email"
                        autoCapitalize="none" autoComplete="email" autoCorrect="off"
                        disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input id="password" placeholder="Password"
                          type={showPassword ? "text" : "password"}
                          autoCapitalize="none" autoCorrect="off"
                          disabled={isLoading} value={password}
                          onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                        <Button type="button" variant="ghost" size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword
                            ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                            : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                        <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
                      </div>
                      <Link href="/forgot-password" className="text-sm font-medium hover:underline">Forgot password?</Link>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input id="otp" placeholder="123456" type="text" inputMode="numeric"
                      pattern="[0-9]*" maxLength={6} autoCapitalize="none" autoCorrect="off"
                      autoComplete="one-time-code" disabled={isLoading} value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="text-center font-mono text-lg tracking-widest" />
                  </div>
                )}

                <Button disabled={isLoading} className="mt-2 text-white bg-primary hover:bg-primary/90">
                  {isLoading && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {step === 1 ? "Continue" : "Verify & Log In"}
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => signIn("github")} disabled={isLoading}>
                <Github className="mr-2 h-4 w-4" /> GitHub
              </Button>
              <Button variant="outline" onClick={() => signIn("google")} disabled={isLoading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
