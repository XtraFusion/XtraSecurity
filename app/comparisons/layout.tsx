import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Secrets Manager Comparison - Vault vs AWS vs Doppler vs XtraSecurity",
  description: "Compare secrets management platforms. Vault vs XtraSecurity, AWS Secrets Manager vs XtraSecurity, Doppler comparison. Feature matrix and pricing comparison.",
  keywords: [
    "secrets manager comparison",
    "vault vs xtrasecurity",
    "aws secrets manager vs",
    "doppler vs xtrasecurity",
    "hashicorp vault alternatives",
    "best secrets manager",
    "vault comparison"
  ],
  openGraph: {
    title: "Secrets Manager Comparison - Which is Best?",
    description: "Feature-by-feature comparison of Vault, AWS Secrets Manager, Doppler, and XtraSecurity. See pricing, deployment options, and use cases.",
    type: "website",
    url: "https://xtrasecurity.in/comparisons",
  },
  alternates: {
    canonical: "https://xtrasecurity.in/comparisons",
  },
}

export default function ComparisonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
