Viewed e2ee.ts:250-340
Viewed e2ee.ts:430-520
Viewed v2-e2ee-crypto.test.ts:25-55
Viewed wrapper.ts:1-60
Viewed wrapper.ts:60-120
Viewed wrapper.ts:240-285
Viewed wrapper.ts:330-380
Searched for "decryptSecretValue"
Searched for "deriveProjectKey"
Searched for "createWorkloadKeyEnvelope"
Searched for "envelope"
Viewed e2ee.ts:480-560
Viewed crypto.ts:1-100
Viewed crypto.ts:101-193
Viewed wrapper.ts:80-140
Searched for "vaultPassphrase"
Viewed wrapper.ts:130-220
Viewed wrapper.ts:270-350
Searched for "resolveVaultPassphrase"
Viewed run.ts:145-185

In XtraSecurity's **Zero-Knowledge Architecture**, the server stores **only AES-256-GCM ciphertexts** and has zero knowledge of the master passphrase or plaintext secrets. 

For headless, automated **Service Accounts** (running in GitHub Actions, Docker containers, Kubernetes pods, or backend microservices), secrets are decrypted through **two primary patterns** (and two deployment-specific alternatives):

---

### 1. Pattern 1: CI/CD Masked Passphrase Injection (Direct & Most Common)

In this approach, the Service Account runner is given two credentials:
1. `XTRA_TOKEN` (or `XTRA_API_KEY`): The Service Account API key that grants authenticated RBAC access to the project and environment.
2. `XTRA_VAULT_PASSPHRASE`: Stored as a masked secret in your CI/CD runner (e.g., GitHub Actions Secrets or Kubernetes Secret).

#### How the Decryption Flow Works:
```
┌────────────────────────────────────────────────────────┐
│               Non-Human Service Account                │
│ (GitHub Actions / Docker / Kubernetes / Node.js)       │
│                                                        │
│  1. Authenticates with XTRA_TOKEN                      │
│     ───────────────────────────────────►  API Server   │
│                                           (MongoDB)    │
│  2. Returns raw encrypted ciphertext                   │
│     ◄───────────────────────────────────  (Zero        │
│        { ciphertext, iv, authTag }        Knowledge)   │
│                                                        │
│  3. Reads local process.env.XTRA_VAULT_PASSPHRASE      │
│  4. Runs deriveProjectKey(projectId, passphrase)       │
│  5. Decrypts ciphertext in process RAM                 │
│  6. Injects plaintext into runtime environment         │
└────────────────────────────────────────────────────────┘
```

#### Code / Pipeline Examples:

* **In GitHub Actions (`.github/workflows/deploy.yml`):**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run application with XtraSecurity Secrets
        env:
          XTRA_TOKEN: ${{ secrets.XTRA_SERVICE_ACCOUNT_KEY }}
          XTRA_PROJECT_ID: ${{ secrets.XTRA_PROJECT_ID }}
          XTRA_VAULT_PASSPHRASE: ${{ secrets.XTRA_VAULT_PASSPHRASE }}
        run: |
          npx xtra-cli run -e production -- npm start
```

* **In the Node.js SDK ([sdk/node/wrapper.ts](file:///c:/Users/salun/OneDrive%20-%20smarttech/Desktop/D%20folder/XtraSecurity/sdk/node/wrapper.ts#L145-L315)):**
```typescript
import { XtraClient } from '@xtra/sdk';

const client = new XtraClient({
  token: process.env.XTRA_TOKEN,
  projectId: process.env.XTRA_PROJECT_ID,
  // Automatically reads process.env.XTRA_VAULT_PASSPHRASE if omitted:
  vaultPassphrase: process.env.XTRA_VAULT_PASSPHRASE
});

// getAll() fetches ciphertext from API and transparently decrypts in memory:
const secrets = await client.getAll('production');
console.log(secrets.DATABASE_URL); // Decrypted plaintext
```

* **Zero-Knowledge Guarantee:** The backend server **never** receives `XTRA_VAULT_PASSPHRASE`. The secret derivation and decryption happen strictly inside the runner's ephemeral memory.

---

### 2. Pattern 2: Workload Key Envelope Protocol (Asymmetric X25519 ECDH — Enterprise Zero-Knowledge)

If you do **not** want to expose the master vault passphrase to CI/CD runners (because a master passphrase could unlock multiple projects or environments), you use the **Workload Key Envelope Protocol** implemented in [lib/crypto/e2ee.ts](file:///c:/Users/salun/OneDrive%20-%20smarttech/Desktop/D%20folder/XtraSecurity/lib/crypto/e2ee.ts#L486-L547).

In this pattern, the Service Account has its own asymmetric key pair:

1. **Service Account Key Pair:**
   - **Public Key:** Registered in XtraSecurity under the Service Account.
   - **Private Key (`XTRA_WORKLOAD_PRIVATE_KEY`):** Stored only on the CI/CD runner.
2. **Envelope Generation by Admin:**
   - When an administrator adds or rotates secrets via the Web Dashboard or CLI, the admin's client (which is already unlocked with the master passphrase) creates a **Workload Key Envelope**:
     ```typescript
     // Admin wraps the project AES key with the Service Account's X25519 Public Key
     const envelope = createWorkloadKeyEnvelope(projectKeyHex, serviceAccountPublicKeyPem);
     ```
   - The encrypted envelope is attached to the secret metadata on the server.
3. **Envelope Decryption by Service Account:**
   - The Service Account downloads the secret payload + its specific envelope.
   - The Service Account unwraps the `projectKey` using its private key:
     ```typescript
     const projectKey = decryptWorkloadKeyEnvelope(envelope, process.env.XTRA_WORKLOAD_PRIVATE_KEY);
     const plaintext = decryptSecretValue(payload, projectKey);
     ```
* **Key Advantage:** The Service Account **never knows the master vault passphrase**, yet it can decrypt project secrets in complete zero-knowledge.

---

### 3. Pattern 3: OS Hardware-Bound Keyring (For Long-Running Bare-Metal / VMs)

For long-running virtual machines (e.g. AWS EC2, bare-metal Ubuntu servers):

1. During server provisioning, the admin logs in and unlocks the project once:
   ```bash
   xtra secrets unlock --project <projectId> --passphrase "<vault-passphrase>"
   ```
2. As implemented in [xtra-cli/src/lib/crypto.ts](file:///c:/Users/salun/OneDrive%20-%20smarttech/Desktop/D%20folder/XtraSecurity/xtra-cli/src/lib/crypto.ts#L17-L37), the CLI combines the machine's motherboard UUID, OS platform, and user SID to create a non-exportable hardware key, and saves the derived project key to the local machine keyring via `secureSave()`.
3. Background services and daemons run `xtra run -- npm start` without needing `XTRA_VAULT_PASSPHRASE` in their `.env` file — `resolveVaultPassphrase()` automatically retrieves the key from the hardware keyring.

---

### 4. Pattern 4: Default System Seed (Development / Standard Projects)

If the project does not have a custom master passphrase configured (standard mode):
- Both the Web Dashboard and CLI/SDK fall back to `xtra-zero-knowledge-master` via HKDF-SHA256 (`deriveProjectKey(projectId, "xtra-zero-knowledge-master")`).
- In this scenario, the Service Account **only needs its `XTRA_TOKEN`** — the CLI and SDK transparently derive the key and decrypt secrets with zero extra environment configuration.

---

### Summary Recommendation

| Deployment Type | Recommended Method | Environment Variables Required |
|---|---|---|
| **GitHub Actions / CI/CD** | **Pattern 1** (Passphrase Injection) | `XTRA_TOKEN`, `XTRA_PROJECT_ID`, `XTRA_VAULT_PASSPHRASE` |
| **High-Security Enterprise CI/CD** | **Pattern 2** (Workload Envelope) | `XTRA_TOKEN`, `XTRA_WORKLOAD_PRIVATE_KEY` |
| **Production EC2 / Dedicated VM** | **Pattern 3** (Hardware Keyring) | Provision once with `xtra secrets unlock`, then only `XTRA_TOKEN` |
| **Development / Default Projects** | **Pattern 4** (Default Seed) | Only `XTRA_TOKEN` |