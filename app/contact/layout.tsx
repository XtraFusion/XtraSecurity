import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Contact Us - XtraSecurity',
    'Get in touch with XtraSecurity team. We are here to help with your secrets management and security needs.',
    '/contact'
  ),
  keywords: 'xtrasecurity contact, xtrasecurity support contact, secrets manager support, xtrasecurity team, enterprise secrets management, contact xtrasecurity',
  openGraph: {
    ...generatePageMetadata(
      'Contact Us - XtraSecurity',
      'Get in touch with XtraSecurity team. We are here to help with your secrets management and security needs.',
      '/contact'
    ).openGraph,
    url: 'https://xtrasecurity.in/contact',
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
      'name': 'Contact Us',
      'item': 'https://xtrasecurity.in/contact'
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
