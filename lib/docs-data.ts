import { DocPage, DocCategory } from '@/types/docs';

const docPages: DocPage[] = [
  {
    id: '1',
    slug: 'getting-started',
    title: 'Getting Started with XtraSecurity',
    description: 'Quick start guide to set up XtraSecurity. Create an account, generate API keys, and manage your first secrets in 5 minutes.',
    keywords: [
      'getting started',
      'quick start',
      'setup guide',
      'how to use xtrasecurity',
      'create account'
    ],
    category: 'Getting Started',
    order: 1,
    content: `# Getting Started with XtraSecurity

XtraSecurity is a secrets management platform that helps you secure API keys, database passwords, and OAuth tokens.

## Step 1: Create an Account

1. Go to [https://xtrasecurity.in/register](https://xtrasecurity.in/register)
2. Enter your email and password
3. Verify your email
4. Create your first project

## Step 2: Create Your First Secret

1. Go to your project dashboard
2. Click "New Secret"
3. Enter secret name: \`api_key\`
4. Enter secret value: \`sk_test_12345\`
5. Click "Save"

## Step 3: Generate an API Key

1. Go to Settings → API Keys
2. Click "Generate New Key"
3. Name it: \`development\`
4. Copy the key (you won't see it again)

## Step 4: Fetch Secrets in Your App

### Using Node.js

\`\`\`javascript
const xtra = require('@xtrasecurity/sdk');

const client = xtra.createClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: 'your-project-id'
});

const apiKey = await client.getSecret('api_key');
console.log(apiKey.value);
\`\`\`

### Using Python

\`\`\`python
from xtrasecurity import XtraClient

client = XtraClient(
    api_key=os.getenv('XTRA_API_KEY'),
    project_id='your-project-id'
)

api_key = client.get_secret('api_key')
print(api_key.value)
\`\`\`

## Step 5: Set Permissions

1. Go to Settings → Access Control
2. Create a role: \`developer\`
3. Grant \`read\` permission to \`api_key\`
4. Invite team members

## What's Next?

- [Learn the CLI](/docs/cli-reference)
- [Integrate with Node.js](/docs/nodejs-sdk)
- [Set up Kubernetes](/docs/kubernetes-integration)
- [Use with GitHub Actions](/docs/github-actions)

## Need Help?

- Check our [FAQ](/help)
- Contact support at [support@xtrasecurity.in](mailto:support@xtrasecurity.in)
`
  },
  {
    id: '2',
    slug: 'cli-reference',
    title: 'XtraSecurity CLI Reference Guide',
    description: 'Complete reference for xtra CLI commands. Install, authenticate, and manage secrets from the command line.',
    keywords: [
      'cli reference',
      'command line',
      'xtra cli',
      'cli commands',
      'cli installation'
    ],
    category: 'Getting Started',
    order: 2,
    content: `# XtraSecurity CLI Reference

The XtraSecurity CLI allows you to manage secrets from the command line.

## Installation

### macOS / Linux

\`\`\`bash
curl -fsSL https://cdn.xtrasecurity.in/install.sh | bash
\`\`\`

### Windows

\`\`\`powershell
powershell -Command "& {Invoke-WebRequest -Uri 'https://cdn.xtrasecurity.in/install.ps1' -OutFile install.ps1; ./install.ps1}"
\`\`\`

### Using npm

\`\`\`bash
npm install -g @xtrasecurity/cli
\`\`\`

## Authentication

### Login

\`\`\`bash
xtra login
# Enter your email and password
\`\`\`

### Set API Key

\`\`\`bash
xtra auth --api-key sk_live_xxx
\`\`\`

## Commands

### Get Secret

\`\`\`bash
xtra get api_key
# Output: sk_test_12345

# Get specific version
xtra get api_key --version 2

# Output as JSON
xtra get api_key --json
\`\`\`

### Set Secret

\`\`\`bash
xtra set api_key sk_prod_12345

# Set with metadata
xtra set api_key sk_prod_12345 \\
  --team "backend" \\
  --expires "2026-04-01"
\`\`\`

### Delete Secret

\`\`\`bash
xtra delete api_key

# Force delete without confirmation
xtra delete api_key --force
\`\`\`

### List Secrets

\`\`\`bash
xtra list

# Show all versions
xtra list --versions

# Filter by tag
xtra list --tags "production"
\`\`\`

### Rotate Secret

\`\`\`bash
xtra rotate api_key

# Auto-rotate every 30 days
xtra rotate api_key --interval 30d
\`\`\`

### Audit Logs

\`\`\`bash
xtra audit

# View specific secret logs
xtra audit api_key

# Show last N entries
xtra audit --limit 50
\`\`\`

## Environment Variables

\`\`\`bash
export XTRA_API_KEY="sk_live_xxx"
export XTRA_PROJECT_ID="proj_xxx"
export XTRA_ENVIRONMENT="production"
\`\`\`

## Configuration File

Create \`~/.xtrarc\`:

\`\`\`yaml
api_key: sk_live_xxx
project_id: proj_xxx
environment: production
output_format: json
\`\`\`

## Examples

### Export to .env File

\`\`\`bash
xtra export --format env > .env.local
\`\`\`

### Sync Secrets

\`\`\`bash
xtra sync --source vault --destination xtrasecurity
\`\`\`

### CI/CD Integration

\`\`\`bash
#!/bin/bash
xtra login --api-key $XTRA_API_KEY
SECRETS=\$(xtra list --json)
echo \$SECRETS | jq '.secrets[] | "\(.name)=\(.value)"' > .env
\`\`\`

## Troubleshooting

### "Authentication failed"

\`\`\`bash
xtra logout
xtra login  # Login again
\`\`\`

### "Secret not found"

\`\`\`bash
xtra list  # Verify secret exists
\`\`\`

### Enable Debug Mode

\`\`\`bash
XTRA_DEBUG=1 xtra get api_key
\`\`\`
`
  },
  {
    id: '3',
    slug: 'nodejs-sdk',
    title: 'Node.js SDK Integration Guide',
    description: 'Complete guide to using XtraSecurity with Node.js. Install the SDK, authenticate, and fetch secrets in your Express or Next.js app.',
    keywords: [
      'nodejs sdk',
      'node integration',
      'javascript sdk',
      'express secrets',
      'nextjs secrets'
    ],
    category: 'SDKs',
    order: 3,
    content: `# Node.js SDK Integration Guide

Integrate XtraSecurity into your Node.js application with just a few lines of code.

## Installation

\`\`\`bash
npm install @xtrasecurity/sdk
\`\`\`

## Quick Start

\`\`\`javascript
const { XtraClient } = require('@xtrasecurity/sdk');

const client = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID
});

// Get a secret
const apiKey = await client.getSecret('stripe_key');
console.log(apiKey.value);
\`\`\`

## Configuration

### Constructor Options

\`\`\`javascript
const client = new XtraClient({
  apiKey: 'sk_live_xxx',          // Required
  projectId: 'proj_xxx',          // Required
  environment: 'production',       // Optional, default: 'default'
  cache: {
    enabled: true,                // Cache secrets locally
    ttl: 3600                      // Cache for 1 hour
  },
  timeout: 5000,                   // Request timeout (ms)
  baseUrl: 'https://api.xtrasecurity.in' // Optional
});
\`\`\`

## Methods

### getSecret()

\`\`\`javascript
// Get latest secret
const secret = await client.getSecret('api_key');
console.log(secret.value);

// Get specific version
const v2 = await client.getSecret('api_key', { version: 2 });

// Get with metadata
const secret = await client.getSecret('api_key');
console.log(secret.createdAt);
console.log(secret.rotatedAt);
\`\`\`

### getSecrets()

\`\`\`javascript
// Get all secrets
const allSecrets = await client.getSecrets();
allSecrets.forEach(secret => {
  console.log(\`\${secret.name}: \${secret.lastUpdated}\`);
});

// Get secrets by tag
const prodSecrets = await client.getSecrets({ tags: ['production'] });
\`\`\`

### setSecret()

\`\`\`javascript
// Create or update secret
await client.setSecret('new_key', 'my_secret_value');

// With metadata
await client.setSecret('new_key', 'my_secret_value', {
  tags: ['production', 'critical'],
  ttl: 2592000 // 30 days
});
\`\`\`

### deleteSecret()

\`\`\`javascript
await client.deleteSecret('old_key');
\`\`\`

### rotateSecret()

\`\`\`javascript
// Rotate a secret
const newSecret = await client.rotateSecret('api_key');

// Set auto-rotation
await client.rotateSecret('api_key', {
  interval: '30d'
});
\`\`\`

## Express.js Integration

\`\`\`javascript
const express = require('express');
const { XtraClient } = require('@xtrasecurity/sdk');

const app = express();
const xtra = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID
});

// Middleware to load secrets
app.use(async (req, res, next) => {
  try {
    req.secrets = await xtra.getSecrets();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to load secrets' });
  }
});

app.get('/api/data', (req, res) => {
  const stripeKey = req.secrets.find(s => s.name === 'stripe_key');
  // Use stripeKey.value
});

app.listen(3000);
\`\`\`

## Next.js Integration

\`\`\`javascript
// lib/xtra.ts
import { XtraClient } from '@xtrasecurity/sdk';

export const xtra = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID
});

// pages/api/route.ts
import { xtra } from '@/lib/xtra';

export default async function handler(req, res) {
  const dbPassword = await xtra.getSecret('db_password');
  // Use dbPassword.value
  res.status(200).json({ success: true });
}
\`\`\`

## Error Handling

\`\`\`javascript
try {
  const secret = await client.getSecret('api_key');
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('Secret does not exist');
  } else if (error.code === 'UNAUTHORIZED') {
    console.log('Invalid API key');
  } else if (error.code === 'TIMEOUT') {
    console.log('Request timed out');
  }
}
\`\`\`

## Caching

\`\`\`javascript
const client = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID,
  cache: {
    enabled: true,
    ttl: 3600 // Cache for 1 hour
  }
});

// First call - fetches from API
const secret1 = await client.getSecret('api_key');

// Second call - returns cached value
const secret2 = await client.getSecret('api_key');

// Force refresh
const secret3 = await client.getSecret('api_key', { cache: false });
\`\`\`
`
  },
  {
    id: '4',
    slug: 'kubernetes-integration',
    title: 'Kubernetes Secrets Integration Guide',
    description: 'Use XtraSecurity as Kubernetes secrets provider. Install External Secrets Operator and sync secrets automatically.',
    keywords: [
      'kubernetes integration',
      'k8s secrets',
      'external secrets operator',
      'kubernetes eso',
      'secrets in kubernetes'
    ],
    category: 'Integrations',
    order: 4,
    content: `# Kubernetes Secrets Integration Guide

Integrate XtraSecurity with Kubernetes using External Secrets Operator.

## Prerequisites

- Kubernetes 1.16+
- Helm 3+
- kubectl configured

## Step 1: Install External Secrets Operator

\`\`\`bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm install external-secrets \\
  external-secrets/external-secrets \\
  -n external-secrets-system \\
  --create-namespace
\`\`\`

## Step 2: Create SecretStore

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: xtrasecurity-store
spec:
  provider:
    xtrasecurity:
      projectId: proj_xxx
      auth:
        secretRef:
          apiKey:
            name: xtra-api-key
            key: apiKey
\`\`\`

## Step 3: Create API Key Secret

\`\`\`bash
kubectl create secret generic xtra-api-key \\
  --from-literal=apiKey=sk_live_xxx
\`\`\`

## Step 4: Create ExternalSecret

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 3600s
  secretStoreRef:
    name: xtrasecurity-store
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database_url
    remoteRef:
      key: db_url
  - secretKey: api_key
    remoteRef:
      key: stripe_key
\`\`\`

## Step 5: Use Secrets in Pods

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
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: database_url
    - name: STRIPE_KEY
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: api_key
\`\`\`

## Auto-Rotation

Enable automatic secret rotation:

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 3600s  # Sync every hour
  secretStoreRef:
    name: xtrasecurity-store
    kind: SecretStore
  target:
    name: app-secrets
\`\`\`

## Troubleshooting

### Check ExternalSecret Status

\`\`\`bash
kubectl describe externalsecret app-secrets

kubectl get externalsecret app-secrets -o json | jq '.status'
\`\`\`

### View Operator Logs

\`\`\`bash
kubectl logs -n external-secrets-system deployment/external-secrets
\`\`\`

### Debug API Key

\`\`\`bash
kubectl get secret xtra-api-key -o jsonpath='{.data.apiKey}' | base64 -d
\`\`\`

## Security Best Practices

1. Use RBAC to limit access to secrets
2. Enable encryption at rest in etcd
3. Rotate API keys regularly
4. Use separate API keys per environment
5. Monitor secret access with audit logs

## Complete Example

\`\`\`yaml
---
# Create namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
# Create API key secret
apiVersion: v1
kind: Secret
metadata:
  name: xtra-api-key
  namespace: production
type: Opaque
stringData:
  apiKey: sk_live_prod_xxx

---
# Create SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: xtrasecurity
  namespace: production
spec:
  provider:
    xtrasecurity:
      projectId: proj_prod
      auth:
        secretRef:
          apiKey:
            name: xtra-api-key
            key: apiKey

---
# Create ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-config
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: xtrasecurity
    kind: SecretStore
  target:
    name: app-config
    creationPolicy: Owner
  data:
  - secretKey: db_password
    remoteRef:
      key: postgres_password
  - secretKey: api_key
    remoteRef:
      key: stripe_api_key

---
# Deploy app
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 2
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        envFrom:
        - secretRef:
            name: app-config
\`\`\`
`
  },
  {
    id: '5',
    slug: 'github-actions-secrets',
    title: 'GitHub Actions Secrets Integration',
    description: 'Use XtraSecurity secrets in GitHub Actions workflows. Fetch secrets securely without storing them in GitHub.',
    keywords: [
      'github actions secrets',
      'github workflows',
      'ci cd secrets',
      'github actions integration',
      'secrets in workflows'
    ],
    category: 'Integrations',
    order: 5,
    content: `# GitHub Actions Secrets Integration

Use XtraSecurity to manage secrets in GitHub Actions workflows without storing them in GitHub.

## Method 1: Using Environment Variables

### Step 1: Create GitHub Repository Secret

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: \`XTRA_API_KEY\`, Value: \`sk_live_xxx\`

### Step 2: Use in Workflow

\`\`\`yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Fetch secrets from XtraSecurity
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
          XTRA_PROJECT_ID: proj_xxx
        run: |
          npm install @xtrasecurity/cli -g
          xtra get database_url > \$GITHUB_ENV
          xtra get api_key >> \$GITHUB_ENV
      
      - name: Deploy
        env:
          DATABASE_URL: \${{ env.DATABASE_URL }}
          API_KEY: \${{ env.API_KEY }}
        run: npm run deploy
\`\`\`

## Method 2: Using Custom Action

Create a custom action to fetch secrets:

\`.github/actions/fetch-secrets/action.yml\`:

\`\`\`yaml
name: 'Fetch XtraSecurity Secrets'
description: 'Fetch secrets from XtraSecurity'
inputs:
  api-key:
    description: 'XtraSecurity API key'
    required: true
  project-id:
    description: 'XtraSecurity project ID'
    required: true
  secrets:
    description: 'Comma-separated secret names'
    required: true
runs:
  using: 'node16'
  main: 'index.js'
\`\`\`

\`.github/actions/fetch-secrets/index.js\`:

\`\`\`javascript
const core = require('@actions/core');
const XtraClient = require('@xtrasecurity/sdk');

async function run() {
  try {
    const apiKey = core.getInput('api-key');
    const projectId = core.getInput('project-id');
    const secretNames = core.getInput('secrets').split(',');
    
    const client = new XtraClient({ apiKey, projectId });
    
    for (const name of secretNames) {
      const secret = await client.getSecret(name);
      core.setSecret(secret.value);
      core.exportVariable(name.toUpperCase(), secret.value);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
\`\`\`

Use the action:

\`\`\`yaml
- uses: ./.github/actions/fetch-secrets
  with:
    api-key: \${{ secrets.XTRA_API_KEY }}
    project-id: proj_xxx
    secrets: database_url, api_key, stripe_key
\`\`\`

## Method 3: Using aws-actions/configure-aws-credentials

For AWS deployments:

\`\`\`yaml
- name: Fetch from XtraSecurity
  run: |
    # Fetch secrets and set as env vars
    docker run \\
      -e XTRA_API_KEY=\${{ secrets.XTRA_API_KEY }} \\
      @xtrasecurity/cli \\
      xtra export --format env > .env
\`\`\`

## Complete Deployment Example

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Get secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
        run: |
          npm install -g @xtrasecurity/cli
          xtra auth --api-key \$XTRA_API_KEY
          xtra export --format env > .env.test
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Get secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
        run: |
          npm install -g @xtrasecurity/cli
          xtra auth --api-key \$XTRA_API_KEY
          echo "DATABASE_URL=\$(xtra get database_url)" >> \$GITHUB_ENV
          echo "API_KEY=\$(xtra get api_key)" >> \$GITHUB_ENV
      
      - name: Deploy to production
        env:
          DATABASE_URL: \${{ env.DATABASE_URL }}
          API_KEY: \${{ env.API_KEY }}
        run: npm run deploy
\`\`\`

## Security Best Practices

1. **Never log secrets**
   \`\`\`yaml
   - run: |
       # ❌ BAD - logs the secret
       echo "Password: \${{ env.PASSWORD }}"
       
       # ✅ GOOD - masks output
       echo "::add-mask::\${{ env.PASSWORD }}"
   \`\`\`

2. **Use branch protection**
   - Require approval for production deployments
   - Restrict secrets to main branch only

3. **Rotate credentials**
   - Rotate XTRA_API_KEY every 30 days
   - Use different keys per environment

4. **Limit permissions**
   - Use least-privilege API keys
   - Restrict to specific secrets

## Troubleshooting

### Secrets not found

\`\`\`yaml
- name: Debug
  run: |
    xtra login --api-key \${{ secrets.XTRA_API_KEY }}
    xtra list  # Verify secrets exist
\`\`\`

### rate limit

\`\`\`yaml
# Add retry logic
- name: Fetch secrets
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: xtra export --format env > .env
\`\`\`
`
  }
];

export const docCategories: DocCategory[] = [
  {
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Start here. Quick start guide and CLI reference.',
    pages: docPages.filter(p => p.category === 'Getting Started')
  },
  {
    name: 'SDKs',
    slug: 'sdks',
    description: 'Integrate XtraSecurity with your applications.',
    pages: docPages.filter(p => p.category === 'SDKs')
  },
  {
    name: 'Integrations',
    slug: 'integrations',
    description: 'Connect XtraSecurity with services like Kubernetes, GitHub, and Docker.',
    pages: docPages.filter(p => p.category === 'Integrations')
  }
];

export function getDocPage(slug: string): DocPage | undefined {
  return docPages.find(page => page.slug === slug);
}

export function getAllDocPages(): DocPage[] {
  return docPages.sort((a, b) => a.order - b.order);
}

export function getDocPagesByCategory(category: string): DocPage[] {
  return docPages
    .filter(page => page.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getDocCategories(): DocCategory[] {
  return docCategories;
}
