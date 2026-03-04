import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password - XtraSecurity',
  description: 'Create a new password for your XtraSecurity account.',
  keywords: 'xtrasecurity reset password, new password, account recovery',
  robots: {
    index: false, // Don't index reset password page
    follow: false,
  },
  openGraph: {
    title: 'Reset Password - XtraSecurity',
    description: 'Create a new password for your account',
    url: 'https://xtrasecurity.in/reset-password',
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
      'name': 'Reset Password',
      'item': 'https://xtrasecurity.in/reset-password'
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
