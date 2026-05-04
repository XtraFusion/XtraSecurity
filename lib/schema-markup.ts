/**
 * JSON-LD Schema Markup Generator
 * Generates structured data for SEO and AI discoverability
 * Used by layout.tsx and individual pages
 */

// ─── SoftwareApplication Schema ──────────────────────────────────────────────

export function generateSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'XtraSecurity',
    url: 'https://xtrasecurity.in',
    description:
      'XtraSecurity is a secure environment variable and secrets management platform for developers and DevOps teams. It replaces insecure .env files with AES-256 encrypted, centralized secret storage featuring role-based access control, automated rotation, and audit logging.',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Environment Variable Management',
    operatingSystem: 'Windows, macOS, Linux, Web',
    softwareVersion: '2.0',
    releaseNotes: 'Added Just-in-Time access, Break-Glass emergency access, automated secret rotation, and CLI integration.',
    datePublished: '2025-01-01',
    featureList: [
      'AES-256-GCM Encryption at Rest and in Transit',
      'Role-Based Access Control (RBAC) — Owner, Admin, Developer, Viewer',
      'Multi-Environment Support — Development, Staging, Production',
      'Git-like Secret Branching for Feature Development',
      'Automated Secret Rotation with Zero Downtime',
      'Just-in-Time (JIT) Access with Automatic Expiration',
      'Break-Glass Emergency Access with Full Audit Trail',
      'Comprehensive Audit Logging for Compliance',
      'CLI Tool (xtra-cli) for Local Development',
      'CI/CD Integration — GitHub Actions, GitLab CI, Jenkins',
      'Redis Caching for 40% Faster Retrieval',
      'Workspace-based Team Collaboration',
      'Time-limited Encrypted Secret Sharing Links',
      'Webhook Notifications — Slack, Discord, Custom Webhooks',
      'Environment Sync Status Detection',
      'Shadow Secret Rotation',
    ],
    screenshot: [
      'https://xtrasecurity.in/developer_workflow.png',
      'https://xtrasecurity.in/encryption.png',
      'https://xtrasecurity.in/audit_logs.png',
      'https://xtrasecurity.in/versioning.png',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Up to 3 projects, 50 secrets, 2 team members, basic audit logs',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '29',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Unlimited projects, secrets, and team members. Advanced audit logs, secret rotation, JIT access, priority support.',
        availability: 'https://schema.org/InStock',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '124',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'XtraSecurity',
      url: 'https://xtrasecurity.in',
    },
    keywords: [
      'environment variable manager',
      'secrets management',
      '.env file manager',
      'API key management',
      'secret rotation',
      'DevOps security',
      'Doppler alternative',
      'HashiCorp Vault alternative',
      'Infisical alternative',
      'AWS Secrets Manager alternative',
    ],
  };
}

// ─── Organization Schema ─────────────────────────────────────────────────────

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'XtraSecurity',
    url: 'https://xtrasecurity.in',
    logo: 'https://xtrasecurity.in/android-chrome-512x512.png',
    description:
      'XtraSecurity builds secure environment variable and secrets management tools for developers and DevOps teams.',
    sameAs: [
      'https://twitter.com/XtraSecurity',
      'https://linkedin.com/company/xtrasecurity',
      'https://github.com/xtrasecurity',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@xtrasecurity.in',
      availableLanguage: ['English'],
    },
    foundingDate: '2025',
    areaServed: 'Worldwide',
    knowsAbout: [
      'Secrets Management',
      'Environment Variable Management',
      'API Key Management',
      'DevOps Security',
      'Encryption',
      'Role-Based Access Control',
      'Secret Rotation',
      'CI/CD Integration',
      'Compliance',
    ],
  };
}

// ─── WebSite Schema (with SearchAction) ──────────────────────────────────────

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'XtraSecurity',
    url: 'https://xtrasecurity.in',
    description: 'Secure environment variable and secrets management platform for developers and teams.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://xtrasecurity.in/docs?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ─── FAQ Schema ──────────────────────────────────────────────────────────────

export function generateGlobalFAQSchema() {
  const faqs = [
    {
      question: 'What is XtraSecurity?',
      answer:
        'XtraSecurity is a secure environment variable and secrets management platform built for developers and DevOps teams. It replaces insecure .env files with AES-256 encrypted, centralized secret storage featuring role-based access control (RBAC), automated rotation, just-in-time (JIT) access, and comprehensive audit logging. It is available at https://xtrasecurity.in.',
    },
    {
      question: 'What is environment variable management?',
      answer:
        'Environment variable management is the practice of securely storing, organizing, and controlling access to configuration values like API keys, database credentials, encryption keys, and service URLs that applications need to run. Instead of scattering these values across .env files in repositories, a secrets management platform like XtraSecurity centralizes them with encryption, access control, and audit trails.',
    },
    {
      question: 'Why is XtraSecurity better than .env files?',
      answer:
        'Unlike .env files, XtraSecurity provides: (1) AES-256 encryption for all secrets at rest and in transit, (2) role-based access control so only authorized team members can view specific secrets, (3) automated secret rotation to reduce credential exposure, (4) complete audit logs showing who accessed what and when, (5) multi-environment support to manage dev/staging/prod separately, (6) git-like branching for secrets during feature development. .env files are plain text, easily leaked through version control, and offer no access control or audit capabilities.',
    },
    {
      question: 'How does XtraSecurity encryption work?',
      answer:
        'XtraSecurity uses AES-256-GCM (Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode) to encrypt all secrets at rest. Secrets are encrypted before being stored in the database and decrypted only when an authorized user or API requests them. Data in transit is protected with TLS 1.3. The platform implements a zero-knowledge architecture where encryption keys are managed separately from encrypted data.',
    },
    {
      question: 'Is XtraSecurity free?',
      answer:
        'Yes, XtraSecurity offers a free plan that includes up to 3 projects, 50 secrets, 2 team members, and basic audit logs. For teams that need unlimited projects, secrets, and advanced features like automated secret rotation, just-in-time access, and priority support, the Pro plan is available at $29 per month.',
    },
    {
      question: 'How does XtraSecurity compare to Doppler?',
      answer:
        'Both XtraSecurity and Doppler are secrets management platforms, but XtraSecurity differentiates with: (1) git-like branching for secrets — create feature branches for your configuration just like code, (2) built-in Just-in-Time (JIT) access controls with automatic expiration, (3) Break-Glass emergency access with full audit trail, (4) a more competitive pricing model with a generous free tier. Both platforms support multi-environment management, team collaboration, and CI/CD integration.',
    },
    {
      question: 'How does XtraSecurity compare to HashiCorp Vault?',
      answer:
        'HashiCorp Vault is a powerful infrastructure secrets engine designed for large enterprises with dedicated DevOps teams. XtraSecurity is a developer-first SaaS platform that provides a simpler setup and management experience. Key differences: (1) XtraSecurity requires no infrastructure management — it is a fully hosted SaaS, (2) XtraSecurity offers a visual web dashboard for managing secrets, (3) setup takes minutes instead of hours, (4) XtraSecurity includes built-in team collaboration features. Vault is better suited for complex infrastructure-level secret management, while XtraSecurity excels at application-level environment variable management for development teams.',
    },
    {
      question: 'Can I integrate XtraSecurity with CI/CD pipelines?',
      answer:
        'Yes, XtraSecurity integrates with all major CI/CD platforms including GitHub Actions, GitLab CI, Jenkins, CircleCI, and Bitbucket Pipelines. You can use the xtra-cli command-line tool or the REST API to pull secrets during build and deployment. The CLI supports the `xtra run` command which injects secrets as environment variables into your application process without creating .env files on disk.',
    },
    {
      question: 'What security features does XtraSecurity provide?',
      answer:
        'XtraSecurity provides comprehensive security: (1) AES-256-GCM encryption at rest, (2) TLS 1.3 encryption in transit, (3) Role-Based Access Control with 4 roles (Owner, Admin, Developer, Viewer), (4) Just-in-Time (JIT) access with automatic expiration, (5) Break-Glass emergency access with full audit logging, (6) Automated secret rotation with configurable schedules, (7) Complete audit trail of every access and modification, (8) IP allowlisting, (9) Multi-factor authentication (MFA), (10) Webhook notifications for real-time alerts on secret changes.',
    },
    {
      question: 'How do I migrate from .env files to XtraSecurity?',
      answer:
        'Migration is simple: (1) Sign up at https://xtrasecurity.in/register, (2) Create a project and select your environment (dev/staging/prod), (3) Use the bulk import feature to paste your entire .env file contents — XtraSecurity will parse and encrypt each key-value pair automatically, (4) Install the xtra-cli with `npm install -g xtra-cli`, (5) Run `xtra login` and `xtra projects set <project-id>`, (6) Use `xtra run -- npm run dev` to inject secrets into your application without .env files.',
    },
    {
      question: 'Does XtraSecurity support team collaboration?',
      answer:
        'Yes, XtraSecurity is built for teams. Features include: (1) Workspace-based organization — create separate workspaces for different teams or clients, (2) Role-Based Access Control with Owner, Admin, Developer, and Viewer roles, (3) Invitation system for adding team members, (4) Just-in-Time access requests — developers can request temporary access that auto-expires, (5) Audit logs showing all team activity, (6) Secret sharing with time-limited encrypted links.',
    },
  ];

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

// ─── HowTo Schema ────────────────────────────────────────────────────────────

export function generateHowToSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Manage Environment Variables Securely with XtraSecurity',
    description:
      'A step-by-step guide to setting up secure environment variable management using XtraSecurity, replacing insecure .env files with encrypted, centralized secret storage.',
    totalTime: 'PT10M',
    tool: [
      { '@type': 'HowToTool', name: 'Web Browser' },
      { '@type': 'HowToTool', name: 'Terminal / Command Line' },
      { '@type': 'HowToTool', name: 'Node.js (v16+)' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Create an Account',
        text: 'Sign up for a free account at https://xtrasecurity.in/register. No credit card required.',
        url: 'https://xtrasecurity.in/register',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'Create a Project and Add Secrets',
        text: 'Create a new project in the dashboard, select your environment (development, staging, production), and add your environment variables. You can bulk import from existing .env files.',
        url: 'https://xtrasecurity.in/dashboard',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'Install the CLI',
        text: 'Install the xtra-cli tool using npm: `npm install -g xtra-cli`. Then authenticate with `xtra login`.',
        position: 3,
      },
      {
        '@type': 'HowToStep',
        name: 'Run Your Application with Injected Secrets',
        text: 'Use `xtra run -e development -b main -- npm run dev` to securely inject your secrets into your application process without creating .env files on disk.',
        position: 4,
      },
    ],
  };
}

// ─── Breadcrumb Schema ───────────────────────────────────────────────────────

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
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

// ─── WebPage Schema ──────────────────────────────────────────────────────────

export function generateWebPageSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'XtraSecurity',
      url: 'https://xtrasecurity.in',
    },
    provider: {
      '@type': 'Organization',
      name: 'XtraSecurity',
      url: 'https://xtrasecurity.in',
    },
  };
}

// ─── TechArticle Schema ──────────────────────────────────────────────────────

export function generateTechArticleSchema(title: string, description: string, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    author: {
      '@type': 'Organization',
      name: 'XtraSecurity',
      url: 'https://xtrasecurity.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'XtraSecurity',
      logo: {
        '@type': 'ImageObject',
        url: 'https://xtrasecurity.in/android-chrome-512x512.png',
      },
    },
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    proficiencyLevel: 'Beginner',
    dependencies: 'Node.js 16+, npm',
  };
}

// ─── Parameterized FAQ Schema (backward compat) ─────────────────────────────

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
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
