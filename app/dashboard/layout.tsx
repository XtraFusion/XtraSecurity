import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - XtraSecurity',
  description: 'Manage your secrets, projects, and team members from your XtraSecurity dashboard.',
  keywords: 'xtrasecurity dashboard, secrets management dashboard, team dashboard, project management',
  robots: {
    index: false, // Don't index dashboard (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Dashboard',
    description: 'Manage your secrets, projects, and team members',
    url: 'https://xtrasecurity.in/dashboard',
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
      'name': 'Dashboard',
      'item': 'https://xtrasecurity.in/dashboard'
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
