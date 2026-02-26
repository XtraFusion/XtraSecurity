import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Terms and Conditions - XtraSecurity',
  'XtraSecurity terms and conditions. Please review our legal terms before using our services.',
  '/terms-and-conditions'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
