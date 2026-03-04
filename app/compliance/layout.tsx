import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generatePageMetadata(
    'Compliance & Certifications - XtraSecurity',
    'SOC 2 Type II, ISO 27001, and GDPR compliance. Complete audit trails and compliance reports for enterprise requirements.',
    '/compliance'
  ),
  keywords: 'xtrasecurity compliance, soc 2 compliance, iso 27001 certification, gdpr compliant, enterprise compliance, compliance reports, audit logs, xtrasecurity certifications',
  openGraph: {
    ...generatePageMetadata(
      'Compliance & Certifications - XtraSecurity',
      'SOC 2 Type II, ISO 27001, and GDPR compliance. Complete audit trails and compliance reports for enterprise requirements.',
      '/compliance'
    ).openGraph,
    url: 'https://xtrasecurity.in/compliance',
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
      'name': 'Compliance',
      'item': 'https://xtrasecurity.in/compliance'
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
