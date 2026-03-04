import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secret Rotation - XtraSecurity',
  description: 'Manage and automate secret rotation policies with XtraSecurity.',
  keywords: 'xtrasecurity rotation, secret rotation, automatic rotation, rotation policies, credential rotation',
  robots: {
    index: false, // Don't index rotation (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Secret Rotation',
    description: 'Manage and automate secret rotation policies',
    url: 'https://xtrasecurity.in/rotation',
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
      'name': 'Rotation',
      'item': 'https://xtrasecurity.in/rotation'
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
