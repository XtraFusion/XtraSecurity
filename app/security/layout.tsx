import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'XtraSecurity Security | AES-256 Encryption, SOC 2, ISO 27001 Compliance',
    'XtraSecurity security features. Enterprise-grade encryption, audit logs, IP allowlisting, compliance certifications (SOC 2, ISO 27001), and security best practices.',
    '/security'
  ),
  keywords: 'xtrasecurity security, secrets encryption, aes-256 encryption, soc 2 compliant, iso 27001, security practices, audit logs, ip allowlisting',
  openGraph: {
    title: 'XtraSecurity Security Features - Enterprise Grade Protection',
    description: 'AES-256 encryption, SOC 2 Type II certified, ISO 27001 compliant, immutable audit logs, IP allowlisting, and more',
    url: 'https://xtrasecurity.in/security',
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
      'name': 'Security',
      'item': 'https://xtrasecurity.in/security'
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
