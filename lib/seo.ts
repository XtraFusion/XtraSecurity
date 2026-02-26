import { Metadata } from 'next';

const SITE_NAME = 'XtraSecurity';
const DOMAIN = 'xtrasecurity.in';
const SITE_URL = `https://${DOMAIN}`;
const DESCRIPTION = 'Professional secrets management platform with enterprise-grade security, compliance, and developer-first features. Protect your API keys, database passwords, and OAuth tokens.';
const AUTHOR = 'XtraSecurity';

export const defaultMetadata: Metadata = {
  title: {
    default: `${SITE_NAME} - Secrets Management & Compliance Platform`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    // Primary keywords
    'secrets management',
    'secret vault',
    'API key management',
    'environment variables',
    'secrets encryption',
    'secret manager',
    'credential management',
    'secrets manager',
    
    // Competitor comparison keywords
    'AWS Secrets Manager alternative',
    'Google Secret Manager alternative',
    'best secrets manager',
    'secrets manager comparison',
    'AWS Secrets Manager vs',
    'Google Cloud Secret Manager competitor',
    'Infisical alternative',
    'Vault HashiCorp alternative',
    
    // Long-tail keywords
    'secure secrets management for developers',
    'centralized secrets management platform',
    'secrets rotation automation',
    'secrets scanning and detection',
    'secrets encryption at rest',
    'secrets encryption in transit',
    
    // Compliance & security
    'compliance',
    'SOC 2',
    'ISO 27001',
    'GDPR compliance',
    'compliance reports',
    'audit logs',
    'tamper-proof audit trail',
    
    // Developer tools
    'developer tools',
    'security platform',
    'DevSecOps platform',
    'CI/CD secrets management',
    'secrets in CI/CD pipeline',
    'GitHub Actions secrets',
    'GitLab CI secrets',
    
    // Use cases
    'password management',
    'database credentials',
    'API credentials',
    'OAuth token management',
    'SSH key management',
    'TLS certificate management',
    'infrastructure security',
    'secrets for microservices',
    
    // Advanced features
    'just-in-time access',
    'JIT access for developers',
    'service accounts',
    'RBAC secrets management',
    'IP-based access control',
    'secret versioning',
    'secret rotation',
    'shadow rotation',
  ],
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Professional Secrets Management Platform`,
    description: DESCRIPTION,
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Secrets Management Platform`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Professional Secrets Management Platform`,
    description: DESCRIPTION,
    creator: '@XtraSecurity',
    images: [`/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/site.webmanifest',
  verification: {
    // Add your verification codes here
    // google: 'GOOGLE_VERIFICATION_CODE',
    // yandex: 'YANDEX_VERIFICATION_CODE',
  },
};

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = '/',
  image?: string
): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ? `${SITE_URL}${image}` : `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      images: [ogImage],
    },
  };
}

export const SITE_CONSTANTS = {
  SITE_NAME,
  DOMAIN,
  SITE_URL,
  DESCRIPTION,
  AUTHOR,
};
