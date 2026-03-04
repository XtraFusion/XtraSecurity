import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - XtraSecurity',
  description: 'Reset your XtraSecurity password using our secure password recovery process.',
  keywords: 'xtrasecurity forgot password, password reset, account recovery, reset password',
  robots: {
    index: false, // Don't index forgot password page
    follow: false,
  },
  openGraph: {
    title: 'Forgot Password - XtraSecurity',
    description: 'Reset your password securely',
    url: 'https://xtrasecurity.in/forgot-password',
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
      'name': 'Forgot Password',
      'item': 'https://xtrasecurity.in/forgot-password'
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
