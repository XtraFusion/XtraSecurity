/**
 * JSON-LD Schema Markup Generator
 * Generates structured data for better SEO
 */

export interface SoftwareApplicationSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
  }[];
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    ratingCount: number;
  };
}

export function generateSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'XtraSecurity',
    description: 'Professional secrets management platform with enterprise-grade security, compliance, and developer-first features.',
    url: 'https://xtrasecurity.in',
    applicationCategory: 'SecurityApplication',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 150,
    },
  };
}

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  producer: {
    '@type': string;
    name: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
    worstRating: number;
  };
}

export function generateProductSchema(): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'XtraSecurity - Secrets Management Platform',
    description: 'Enterprise-grade secrets management with compliance, audit logs, and developer-first tools.',
    producer: {
      '@type': 'Organization',
      name: 'XtraSecurity',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 150,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

export interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  name: string;
  image: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
    postalCode: string;
  };
  sameAs: string[];
}

export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'XtraSecurity',
    image: 'https://xtrasecurity.in/placeholder-logo.svg',
    description: 'Professional secrets management platform',
    url: 'https://xtrasecurity.in',
    telephone: '+1-xxx-xxx-xxxx',
    email: 'support@xtrasecurity.in',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Address',
      addressLocality: 'Your City',
      addressCountry: 'Your Country',
      postalCode: 'Your Postal Code',
    },
    sameAs: [
      'https://www.facebook.com/xtrasecurity',
      'https://twitter.com/xtrasecurity',
      'https://www.linkedin.com/company/xtrasecurity',
    ],
  };
}
