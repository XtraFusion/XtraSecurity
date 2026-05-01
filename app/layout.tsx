import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Space_Grotesk, Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider" 
import { UserProvider } from "@/hooks/useUser"
import { defaultMetadata } from "@/lib/seo"
import "./globals.css"
import Provider from "@/lib/provider"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as CustomToaster } from "@/components/ui/toaster"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

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
  if (typeof window === "undefined") {
    import("@/lib/rotation/lazy-cron").then(({ triggerLazyRotation }) => {
      triggerLazyRotation().catch(console.error);
    }).catch(console.error);
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" 
        />
        <style>{`
html {
  font-family: ${inter.style.fontFamily};
  --font-sans: ${inter.variable};
  --font-mono: ${GeistMono.variable};
  --font-space-grotesk: ${spaceGrotesk.style.fontFamily};
  --font-inter: ${inter.style.fontFamily};
  --font-geist: ${GeistSans.style.fontFamily};
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
        {/* JSON-LD Schema for SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'XtraSecurity',
              operatingSystem: 'Windows, macOS, Linux',
              applicationCategory: 'DevOpsApplication',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '124',
              },
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'USD',
              },
              description: 'XtraSecurity is an advanced environment manager and .env file management tool for developers and teams.',
            }),
          }}
        />
      </head>

      <body>
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

