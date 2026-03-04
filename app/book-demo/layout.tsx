import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Demo - XtraSecurity',
  description: 'Schedule a personalized demo with XtraSecurity team to learn how we secure your secrets.',
  keywords: 'xtrasecurity demo, book demo, schedule demo, free demo, secrets manager demo',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Book a Demo - XtraSecurity',
    description: 'Schedule a personalized demo with XtraSecurity team',
    url: 'https://xtrasecurity.in/book-demo',
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
      'name': 'Book a Demo',
      'item': 'https://xtrasecurity.in/book-demo'
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
