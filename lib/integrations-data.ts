import { IntegrationPage } from '@/types/integrations';

export const integrationPages: IntegrationPage[] = [
  {
    id: '1',
    slug: 'github-secrets',
    title: 'XtraSecurity with GitHub Secrets | Secure CI/CD Integration',
    description: 'Complete guide to integrating XtraSecurity with GitHub Actions. Secure your CI/CD pipeline by fetching secrets from XtraSecurity in GitHub workflows.',
    keywords: [
      'github secrets',
      'github actions secrets',
      'github integration',
      'ci cd secrets github',
      'secure github workflows'
    ],
    service: 'GitHub',
    icon: '🐙',
    difficulty: 'Easy',
    setupTime: '10 minutes',
    content: `# XtraSecurity + GitHub Secrets Integration

Securely manage secrets in GitHub Actions workflows using XtraSecurity.

## Quick Setup (5 Minutes)

### Step 1: Create GitHub Repository Secret

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: \`XTRA_API_KEY\`
4. Value: Copy from XtraSecurity API Keys page
5. Click "Add secret"

### Step 2: Add to Workflow

\`\`\`yaml
name: Deploy

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Fetch secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
        run: |
          npm install -g @xtrasecurity/cli
          xtra get database_url > \$GITHUB_ENV
          xtra get api_key >> \$GITHUB_ENV
      
      - name: Deploy
        run: npm run deploy
\`\`\`

## Full Example

\`\`\`yaml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Get secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
        run: |
          npm install -g @xtrasecurity/cli
          xtra get test_db_url > .env.test
          xtra get stripe_test_key >> .env.test
      
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Get production secrets
        env:
          XTRA_API_KEY: \${{ secrets.XTRA_API_KEY }}
        run: |
          npm install -g @xtrasecurity/cli
          export DATABASE_URL=\$(xtra get prod_database_url)
          export API_KEY=\$(xtra get stripe_live_key)
      
      - name: Deploy to production
        run: npm run deploy:prod
\`\`\`

## Best Practices

1. **Use separate API keys** per environment
2. **Rotate keys regularly** every 30 days
3. **Never commit secrets** to repo
4. **Use branch protection** for main deployment
5. **Enable audit logging** to track secret access
`
  },
  {
    id: '2',
    slug: 'docker-secrets',
    title: 'XtraSecurity with Docker | Container Secrets Management',
    description: 'Integrate XtraSecurity with Docker and Docker Compose. Securely manage container secrets without hardcoding in Dockerfile.',
    keywords: [
      'docker secrets',
      'docker integration',
      'docker compose secrets',
      'container secrets',
      'docker environment variables'
    ],
    service: 'Docker',
    icon: '🐳',
    difficulty: 'Medium',
    setupTime: '15 minutes',
    content: `# XtraSecurity + Docker Integration

Manage secrets in Docker containers using XtraSecurity.

## Quick Start

### Using Docker Run

\`\`\`bash
# Fetch secrets first
xtra get database_url > /tmp/.env
xtra get api_key >> /tmp/.env

# Run container with secrets
docker run \\
  --env-file /tmp/.env \\
  -e XTRA_API_KEY="sk_live_xxx" \\
  myapp:latest
\`\`\`

### Docker Compose

\`\`\`yaml
version: '3.9'

services:
  app:
    image: myapp:latest
    environment:
      XTRA_API_KEY: \${XTRA_API_KEY}
      DATABASE_URL: \${DATABASE_URL}
      API_KEY: \${API_KEY}
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
\`\`\`

### .env File Management

\`\`\`bash
# Fetch all secrets into .env
xtra export --format env > .env.production

# Don't commit .env files
echo ".env.production" >> .gitignore
\`\`\`

## Advanced: Custom Entrypoint

Create \`entrypoint.sh\`:

\`\`\`bash
#!/bin/bash
set -e

# Fetch secrets on startup
xtra get database_url > /run/secrets/db_url
xtra get api_key > /run/secrets/api_key

# Export as environment variables
export DATABASE_URL=\$(cat /run/secrets/db_url)
export API_KEY=\$(cat /run/secrets/api_key)

# Start application
exec \"\$@\"
\`\`\`

Update Dockerfile:

\`\`\`dockerfile
FROM node:18

WORKDIR /app
RUN npm install -g @xtrasecurity/cli

COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

COPY . .
RUN npm install

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
\`\`\`

## Security Best Practices

1. Never hardcode secrets in Dockerfile
2. Use ARG for build-time values only
3. Exclude .env from Docker builds
4. Rotate API keys monthly
5. Use read-only mounts for secrets
`
  },
  {
    id: '3',
    slug: 'kubernetes-secrets-integration',
    title: 'XtraSecurity with Kubernetes | K8s External Secrets Operator',
    description: 'Use XtraSecurity as a secrets provider in Kubernetes. External Secrets Operator integration for automatic secret syncing.',
    keywords: [
      'kubernetes secrets',
      'external secrets operator',
      'k8s integration',
      'kubernetes external secrets',
      'eso xtrasecurity'
    ],
    service: 'Kubernetes',
    icon: '☸️',
    difficulty: 'Advanced',
    setupTime: '30 minutes',
    content: `# XtraSecurity + Kubernetes Integration

Use XtraSecurity as a secrets provider in Kubernetes clusters.

## Installation

### Install External Secrets Operator

\`\`\`bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm install external-secrets \\
  external-secrets/external-secrets \\
  -n external-secrets-system \\
  --create-namespace
\`\`\`

### Create XtraSecurity API Key Secret

\`\`\`bash
kubectl create secret generic xtra-api-key \\
  -n production \\
  --from-literal=apiKey=sk_live_xxx
\`\`\`

### Create SecretStore

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: xtrasecurity
  namespace: production
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

### Create ExternalSecret

\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  refreshInterval: 3600s
  secretStoreRef:
    name: xtrasecurity
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database_url
    remoteRef:
      key: db_url
  - secretKey: stripe_key
    remoteRef:
      key: stripe_api_key
\`\`\`

### Use in Pods

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        envFrom:
        - secretRef:
            name: app-secrets
\`\`\`

## Complete Example

\`\`\`yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
apiVersion: v1
kind: Secret
metadata:
  name: xtra-api-key
  namespace: production
stringData:
  apiKey: sk_live_prod_xxx

---
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
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-config
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: xtrasecurity
  target:
    name: app-config
  data:
  - secretKey: databaseUrl
    remoteRef:
      key: postgres_password
  - secretKey: stripeKey
    remoteRef:
      key: stripe_live_key
\`\`\`

## Troubleshooting

\`\`\`bash
# Check ExternalSecret status
kubectl describe externalsecret app-secrets -n production

# View operator logs
kubectl logs -n external-secrets-system deployment/external-secrets

# Verify secret was created
kubectl get secret app-secrets -n production -o yaml
\`\`\`
`
  },
  {
    id: '4',
    slug: 'jenkins-pipeline-secrets',
    title: 'XtraSecurity with Jenkins | CI/CD Pipeline Integration',
    description: 'Integrate XtraSecurity secrets with Jenkins pipelines. Secure your Jenkins CI/CD with declarative and scripted pipelines.',
    keywords: [
      'jenkins secrets',
      'jenkins integration',
      'jenkins pipeline secrets',
      'jenkins ci cd',
      'declarative pipeline'
    ],
    service: 'Jenkins',
    icon: '🔘',
    difficulty: 'Medium',
    setupTime: '20 minutes',
    content: `# XtraSecurity + Jenkins Integration

Secure your Jenkins pipelines with XtraSecurity.

## Install Jenkins Credentials Plugin

1. Manage Jenkins → Manage Plugins
2. Search "Credentials plugin"
3. Install and restart Jenkins

## Create Jenkins Credentials

1. Manage Jenkins → Manage Credentials
2. Click "Add Credentials"
3. Type: "Username with password"
4. Username: \`xtra-api-key\`
5. Password: \`sk_live_xxx\`
6. ID: \`xtrasecurity-api-key\`

## Declarative Pipeline

\`\`\`groovy
pipeline {
  agent any
  
  environment {
    XTRA_KEY = credentials('xtrasecurity-api-key')
  }
  
  stages {
    stage('Get Secrets') {
      steps {
        sh '''
          npm install -g @xtrasecurity/cli
          xtra auth --username \$XTRA_KEY_USR --password \$XTRA_KEY_PSW
          export DATABASE_URL=\$(xtra get database_url)
          export API_KEY=\$(xtra get api_key)
          echo "Secrets loaded"
        '''
      }
    }
    
    stage('Deploy') {
      steps {
        sh 'npm run deploy'
      }
    }
  }
}
\`\`\`

## Scripted Pipeline

\`\`\`groovy
node {
  withCredentials([usernamePassword(credentialsId: 'xtrasecurity-api-key', 
                                     usernameVariable: 'XTRA_USER', 
                                     passwordVariable: 'XTRA_PASS')]) {
    stage('Build') {
      sh '''
        npm install -g @xtrasecurity/cli
        xtra auth --username \$XTRA_USER --password \$XTRA_PASS
        export DB_URL=\$(xtra get db_url)
        npm run build
      '''
    }
    
    stage('Deploy') {
      sh 'npm run deploy'
    }
  }
}
\`\`\`

## Using Shared Library

Create \`vars/xtraSecrets.groovy\`:

\`\`\`groovy
def call(Map config, Closure body) {
  withCredentials([usernamePassword(credentialsId: 'xtrasecurity-api-key',
                                     usernameVariable: 'XTRA_USER',
                                     passwordVariable: 'XTRA_PASS')]) {
    sh '''
      npm install -g @xtrasecurity/cli
      xtra auth --username \$XTRA_USER --password \$XTRA_PASS
      xtra export --format env > .env.\${BUILD_NUMBER}
    '''
    body()
  }
}
\`\`\`

Use in pipeline:

\`\`\`groovy
xtraSecrets {
  stage('Deploy') {
    sh 'npm run deploy'
  }
}
\`\`\`
`
  },
  {
    id: '5',
    slug: 'aws-lambda-secrets',
    title: 'XtraSecurity with AWS Lambda | Serverless Secrets Management',
    description: 'Fetch XtraSecurity secrets in AWS Lambda functions. Integration for serverless applications running on AWS.',
    keywords: [
      'lambda secrets',
      'aws lambda',
      'serverless secrets',
      'aws integration',
      'lambda environment variables'
    ],
    service: 'AWS Lambda',
    icon: '⚡',
    difficulty: 'Medium',
    setupTime: '15 minutes',
    content: `# XtraSecurity + AWS Lambda Integration

Manage secrets in AWS Lambda functions using XtraSecurity.

## Lambda Layer Setup

### Create Lambda Layer

\`\`\`bash
# Create layer directory
mkdir -p layer/nodejs
cd layer/nodejs

# Install SDK
npm install @xtrasecurity/sdk

# Package layer
cd ..
zip -r xtrasecurity-layer.zip nodejs/
\`\`\`

### Upload Layer to AWS

\`\`\`bash
aws lambda publish-layer-version \\
  --layer-name xtrasecurity-sdk \\
  --zip-file fileb://xtrasecurity-layer.zip \\
  --compatible-runtimes nodejs18.x
\`\`\`

## Lambda Function Setup

### Environment Variables

\`\`\`yaml
Environment:
  Variables:
    XTRA_API_KEY: sk_live_xxx
    XTRA_PROJECT_ID: proj_xxx
\`\`\`

### Add Layer

1. AWS Lambda → Function → Layers
2. Click "Add a layer"
3. Select "xtrasecurity-sdk"
4. Click "Add"

## Code Example

\`\`\`javascript
const { XtraClient } = require('@xtrasecurity/sdk');

const xtra = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID,
  cache: { enabled: true, ttl: 3600 }
});

exports.handler = async (event) => {
  try {
    const dbPassword = await xtra.getSecret('db_password');
    const apiKey = await xtra.getSecret('stripe_key');
    
    // Use secrets
    const db = await connectDatabase(dbPassword.value);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
\`\`\`

## With VPC

\`\`\`javascript
// For RDS/database access in VPC
const { XtraClient } = require('@xtrasecurity/sdk');

const xtra = new XtraClient({
  apiKey: process.env.XTRA_API_KEY,
  projectId: process.env.XTRA_PROJECT_ID
});

exports.handler = async (event) => {
  // Get RDS password
  const rdsPassword = await xtra.getSecret('rds_password');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: rdsPassword.value,
    database: process.env.DB_NAME
  });
  
  // Query database
  const results = await connection.query('SELECT * FROM users');
  
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
};
\`\`\`

## Best Practices

1. Use Lambda layers for shared code
2. Enable caching to reduce API calls
3. Set IAM role with least privilege
4. Monitor Lambda logs for secret access
5. Rotate secrets every 30 days
`
  }
];

export function getIntegrationPage(slug: string): IntegrationPage | undefined {
  return integrationPages.find(page => page.slug === slug);
}

export function getAllIntegrations(): IntegrationPage[] {
  return integrationPages;
}

export function getIntegrationsByService(service: string): IntegrationPage[] {
  return integrationPages.filter(page => page.service === service);
}
