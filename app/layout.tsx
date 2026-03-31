import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/hooks/useUser"
import { defaultMetadata } from "@/lib/seo"
import "./globals.css"
import Provider from "@/lib/provider"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as CustomToaster } from "@/components/ui/toaster"
import { triggerLazyRotation } from "@/lib/rotation/lazy-cron";

export const metadata: Metadata = {
  ...defaultMetadata,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Trigger Automated Secret Rotation (Lazy Cron)
  // This is throttled to 15 mins and runs in the background.
  triggerLazyRotation().catch(console.error);
  
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
        {/* JSON-LD Schema for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'XtraSecurity',
              url: 'https://xtrasecurity.in',
              logo: 'https://xtrasecurity.in/placeholder-logo.svg',
              description: 'Professional secrets management platform with enterprise-grade security, compliance, and developer-first features.',
              sameAs: [
                'https://twitter.com/XtraSecurity',
                'https://linkedin.com/company/xtrasecurity',
                'https://github.com/xtrasecurity',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@xtrasecurity.in',
              },
              foundingDate: '2024',
              areaServed: 'Worldwide',
              knowsAbout: [
                'Secrets Management',
                'API Key Management',
                'Compliance',
                'Security',
                'DevOps',
              ],
            }),
          }}
        />
      </head>

      <body style={{
        pointerEvents: "fill"
      }}>
        <Provider>
          <UserProvider>
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

