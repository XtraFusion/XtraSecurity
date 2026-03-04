import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { generateFAQSchema } from '@/lib/schema-markup';

const googleComparisonFAQs = [
  {
    question: 'What is the difference between Google Secret Manager and XtraSecurity?',
    answer: 'Google Secret Manager is tightly integrated with GCP, while XtraSecurity works across all clouds (AWS, Azure, GCP) and on-premises. XtraSecurity offers superior team collaboration features, better compliance options, and developer-friendly tools like VS Code integration.',
  },
  {
    question: 'Can I use XtraSecurity if I use Google Cloud?',
    answer: 'Yes, absolutely. XtraSecurity works seamlessly with Google Cloud while also supporting AWS, Azure, and on-premise infrastructure. This makes it ideal for multi-cloud strategies.',
  },
  {
    question: 'How does pricing compare between Google and XtraSecurity?',
    answer: 'Google Secret Manager offers a small free tier then charges per API call. XtraSecurity provides transparent, predictable pricing with no surprise charges. Plans include unlimited secrets, API calls, and team members.',
  },
  {
    question: 'Is Google Secret Manager good for team collaboration?',
    answer: 'Google Secret Manager is basic for team features. XtraSecurity is purpose-built for teams with RBAC, JIT access, activity feeds, and team-level compliance dashboards.',
  },
];

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Google Secret Manager Alternative | XtraSecurity vs Google Cloud',
    'Compare Google Cloud Secret Manager with XtraSecurity. Multi-cloud support, better team features, compliance built-in. Get started free.',
    '/comparison/google-secret-manager'
  ),
  keywords: 'google secret manager alternative, xtrasecurity vs google secret manager, google cloud secrets comparison, multi-cloud secrets manager',
  openGraph: {
    ...generatePageMetadata(
      'Google Secret Manager Alternative | XtraSecurity vs Google Cloud',
      'Compare Google Cloud Secret Manager with XtraSecurity. Multi-cloud support, better team features, compliance built-in.',
      '/comparison/google-secret-manager'
    ).openGraph,
    images: [
      {
        url: '/og-images/google-comparison.png',
        width: 1200,
        height: 630,
        alt: 'Google Secret Manager vs XtraSecurity Comparison',
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
      'name': 'Google Secret Manager',
      'item': 'https://xtrasecurity.in/comparison/google-secret-manager'
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
          __html: JSON.stringify(generateFAQSchema(googleComparisonFAQs)),
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
