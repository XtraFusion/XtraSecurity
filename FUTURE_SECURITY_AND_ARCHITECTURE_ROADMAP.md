# 🔐 XtraSecurity: Future Security & Architecture Roadmap (v2.0 Refined)

This document outlines the technical specifications and execution strategy to transform **XtraSecurity** into a zero-knowledge, enterprise-grade secrets management platform while maintaining **100% backward compatibility** with existing `/api/` endpoints, CLI tools, and SDKs.

---

## 📌 Executive Summary & Architectural Vision

To eliminate server-side vulnerabilities, static CI credentials, and database bottlenecks without breaking existing client integrations, XtraSecurity transitions through four non-breaking architectural phases:

1. **Phase 1: Redis Caching, Distributed Rate Limiting & Pub/Sub Event Bus**  
   Establish sub-5ms policy check performance, Redis-backed rate limiting, and instant multi-node cache invalidation via Redis Pub/Sub.
2. **Phase 2: OIDC Workload Identity Federation (`/api/v2/auth/oidc`)**  
   Eliminate static API keys in CI/CD (GitHub Actions, GitLab, Kubernetes) by exchanging short-lived OIDC JWTs for ephemeral access tokens.
3. **Phase 3: Zero-Knowledge E2EE & Workload Key Wrapping (`/api/v2/secret`)**  
   Shift secret encryption entirely to the client (`xtra-cli`, Web Dashboard, SDKs) using X25519 asymmetric key pairs and AES-256-GCM. Introduce the **Workload Key Envelope Protocol** to seamlessly support zero-knowledge CI/CD secret injection.
4. **Phase 4: OS Keychain Storage & Device Security**  
   Harden local CLI cache storage using OS-native keychains (Windows DPAPI, macOS Keychain, Linux Secret Service).

---

## 🔄 Backward Compatibility & Versioning Strategy

To guarantee that existing production integrations never break:
* **Legacy `/api/...` (v1) Routes:** Continue supporting server-side AES-256-GCM encryption and static API key authentication.
* **New `/api/v2/...` Routes:** Host Zero-Knowledge E2EE payload structures, OIDC exchange workflows, and asymmetric key envelope handshakes.
* **Dual-Mode SDK & CLI:** `xtra-cli` and SDKs automatically detect project capabilities and utilize `v2` zero-knowledge endpoints when enabled, falling back safely to `v1` for legacy projects.

---

## ⚡ Phase 1: Redis Caching, Distributed Rate Limiting & Pub/Sub Event Bus

### Problem Statement
Synchronous Prisma database queries for permissions, rate limits, and audit logs create latency bottlenecks and introduce delays when invalidating revoked access.

### Architectural Solution
* **High-Throughput Policy Caching:** Cache user/project RBAC policies under `policy:<user_id>:<project_id>` with a 5-minute TTL.
* **Instant Cache Invalidation (Pub/Sub):** When an admin revokes access or alters roles, publish an invalidation event to Redis Channel `authz:cache:invalidate`. All active Next.js API instances purge the local/Redis cached policy instantly.
* **Distributed Rate Limiting:** Enforce sliding window rate limits per IP and token using `ioredis`.

```
Client Request ──► Redis Rate Limiter ──► Policy Cache (Hit: <3ms)
                                                │
                                    (Cache Miss └─► DB Query ──► Store in Cache)
                                                ▲
Role Revoked ──► Publish Redis Event ───────────┘ (Purges cache across all nodes)
```

### Implementation Checklist
- [ ] Refactor `lib/redis.ts` to support graceful fallback when Redis is offline.
- [ ] Implement `getCachedPolicy(userId, projectId)` policy wrapper with Pub/Sub subscriber listener in `lib/authz`.
- [ ] Implement Redis sliding-window middleware for API endpoints in `lib/rate-limit.ts`.

---

## 🔑 Phase 2: OIDC Workload Identity Federation (Eliminating Static CI Keys)

### Problem Statement
CI/CD runners (GitHub Actions, GitLab CI, Kubernetes) currently require long-lived static API keys (`XTRA_API_KEY`). If leaked, attackers gain permanent access to production secrets.

### Architectural Solution
Implement OpenID Connect (OIDC) verification. GitHub Actions / Kubernetes issues a short-lived signed JWT. XtraSecurity verifies the JWT against public JWKS endpoints and issues a temporary (5-minute) ephemeral token.

```
┌────────────────┐     1. Get Signed OIDC JWT     ┌────────────────────────┐
│ GitHub Actions │ ─────────────────────────────► │ token.actions.github...│
└────────────────┘                                └────────────────────────┘
        │                                                     │
        │ 2. POST /api/v2/auth/oidc/token                     ▼ 3. Verify JWKS
        └─────────────────────────────────────────► ┌────────────────────────┐
                                                     │ XtraSecurity API       │
                                                     └────────────────────────┘
                                                              │
                                                              ▼ 4. Ephemeral Token (5m)
                                                                 + Workload Key Envelope
```

### Security Hardening Requirements
- **Strict Audience (`aud`) Validation:** Reject tokens unless `aud == "https://api.xtrasecurity.com"`.
- **JTI Replay Protection:** Store single-use `jti` claims in Redis with TTL equal to token expiry to prevent token replay attacks.
- **Clock Skew Allowance:** Enforce strict clock tolerance (<= 60 seconds).
- **Supported Providers:** GitHub Actions, GitLab CI, Kubernetes Service Account Tokens (SATs), and AWS IAM Roles Anywhere.

### Implementation Checklist
- [ ] Create `/app/api/v2/auth/oidc/token/route.ts` endpoint.
- [ ] Implement `jose`-backed JWKS verifier with Redis JTI replay caching in `lib/auth/oidc.ts`.
- [ ] Add OIDC Trust Policy configuration schema in Prisma (`OidcTrustPolicy`).
- [ ] Build GitHub Action `xtrasecurity/inject-secrets-action@v1`.

---

## 🛡️ Phase 3: Zero-Knowledge Client-Side Encryption (E2EE) & Workload Envelope Protocol

### Problem Statement
Server-side secret decryption leaves plaintext accessible in server memory. Moving to pure E2EE introduces a conflict: **How do automated CI/CD workloads fetch secrets if the server doesn't hold the key?**

### Architectural Solution: The Workload Key Envelope Protocol

#### 1. Human-to-Human E2EE (X25519 + AES-256-GCM)
* **User Keypair:** Users generate an **X25519** asymmetric key pair upon signup. Public keys are registered on XtraSecurity; private keys are encrypted locally using the user's master passphrase (with Argon2id / WebCrypto HKDF).
* **Project Key:** Each project has a unique AES-256 Symmetric Key.
* **Envelope Sharing:** When adding User B to Project X, User A encrypts Project X's AES key using User B's Public Key.

#### 2. Workload Key Envelope (Solving the CI/CD E2EE Conflict)
* When an admin links a CI/CD environment (e.g. GitHub Repo `org/app`), the admin's client generates a **Workload Key Envelope**: the Project AES Key encrypted for that specific workload's registered public key (or server-isolated vault key).
* When CI authenticates via OIDC, the server returns the **Encrypted Workload Envelope**. The `xtra` runner decrypts the envelope locally in CI memory. The server **never** sees plaintext secrets or unencrypted keys.

#### 3. Key Recovery & Member Offboarding Key Rotation
* **24-Word Recovery Mnemonic:** Generated at signup to allow account/private key recovery if a user forgets their passphrase.
* **Member Revocation Rotation:** When User B is removed from Project X, `xtra` CLI automatically generates a new Project Key, re-encrypts project secrets locally, and updates project envelopes for remaining team members.

```
┌───────────────────────────────────────────┐         ┌──────────────────────────────┐
│  Client (CLI / Dashboard / SDK)           │         │  XtraSecurity Backend (v2)   │
├───────────────────────────────────────────┤         ├──────────────────────────────┤
│ 1. User enters secret plaintext           │         │                              │
│ 2. Encrypt secret via AES-256-GCM         │         │                              │
│ 3. Send Ciphertext + IV + AuthTag         │ ──────► │ 4. Store Ciphertext Blob     │
│    + Encrypted Workload Envelopes         │         │    (NO server-side key!)     │
└───────────────────────────────────────────┘         └──────────────────────────────┘
```

### Implementation Checklist
- [x] Core Cryptographic Engine (`lib/crypto/e2ee.ts`) using WebCrypto & Node crypto (X25519 + AES-256-GCM).
- [x] Build `/app/api/v2/secret` suite (GET, POST, PUT, DELETE) and `/app/api/v2/secret/bulk` accepting pre-encrypted payload blobs `{ iv, ciphertext, authTag }`.
- [x] Implement 24-word BIP-39 recovery mnemonic generation and 32-byte recovery key derivation.
- [x] Client-side Zero-Knowledge encryption in Web Dashboard (`/projects/[id]`: create, edit, bulk import, local decrypt) and `xtra-cli` E2EE methods.

---

## 🔒 Phase 4: OS Keychain Storage & Local Device Security

### Problem Statement
CLI caches (`~/.xtra/cache.json`) stored in plain JSON on developer laptops can be stolen if the machine is compromised or unencrypted.

### Architectural Solution
Use platform-native keyring bindings to secure cached tokens and keys:
* **Windows:** DPAPI (Data Protection API) / Credential Manager
* **macOS:** Apple Keychain API
* **Linux:** Secret Service API / `libsecret`

### Implementation Checklist
- [ ] Integrate keytar / native OS keychain storage into `xtra-cli`.
- [ ] Add fallback encrypted cache for headless CI environments.
- [ ] Add step-up MFA verification for high-risk CLI operations.

---

## 📅 Execution Roadmap Summary

| Phase | Milestone | Primary Focus | API Version | Impact on Existing Code |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Redis Shield & Pub/Sub | Rate limiting & instant cache purge | Existing `/api/` | 0% Breaking (Transparent acceleration) |
| **Phase 2** | OIDC Workload Identity | Eliminate static CI keys in GitHub/K8s | `/api/v2/auth/oidc/` | 0% Breaking (New v2 routes) |
| **Phase 3** | Zero-Knowledge E2EE | Client-side X25519 & Workload Envelopes | `/api/v2/secret/` | 0% Breaking (v1 endpoints remain active) |
| **Phase 4** | OS Keychain Hardening | Hardware-locked CLI local storage | `xtra-cli` native | 0% Breaking (Opt-in CLI feature) |
