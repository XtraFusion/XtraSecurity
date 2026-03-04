import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Help & Support - XtraSecurity',
    'Get help with XtraSecurity. FAQs, troubleshooting guides, and support resources.',
    '/help'
  ),
  keywords: 'xtrasecurity help, xtrasecurity support, secrets manager guide, xtrasecurity faq, xtrasecurity troubleshooting, xtrasecurity documentation',
  openGraph: {
    ...generatePageMetadata(
      'Help & Support - XtraSecurity',
      'Get help with XtraSecurity. FAQs, troubleshooting guides, and support resources.',
      '/help'
    ).openGraph,
    url: 'https://xtrasecurity.in/help',
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
      'name': 'Help & Support',
      'item': 'https://xtrasecurity.in/help'
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
