import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { generateFAQSchema } from '@/lib/schema-markup';

const comparisonFAQs = [
  {
    question: 'What is the difference between AWS Secrets Manager and XtraSecurity?',
    answer: 'AWS Secrets Manager is cloud-native for AWS users with tight integration, while XtraSecurity is platform-agnostic, offering better team collaboration, easier setup, 50-70% lower costs, and built-in compliance features. XtraSecurity also provides superior developer experience with VS Code extension and Git-like versioning.',
  },
  {
    question: 'Is XtraSecurity cheaper than AWS Secrets Manager?',
    answer: 'Yes, XtraSecurity offers transparent, predictable pricing with no surprise charges. AWS charges per secret stored, per rotation, and per API call which accumulates quickly. XtraSecurity plans include unlimited secrets, rotations, and API calls at a fixed monthly rate.',
  },
  {
    question: 'Can I migrate from AWS to XtraSecurity?',
    answer: 'Yes, XtraSecurity provides seamless migration tools with zero downtime. Our team guides you through exporting from AWS Secrets Manager and importing into XtraSecurity with full encryption and no data loss.',
  },
  {
    question: 'What are the key differences from Google Secret Manager?',
    answer: 'Google Secret Manager is GCP-only, while XtraSecurity is multi-cloud (AWS, Azure, GCP, on-prem). XtraSecurity offers better team collaboration, compliance dashboards, developer tools, and works across all your infrastructure.',
  },
];

export const metadata: Metadata = {
  ...generatePageMetadata(
    'AWS Secrets Manager Alternative | XtraSecurity vs AWS',
    'Compare AWS Secrets Manager with XtraSecurity. Lower costs, better team features, multi-cloud support, and easier compliance. See why teams are switching.',
    '/comparison/aws-secrets-manager'
  ),
  keywords: 'aws secrets manager alternative, xtrasecurity vs aws, aws secrets manager pricing, secrets manager comparison, why switch from aws secrets manager',
  openGraph: {
    ...generatePageMetadata(
      'AWS Secrets Manager Alternative | XtraSecurity vs AWS',
      'Compare AWS Secrets Manager with XtraSecurity. Lower costs, better team features, multi-cloud support, and easier compliance.',
      '/comparison/aws-secrets-manager'
    ).openGraph,
    images: [
      {
        url: '/og-images/aws-comparison.png',
        width: 1200,
        height: 630,
        alt: 'AWS Secrets Manager vs XtraSecurity Comparison',
      },
    ],
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': 'https://xtrasecurity.in'
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'Comparison',
      'item': 'https://xtrasecurity.in/comparison'
    },
    {
      '@type': 'ListItem',
      'position': 3,
      'name': 'AWS Secrets Manager',
      'item': 'https://xtrasecurity.in/comparison/aws-secrets-manager'
    }
  ]
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
          __html: JSON.stringify(generateFAQSchema(comparisonFAQs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
