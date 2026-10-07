const fs = require('fs');
const path = require('path');

function fileExists(relPath) {
  return fs.existsSync(path.resolve(process.cwd(), relPath));
}

function checkContent(relPath, pattern) {
  if (!fileExists(relPath)) return false;
  const content = fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
  if (typeof pattern === 'string') return content.includes(pattern);
  return pattern.test(content);
}

const tasks = [
  {
    id: 'N01',
    name: 'Fix Top-Level ENCRYPTION_KEY Boot Crash & alias lib/encryption.ts',
    done: fileExists('lib/encryption.ts') && checkContent('lib/encription.ts', 'getEncryptionKey')
  },
  {
    id: 'N02',
    name: 'Safe NextAuth OAuth Provider Initialization',
    done: checkContent('app/api/auth/[...nextauth]/route.ts', 'GOOGLE_CLIENT_ID')
  },
  {
    id: 'N03',
    name: 'Robust Redis Queue URL Parsing',
    done: fileExists('lib/queue/config.ts') && checkContent('lib/queue/config.ts', 'parseRedisConnection')
  },
  {
    id: 'N04',
    name: 'Clean Up Prisma Build Output & Remove Compiled JS (lib/db.js)',
    done: !fileExists('lib/db.js')
  },
  {
    id: 'N05',
    name: 'Redis-Based Rate Limiting for Middleware',
    done: fileExists('lib/rate-limit.ts') && checkContent('lib/rate-limit.ts', 'ioredis')
  },
  {
    id: 'N06',
    name: 'Unified ABAC/RBAC Policy Engine Refactoring',
    done: fileExists('lib/authz/policy-engine.ts')
  },
  {
    id: 'N07',
    name: 'JIT Access Request & Grant Engine',
    done: fileExists('app/api/jit') || fileExists('app/api/access-requests')
  },
  {
    id: 'N08',
    name: 'Immutable Audit Trail with Cryptographic Hashes',
    done: fileExists('app/api/audit/verify/route.ts') || checkContent('lib/audit.ts', 'sha256')
  },
  {
    id: 'N09',
    name: 'Base Integration Provider Interface',
    done: fileExists('lib/integrations/providers/base.ts')
  },
  {
    id: 'N10',
    name: 'Vercel Integration Provider',
    done: fileExists('lib/integrations/providers/vercel.ts')
  },
  {
    id: 'N11',
    name: 'AWS Secrets Manager Provider',
    done: fileExists('lib/integrations/providers/aws.ts')
  },
  {
    id: 'N12',
    name: 'Netlify Integration Provider',
    done: fileExists('lib/integrations/providers/netlify.ts')
  },
  {
    id: 'N13',
    name: 'Supabase Integration Provider',
    done: fileExists('lib/integrations/providers/supabase.ts')
  },
  {
    id: 'N14',
    name: 'HashiCorp Vault Integration Provider',
    done: fileExists('lib/integrations/providers/vault.ts')
  },
  {
    id: 'N15',
    name: 'Slack & Discord Webhook Notification Engine',
    done: fileExists('lib/notifications/dispatch.ts') || fileExists('lib/notifications/engine.ts')
  },
  {
    id: 'N16',
    name: 'Secret Versioning & Rollback API Endpoint',
    done: fileExists('app/api/secret/rollback/route.ts') || fileExists('app/api/projects/[projectId]/envs/[env]/secrets/[key]/history/route.ts')
  },
  {
    id: 'N17',
    name: 'Automated Secret Rotation Background Engine',
    done: fileExists('lib/rotation/automation.ts') && fileExists('lib/rotation-service.ts')
  },
  {
    id: 'N18',
    name: 'Service Account Scoping & API Key Management',
    done: fileExists('app/api/projects/[projectId]/service-accounts/route.ts')
  },
  {
    id: 'N19',
    name: 'Razorpay Payment & Webhook Verification Handler',
    done: fileExists('app/api/payment/verify/route.ts') || fileExists('app/api/payment/create-order/route.ts')
  },
  {
    id: 'N20',
    name: 'OpenAPI 3.0 Specification Endpoint Generator',
    done: fileExists('app/api/openapi.json') && fileExists('app/api/docs/route.ts')
  },
  {
    id: 'N21',
    name: 'IP Allowlist & CIDR Subnet Enforcement Middleware',
    done: fileExists('lib/middleware/ip-check.ts')
  },
  {
    id: 'N22',
    name: 'Password & Credential Complexity Validator',
    done: checkContent('lib/validators.ts', 'validatePasswordComplexity')
  },
  {
    id: 'N23',
    name: 'Time-Limited Secret Share Link API',
    done: fileExists('app/api/secret/share/route.ts')
  },
  {
    id: 'N24',
    name: 'System Health & Diagnostics API Endpoint (/api/health)',
    done: fileExists('app/api/health/route.ts') && checkContent('app/api/health/route.ts', 'durationMs')
  },
  {
    id: 'N25',
    name: 'Webhook HMAC Payload Signatures',
    done: checkContent('lib/webhook-dispatcher.ts', 'signWebhookPayload')
  },
  {
    id: 'N26',
    name: 'Global User & Workspace Resource Quota Guard',
    done: fileExists('lib/middleware/quota.ts')
  },
  {
    id: 'N27',
    name: 'High-Performance Bulk Secret Import/Export Endpoint',
    done: fileExists('app/api/secret/bulk/route.ts') || fileExists('app/api/v2/secret/bulk/route.ts')
  },
  {
    id: 'N28',
    name: 'Password Reset & Email Verification Token Engine',
    done: fileExists('app/api/auth/forgot-password/route.ts') && fileExists('app/api/auth/reset-password/route.ts')
  },
  {
    id: 'N29',
    name: 'TOTP MFA Secret Encryption & Storage',
    done: checkContent('app/api/mfa/setup/route.ts', 'encrypt') && checkContent('app/api/mfa/verify/route.ts', 'decrypt')
  },
  {
    id: 'N30',
    name: 'Database Migration & Index Optimization',
    done: checkContent('prisma/schema.prisma', '@@index([userId, workspaceId])')
  },
  {
    id: 'N31',
    name: 'Anomaly Detection & Security Event Recorder',
    done: fileExists('lib/security-logger.ts') && checkContent('lib/security-logger.ts', 'SecurityEvent')
  },
  {
    id: 'N32',
    name: 'Access Review & Compliance Data Generator API',
    done: fileExists('app/api/compliance/report/route.ts')
  },
  {
    id: 'N33',
    name: 'Service Account Glob Path Matching',
    done: checkContent('lib/authz/policy-engine.ts', 'matchesPattern')
  },
  {
    id: 'N34',
    name: 'Soft-Delete Data Recovery Pipeline',
    done: checkContent('prisma/schema.prisma', 'deletedAt')
  },
  {
    id: 'N35',
    name: 'Comprehensive Backend Jest Test Suite',
    done: fileExists('tests/v2-e2ee-api.test.ts') && fileExists('tests/v2-e2ee-crypto.test.ts')
  }
];

console.log('Results:');
let passed = 0;
tasks.forEach(t => {
  if (t.done) passed++;
  console.log(`${t.done ? '✅' : '❌'} ${t.id}: ${t.name}`);
});
console.log(`\nScore: ${passed}/${tasks.length} tasks completed (${Math.round(passed / tasks.length * 100)}%)`);
