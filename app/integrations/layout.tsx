import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations - XtraSecurity: GitHub, Docker, Kubernetes, Jenkins, AWS Lambda',
  description: 'XtraSecurity integrations with GitHub Actions, Docker, Kubernetes, Jenkins, AWS Lambda, and more. Complete setup guides for DevOps tools.',
  keywords: 'xtrasecurity integrations, github actions secrets, docker secrets, kubernetes integration, jenkins pipeline, aws lambda secrets, ci cd integration',
  robots: {
    index: true,
    follow: true,
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
