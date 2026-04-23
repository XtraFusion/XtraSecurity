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

### Step 2: Initialize Your Project
Go to your project folder and link it to XtraSecurity.
```bash
xtra init
```

### Step 3: Set Your First Secret
Forget manual `.env` edits. Set secrets from the command line:
```bash
xtra secrets set API_KEY=sk_test_4eC39...
```

### Step 4: Run Your App (The "Magic" Part)
Stop hardcoding secrets! Use `xtra run` to inject them directly into your app's memory:
```bash
xtra run npm start
```
*Note: Your application will see `process.env.API_KEY` perfectly, but no `.env` file ever exists on your disk!*

---

## 🛡️ Core Security Concepts

| Concept | What it means for you |
| :--- | :--- |
| **JIT Access** | "Just-In-Time" access. Request temporary 1-hour access to high-stakes secrets. Perfect for production bug fixing. |
| **Zero-Disk** | Secrets stay in RAM. If your laptop is stolen, the secrets aren't on the hard drive. |
| **Drift Detection** | The VS Code extension tells you if your local code is out of sync with the team's cloud secrets. |
| **Machine-Locking** | Your local cache is encrypted using your motherboard's unique ID. It can't be stolen and used elsewhere. |

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
