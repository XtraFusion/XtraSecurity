import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Privacy Policy - XtraSecurity',
  'Read XtraSecurity privacy policy. We are committed to protecting your personal data and privacy.',
  '/privacy-policy'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
