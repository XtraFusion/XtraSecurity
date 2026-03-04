import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - XtraSecurity',
  description: 'Manage your XtraSecurity user profile and account information.',
  keywords: 'xtrasecurity profile, user profile, account information, profile settings',
  robots: {
    index: false, // Don't index profile (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Profile',
    description: 'Manage your user profile and account information',
    url: 'https://xtrasecurity.in/profile',
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
      'name': 'Profile',
      'item': 'https://xtrasecurity.in/profile'
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
