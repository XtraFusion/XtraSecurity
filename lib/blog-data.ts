import { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-secure-api-keys',
    title: 'How to Secure API Keys: Complete Guide for Developers',
    description: 'Learn the best practices for securing API keys in Node.js, Python, and Go. Prevent API key leaks and protect your production infrastructure.',
    keywords: [
      'how to secure api keys',
      'api key security',
      'api key management',
      'secure api key storage',
      'prevent api key leaks'
    ],
    content: `# How to Secure API Keys: Complete Guide for Developers

API keys are the crown jewels of your application. They provide access to critical services like payment processors, cloud platforms, and third-party APIs. Yet many developers store them carelessly—in code repositories, environment files, or worse, hardcoded in production builds.

## The Problem with Unsecured API Keys

Every day, hackers scan GitHub for exposed API keys. When they find one, they can:
- Access your cloud infrastructure
- Make unauthorized API calls
- Drain your database
- Access customer data

This costs companies thousands in minutes.

## Best Practices for Securing API Keys

### 1. Never Commit API Keys to Git

The first rule: **never commit secrets to your repository**.

✅ Bad Example:
\`\`\`javascript
const apiKey = "sk-12345678901234567890"; // 🚨 DO NOT DO THIS
\`\`\`

✅ Good Example:
\`\`\`javascript
const apiKey = process.env.API_KEY;
\`\`\`

### 2. Use Environment Variables

Store secrets in environment variables that are loaded at runtime:

\`\`\`bash
# .env.local (add to .gitignore)
API_KEY=sk_prod_123456789
DATABASE_PASSWORD=secret_password_here
STRIPE_KEY=sk_live_abc123
\`\`\`

### 3. Use a Secrets Manager

For production, use a dedicated secrets manager like XtraSecurity, AWS Secrets Manager, or HashiCorp Vault:

\`\`\`javascript
// With XtraSecurity
const xtra = require('@xtrasecurity/sdk');
const apiKey = await xtra.getSecret('api-key-prod');
\`\`\`

### 4. Rotate Keys Regularly

Never use the same API key forever. Rotate keys every:
- 30 days for production
- 7 days for high-risk services

### 5. Restrict Key Permissions

Create API keys with minimal permissions:
- Only read access if write isn't needed
- Restrict to specific IP addresses
- Set expiration dates

### 6. Monitor Key Usage

Log all API key access and alert on unusual patterns.

## How to Implement in Your Stack

### Node.js with dotenv

\`\`\`javascript
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_API_KEY);
\`\`\`

### Python

\`\`\`python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('API_KEY')
\`\`\`

### Go

\`\`\`go
package main

import (
  "os"
)

func main() {
  apiKey := os.Getenv("API_KEY")
}
\`\`\`

## What to Do If You've Exposed a Key

1. Immediately revoke the exposed key
2. Generate a new key
3. Update all services using the old key
4. Check logs for unauthorized access
5. If in public repository, contact the service provider

## Conclusion

Securing API keys isn't optional—it's critical infrastructure security.`,
    author: 'OM Salunke',
    date: '2026-03-01',
    category: 'Security',
    readTime: 8,
    featured: true,
    canonical: 'https://xtrasecurity.in/blog/how-to-secure-api-keys'
  },
  {
    id: '2',
    slug: 'env-file-security-best-practices',
    title: '.env File Security Best Practices: Keep Your Secrets Safe',
    description: 'Should you commit .env files? How to secure environment variables? Complete guide to .env file security for developers.',
    keywords: [
      '.env security best practices',
      'should i commit env file',
      'env file security risks',
      'environment variables security',
      '.env file secrets management'
    ],
    content: `# .env File Security Best Practices: Keep Your Secrets Safe

The .env file is where developers store sensitive configuration. Database passwords, API keys, OAuth tokens—they all live there. Yet it's one of the most frequently leaked files in web applications.

## Should You Commit .env Files?

The answer is simple: **Never commit .env files to version control.**

Even if you add it to .gitignore, mistakes happen. Developers accidentally commit the wrong file. CI/CD systems expose variables. The risk is too high.

## Common .env Security Mistakes

### Mistake #1: Committing .env to Git

\`\`\`bash
git add .env  # 🚨 DO NOT DO THIS
\`\`\`

### Mistake #2: Hardcoding Secrets in Docker

\`\`\`dockerfile
ENV API_KEY="sk_prod_secret"  # 🚨 Visible in image
\`\`\`

### Mistake #3: Logging Environment Variables

\`\`\`javascript
console.log(process.env);  // 🚨 May expose secrets in logs
\`\`\`

## The Right Way to Manage .env Files

### Step 1: Create .env.example

Create a template with placeholder values:

\`\`\`bash
# .env.example
DATABASE_URL=postgres://user:password@localhost:5432/db
API_KEY=your_api_key_here
STRIPE_KEY=sk_test_xyz
JWT_SECRET=your_secret_here
\`\`\`

### Step 2: Add .env to .gitignore

\`\`\`bash
# .gitignore
.env
.env.local
.env.*.local
\`\`\`

### Step 3: Use a Secrets Manager

For production, never use .env files. Use:
- XtraSecurity
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### Step 4: Rotate Secrets Regularly

Change all secrets every:
- 30 days for database credentials
- 7 days for API keys
- Immediately if compromised

## Implementation Examples

### Development Setup

\`\`\`bash
# 1. Create .env.local with your secrets
\`\`\`

### Docker Setup

\`\`\`dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install

# Don't embed secrets in image
CMD ["npm", "start"]
\`\`\`

### Docker Compose with XtraSecurity

\`\`\`yaml
version: '3'
services:
  api:
    image: myapp:latest
    environment:
      DATABASE_URL: \${DATABASE_URL}
      API_KEY: \${API_KEY}
\`\`\`

## Red Flags in .env Files

Never include in .env:
- ❌ Production database passwords
- ❌ API keys for paid services
- ❌ OAuth tokens
- ❌ JWT secrets
- ❌ SSH keys
- ❌ Encryption keys

## Securing .env Files

Use file permissions:

\`\`\`bash
chmod 600 .env  # Only user can read
\`\`\`

## Conclusion

.env files are critical infrastructure. Treat them with the same security as production databases.`,
    author: 'OM Salunke',
    date: '2026-02-28',
    category: 'DevOps',
    readTime: 7,
    featured: true,
    canonical: 'https://xtrasecurity.in/blog/env-file-security-best-practices'
  },
  {
    id: '3',
    slug: 'ci-cd-secrets-management-github-actions',
    title: 'CI/CD Secrets Management: Securing GitHub Actions & GitLab CI',
    description: 'How to securely manage secrets in GitHub Actions, GitLab CI, and Jenkins. Prevent credential exposure in CI/CD pipelines.',
    keywords: [
      'ci cd secrets management',
      'github secrets management',
      'github actions secrets',
      'gitlab ci secrets',
      'jenkins secrets management'
    ],
    content: `# CI/CD Secrets Management: Securing GitHub Actions & GitLab CI

Your CI/CD pipeline is the nervous system of your application. If secrets leak here, your entire infrastructure is compromised.

Yet many teams handle secrets carelessly in GitHub Actions, GitLab CI, and Jenkins.

## The CI/CD Secrets Problem

When you push code, your CI/CD pipeline springs into action:
1. Clone repository
2. Install dependencies
3. Run tests
4. Build application
5. Deploy to production

At each step, secrets are needed. And at each step, they're exposed to logs, artifacts, and environment variables.

## GitHub Actions Secrets: The Right Way

### Creating Secrets in GitHub

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add your secret (API_KEY, DATABASE_PASSWORD, etc.)

### Accessing Secrets in Workflows

\`\`\`yaml
name: Deploy

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
          API_KEY: \${{ secrets.API_KEY }}
        run: npm run deploy
\`\`\`

### Never Log Secrets

✅ Good:
\`\`\`yaml
- name: Connect to database
  env:
    PASSWORD: \${{ secrets.DB_PASSWORD }}
  run: npm run migrate  # Password not logged
\`\`\`

❌ Bad:
\`\`\`yaml
- name: Test
  run: echo "Password is: \${{ secrets.DB_PASSWORD }}"  # 🚨 EXPOSED
\`\`\`

## GitHub Actions Best Practices

1. **Use organization secrets** for shared secrets
2. **Rotate secrets** every 30 days
3. **Audit secret access** logs
4. **Mask secret values** in logs automatically (GitHub does this)
5. **Limit branch access** to production secrets

## GitLab CI Secrets

GitLab calls them "CI/CD Variables":

\`\`\`yaml
stages:
  - deploy

deploy:
  stage: deploy
  script:
    - export DATABASE_URL=\$DB_URL
    - npm run deploy
  only:
    - main
\`\`\`

## Jenkins Secrets

In Jenkins, use the Credentials Plugin:

\`\`\`groovy
pipeline {
  agent any
  
  environment {
    API_KEY = credentials('api-key-prod')
  }
  
  stages {
    stage('Deploy') {
      steps {
        sh '''
          export API_KEY=${API_KEY}
          npm run deploy
        '''
      }
    }
  }
}
\`\`\`

## Advanced: Integration with XtraSecurity

For enterprise CI/CD, integrate XtraSecurity:

\`\`\`yaml
name: Deploy with XtraSecurity

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Fetch secrets
        run: |
          npm install @xtrasecurity/sdk
          node fetch-secrets.js
      
      - name: Deploy
        run: npm run deploy
\`\`\`

## Common CI/CD Secret Mistakes

❌ Storing secrets in code
❌ Committing .env files
❌ Using weak credentials
❌ No secret rotation
❌ Storing secrets in artifacts
❌ No audit logs

## Conclusion

CI/CD pipelines should never expose secrets in logs, artifacts, or environment variables.`,
    author: 'OM Salunke',
    date: '2026-02-25',
    category: 'DevOps',
    readTime: 9,
    featured: true,
    canonical: 'https://xtrasecurity.in/blog/ci-cd-secrets-management-github-actions'
  },
  {
    id: '4',
    slug: 'kubernetes-secrets-management-guide',
    title: 'Kubernetes Secrets Management: Secure Your Container Secrets',
    description: 'Complete guide to managing secrets in Kubernetes. Learn etcd encryption, RBAC, secret rotation, and integrations with vault and external secret operators.',
    keywords: [
      'kubernetes secrets manager',
      'kubernetes secrets management',
      'etcd encryption',
      'kubernetes secret vault',
      'external secrets operator'
    ],
    content: `# Kubernetes Secrets Management: Secure Your Container Secrets

Kubernetes is where modern applications run. It's also where many teams struggle with secrets management.

By default, Kubernetes stores secrets in etcd—unencrypted. That's a disaster waiting to happen.

## The Kubernetes Secrets Problem

By default:
- Secrets are base64-encoded (not encrypted!)
- Stored in etcd in plain text
- Accessible to any pod with RBAC permissions
- No audit trail
- No rotation mechanism

## Creating Kubernetes Secrets

### Method 1: From Command Line

\`\`\`bash
kubectl create secret generic db-credentials \\
  --from-literal=username=admin \\
  --from-literal=password=secret123
\`\`\`

### Method 2: From YAML

\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=  # base64: admin
  password: c2VjcmV0MTIz  # base64: secret123
\`\`\`

### Method 3: From .env File

\`\`\`bash
kubectl create secret generic app-secrets --from-env-file=.env
\`\`\`

## Using Secrets in Pods

### Mounting as Environment Variables

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
\`\`\`

### Mounting as Volumes

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - name: secrets
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets
    secret:
      secretName: db-credentials
\`\`\`

## Securing Kubernetes Secrets

### Enable etcd Encryption

\`\`\`yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-32-byte-secret>
  - identity: {}
\`\`\`

### Implement RBAC

\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
  resourceNames: ["db-credentials"]  # Limit to specific secret
\`\`\`

## External Secrets Operator

For production, use External Secrets Operator to sync secrets from XtraSecurity, Vault, or AWS:

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
\`\`\`

## Secrets Rotation in Kubernetes

Never use static secrets. Rotate frequently:

\`\`\`bash
# Rotate database password
kubectl patch secret db-credentials -p \\
  '{"data":{"password":"'$(echo -n newpassword|base64)'"}}'
\`\`\`

## Best Practices

1. **Enable etcd encryption** at rest
2. **Use RBAC** to limit secret access
3. **Don't commit secrets** to Git
4. **Use External Secrets Operator** for production
5. **Audit secret access** with logging
6. **Rotate secrets regularly** (every 30 days)
7. **Use read-only mounts** for secret volumes
8. **Never use default namespace** for secrets

## Conclusion

Kubernetes secrets require encryption, RBAC, and regular rotation.`,
    author: 'OM Salunke',
    date: '2026-02-20',
    category: 'DevOps',
    readTime: 10,
    featured: true,
    canonical: 'https://xtrasecurity.in/blog/kubernetes-secrets-management-guide'
  },
  {
    id: '5',
    slug: 'secrets-management-tools-comparison',
    title: 'Secrets Management Tools 2026: Vault vs Doppler vs AWS vs XtraSecurity',
    description: 'Compare the best secrets management platforms. Feature comparison of HashiCorp Vault, Doppler, AWS Secrets Manager, and XtraSecurity.',
    keywords: [
      'best secrets management tools',
      'secrets management comparison',
      'vault vs doppler',
      'aws secrets manager alternative',
      'open source secrets manager'
    ],
    content: `# Secrets Management Tools 2026: Vault vs Doppler vs AWS vs XtraSecurity

Choosing a secrets manager is a critical infrastructure decision. Get it wrong, and you compromise every secret in your organization.

This guide compares the leading platforms: HashiCorp Vault, Doppler, AWS Secrets Manager, and XtraSecurity.

## Feature Comparison

| Feature | Vault | Doppler | AWS | XtraSecurity |
|---------|-------|---------|-----|--------------|
| Open Source | ✅ | ❌ | ❌ | ✅ |
| SaaS | ❌ | ✅ | ✅ | ✅ |
| Self-Hosted | ✅ | ❌ | ❌ | ✅ |
| Secret Rotation | ✅ | ✅ | ✅ | ✅ |
| RBAC | ✅ | ✅ | ✅ | ✅ |
| Kubernetes Integration | ✅ | ✅ | ✅ | ✅ |
| Audit Logging | ✅ | ✅ | ✅ | ✅ |
| Zero-Trust | ✅ | ⚠️ | ⚠️ | ✅ |
| Pricing | Free | $120/month | Pay-per-use | $99/month |

## HashiCorp Vault

**Best for:** Enterprise, self-hosted, multi-cloud

**Pros:**
- Most mature open-source option
- Self-hosted control
- Multi-cloud support
- Strong RBAC system

**Cons:**
- Complex setup and maintenance
- High operational overhead
- Steep learning curve
- Expensive at scale

**Pricing:**
- Community: Free
- Enterprise: $2,500+/month for support

**Good for:**
- Large enterprises with on-premise requirement
- Teams with DevOps expertise

## Doppler

**Best for:** Small to mid-size teams, simplicity

**Pros:**
- Simple, intuitive interface
- Fast setup (minutes)
- Good environment management
- Nice CLI experience

**Cons:**
- SaaS only (no self-hosted)
- Limited integrations
- Less powerful than Vault
- No open source alternative

**Pricing:**
- Free tier: up to 5 team members
- Pro: $120/month
- Enterprise: Custom

**Good for:**
- Startups and growing teams
- Companies wanting simplicity over features

## AWS Secrets Manager

**Best for:** AWS-native deployments

**Pros:**
- Native AWS integration
- IAM integration
- Automatic rotation
- Pay-per-secret pricing

**Cons:**
- AWS-only ecosystem
- Higher latency (network calls)
- Basic compared to Vault
- Vendor lock-in

**Pricing:**
- $0.40 per secret stored
- $0.06 per API call (first million free)

**Good for:**
- AWS-first organizations
- Simple use cases

## XtraSecurity

**Best for:** Modern teams wanting open-source + SaaS flexibility

**Pros:**
- Open-source SDK/CLI
- SaaS simplicity + self-hosted option
- Built for DevOps-first teams
- Developer-friendly integrations
- Zero-trust architecture
- Affordable pricing

**Cons:**
- Newer than established players
- Smaller community (growing)
- Fewer enterprise features (for now)

**Pricing:**
- Free tier
- Pro: $99/month
- Enterprise: Custom

**Good for:**
- Modern DevOps teams
- Development standards over enterprise features

## Comparison Summary

### For Complex Enterprise: HashiCorp Vault
- Ultimate flexibility
- Self-hosted control
- But requires DevOps expertise

### For Simple SaaS: Doppler
- Easiest to set up
- Great UX
- But locked into SaaS

### For AWS Shops: AWS Secrets Manager
- Native integration
- Pay-per-secret
- But trapped in AWS ecosystem

### For Modern DevOps: XtraSecurity
- Open-source + SaaS
- Developer ergonomics
- Zero-trust by default
- Great middle ground

## Decision Matrix

Choose Vault if:
- ✅ Self-hosted is required
- ✅ Complex PKI needed
- ✅ Unlimited budget for ops

Choose Doppler if:
- ✅ Want simplest UI
- ✅ Don't need open source
- ✅ SaaS-first team

Choose AWS if:
- ✅ 100% AWS ecosystem
- ✅ Want minimal integration work
- ✅ Simple use cases

Choose XtraSecurity if:
- ✅ Want open-source visibility
- ✅ Value DevOps ergonomics
- ✅ Want flexible deployment options
- ✅ Zero-trust security model

## Conclusion

The best secrets manager depends on your architecture. But for modern DevOps teams, the trend is clear: simplicity + flexibility wins.`,
    author: 'OM Salunke',
    date: '2026-02-15',
    category: 'Comparison',
    readTime: 11,
    featured: true,
    canonical: 'https://xtrasecurity.in/blog/secrets-management-tools-comparison'
  }
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(post => post.featured).slice(0, 3);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getLatestPosts(limit: number = 10): BlogPost[] {
  return blogPosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
