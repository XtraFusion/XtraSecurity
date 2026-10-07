# XtraSecurity Zero-Knowledge Vault & Passphrase Architecture Guide

This document explains the cryptographic architecture of XtraSecurity vaults, why "Authentication tag mismatch" occurs, how Server AES vs. Client E2EE secrets work, and how to securely manage and recover vault passphrases.

---

## 1. Cryptographic Levels in XtraSecurity

XtraSecurity supports three distinct tiers of secret encryption:

| Tier | Payload Keys | Where Key Lives | Where Decryption Happens | Zero-Knowledge? |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Server AES-256-GCM** *(Legacy)* | `iv`, `encryptedData`, `authTag` | Server (`.env` file `ENCRYPTION_KEY`) | **Server-side only** | ❌ No (Server holds the key) |
| **Level 2: Project Zero-Knowledge** | `iv`, `ciphertext`, `authTag` | Deterministic HKDF project salt + fallback master seed | **Client browser (WebCrypto)** | 🟡 Standard (System default key) |
| **Level 3: Strict Zero-Knowledge (E2EE)** | `iv`, `ciphertext`, `authTag` | **Client only** (User-held master passphrase / mnemonic) | **Client browser (WebCrypto)** | ✅ **Strict (Server has 0 keys)** |

---

## 2. Common Issues & Root Cause Explanations

### Issue A: "Authentication tag mismatch. Incorrect master passphrase for this project."

#### Why this happens:
1. **How AES-256-GCM Works**:
   During encryption, AES-256-GCM generates a 16-byte cryptographic authentication tag (`authTag`). During decryption, if the provided key is even 1 bit different from the key used during encryption, decryption immediately fails with an **Authentication Tag Mismatch** (tamper protection).
2. **Why a newly generated phrase fails on an existing vault**:
   If a vault's secrets were encrypted with **Key A**, clicking "Generate Passphrase" creates a brand-new random **Key B** (24 random words). Key B mathematically cannot open a lock set by Key A.
3. **Why it worked in "another project"**:
   In an empty project with 0 secrets, there are no existing ciphertexts to validate against. The system accepts the newly generated phrase as the initial key for that vault and encrypts future secrets with it.

> [!IMPORTANT]
> **Generating a new key does NOT damage or overwrite your secrets in the database.**
> Generating a phrase only creates random words in your browser's temporary memory. It does not touch the database. Your secrets in the database remain intact and encrypted under their original key.

---

### Issue B: Seeing raw JSON `{"iv":"...","encryptedData":"...","authTag":"..."}` in the UI

#### Why this happened:
* Secrets created under **Level 1** are stored as `{ iv, encryptedData, authTag }` using the server's private `ENCRYPTION_KEY`.
* For security, the server's `ENCRYPTION_KEY` is **never sent to client web browsers**.
* If the API endpoint (`/api/branch`) returned that secret raw without decrypting it, the browser was unable to decrypt it and displayed the raw encrypted JSON string.

#### The Fix:
* In `app/api/branch/route.ts`, the server automatically detects Server AES payloads (`encryptedData`), decrypts them on the server using `ENCRYPTION_KEY`, and sends the plaintext to the user.
* Strict Zero-Knowledge secrets (`ciphertext`) remain completely raw so your browser decrypts them client-side.

---

## 3. How to Manage Passphrases Safely Without Memorizing 24 Words

Managing unique 24-word phrases across multiple projects creates friction. XtraSecurity provides three built-in solutions:

### Solution 1: "Remember on this device" (Local Browser Persistence)
* When unlocking your vault, check the **"Remember on this device"** checkbox.
* The session key is stored in your local browser's storage on that specific workstation.
* You remain unlocked across browser refreshes and restarts without retyping the passphrase.
* Clicking **"Lock Vault"** at any time instantly purges the passphrase from browser memory.

### Solution 2: Downloadable Emergency Recovery Kit (`.txt`)
* When generating a 24-word recovery phrase, click **"Download (.txt)"** in the modal.
* This generates an emergency recovery file containing your Project Name, ID, Timestamp, and 24-word phrase.
* Save this file in a password manager (Bitwarden, 1Password, KeePass) or secure offline drive.

### Solution 3: Use a Memorable Sentence Instead of 24 Random Words
* You are **not required** to use random 24 words.
* You can type any memorable passphrase (e.g. `galaxy-orbit-blue-coffee-2026`).
* The **HKDF-SHA256** key derivation engine automatically expands whatever passphrase you enter into a full 256-bit AES key.

### Future Enterprise Architecture: Asymmetric Key Envelopes (X25519)
As outlined in `FUTURE_SECURITY_AND_ARCHITECTURE_ROADMAP.md`:
* Each user has **ONE master account password** or **Passkey (Touch ID / Face ID / Windows Hello)**.
* Each project has a random AES-256 key encrypted as an envelope using the user's public key.
* Logging into your account automatically unwraps all project keys—users never memorize individual project keys.

---

## 4. Vault Recovery & Migration Tooling

XtraSecurity includes CLI tools for vault administration:

### 1. Resetting a Locked Project Vault
If a project's passphrase was lost or you need to restore access to default:
```bash
# Reset project secrets back to the default system key
npx tsx scripts/reset-project-vault.ts --projectId "<project-id>"

# Or reset and re-encrypt directly to a chosen passphrase
npx tsx scripts/reset-project-vault.ts --projectId "<project-id>" --passphrase "my-new-passphrase"
```

### 2. Migrating All Secrets to 100% Strict Zero-Knowledge (Zero Server Decryption)
To upgrade all legacy Server AES secrets in your database to client-held Zero-Knowledge:
```bash
# Dry-run first to preview changes
npx tsx scripts/reencrypt-to-level3.ts --passphrase "my-master-passphrase" --dryRun

# Commit migration to database
npx tsx scripts/reencrypt-to-level3.ts --passphrase "my-master-passphrase"
```

### 3. Quick Unlock in the Web Dashboard
* **Default Key Quick Unlock**: If your project is using the default zero-knowledge key, open the Unlock modal and click **"Use Default Key"**.
* **Automatic Upgrade on New Passphrase**: If your project is currently on the default key, entering a new passphrase and clicking **"Unlock Vault"** will automatically re-encrypt all existing secrets to your new passphrase.
