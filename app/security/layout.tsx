import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Security - XtraSecurity',
  'Enterprise-grade security infrastructure, encryption, and compliance. Learn about our security practices and certifications.',
  '/security'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
