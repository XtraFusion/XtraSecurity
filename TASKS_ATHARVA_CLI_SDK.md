# 💻 CLI, SDKs & DEVELOPER TOOLING TASK LIST — ATHARVA

**Assigned To**: Atharva  
**Scope**: Terminal CLI Tool (`xtra-cli`), Node.js SDK (`sdk/node`), Python SDK (`sdk/python`), Go SDK (`sdk/go`), VS Code Extension (`xtra-vscode`), Machine-Locking Security, Zero-Disk RAM Injection, Local Caching, OpenAPI SDK Generator Pipeline.

---

> ⚠️ **CRITICAL CROSS-PLATFORM IMPACT NOTICE**
> The CLI and SDKs rely on **Nishant's API endpoints** (`/api/projects/.../secrets`).
> Any API key authentication headers (`X-API-Key` or `Bearer <jwt>`) must conform to the security middleware specification maintained by Nishant.
> CLI commands must reflect features exposed in **Priti's Web UI** (e.g. JIT token request format).

---

## 📌 TASK SUMMARY (35 TASKS)

### 🟢 Phase 1: Machine-Locking, Security & CLI Engine
- [ ] **A01: Motherboard-Bound Local Cache Encryption**
  - **Details**: Implement local cache encryption for `~/.xtra/cache.json` using hardware identifiers (Motherboard serial / System UUID + AES-256-GCM) so cache files cannot be stolen or reused on another machine.
- [ ] **A02: Zero-Disk Secret Injection Engine (`xtra run`)**
  - **Details**: Refactor `xtra run -- <command>` to inject decrypted environment variables directly into child process RAM without writing `.env` files to disk.
- [ ] **A03: Interactive CLI Authentication (`xtra login`)**
  - **Details**: Implement OAuth PKCE browser flow launching local callback server on `http://localhost:9876/callback` to retrieve access JWT.
- [ ] **A04: Interactive Project Linker (`xtra init`)**
  - **Details**: Interactive terminal prompt allowing developer to select Workspace, Project, and default Git Branch to generate `.xtra.json` project config.
- [ ] **A05: Full Secret Management CLI Commands (`xtra secrets`)**
  - **Details**: Implement `xtra secrets list`, `xtra secrets set KEY=VALUE`, `xtra secrets get KEY`, and `xtra secrets delete KEY` with colorized terminal output.
- [ ] **A06: JIT Access Claim & Injection Commands (`xtra access jit`)**
  - **Details**: Implement `xtra access jit <token>` and `xtra jit-run --token <token> -- <cmd>` to claim time-bound elevated access links and inject secrets.
- [ ] **A07: Rich Terminal UI Dashboard (`xtra ui`)**
  - **Details**: Build interactive terminal UI using `ink` / `blessed` allowing developers to inspect secrets, switch branches, and view rotation status directly inside the terminal.

---

### 🟡 Phase 2: Diagnostics, Multi-Language SDKs & Auto-Generation
- [ ] **A08: Environment & Connectivity Diagnostic Tool (`xtra doctor`)**
  - **Details**: Build health command `xtra doctor` checking local CLI version, API endpoint connectivity, token expiration, and local drift state.
- [ ] **A09: Node.js SDK Implementation (`sdk/node`)**
  - **Details**: Build TypeScript client package providing `XtraClient` with auto-decrypt and local caching support (`npm install @xtrasecurity/node`).
- [ ] **A10: Python SDK Implementation (`sdk/python`)**
  - **Details**: Create PyPI-ready Python package supporting context manager syntax (`with xtra.secrets(): pass`) and environment injection.
- [ ] **A11: Go SDK Implementation (`sdk/go`)**
  - **Details**: Create idiomatic Go module providing client bindings and struct tag auto-unmarshalling for secrets.
- [ ] **A12: Automated Multi-Language SDK Generator Pipeline**
  - **Details**: Configure `@openapitools/openapi-generator-cli` scripts in `package.json` to auto-generate SDK code from Nishant's `/api/openapi.json`.
- [ ] **A13: VS Code Extension Project Initialization (`xtra-vscode`)**
  - **Details**: Set up VS Code extension project structure with TypeScript, extension manifest, and language server capabilities.
- [ ] **A14: VS Code Real-Time Hardcoded Secret Scanner**
  - **Details**: Background linter scanning source code files for hardcoded API keys/passwords and displaying warnings in the VS Code Problems pane.

---

### 🔵 Phase 3: Extension Features, Offline Sync & Service Accounts
- [ ] **A15: VS Code IntelliSense Secret Auto-Completion**
  - **Details**: Provide autocomplete suggestions for `process.env.KEY` matching available secret keys in the linked XtraSecurity project.
- [ ] **A16: VS Code Local vs Cloud Drift Indicator**
  - **Details**: Status bar widget in VS Code warning developers when cloud secrets have been updated by team members since last local sync.
- [ ] **A17: Offline Encrypted Cache Fallback**
  - **Details**: When network connectivity fails, transparently fall back to reading motherboard-locked local encrypted cache with warning indicator.
- [ ] **A18: Headless Service Account CLI Authentication**
  - **Details**: Enable non-interactive CLI login using environment variable `XTRA_SERVICE_ACCOUNT_TOKEN` for CI/CD pipelines (GitHub Actions, GitLab CI).
- [ ] **A19: Bulk File Import/Export CLI Commands**
  - **Details**: Implement `xtra secrets import .env` and `xtra secrets export --format json/env`.
- [ ] **A20: Local Branch Context Switcher (`xtra branch`)**
  - **Details**: CLI command `xtra branch use <name>` to toggle active configuration context without modifying git repository branch.
- [ ] **A21: Cross-Platform Windows & POSIX Path Compatibility**
  - **Details**: Fix path separator handling across Windows PowerShell, CMD, and Linux/macOS Bash shells.

---

### 4. Advanced Tooling, Framework Plugins & Test Suite
- [ ] **A22: Output Secret Masking Flag (`--mask`)**
  - **Details**: Flag `--mask` for `xtra secrets list` replacing secret values with `***` for safe terminal screen sharing.
- [ ] **A23: Shell Autocompletion Script Generator**
  - **Details**: Command `xtra completion` producing tab-completion scripts for Bash, Zsh, and PowerShell.
- [ ] **A24: Configurable CLI Output Formats**
  - **Details**: Flag `--format json`, `--format yaml`, `--format table`, and `--format csv` for all list commands.
- [ ] **A25: Automated CLI Self-Update Engine (`xtra update`)**
  - **Details**: Check npm registry for new release tags and update CLI binary automatically.
- [ ] **A26: Interactive Conflict Resolution CLI (`xtra push`)**
  - **Details**: Detect remote version conflicts on secret update and prompt user to overwrite, skip, or merge values.
- [ ] **A27: Node.js SDK Background Cache Auto-Refresh**
  - **Details**: Non-blocking background worker in Node SDK updating secret values in memory every N minutes.
- [ ] **A28: Python Framework Auto-Injectors (Django/Flask/FastAPI)**
  - **Details**: Add helper modules for Django `settings.py` and FastAPI startup hooks to auto-load XtraSecurity secrets.
- [ ] **A29: Go SDK Context Cancellation & Timeout Support**
  - **Details**: Ensure all Go SDK API calls support `context.WithTimeout` and context cancellation signals.
- [ ] **A30: VS Code Hover Tooltips for Secret Keys**
  - **Details**: Hovering over `process.env.SECRET_NAME` in code displays hover card with environment type, version, and last updated time.
- [ ] **A31: VS Code 1-Click Secret Creation Context Menu**
  - **Details**: Right-clicking selected string in code offers "Add to XtraSecurity" command to create cloud secret instantly.
- [ ] **A32: Opt-In Anonymous CLI Telemetry & Error Logging**
  - **Details**: Command execution logger sending crash stack traces to backend audit log.
- [ ] **A33: Multi-Environment Fallback Resolution in SDKs**
  - **Details**: If secret key is absent in `development` environment, optionally fall back to `staging` value with warning log.
- [ ] **A34: CLI & SDK Unit Test Suite**
  - **Details**: Jest & PyTest test suites verifying encryption, CLI commands, and SDK API client calls.
- [ ] **A35: CLI & SDK Package Documentation**
  - **Details**: Write detailed documentation and quickstart guides for npm, PyPI, and Go package registries.
