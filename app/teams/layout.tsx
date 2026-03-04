import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teams - XtraSecurity',
  description: 'View and join teams in XtraSecurity. Collaborate securely with your team members.',
  keywords: 'xtrasecurity teams, team collaboration, workspaces, team management',
  robots: {
    index: false, // Don't index teams (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Teams',
    description: 'View and join teams for secure collaboration',
    url: 'https://xtrasecurity.in/teams',
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
      'name': 'Teams',
      'item': 'https://xtrasecurity.in/teams'
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
