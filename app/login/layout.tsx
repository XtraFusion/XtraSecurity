import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XtraSecurity Login | Secure Account Access',
  description: 'XtraSecurity login page. Sign in to your account to manage your secrets, API keys, and credentials securely.',
  keywords: 'xtrasecurity login, xtrasecurity signin, xtrasecurity account, secrets manager login',
  robots: {
    index: true, // Enable indexing for search visibility
    follow: true,
  },
  openGraph: {
    title: 'XtraSecurity Login',
    description: 'Sign in to your XtraSecurity account',
    url: 'https://xtrasecurity.in/login',
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
      'name': 'Login',
      'item': 'https://xtrasecurity.in/login'
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

