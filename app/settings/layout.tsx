import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - XtraSecurity',
  description: 'Manage your XtraSecurity account settings, workspace configuration, and security preferences.',
  keywords: 'xtrasecurity settings, account settings, workspace settings, security settings, preferences',
  robots: {
    index: false, // Don't index settings (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Settings',
    description: 'Manage your account and workspace settings',
    url: 'https://xtrasecurity.in/settings',
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
      'name': 'Settings',
      'item': 'https://xtrasecurity.in/settings'
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
