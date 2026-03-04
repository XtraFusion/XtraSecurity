import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Requests - XtraSecurity',
  description: 'Manage and review access requests for secret access with just-in-time (JIT) approval workflows.',
  keywords: 'xtrasecurity access requests, jit access, just-in-time access, access approval, secret access requests',
  robots: {
    index: false, // Don't index access requests (user-specific content)
    follow: false,
  },
  openGraph: {
    title: 'XtraSecurity Access Requests',
    description: 'Manage and review access requests for secret access',
    url: 'https://xtrasecurity.in/access-requests',
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
      'name': 'Access Requests',
      'item': 'https://xtrasecurity.in/access-requests'
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
