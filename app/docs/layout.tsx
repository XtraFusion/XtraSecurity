import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Documentation - XtraSecurity',
  'Complete guides, API documentation, and tutorials for XtraSecurity. Get started with secrets management in minutes.',
  '/docs'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
