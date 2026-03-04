import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Privacy Policy - XtraSecurity',
    'Read XtraSecurity privacy policy. We are committed to protecting your personal data and privacy.',
    '/privacy-policy'
  ),
  keywords: 'xtrasecurity privacy, privacy policy, data protection, gdpr compliance, personal data',
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
      'name': 'Privacy Policy',
      'item': 'https://xtrasecurity.in/privacy-policy'
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
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
