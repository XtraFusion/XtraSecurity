import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { generateFAQSchema } from '@/lib/schema-markup';

const generalComparisonFAQs = [
  {
    question: 'What does a secrets manager do?',
    answer: 'A secrets manager securely stores, encrypts, and controls access to sensitive credentials like API keys, database passwords, OAuth tokens, and certificates. It provides encryption, access control, audit logging, automatic rotation, and compliance features to protect secrets throughout their lifecycle.',
  },
  {
    question: 'Is Secret Manager free?',
    answer: 'Most enterprise secrets managers have pricing. Some offer free tiers with limitations (AWS, Google, Azure). XtraSecurity offers a free tier with unlimited secrets for up to 5 team members, perfect for small teams and startups.',
  },
  {
    question: 'When to use AWS Secrets Manager?',
    answer: 'Use AWS Secrets Manager when you\'re exclusively on AWS and want tight native integration. For multi-cloud environments, teams prioritizing collaboration, or those seeking lower costs, alternatives like XtraSecurity may be more suitable.',
  },
  {
    question: 'What is the difference between IAM and secret manager?',
    answer: 'IAM (Identity & Access Management) controls who can access resources. Secret Manager stores sensitive credentials securely. Use IAM to control who can access your Secret Manager, and Secret Manager to securely store credentials that applications need.',
  },
  {
    question: 'Best secrets manager for 2025?',
    answer: 'The best secrets manager depends on your needs: AWS Secrets Manager for AWS-only teams, Google Secret Manager for GCP, HashiCorp Vault for self-hosted control, and XtraSecurity for multi-cloud teams wanting simplicity and collaboration.',
  },
  {
    question: 'How much does a secrets manager cost?',
    answer: 'Costs vary: AWS charges per secret and API call (can be $1000+/month), Google charges per API call, HashiCorp Vault requires self-hosting cost, XtraSecurity offers transparent fixed pricing ($49-$499/month/team depending on size).',
  },
];

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Best Secrets Manager Comparison 2025 | AWS vs Google vs XtraSecurity',
    'Compare top secrets managers: AWS Secrets Manager, Google Secret Manager, HashiCorp Vault, and XtraSecurity. See features, pricing, and use cases.',
    '/comparison'
  ),
  openGraph: {
    ...generatePageMetadata(
      'Best Secrets Manager Comparison 2025 | AWS vs Google vs XtraSecurity',
      'Compare top secrets managers: AWS Secrets Manager, Google Secret Manager, HashiCorp Vault, and XtraSecurity. See features, pricing, and use cases.',
      '/comparison'
    ).openGraph,
    images: [
      {
        url: '/og-images/comparison-matrix.png',
        width: 1200,
        height: 630,
        alt: 'Secrets Manager Comparison Matrix 2025',
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
          __html: JSON.stringify(generateFAQSchema(generalComparisonFAQs)),
        }}
      />
      {children}
    </>
  );
}
