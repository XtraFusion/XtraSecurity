import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - XtraSecurity',
  description: 'Create your XtraSecurity account. Start securing your secrets in minutes.',
  robots: {
    index: false, // Don't index registration page
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
