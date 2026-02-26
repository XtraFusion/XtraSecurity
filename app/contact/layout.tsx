import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Contact Us - XtraSecurity',
  'Get in touch with XtraSecurity team. We are here to help with your secrets management and security needs.',
  '/contact'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
