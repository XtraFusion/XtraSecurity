import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About XtraSecurity - Enterprise Secrets Management Built by AWS Security Engineers",
  description: "Learn how XtraSecurity solves enterprise secrets management. Founded by security engineers from AWS, Google Cloud, and Azure with 10+ years of experience securing Fortune 500 companies.",
  keywords: [
    "secrets management platform",
    "enterprise security solutions",
    "API key management system",
    "DevOps security tools",
    "secrets manager for teams",
    "cloud secrets management",
    "credential vault",
    "secrets rotation automation",
  ],
  openGraph: {
    title: "About XtraSecurity - Built by Enterprise Security Experts",
    description: "Discover how XtraSecurity provides enterprise-grade secrets management with SOC 2 compliance, zero-trust architecture, and DevOps-first features.",
    type: "website",
    url: "https://xtrasecurity.in/about",
  },
  alternates: {
    canonical: "https://xtrasecurity.in/about",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
