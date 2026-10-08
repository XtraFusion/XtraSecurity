## Security Audit — Phase 3 & 4 (E2EE Envelopes & OS Keychains) — 2026-10-08

### Summary
- Overall risk posture: Critical issues present
- Findings: Critical 1, High 0, Medium 1, Low 0

### Findings
- ID: SEC-001
- Title: OS Command Injection in Native Keychain Fallbacks
- Severity: Critical
- Location: `xtra-cli/src/lib/crypto.ts` (lines 88-100)
- Description: The `secureSave` and `secureRead` functions use `child_process.execSync` to invoke native OS commands (`security`, `cmdkey`, `secret-tool`) and directly interpolate the `value` and `account` variables into the shell string without properly escaping shell metacharacters (e.g., quotes, semicolons, backticks).
- Impact if exploited: If a malicious user supplies a specially crafted Master Passphrase containing shell characters (e.g., `pass" ; rm -rf / ; "`), the CLI will execute arbitrary OS commands locally on the developer's machine with their privileges.
- Recommended fix: Refactor `execSync` to use `execFileSync` or `spawnSync` which pass arguments as an array, completely bypassing the shell interpreter, or use a dedicated native binding library.

- ID: SEC-002
- Title: Ephemeral Token Entropy and Predictability
- Severity: Medium
- Location: `app/api/v2/auth/oidc/token/route.ts`
- Description: The OIDC token exchange endpoint generates ephemeral tokens via `crypto.randomBytes(32).toString('hex')`. While secure, the tokens do not have a distinct prefix for secret scanning tools to easily identify them (other than `xtra_eph_`), and they lack checksum verification.
- Impact if exploited: If these tokens are accidentally committed, they might not be immediately revoked by standard secret scanners unless the exact format is registered.
- Recommended fix: Ensure the prefix `xtra_eph_` is registered with secret scanning partners (like GitHub Advanced Security) and consider adding a CRC32 checksum to the token string for fast local validation.

### What's Done Well
- **OIDC Replay Protection:** The use of Redis to cache the JWT ID (`jti`) with a TTL strictly bound to the token's `exp` claim completely neutralizes JWT replay attacks.
- **Strict Zero-Knowledge:** The cryptographic design of the Workload Envelope correctly enforces that the Server never receives the Private Key or the plaintext Project Key, upholding the core E2EE guarantee.
- **Robust Cryptography:** AES-256-GCM and X25519 ECDH are industry-standard and correctly implemented with proper IV handling and authentication tags.

### Immediate Actions Required
1. Fix SEC-001 (OS Command Injection in `crypto.ts`) immediately before any developers upgrade to the new CLI version.
