# ⚙️ BACKEND API, DB & SECURITY ENGINE TASK LIST — NISHANT

**Assigned To**: Nishant  
**Scope**: Next.js API Routes (`/app/api`), Prisma ORM & Database Schema (`/prisma/schema.prisma`), MongoDB, ABAC/RBAC Policy Engine (`/lib/authz`), Encryption Utility (`/lib/encryption.ts`), JIT Engine, Audit Logging (`/lib/audit.ts`), Webhook Dispatcher, BullMQ Queues (`/lib/queue`), 20+ Integration Providers (`/lib/integrations`).

---

> ⚠️ **CRITICAL CROSS-PLATFORM IMPACT NOTICE**
> Any modification to API response format or endpoints directly affects **Atharva's CLI & SDKs** and **Priti's Web UI**.
> You MUST preserve backward compatibility. Do not remove existing response keys or break API contract schemas (`/api/openapi.json`).

---

## 📌 TASK SUMMARY (35 TASKS)

### 🟢 Phase 1: Critical Security, Boot Fixes & DB Optimization
- [x] **N01: Fix Top-Level `ENCRYPTION_KEY` Boot Crash**
  - **Details**: Refactor `lib/encription.ts` to access `process.env.ENCRYPTION_KEY` lazily inside `encrypt()` and `decrypt()` functions rather than top-level module load. Create a alias export `lib/encryption.ts`.
- [x] **N02: Safe NextAuth OAuth Provider Initialization**
  - **Details**: In `app/api/auth/[...nextauth]/route.ts`, conditionally add `GoogleProvider` and `GithubProvider` only when `process.env.GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID` are present to avoid startup crashes.
- [x] **N03: Robust Redis Queue URL Parsing**
  - **Details**: Wrap `new URL(redisUrl)` parsing in `lib/queue/config.ts` with try-catch fallback handling to handle non-standard Redis URLs gracefully.
- [x] **N04: Clean Up Prisma Build Output & Remove Compiled JS**
  - **Details**: Remove orphan compiled file `lib/db.js` from repository. Fix `prisma/schema.prisma` output path to prevent recursive `lib/generated/lib/generated` nestings.
- [x] **N05: Redis-Based Rate Limiting for Middleware**
  - **Details**: Update `lib/api-middleware.ts` to execute distributed rate limiting via Redis (`ioredis` / `@upstash/ratelimit`) instead of in-memory JS Maps.
- [x] **N06: Unified ABAC/RBAC Policy Engine Refactoring**
  - **Details**: Complete `PolicyEngine.authorize()` implementation in `lib/authz/policy-engine.ts` supporting role permissions, Service Accounts, and JIT elevation triggers.
- [x] **N07: JIT Access Request & Grant Engine**
  - **Details**: Implement backend API endpoints under `/app/api/jit` and `/app/api/access-requests` to create, approve, reject, and auto-expire temporary secret grants.

---

### 🟡 Phase 2: Audit Engine, Integrations & Secret Engine
- [x] **N08: Immutable Audit Trail with Cryptographic Hashes**
  - **Details**: Update `lib/audit.ts` to calculate SHA-256 hash chains (`currentHash = SHA256(timestamp + action + entityId + userId + previousHash)`). Implement verification API endpoint `/api/audit/verify`.
- [x] **N09: Base Integration Provider Interface (`lib/integrations/providers/base.ts`)**
  - **Details**: Create abstract `BaseProvider` class with standardized interface (`connect()`, `sync()`, `disconnect()`, `testConnection()`).
- [x] **N10: Vercel Integration Provider (`lib/integrations/providers/vercel.ts`)**
  - **Details**: Implement bidirectional Vercel environment variable sync logic with project environment mapping.
- [x] **N11: AWS Secrets Manager Provider (`lib/integrations/providers/aws.ts`)**
  - **Details**: Implement AWS SDK integration pushing secret key-values to AWS Secrets Manager ARNs.
- [x] **N12: Netlify Integration Provider (`lib/integrations/providers/netlify.ts`)**
  - **Details**: Refactor inline logic from `app/api/integrations/netlify/sync/route.ts` into a dedicated provider class.
- [x] **N13: Supabase Integration Provider (`lib/integrations/providers/supabase.ts`)**
  - **Details**: Implement Supabase Vault secrets sync engine.
- [x] **N14: HashiCorp Vault Integration Provider (`lib/integrations/providers/vault.ts`)**
  - **Details**: Implement Vault KV v2 engine sync provider.
- [x] **N15: Slack & Discord Webhook Notification Engine**
  - **Details**: Refactor `lib/notifications/dispatch.ts` to execute async background retries for failed webhook deliveries.
- [x] **N16: Secret Versioning & Rollback API Endpoint**
  - **Details**: Create API route `POST /api/projects/[id]/envs/[env]/secrets/[key]/rollback` to restore past version state in MongoDB.

---

### 🔵 Phase 3: Service Accounts, Automation & Queue Workers
- [x] **N17: Automated Secret Rotation Background Engine**
  - **Details**: Implement BullMQ background queue consumer in `lib/queue/worker-logic.ts` executing automated scheduled rotations (daily, weekly, monthly).
- [x] **N18: Service Account Scoping & API Key Management**
  - **Details**: Create API endpoints `/api/projects/[id]/service-accounts` for generating non-human identity tokens scoped to specific project environments.
- [x] **N19: Razorpay Payment & Webhook Verification Handler**
  - **Details**: Implement `/api/payment/verify` verifying Razorpay payment signatures and updating user subscription status in Prisma DB.
- [x] **N20: OpenAPI 3.0 Specification Endpoint Generator**
  - **Details**: Maintain dynamic OpenAPI schema `/app/api/openapi.json` ensuring all CLI & SDK endpoints are strictly typed and documented.
  - ⚠️ *Cross-Platform Impact*: **Atharva's SDK Generator** consumes this file to produce Node, Python, and Go SDKs.
- [x] **N21: IP Allowlist & CIDR Subnet Enforcement Middleware**
  - **Details**: Implement CIDR block parsing in `lib/middleware/ip-check.ts` to block unauthorized client requests before reaching API handlers.
- [x] **N22: Password & Credential Complexity Validator**
  - **Details**: Create reusable validation utility enforcing min length, numbers, special characters, and entropy checks.
- [x] **N23: Time-Limited Secret Share Link API**
  - **Details**: Implement `/api/secrets/share` generating single-use or time-bound secret access tokens.

---

### 🟣 Phase 4: Reliability, Security Audit & Backend Testing
- [x] **N24: System Health & Diagnostics API Endpoint (`/api/health`)**
  - **Details**: Create health check API testing database connection, Redis ping, queue latency, and encryption key validity.
- [x] **N25: Webhook HMAC Payload Signatures**
  - **Details**: Sign all outgoing webhook payloads with `X-Xtra-Signature` using HMAC-SHA256 for integrity verification.
- [x] **N26: Global User & Workspace Resource Quota Guard**
  - **Details**: Implement DB middleware checking tier limits (Free: 3 Workspaces, 5 Projects) before creation operations.
- [x] **N27: High-Performance Bulk Secret Import/Export Endpoint**
  - **Details**: Build `/api/projects/[id]/envs/[env]/secrets/bulk` to handle batch insert/update of up to 500 secrets atomically.
- [x] **N28: Password Reset & Email Verification Token Engine**
  - **Details**: Create `/api/auth/forgot-password` and `/api/auth/reset-password` API endpoints using `nodemailer` transport.
- [x] **N29: TOTP MFA Secret Encryption & Storage**
  - **Details**: Encrypt MFA TOTP secrets using AES-256-GCM before writing to the MongoDB `users` collection.
- [x] **N30: Database Migration & Index Optimization**
  - **Details**: Optimize compound index definitions in `schema.prisma` (`[userId, projectId]`, `[secretId, provider]`) to minimize query latency.
- [x] **N31: Anomaly Detection & Security Event Recorder**
  - **Details**: Log rate-limit bursts, unusual geographic access, and authentication failures into `SecurityEvent` table.
- [x] **N32: Access Review & Compliance Data Generator API**
  - **Details**: Endpoint `/api/compliance/report` aggregating project permissions, 2FA enforcement status, and rotation logs for audit export.
- [x] **N33: Service Account Glob Path Matching**
  - **Details**: Support pattern matching (e.g. `API_*`, `DATABASE_*`) for service account secret permissions.
- [x] **N34: Soft-Delete Data Recovery Pipeline**
  - **Details**: Add `deletedAt` timestamps to `Project` and `Secret` schemas with 30-day retention before permanent purge.
- [x] **N35: Comprehensive Backend Jest Test Suite**
  - **Details**: Write unit & integration test coverage for encryption, authentication, policy engine, and API routes.
