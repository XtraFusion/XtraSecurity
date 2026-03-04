import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Management - XtraSecurity',
  description: 'Manage team members, set permissions, and collaborate securely with XtraSecurity.',
  keywords: 'xtrasecurity team, team management, user permissions, rbac, role-based access control, team collaboration',
  robots: {
    index: false, // Don't index team management (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Team Management',
    description: 'Manage team members and permissions',
    url: 'https://xtrasecurity.in/team',
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
      'name': 'Team',
      'item': 'https://xtrasecurity.in/team'
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
