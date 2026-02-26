import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata(
  'Compliance & Certifications - XtraSecurity',
  'SOC 2 Type II, ISO 27001, and GDPR compliance. Complete audit trails and compliance reports for enterprise requirements.',
  '/compliance'
);

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
