import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription & Billing - XtraSecurity',
  description: 'Manage your XtraSecurity subscription, billing, and upgrade your plan.',
  keywords: 'xtrasecurity subscription, billing, pricing plans, upgrade, payment',
  robots: {
    index: false, // Don't index subscription (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Subscription',
    description: 'Manage your subscription and billing',
    url: 'https://xtrasecurity.in/subscription',
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
      'name': 'Subscription',
      'item': 'https://xtrasecurity.in/subscription'
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
