import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit Logs - XtraSecurity',
  description: 'Review comprehensive audit logs of all secret access and modifications with XtraSecurity.',
  keywords: 'xtrasecurity audit logs, secret access logs, compliance audit, activity logs, secret history',
  robots: {
    index: false, // Don't index audit logs (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Audit Logs',
    description: 'Review comprehensive audit logs of all secret access and modifications',
    url: 'https://xtrasecurity.in/audit',
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
      'name': 'Audit Logs',
      'item': 'https://xtrasecurity.in/audit'
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
