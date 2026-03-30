import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog - Secrets Management, DevOps Security & API Key Protection | XtraSecurity",
  description: "Technical blog on secrets management, API key security, CI/CD best practices, Kubernetes secrets, and DevOps security. Expert guides for modern development teams.",
  keywords: [
    "secrets management blog",
    "devops security tutorials",
    "api key security guide",
    "kubernetes secrets",
    "ci cd security",
    "environment variables security",
    "secrets rotation"
  ],
  openGraph: {
    title: "Blog - Secrets Management & DevOps Security Tutorials",
    description: "Expert technical guides on API key security, Kubernetes secrets, CI/CD best practices, and enterprise secrets management.",
    type: "website",
    url: "https://xtrasecurity.in/blog",
  },
  alternates: {
    canonical: "https://xtrasecurity.in/blog",
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
