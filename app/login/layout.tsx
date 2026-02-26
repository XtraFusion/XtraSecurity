import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - XtraSecurity',
  description: 'Sign in to your XtraSecurity account. Manage your secrets securely.',
  robots: {
    index: false, // Don't index login page
    follow: false,
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
