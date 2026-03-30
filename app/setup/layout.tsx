import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Setup Guides - XtraSecurity: GitHub, Docker, Kubernetes, Jenkins, AWS Lambda",
  description: "Step-by-step setup guides for XtraSecurity integrations. Learn how to integrate with GitHub Actions, Docker, Kubernetes, Jenkins, and AWS Lambda.",
  keywords: [
    "setup guides",
    "integration guides",
    "github actions setup",
    "docker setup",
    "kubernetes setup",
    "jenkins setup",
    "aws lambda setup"
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "XtraSecurity Setup Guides - Complete Integration Tutorials",
    description: "Learn how to integrate XtraSecurity with your favorite DevOps tools.",
    type: "website",
    url: "https://xtrasecurity.in/setup",
  },
  alternates: {
    canonical: "https://xtrasecurity.in/setup",
  },
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
