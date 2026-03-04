import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations - XtraSecurity',
  description: 'Connect XtraSecurity with your favorite tools and services for seamless secrets management.',
  keywords: 'xtrasecurity integrations, github integration, gitlab integration, secrets integration, api integrations',
  robots: {
    index: false, // Don't index integrations (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Integrations',
    description: 'Connect with your favorite tools and services',
    url: 'https://xtrasecurity.in/integrations',
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
      'name': 'Integrations',
      'item': 'https://xtrasecurity.in/integrations'
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
