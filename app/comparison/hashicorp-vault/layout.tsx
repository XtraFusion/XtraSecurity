import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { generateFAQSchema } from '@/lib/schema-markup';

const vaultComparisonFAQs = [
  {
    question: 'Is XtraSecurity better than HashiCorp Vault?',
    answer: 'XtraSecurity is simpler and more intuitive than HashiCorp Vault for most teams. While Vault is powerful, it requires significant operational knowledge and maintenance. XtraSecurity provides similar security with managed service benefits, built-in compliance, and much easier team collaboration.',
  },
  {
    question: 'What is hashiCorp Vault?',
    answer: 'HashiCorp Vault is an open-source secrets management tool that requires self-hosting/management. It\'s powerful but complex, requiring DevOps expertise. XtraSecurity offers a managed alternative with easier setup and team features.',
  },
  {
    question: 'Should I use Vault or XtraSecurity?',
    answer: 'Use Vault if you want maximum control and don\'t mind operational overhead. Use XtraSecurity if you want simplicity, team collaboration, compliance built-in, and managed service benefits without the ops burden.',
  },
  {
    question: 'Can I migrate from HashiCorp Vault to XtraSecurity?',
    answer: 'Yes, XtraSecurity provides migration tools to export from Vault and import your secrets securely. The process is straightforward with zero application downtime.',
  },
  {
    question: 'Is XtraSecurity open source like Vault?',
    answer: 'XtraSecurity is a commercial managed service with enterprise-grade security and compliance. We focus on ease of use, team features, and compliance instead of open-source model like Vault.',
  },
];

export const metadata: Metadata = {
  ...generatePageMetadata(
    'HashiCorp Vault Alternative | XtraSecurity vs Vault',
    'Compare HashiCorp Vault with XtraSecurity. Simpler setup, team collaboration, managed service, compliance built-in. No ops overhead.',
    '/comparison/hashicorp-vault'
  ),
  openGraph: {
    ...generatePageMetadata(
      'HashiCorp Vault Alternative | XtraSecurity vs Vault',
      'Compare HashiCorp Vault with XtraSecurity. Simpler setup, team collaboration, managed service, compliance built-in.',
      '/comparison/hashicorp-vault'
    ).openGraph,
    images: [
      {
        url: '/og-images/vault-comparison.png',
        width: 1200,
        height: 630,
        alt: 'HashiCorp Vault vs XtraSecurity Comparison',
      },
    ],
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(vaultComparisonFAQs)),
        }}
      />
      {children}
    </>
  );
}
