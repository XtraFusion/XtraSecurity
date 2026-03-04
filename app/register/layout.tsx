import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up for XtraSecurity | Free Secrets Manager',
  description: 'Create your XtraSecurity account and start managing secrets securely. Free tier includes unlimited secrets for up to 5 team members.',
  keywords: 'xtrasecurity signup, create xtrasecurity account, xtrasecurity register, free secrets manager, secrets management platform',
  robots: {
    index: false, // Don't index registration page
    follow: false,
  },
  openGraph: {
    title: 'Sign Up for XtraSecurity',
    description: 'Start securing your secrets in minutes with our free tier',
    url: 'https://xtrasecurity.in/register',
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
      'name': 'Sign Up',
      'item': 'https://xtrasecurity.in/register'
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
