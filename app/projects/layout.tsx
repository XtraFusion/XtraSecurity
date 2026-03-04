import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects - XtraSecurity',
  description: 'Organize and manage your secrets across multiple projects with XtraSecurity.',
  keywords: 'xtrasecurity projects, secrets by project, project management, secret organization',
  robots: {
    index: false, // Don't index projects (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Projects',
    description: 'Organize and manage your secrets across multiple projects',
    url: 'https://xtrasecurity.in/projects',
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
      'name': 'Projects',
      'item': 'https://xtrasecurity.in/projects'
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
