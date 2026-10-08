# 🔐 XtraSecurity - The Unified Secrets Layer

XtraSecurity is a premium, open-source secrets management platform designed for the modern developer. It replaces insecure `.env` files with a unified, zero-trust injection layer that works across your **CLI**, **VS Code**, and **CI/CD**.

---

## 🚀 Quick Installation

### 1. Install the CLI
The CLI is the engine of XtraSecurity. Install it globally via npm:
```bash
npm install -g xtra-cli
```
*Verify installation:* `xtra --version`

### 2. Install the VS Code Extension
Get real-time secret scanning, auto-completion, and "drift" detection directly in your editor.
👉 **[Download from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=XtraSecurity.xtra-vscode)**

---

## ⚡ The "5-Minute" Mastery Guide

If you're a newly started developer, follow these four steps to secure your first project:

### Step 1: Login
Authenticate your computer with the cloud.
```bash
xtra login
```

### Step 3: Link Your Project
Go to your project folder and set the active project. **You will be prompted to enter your Zero-Knowledge Vault Passphrase**.
```bash
xtra project set
```
*Note: Your passphrase is never sent to our servers. It is securely cached in your local OS Hardware Keyring for seamless future use.*

### Step 4: Set Your First Secret
Forget manual `.env` edits. Set secrets from the command line:
```bash
xtra secrets set API_KEY=sk_test_4eC39...
```

### Step 5: Run Your App (The "Magic" Part)
Stop hardcoding secrets! Use `xtra run` to inject them directly into your app's memory:
```bash
xtra run -- npm start
```
*Note: Your application will see `process.env.API_KEY` perfectly, but no `.env` file ever exists on your disk! The CLI decrypts secrets on-the-fly using the cached passphrase in your OS Keyring.*

---

## 🛡️ Core Security Concepts

XtraSecurity is built on a **Strict Zero-Knowledge Architecture**. Your secrets are encrypted locally and we can never read them.

### Master Passphrase & Hardware Keyring
When you create a project, you generate a **Vault Passphrase**. This passphrase is the mathematical key used to encrypt and decrypt all your environment variables. 
- **Zero-Knowledge**: This passphrase is *never* sent to our servers. We only store an Argon2id hash for login verification. If you lose your passphrase, **your secrets are permanently unrecoverable by us or anyone else**.
- **OS Native Hardware Keyring (Phase 4)**: You don't have to type your passphrase every time. When you run `xtra project set` or log into the VS Code extension, your passphrase is encrypted and stored in your OS's native secure keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service). 
- **Headless Fallback**: If running in a headless environment without a native keyring, we securely cache your passphrase using a machine-bound hardware fingerprint derived from your OS and motherboard ID.

### CI/CD Workload Envelopes (Phase 3)
Because the server never holds your Project Keys, automated CI/CD pipelines (like GitHub Actions) cannot normally decrypt secrets. XtraSecurity solves this using the **Workload Key Envelope Protocol**.

When you link a CI/CD pipeline using the new `xtra oidc-link` command, the CLI automatically generates an X25519 Asymmetric Keypair for the workload, encrypts your Project AES Key using the workload's public key (creating an "Envelope"), and saves this to the server. Your CI runner then securely fetches the envelope, proves its identity via OIDC, and decrypts the Project Key entirely within CI memory. No static API keys required!

### How Clients Decrypt Secrets Under the Hood
1. **The CLI (`xtra run`)**: Intercepts `getSecrets` API calls. The server returns AES-256-GCM ciphertext. The CLI transparently loads your passphrase from the hardware keyring, decrypts the payload in RAM, and spawns your application with the plaintext environment variables.
2. **Node SDK**: If you use our official SDK (`XtraClient`), it fetches the encrypted blobs and decrypts them directly within your Node.js process using `XTRA_VAULT_PASSPHRASE`. If the passphrase is missing, it will loudly fail with a Zero-Knowledge Error to prevent misconfiguration.
3. **VS Code Extension**: Fetches ciphertext and decrypts it locally within the extension host. It requires you to run the `Xtra: Set Vault Passphrase` command once per project. It provides live hover decryption and secret scanning without ever logging plaintext to the local filesystem.

| Concept | What it means for you |
| :--- | :--- |
| **End-to-End Encryption** | Client-side encryption using AES-256-GCM. The cloud only receives unbreakable ciphertext. |
| **JIT Access** | "Just-In-Time" access. Request temporary 1-hour access to high-stakes secrets. Perfect for production bug fixing. |
| **Zero-Disk** | Secrets stay in RAM. If your laptop is stolen, the secrets aren't on the hard drive. |
| **Machine-Locking** | Your local cache is encrypted using your motherboard's unique hardware ID. It can't be stolen and used elsewhere. |

---

## 🛠️ Essential Commands Reference

- `xtra secrets list` — See all secrets in the current project.
- `xtra access jit <token>` — Claim a time-limited access link.
- `xtra jit-run --token <tok> -- npm start` — Claim access and run the app in one command.
- `xtra status` — Check your sync status and active branch.

---

## 🆘 Need Help?

- **Interactive UI**: Run `xtra ui` to open the terminal dashboard.
- **Diagnostics**: Run `xtra doctor` to check your connection and configuration.
- **Docs**: Visit the full [Command Reference](./CLI_COMMANDS_REFERENCE.md).

---

**Built with ❤️ by XtraSecurity. Dedicated to making secrets invisible and unhackable.**
