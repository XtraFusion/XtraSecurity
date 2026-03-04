import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'XtraSecurity Documentation | API Guides, Tutorials & Integration Docs',
    'Complete XtraSecurity documentation. API integration guides, SDK documentation, tutorials, and step-by-step setup instructions for secrets management.',
    '/docs'
  ),
  keywords: 'xtrasecurity documentation, xtrasecurity docs, xtrasecurity api, xtrasecurity guide, secrets management docs, xtrasecurity tutorial',
  openGraph: {
    title: 'XtraSecurity Documentation - Complete API & Integration Guides',
    description: 'Complete documentation for XtraSecurity API, SDKs, CLI, and integration guides for enterprises',
    url: 'https://xtrasecurity.in/docs',
    type: 'website',
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
      'name': 'Documentation',
      'item': 'https://xtrasecurity.in/docs'
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
