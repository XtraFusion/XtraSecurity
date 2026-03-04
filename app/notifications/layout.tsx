import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications - XtraSecurity',
  description: 'View and manage your XtraSecurity notifications and alerts.',
  keywords: 'xtrasecurity notifications, alerts, activity notifications, security alerts',
  robots: {
    index: false, // Don't index notifications (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Notifications',
    description: 'View and manage your notifications and alerts',
    url: 'https://xtrasecurity.in/notifications',
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
      'name': 'Notifications',
      'item': 'https://xtrasecurity.in/notifications'
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
