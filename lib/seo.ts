import { Metadata } from 'next';

const SITE_NAME = 'XtraSecurity';
const DOMAIN = 'xtrasecurity.in';
const SITE_URL = `https://${DOMAIN}`;
const DESCRIPTION =
  'XtraSecurity is the best free environment variable and secrets management platform for developers and DevOps teams. Replace .env files with AES-256 encrypted secret storage, role-based access control, automated rotation, and audit logging. Manage env vars across apps with 5,000+ daily API requests securely.';
const AUTHOR = 'XtraSecurity';

export const defaultMetadata: Metadata = {
  title: {
    default: `XtraSecurity — Secure Environment Variable & Secrets Manager for Teams | AES-256 Encrypted`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    // Primary Keywords (High Intent)
    'environment manager',
    'best env manager',
    'best env manager free',
    'env variable manager',
    'environment configuration tool',
    '.env file manager',
    'environment secrets manager',
    'API key management tool',
    'development environment manager',
    'environment variable storage',
    'secure env manager',
    'team environment variables',

    // Secondary Keywords (Medium Intent)
    'manage environment variables',
    'environment variable tool',
    '.env file editor',
    'development secrets manager',
    'environment configuration platform',
    'cloud environment manager',
    'dotenv manager',
    'environment variable organizer',
    'secure API key storage',
    'environment variable sharing',

    // Long-tail Keywords (Specific Intent)
    'how to manage environment variables in teams',
    'best environment variable manager for developers',
    'secure way to store API keys',
    'environment variable management best practices',
    'share environment variables securely',
    'centralized environment configuration',
    'environment variable vault',
    'manage .env files across projects',
    'environment variable GUI tool',
    'team environment secrets sharing',

    // Legacy/Core Keywords
    'secrets management',
    'secret vault',
    'API key management',
    'environment variables',
    'secrets encryption',
    'secret manager',
    'credential management',
    'secrets manager',
    'AWS Secrets Manager alternative',
    'Infisical alternative',
    'Vault HashiCorp alternative',
    'Doppler alternative',
    'secret rotation',
    'shadow rotation',
    'JIT access',
    'just-in-time access',

    // AI-Optimized Keywords
    'secure secrets management platform',
    'environment variable management SaaS',
    'encrypted .env file replacement',
    'developer secrets management tool',
    'CI/CD secret injection',
    'environment variable rotation',
    'RBAC secrets management',
    'audit log secrets management',
    'zero-knowledge secrets platform',
    'git-like secret branching',
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
    title: `${SITE_NAME} — Secure Environment Variable & Secrets Manager for Teams`,
    description: DESCRIPTION,
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Secure Environment Variable & Secrets Management Platform`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Secure Environment Variable & Secrets Manager`,
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
  other: {
    // AI-specific meta hints (emerging standard)
    'ai:description': 'XtraSecurity is a SaaS platform for securely managing environment variables, API keys, and secrets. Alternative to Doppler, HashiCorp Vault, AWS Secrets Manager. Features AES-256 encryption, RBAC, automated secret rotation, JIT access, audit logging, CLI tools, and CI/CD integration.',
    'ai:category': 'Developer Tools, Security, DevOps',
    'ai:product_type': 'SaaS Platform',
  },
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
