import { ComparisonPage } from '@/types/comparison';

export const comparisonPages: ComparisonPage[] = [
  {
    id: '1',
    slug: 'hashicorp-vault-vs-xtrasecurity',
    title: 'HashiCorp Vault vs XtraSecurity: Detailed Comparison 2026',
    description: 'Compare HashiCorp Vault and XtraSecurity. Feature-by-feature comparison of pricing, ease of use, deployment options, and enterprise capabilities.',
    keywords: [
      'hashicorp vault alternatives',
      'vault vs xtrasecurity',
      'vault comparison',
      'best vault alternative',
      'secrets manager comparison',
      'open source secrets manager'
    ],
    competitorName: 'HashiCorp Vault',
    competitorUrl: 'https://www.vaultproject.io/',
    shortDescription: 'HashiCorp Vault is the industry standard for secrets management, but XtraSecurity offers a developer-friendly alternative with simpler setup.',
    features: [
      {
        name: 'Deployment Model',
        xtraSecurity: 'SaaS + Self-Hosted',
        competitor: 'Self-Hosted Only',
        note: 'XtraSecurity offers flexibility of both'
      },
      {
        name: 'Setup Time',
        xtraSecurity: '15 minutes',
        competitor: '2-3 days',
        note: 'XtraSecurity is dramatically faster'
      },
      {
        name: 'Open Source',
        xtraSecurity: 'Yes',
        competitor: 'Yes',
        note: 'Both have open-source options'
      },
      {
        name: 'RBAC (Role-Based Access)',
        xtraSecurity: 'Yes',
        competitor: 'Yes',
        note: 'Both support fine-grained access control'
      },
      {
        name: 'Secret Rotation',
        xtraSecurity: 'Automatic',
        competitor: 'Manual Configuration',
        note: 'XtraSecurity automates by default'
      },
      {
        name: 'Kubernetes Integration',
        xtraSecurity: 'Native + CSI Driver',
        competitor: 'Native + CSI Driver',
        note: 'Both support Kubernetes well'
      },
      {
        name: 'Pricing Model',
        xtraSecurity: 'Per-user + Usage',
        competitor: 'Free + Enterprise Support',
        note: 'Vault has free tier; XtraSecurity SaaS has Pro plan'
      },
      {
        name: 'Database Integration',
        xtraSecurity: 'All major DBs',
        competitor: 'All major DBs',
        note: 'Both support extensive integrations'
      },
      {
        name: 'Audit Logging',
        xtraSecurity: 'Yes, Detailed',
        competitor: 'Yes, Detailed',
        note: 'Both provide comprehensive audit trails'
      },
      {
        name: 'Zero-Trust Architecture',
        xtraSecurity: 'Built-in',
        competitor: 'Available',
        note: 'XtraSecurity is zero-trust by default'
      },
      {
        name: 'CLI Tool',
        xtraSecurity: 'Native CLI',
        competitor: 'Native CLI',
        note: 'Both have excellent CLIs'
      },
      {
        name: 'Operational Overhead',
        xtraSecurity: 'Low',
        competitor: 'High',
        note: 'Vault requires DevOps expertise'
      }
    ],
    xtraSecurityAdvantages: [
      'Simpler deployment: no infrastructure management needed',
      'Faster setup: 15 minutes vs 2-3 days',
      'Developer-first UX: easier for teams without DevOps dedicated staff',
      'Flexible deployment: SaaS option removes operational burden',
      'Built-in zero-trust: security by default'
    ],
    useCase: 'Choose Vault if you need ultimate flexibility and have a dedicated DevOps team. Choose XtraSecurity if you want simplicity + flexibility without operational overhead.',
    dateUpdated: '2026-03-07'
  },
  {
    id: '2',
    slug: 'aws-secrets-manager-vs-xtrasecurity',
    title: 'AWS Secrets Manager vs XtraSecurity: Feature Comparison',
    description: 'Compare AWS Secrets Manager with XtraSecurity. Pricing, multi-cloud support, ease of use, and best use cases for each platform.',
    keywords: [
      'aws secrets manager alternatives',
      'aws secrets manager vs',
      'best aws secrets manager alternative',
      'secrets manager comparison',
      'vault vs aws secrets manager'
    ],
    competitorName: 'AWS Secrets Manager',
    competitorUrl: 'https://aws.amazon.com/secrets-manager/',
    shortDescription: 'AWS Secrets Manager is great for AWS-only deployments, but XtraSecurity offers multi-cloud support and platform independence.',
    features: [
      {
        name: 'Multi-Cloud Support',
        xtraSecurity: 'Yes (AWS, Azure, GCP)',
        competitor: 'AWS Only',
        note: 'XtraSecurity runs everywhere'
      },
      {
        name: 'Pricing Model',
        xtraSecurity: '$99/month Pro or usage-based',
        competitor: '$0.40/secret + API calls',
        note: 'AWS is good for few secrets; XtraSecurity better for scale'
      },
      {
        name: 'Vendor Lock-In',
        xtraSecurity: 'None',
        competitor: 'High',
        note: 'Never stuck with one cloud'
      },
      {
        name: 'Setup Time',
        xtraSecurity: '15 minutes',
        competitor: '10 minutes',
        note: 'Both are fast; AWS slightly faster'
      },
      {
        name: 'IAM Integration',
        xtraSecurity: 'Flexible',
        competitor: 'Tight AWS IAM Integration',
        note: 'AWS Secrets Manager deeply integrated with IAM'
      },
      {
        name: 'Secret Rotation',
        xtraSecurity: 'Automatic',
        competitor: 'Automatic (Lambda-based)',
        note: 'AWS requires Lambda functions'
      },
      {
        name: 'Kubernetes Support',
        xtraSecurity: 'Native CSI Driver',
        competitor: 'Not Native (workaround with External Secrets)',
        note: 'AWS requires External Secrets Operator'
      },
      {
        name: 'On-Premise Option',
        xtraSecurity: 'Yes',
        competitor: 'No',
        note: 'XtraSecurity can run self-hosted'
      },
      {
        name: 'API/SDK',
        xtraSecurity: 'REST + SDK',
        competitor: 'AWS SDK Only',
        note: 'XtraSecurity has standard REST API'
      },
      {
        name: 'Compliance Certifications',
        xtraSecurity: 'SOC 2, ISO 27001',
        competitor: 'SOC 2, ISO 27001, FedRAMP',
        note: 'AWS has more certifications'
      },
      {
        name: 'Learning Curve',
        xtraSecurity: 'Easy',
        competitor: 'Easy',
        note: 'Both are straightforward'
      },
      {
        name: 'Team Collaboration',
        xtraSecurity: 'Strong',
        competitor: 'Requires IAM configuration',
        note: 'XtraSecurity has better team UX'
      }
    ],
    xtraSecurityAdvantages: [
      'Multi-cloud: works on any cloud (AWS, Azure, GCP, on-premise)',
      'No vendor lock-in: switch clouds anytime',
      'Better Kubernetes support: native integration vs workarounds',
      'Simpler team collaboration: doesn\'t require AWS IAM expertise',
      'Predictable pricing: no hidden API call costs'
    ],
    useCase: 'Use AWS Secrets Manager if you\'re 100% AWS and want native integration. Use XtraSecurity if you use multiple clouds or want flexibility.',
    dateUpdated: '2026-03-07'
  },
  {
    id: '3',
    slug: 'doppler-vs-xtrasecurity',
    title: 'Doppler vs XtraSecurity: Secrets Manager Comparison',
    description: 'Doppler vs XtraSecurity comparison. Pricing, features, integrations, and which platform is best for your team.',
    keywords: [
      'doppler vs xtrasecurity',
      'doppler alternatives',
      'doppler vs vault',
      'best doppler alternative',
      'secrets management tools'
    ],
    competitorName: 'Doppler',
    competitorUrl: 'https://www.doppler.com/',
    shortDescription: 'Doppler is popular with startups for simplicity. XtraSecurity offers similar ease with added open-source flexibility.',
    features: [
      {
        name: 'Pricing',
        xtraSecurity: '$99/month Pro',
        competitor: 'Free + $120/month Pro',
        note: 'Doppler has free tier; XtraSecurity also has free tier'
      },
      {
        name: 'Deployment',
        xtraSecurity: 'SaaS + Self-Hosted',
        competitor: 'SaaS Only',
        note: 'XtraSecurity offers self-hosted option'
      },
      {
        name: 'Open Source',
        xtraSecurity: 'Yes',
        competitor: 'No',
        note: 'XtraSecurity is open-source'
      },
      {
        name: 'CLI Tool',
        xtraSecurity: 'Excellent',
        competitor: 'Excellent',
        note: 'Both have great CLIs'
      },
      {
        name: 'Configuration Management',
        xtraSecurity: 'Environments + Projects',
        competitor: 'Environments + Projects',
        note: 'Very similar UX'
      },
      {
        name: 'Integrations',
        xtraSecurity: '50+ integrations',
        competitor: '100+ integrations',
        note: 'Doppler has more integrations'
      },
      {
        name: 'UI/UX',
        xtraSecurity: 'Modern, Clean',
        competitor: 'Modern, Very clean',
        note: 'Doppler known for best UX in category'
      },
      {
        name: 'Team Collaboration',
        xtraSecurity: 'Yes',
        competitor: 'Yes',
        note: 'Both support team features'
      },
      {
        name: 'Audit Logs',
        xtraSecurity: 'Yes',
        competitor: 'Yes',
        note: 'Both provide audit trails'
      },
      {
        name: 'Secret Rotation',
        xtraSecurity: 'Automatic',
        competitor: 'Manual',
        note: 'XtraSecurity automates rotation'
      },
      {
        name: 'Kubernetes Integration',
        xtraSecurity: 'Native CSI',
        competitor: 'Via External Secrets',
        note: 'Both work with K8s'
      },
      {
        name: 'API Rate Limits',
        xtraSecurity: 'Unlimited',
        competitor: 'Limited on free tier',
        note: 'XtraSecurity doesn\'t nickel-and-dime'
      }
    ],
    xtraSecurityAdvantages: [
      'Open-source: audit the code yourself',
      'Self-hosted option: keep secrets on your infrastructure',
      'Automatic secret rotation: default behavior',
      'No vendor lock-in: export anytime',
      'Unlimited API calls: no rate limiting'
    ],
    useCase: 'Doppler is perfect for simplicity. XtraSecurity is better if you want open-source transparency or self-hosted option.',
    dateUpdated: '2026-03-07'
  }
];

export function getComparisonPage(slug: string): ComparisonPage | undefined {
  return comparisonPages.find(page => page.slug === slug);
}

export function getAllComparisons(): ComparisonPage[] {
  return comparisonPages;
}
