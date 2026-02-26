import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Help & Support - XtraSecurity',
  'Get help with XtraSecurity. FAQs, troubleshooting guides, and support resources.',
  '/help'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
