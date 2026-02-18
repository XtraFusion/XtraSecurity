
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/hooks/useUser"
import "./globals.css"
import Provider from "@/lib/provider"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as CustomToaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "XtraSecurity",
  description: "Professional environment and secrets management platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>

      <body style={{
        pointerEvents: "fill"
      }}>
        <Provider>
          <UserProvider  >

            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <Toaster />
              <CustomToaster />
            </ThemeProvider>
          </UserProvider>
        </Provider>
      </body>
    </html>
  )
}
