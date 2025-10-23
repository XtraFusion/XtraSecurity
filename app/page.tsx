"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"



export default function HomePage() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    // If the app still uses the legacy localStorage flag (demo/login flow), prefer it
    // to avoid a flash/loop between /login and /dashboard.
    try {
      const legacy = typeof window !== "undefined" && localStorage.getItem("isAuthenticated")
      if (legacy) {
        router.replace("/dashboard")
        return
      }
    } catch (e) {
      // ignore
    }

    // Otherwise rely on next-auth session status.
    if (status === "loading") return
    if (status === "authenticated") {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router, status])
  return (
    <div className="min-h-screen  bg-background flex items-center justify-center" style={{pointerEvents:"fill"}}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
