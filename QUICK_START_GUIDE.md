# 🚀 XtraSecurity Quick Start Guide

Welcome to XtraSecurity! This guide will get you from zero to securely running your first application in less than 2 minutes.

---

## 1. Install the CLI
The Xtra CLI is the primary tool for secret injection and management.

**Windows (PowerShell):**
```powershell
iwr -useb https://www.xtrasecurity.in/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://www.xtrasecurity.in/install.sh | sh
```

---

## 2. Authenticate
Login to your account to link your local machine with your secure vault.

```bash
xtra login
```
*This will open a browser window for secure authentication.*

---

## 3. Secure Runtime Injection (The Magic ✨)
Stop using `.env` files. XtraSecurity injects secrets directly into your process memory.

**In your project directory:**
```bash
# Initialize your project
xtra init

# Run your application with secrets injected
xtra run -- node server.js
```
*Your app now has access to all environment variables from the XtraSecurity cloud, but they never touch your disk.*

---

## 4. Use the Node.js SDK
For more granular control, use the native SDK.

**Install:**
```bash
npm install @xtrasecurity/node-sdk
```

**Usage:**
```javascript
const { XtraClient } = require('@xtrasecurity/node-sdk');

const xtra = new XtraClient();

async function startApp() {
    // Automatically inject secrets into process.env
    await xtra.injectSecrets('production');
    
    console.log(`Connected to: ${process.env.DB_URL}`);
}

startApp();
```

---

## 5. Requesting JIT Access
Need temporary access to production? Use the Just-In-Time (JIT) workflow.

```bash
xtra access request production --duration 1h --reason "Investigating checkout bug"
```
*Your manager will be notified instantly for approval.*

---

## 6. Zero-Downtime Rotation
Want to rotate your database password? Use Shadow Mode.

```bash
# Set a new secret in shadow mode
xtra set DB_PASSWORD "new_secure_password" --shadow

# Promote it once confirmed
xtra rotate promote DB_PASSWORD
```

---

## 🛡️ Security Best Practices
- **Never commit `.env` files:** Add `*.env` to your `.gitignore`.
- **Use Service Accounts:** For CI/CD, use IP-restricted service accounts.
- **Enable Alerts:** Set up Slack notifications for secret access events.

---

**Next Steps:**
- [Full CLI Reference](CLI_COMMANDS_REFERENCE.md)
- [SDK Documentation](sdk/README.md)
- [Visit Dashboard](https://www.xtrasecurity.in/dashboard)
