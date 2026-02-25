# XtraSecurity CLI Commands Reference

**Complete Documentation for All 32 Commands**
Generated: February 25, 2026

---

## Table of Contents
1. [Authentication Commands](#1-authentication-commands)
2. [Project & Workspace Commands](#2-project--workspace-commands)
3. [Secrets Management Commands](#3-secrets-management-commands)
4. [Environment Commands](#4-environment-commands)
5. [Execution Commands](#5-execution-commands)
6. [Configuration & Generation Commands](#6-configuration--generation-commands)
7. [Version Control & History Commands](#7-version-control--history-commands)
8. [Integration Commands](#8-integration-commands)
9. [Audit & Security Commands](#9-audit--security-commands)
10. [Diagnostic & Utility Commands](#10-diagnostic--utility-commands)

---

## 1. Authentication Commands

### 1.1 `xtra login`
**Description:** Authenticate with XtraSecurity Cloud platform using SSO, Access Key, or Email/Password.

**Options:**
- `-k, --key <key>` - Login using an Access Key (non-interactive)
- `-e, --email <email>` - Login using Email (non-interactive, will prompt for password)
- `--sso` - Login via Web/Browser SSO

**Behavior:**
- If no option specified, shows interactive menu to choose authentication method
- Supports three authentication methods:
  - Browser Login (SSO) - Opens browser for OAuth-style login
  - Access Key - For service accounts or CI/CD
  - Email & Password - Traditional email/password login
- Stores authentication token locally in CLI config

**Examples:**
```bash
# Interactive login (menu appears)
xtra login

# Direct SSO login
xtra login --sso

# Access key authentication
xtra login --key xs_abcd1234efgh5678

# Email authentication (prompts for password)
xtra login --email user@company.com

# CI/CD with service account token
export XTRA_MACHINE_TOKEN=tok_xxxxx
xtra ci secrets -p proj_123 -e production
```

**Common Errors:**
- "Unauthorized" - Invalid credentials
- "Session expired" - Token has expired, run `xtra login` again

---

## 2. Project & Workspace Commands

### 2.1 `xtra init`
**Description:** Bootstrap a new project by creating `.xtrarc` configuration file and optional `.gitignore` entry.

**Options:**
- `--project <id>` - Project ID (skip interactive prompt)
- `--env <env>` - Default environment (default: "development")
- `--branch <branch>` - Default branch (default: "main")
- `-y, --yes` - Accept all defaults without prompting

**Behavior:**
- Creates `.xtrarc` in current directory with project configuration
- Fetches available projects from API if logged in
- Fetches available branches for selected project
- Optionally adds `.xtrarc` to `.gitignore`
- Configuration is "sticky" to the directory

**Examples:**
```bash
# Interactive setup (recommended)
xtra init

# Auto-accept defaults for current project
xtra init -y

# Setup specific project, skip prompts
xtra init --project proj_123 --env staging --branch develop -y

# Setup and confirm all steps
xtra init --project proj_abc --branch production --env production
```

**Output:**
- Creates `.xtrarc` with structure:
```json
{
  "project": "proj_123",
  "env": "development",
  "branch": "main",
  "apiUrl": "https://xtra-security.vercel.app/api",
  "createdAt": "2026-02-25T10:30:00Z"
}
```

---

### 2.2 `xtra project`
**Description:** Manage active project context across sessions.

#### Subcommand: `xtra project set [projectId]`
**Description:** Set the default project ID globally or show interactive list.

**Options:**
- None (argument is optional)

**Behavior:**
- If Project ID provided: Sets directly and updates `.xtrarc` in current directory
- If no ID provided: Fetches all projects and shows interactive selector
- Resets branch to "main" when project changes
- Updates both global config and local `.xtrarc` file

**Examples:**
```bash
# Set project directly
xtra project set proj_123

# Interactive project selection
xtra project set

# In CI/CD (non-interactive)
xtra project set proj_staging
```

**Output:**
```
✔ Default project set to 'Production Database'
  Active branch: main
  ✔ Updated local .xtrarc (Project context locked to this folder)
```

#### Subcommand: `xtra project current`
**Description:** Show the currently active project and branch.

**Options:**
- None

**Examples:**
```bash
xtra project current
```

**Output:**
```
Project: Production Database (proj_abc123)
Branch: feature-auth
```

---

### 2.3 `xtra branch`
**Description:** Manage secret storage branches within a project.

#### Subcommand: `xtra branch list`
**Description:** List all branches in the current/specified project.

**Options:**
- `-p, --project <projectId>` - Project ID (falls back to config if not provided)

**Examples:**
```bash
# List branches in current project
xtra branch list

# List branches in specific project
xtra branch list -p proj_789

# With project override
xtra branch list -p proj_123
```

**Output:**
```
| Name      | ID           | Created By       |
|-----------|--------------|------------------|
| main      | br_001       | admin@company.com|
| staging   | br_002       | dev@company.com  |
| develop   | br_003       | dev@company.com  |
```

#### Subcommand: `xtra branch create <name>`
**Description:** Create a new branch in the project.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-d, --description <text>` - Optional branch description

**Examples:**
```bash
xtra branch create feature-auth

xtra branch create staging -d "Staging environment branch" -p proj_123

xtra branch create develop --description "Development branch"
```

#### Subcommand: `xtra branch delete <name>`
**Description:** Delete a branch permanently.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-y, --yes` - Skip confirmation prompt

**Behavior:**
- Cannot delete "main" branch (protected)
- Requires confirmation unless `-y` flag is used
- Logs audit event for deletion

**Examples:**
```bash
# With confirmation prompt
xtra branch delete feature-old -p proj_123

# Skip confirmation
xtra branch delete feature-old -p proj_123 -y
```

#### Subcommand: `xtra branch update <name>`
**Description:** Rename or update a branch description.

**Options:**
- `-n, --new-name <newName>` - New branch name
- `-d, --description <description>` - New branch description
- `-p, --project <projectId>` - Project ID

**Examples:**
```bash
xtra branch update staging --new-name staging-prod

xtra branch update develop -d "Updated development branch"

xtra branch update feature-old -n feature-beta -p proj_123
```

---

### 2.4 `xtra checkout`
**Description:** Switch the active branch context for secret operations.

**Options:**
- None (branch name is optional for interactive selection)

**Behavior:**
- If branch name provided: Verifies existence and switches
- If no name provided: Shows interactive list of branches
- Updates CLI config with new active branch
- Used to target different secret sets per branch

**Examples:**
```bash
# Switch directly to branch
xtra checkout staging

xtra checkout develop

# Interactive branch selection
xtra checkout

# Verify branch exists before switching
xtra checkout feature-new -p proj_123
```

**Output:**
```
✔ Switched to branch 'staging'
```

---

## 3. Secrets Management Commands

### 3.1 `xtra secrets`
**Description:** List, set, and manage secrets in XtraSecurity vault.

#### Subcommand: `xtra secrets list`
**Description:** List all secrets for a project/environment.

**Parent Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (development, staging, production)
- `-b, --branch <branchName>` - Branch name

**Subcommand Options:**
- `--show` - Reveal actual secret values (caution: terminal history!)

**Examples:**
```bash
# List secrets in default environment
xtra secrets list

# List production secrets
xtra secrets list -e production

# Show actual values (CAUTION!)
xtra secrets list -e production --show

# List for specific project and branch
xtra secrets list -p proj_123 -e staging -b feature-auth
```

**Output (without --show):**
```
| Key             | Value      | Env       |
|-----------------|------------|-----------|
| DATABASE_URL    | ********* | production|
| API_KEY         | ********* | production|
| JWT_SECRET      | ********* | production|
```

#### Subcommand: `xtra secrets set [KEY=VALUE...]`
**Description:** Set one or more secrets.

**Parent Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment
- `-b, --branch <branchName>` - Branch name

**Subcommand Options:**
- `-f, --force` - Skip production confirmation prompt

**Behavior:**
- Format: `KEY=VALUE` pairs separated by spaces
- Requires confirmation for production environment (unless `-f` flag)
- Creates new versions automatically (versioning built-in)
- Can set multiple secrets in single command

**Examples:**
```bash
# Set single secret
xtra secrets set API_KEY=sk_12345xyz

# Set multiple secrets
xtra secrets set DATABASE_URL=postgres://... API_KEY=sk_xxx JWT_SECRET=secret123

# Set in staging environment
xtra secrets set TOKEN=newtoken -e staging

# Production set (requires confirmation)
xtra secrets set DATABASE_URL=postgres://prod... -e production

# Force production set without confirmation
xtra secrets set DATABASE_URL=postgres://prod... -e production -f

# Set for specific branch
xtra secrets set FEATURE_FLAG=enabled -b feature-auth -p proj_123
```

**Output:**
```
Setting 2 secrets for production (branch: main)...
✔ Successfully set 2 secret(s).
   Added: 2
   Updated: 0
```

#### Subcommand: `xtra secrets delete <KEY>`
**Description:** Delete a secret from the vault.

**Behavior:**
- Marks secret as deleted (preserves history)
- Can be recovered via rollback to previous version
- Requires confirmation for production

**Examples:**
```bash
xtra secrets delete DEPRECATED_KEY

xtra secrets delete OLD_TOKEN -e production
```

---

### 3.2 `xtra rotate`
**Description:** Rotate a secret using Zero-Downtime Shadow Mode strategy.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `--strategy <strategy>` - Rotation strategy (default: "shadow")
- `--promote` - Promote shadow value to active
- `--value <value>` - New secret value (optional)

**Behavior:**
- Shadow Mode: Creates new secret version without affecting active one
- Can be tested in application before promotion
- After verification, use `--promote` to make it active
- Older values kept in history
- Requires production confirmation

**Workflow:**
1. Start rotation with `xtra rotate KEY` → creates shadow version
2. Test in application using shadow value
3. Promote with `xtra rotate KEY --promote` → makes it active
4. All changes are versioned

**Examples:**
```bash
# Start rotation (creates shadow version)
xtra rotate DATABASE_PASSWORD

# Rotate with custom value
xtra rotate API_KEY --value new_key_xyz123

# Promote shadow to active after testing
xtra rotate DATABASE_PASSWORD --promote

# Production rotation with strategy
xtra rotate AWS_SECRET_KEY -e production --strategy shadow

# Combined rotation and promote
xtra rotate JWT_SECRET -e staging --value new_jwt --promote
```

**Output (Rotation Start):**
```
✔ Rotation initiated for 'DATABASE_PASSWORD'
Shadow Value: (new value shown)
Expires At: 2026-03-02T10:30:00Z

To verify, run your app. To finalize, run:
xtra rotate DATABASE_PASSWORD --promote -p proj_123 -e production
```

**Output (Promotion):**
```
✔ Successfully promoted 'DATABASE_PASSWORD' to version 5
```

---

## 4. Environment Commands

### 4.1 `xtra local`
**Description:** Toggle between cloud and local offline modes for development.

#### Subcommand: `xtra local status`
**Description:** Show current cloud/local mode status.

**Examples:**
```bash
xtra local status
```

**Output:**
```
Mode Status:

  Mode        : ☁ CLOUD
  .env.local  : Not found
  Config flag : false
  Env var     : (not set)

  Run 'xtra local on' to switch to offline mode.
```

#### Subcommand: `xtra local on`
**Description:** Enable local offline mode (reads from `.env.local` instead of cloud).

**Behavior:**
- Sets config flag for local mode
- `xtra run` will read from `.env.local` instead of calling API
- No internet connection required
- Useful for offline development, airplane mode, etc.

**Examples:**
```bash
xtra local on

# Then run commands
xtra run npm start  # Reads from .env.local, not cloud
```

**Output:**
```
🔌 Local mode ENABLED.
   'xtra run' will now read from .env.local instead of the cloud.
   ⚠ No .env.local file found. Run 'xtra local sync' to populate it.
```

#### Subcommand: `xtra local off`
**Description:** Disable local mode and return to cloud mode.

**Examples:**
```bash
xtra local off
```

**Output:**
```
☁ Cloud mode ENABLED.
   'xtra run' will now fetch secrets from XtraSecurity Cloud.
```

#### Subcommand: `xtra local sync`
**Description:** Pull cloud secrets and write to `.env.local` for offline use.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branch>` - Branch name (default: main)
- `-o, --output <file>` - Output file path (default: .env.local)
- `--overwrite` - Overwrite existing file without prompt

**Behavior:**
- Fetches secrets from cloud
- Writes in dotenv format (.env format)
- Adds timestamp and environment info as comments
- Warns about production secrets being written locally
- Reminds to add file to `.gitignore`

**Examples:**
```bash
# Sync development to .env.local
xtra local sync

# Sync production (requires confirmation)
xtra local sync -e production

# Override existing file
xtra local sync -e staging --overwrite

# Custom output file
xtra local sync -o .env.development

# Sync specific project/branch
xtra local sync -p proj_123 -e staging -b develop
```

**Output:**
```
✅ Synced 12 secrets to .env.local
   Run 'xtra local on' to switch to local mode.

  ⚠ Remember to add '.env.local' to your .gitignore!
```

---

### 4.2 `xtra env`
**Description:** Manage environment configurations and sync operations.

#### Subcommand: `xtra env clone`
**Description:** Clone secrets from one environment to another.

**Options:**
- `--from <env>` - Source environment (required) e.g., production
- `--to <env>` - Destination environment (required) e.g., staging
- `-p, --project <id>` - Project ID
- `-b, --branch <name>` - Branch name
- `--overwrite` - Overwrite existing secrets (default: merge)

**Behavior:**
- Copies all secrets from source to destination
- With `--overwrite`: Replaces destination secrets
- Without `--overwrite`: Merges (new keys added, existing kept)
- Requires confirmation before proceeding
- Useful for environment promotion workflows

**Examples:**
```bash
# Clone production to staging (merge)
xtra env clone --from production --to staging

# Clone with overwrite
xtra env clone --from production --to staging --overwrite

# Clone specific project
xtra env clone --from prod --to staging -p proj_123

# Clone to different branch
xtra env clone --from production --to staging -b develop
```

**Output:**
```
Cloning secrets from production to staging (branch: main)...
⚠ Warning: Existing secrets in destination will be overwritten!
Are you sure you want to proceed? (y/N) y

✔ Clone successful!
Copied: 12
Updated: 3 (overwrite: true)
Skipped: 0
```

---

## 5. Execution Commands

### 5.1 `xtra run`
**Description:** Run a command with secrets injected at runtime (core command).

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branchName>` - Branch name
- `--shell` - Enable shell mode (for npm run, shell built-ins on Windows)

**Arguments:**
- `<command>` - Command to execute
- `[args...]` - Additional arguments passed to command

**Behavior:**
- Fetches secrets from cloud or local cache
- Injects as environment variables into child process
- Does NOT write to disk (in-memory only, secure)
- Supports offline fallback from cache
- Shell mode required for npm run, pipes, && operators on Windows

**Error Handling:**
- Falls back to encrypted local cache if network fails
- Requires explicit `--shell` for unsafe characters (&;|`$<>)

**Examples:**
```bash
# Basic: run Node.js app with injected secrets
xtra run node app.js

# Run npm script
xtra run --shell npm start

# With environment override
xtra run -e production npm run build

# With project override
xtra run -p proj_123 -e staging python script.py

# Complex command with arguments
xtra run -e production -- node server.js --port 3000

# Run shell command (Windows)
xtra run --shell "echo $DATABASE_URL >> log.txt"

# Background execution
xtra run node worker.js &

# Shell redirection
xtra run --shell "npm start > app.log 2>&1"
```

**Output:**
```
✓ Loaded 15 secrets (Online).
$ node app.js
[App logs...]
```

**Common Patterns:**
```bash
# CI/CD pipeline
xtra run -e production npm run build
xtra run -e production npm test

# Development
xtra run node app.js

# Docker build with secrets
xtra run -- docker build -t myapp .

# Python
xtra run -e production python manage.py migrate

# Go application
xtra run -e production ./myapp
```

---

### 5.2 `xtra watch`
**Description:** Live reload mode - auto-restart process when secrets change in cloud.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branch>` - Branch name (default: main)
- `--interval <seconds>` - Poll interval in seconds (default: 5)
- `--shell` - Use shell mode for child process

**Behavior:**
- Polls cloud every N seconds for secret changes
- On change detected: kills current process and restarts with new secrets
- Blocked for production (too dangerous for live environments)
- Graceful shutdown on Ctrl+C
- Shows status messages with timestamps

**Use Cases:**
- Development environment with frequently changing secrets
- Testing rotation behavior
- Feature development with shared test credentials

**Examples:**
```bash
# Watch development with default interval (5s)
xtra watch -p proj_123 -e development node app.js

# Faster polling (every 3 seconds)
xtra watch -p proj_123 -e development --interval 3 npm run dev

# Watch with shell scripts
xtra watch -p proj_123 -e development --shell "npm run dev"

# Watch specific branch
xtra watch -p proj_123 -b feature-auth node server.js
```

**Output:**
```
● xtra watch — watching development/main (every 5s)

  Press Ctrl+C to stop.

  [watch] Starting: node app.js
  [App output...]
  [watch] 10:30:45 — no changes
  [watch] 10:30:50 — no changes
  [watch] 10:30:55 — Secret change detected — restarting...
  [watch] Starting: node app.js
```

---

### 5.3 `xtra simulate`
**Description:** Dry-run mode for `xtra run` - show what would be injected without execution.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branch>` - Branch name (default: main)
- `--show-values` - Reveal actual secret values (default: masked)
- `--diff` - Highlight differences from local .env/process.env

**Behavior:**
- Fetches secrets that would be injected
- Shows them in formatted table
- Does NOT execute the command
- Safe for any environment (read-only)
- Useful for debugging and verification

**Examples:**
```bash
# See what would be injected
xtra simulate node app.js

# Simulation with production
xtra simulate -e production npm start

# Show actual values (caution)
xtra simulate -e staging --show-values

# Compare with local environment
xtra simulate -e staging --diff

# Full simulation with all details
xtra simulate -p proj_123 -e production npm run build --show-values --diff
```

**Output:**
```
● Simulation — xtra run node app.js

   Project : proj_123
   Env     : staging
   Branch  : main
   Secrets : 12 would be injected

| Key             | Injected Value | Local .env      | Status       |
|-----------------|----------------|-----------------|--------------|
| DATABASE_URL    | ••••••••       | postgres://...  | ⚡ Override  |
| API_KEY         | ••••••••       | ••••••••        | Same         |
| JWT_SECRET      | ••••••••       | -               | New          |
...

✔ Simulation complete. 12 secret(s) would be injected.
Run without 'simulate' to actually execute the command.
```

---

## 6. Configuration & Generation Commands

### 6.1 `xtra generate`
**Description:** Generate local configuration files from secrets (.env, JSON, YAML).

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: dev)
- `-b, --branch <branchName>` - Branch name
- `-o, --output <path>` - Output file path (forces full overwrite)
- `-f, --format <format>` - Output format: env, json, yaml (default: env)
- `--force` - Skip confirmation prompts

**Behavior:**
- For .env format (no -o flag): **Merges** with existing file (preserves comments)
- With -o flag or different format: **Overwrites** file completely
- Detects format from file extension if not specified
- Creates new keys, updates existing ones
- Preserves .env formatting and comments when merging

**Examples:**
```bash
# Generate .env (merge with existing)
xtra generate

# Generate for production
xtra generate -e production

# Generate JSON format
xtra generate -f json -o config.json

# Generate YAML
xtra generate -f yaml -o secrets.yaml

# Full overwrite mode
xtra generate -o .env.production --force

# Generate for specific branch
xtra generate -b feature-auth -e development

# All options
xtra generate -p proj_123 -e staging -b develop -f json -o config.staging.json --force
```

**Output (merge mode):**
```
Fetching secrets for staging (branch: main)...
Merging with existing .env file...
✔ Successfully merged 12 secrets into .env

Added   : DATABASE_URL, API_KEY
Updated : JWT_SECRET, REFRESH_TOKEN
```

**Output (overwrite mode):**
```
✔ Generated secrets.json
```

---

### 6.2 `xtra import`
**Description:** Import secrets from file (JSON, Dotenv, CSV).

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branchName>` - Branch name
- `-f, --format <format>` - Format detection: json, dotenv, csv (auto-detected)
- `--prefix <prefix>` - Add prefix to all imported keys
- `--overwrite` - Merge or overwrite mode (API usually upserts)

**Behavior:**
- Auto-detects format from file extension
- Parses file and uploads to cloud
- Supports prefix for namespacing secrets
- Creates/updates secrets (API handles merging)
- Logs audit trail of import

**Supported Formats:**

**JSON:**
```json
{
  "DATABASE_URL": "postgres://...",
  "API_KEY": "sk_12345"
}
```

**Dotenv (.env):**
```
DATABASE_URL=postgres://...
API_KEY=sk_12345
```

**CSV (with headers):**
```
key,value
DATABASE_URL,postgres://...
API_KEY,sk_12345
```

**Examples:**
```bash
# Import from JSON
xtra import secrets.json -e staging

# Import from .env file
xtra import .env.production -e production

# Import CSV
xtra import secrets.csv -e development

# Import with prefix
xtra import config.json --prefix APP_ -e staging
# Creates: APP_DATABASE_URL, APP_API_KEY, etc.

# Import to specific project/branch
xtra import secrets.json -p proj_123 -e staging -b feature-auth

# Format inference from extension
xtra import data.json      # JSON detected
xtra import .env.local    # Dotenv detected
xtra import secrets.csv   # CSV detected
```

**Output:**
```
Reading json file...
Importing 8 secrets to staging (branch: main)...
✔ Successfully imported 8 secrets.
```

---

### 6.3 `xtra export`
**Description:** Export secrets to file (JSON, Dotenv, CSV).

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branchName>` - Branch name
- `-f, --format <format>` - Output format: json, dotenv, csv (default: json)
- `-o, --output <file>` - Output file path (default: stdout)

**Behavior:**
- Fetches secrets from cloud
- Exports in requested format
- If no output specified: prints to stdout (pipe-friendly)
- If output specified: writes to file
- Logs export in audit trail

**Examples:**
```bash
# Export to stdout (JSON)
xtra export

# Export to file
xtra export -o secrets.json

# Export as .env file
xtra export -f dotenv -o .env.production

# Export as CSV
xtra export -f csv -o secrets.csv

# Export production and pipe to grep
xtra export -e production | grep DATABASE

# Export and pipe to jq
xtra export -e production | jq '.API_KEY'

# Export with format override
xtra export -p proj_123 -e staging -f yaml -o config.yaml
```

**Output (JSON):**
```json
{
  "DATABASE_URL": "postgres://user:pass@host/db",
  "API_KEY": "sk_12345xyz",
  "JWT_SECRET": "secret123"
}
```

**Output (Dotenv):**
```
DATABASE_URL="postgres://user:pass@host/db"
API_KEY="sk_12345xyz"
JWT_SECRET="secret123"
```

---

### 6.4 `xtra template`
**Description:** Template engine - render config files with injected secrets.

#### Subcommand: `xtra template render <templateFile>`
**Description:** Render template file by substituting placeholders with secrets.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-b, --branch <branch>` - Branch name (default: main)
- `-o, --output <file>` - Output file (default: stdout)
- `--strict` - Exit with error if unresolved placeholders

**Placeholder Syntax:**
```
{{ secrets.KEY }}              # Replace with secret value
{{ secrets.KEY | default }}    # With fallback default
{{ env.KEY }}                  # Local environment variable
{{ env.KEY | default }}        # With fallback default
```

**Behavior:**
- Reads template file
- Fetches secrets from cloud
- Substitutes all placeholders
- Writes rendered output to file or stdout
- Reports missing keys and defaults used
- With `--strict`: fails if placeholders unresolved

**Template Examples:**
```yaml
# config.yaml.tpl
database:
  url: {{ secrets.DATABASE_URL }}
  pool_size: {{ secrets.DB_POOL_SIZE | 10 }}
  timeout: {{ env.DB_TIMEOUT | 5000 }}

api:
  key: {{ secrets.API_KEY }}
  endpoint: {{ secrets.API_ENDPOINT | https://api.example.com }}

app:
  debug: {{ env.DEBUG | false }}
  port: {{ env.PORT | 3000 }}
```

**Examples:**
```bash
# Render and output to stdout
xtra template render config.yaml.tpl -p proj_123 -e production

# Render to file
xtra template render nginx.conf.tpl -p proj_123 -e production -o /etc/nginx/nginx.conf

# Render with strict mode (fail on missing placeholders)
xtra template render app.config.tpl -e production --strict

# Render for different environment
xtra template render docker.env.tpl -e staging -o docker.env

# Pipe rendered output
xtra template render config.tpl -e prod | tee config.yaml
```

#### Subcommand: `xtra template check <templateFile>`
**Description:** Check template for missing or unresolved placeholders without rendering.

**Examples:**
```bash
xtra template check config.yaml.tpl -e production
```

#### Subcommand: `xtra template list <templateFile>`
**Description:** List all placeholders found in template file.

**Examples:**
```bash
xtra template list config.yaml.tpl
```

**Output:**
```
Template Placeholders Found:
  secrets.DATABASE_URL (required)
  secrets.DB_POOL_SIZE (default: 10)
  env.DB_TIMEOUT (default: 5000)
  env.NODE_ENV (required)
```

---

## 7. Version Control & History Commands

### 7.1 `xtra history`
**Description:** View version history of a specific secret.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)

**Arguments:**
- `<key>` - Secret key to view history for

**Behavior:**
- Fetches all versions of a secret
- Shows timestamps, updater, version numbers
- Useful for audit and rollback decisions

**Examples:**
```bash
# View change history of DATABASE_URL
xtra history DATABASE_URL

# Check production secret history
xtra history API_KEY -e production

# Audit trail for specific secret
xtra history JWT_SECRET -p proj_123 -e staging
```

**Output:**
```
History for DATABASE_URL (production)
Current Version: 5

v5 - 2026-02-25 10:30:15 by admin@company.com
  Updated via CLI

v4 - 2026-02-20 14:22:30 by dev@company.com
  Rotation completed

v3 - 2026-02-15 09:15:00 by admin@company.com
  Initial value

v2 - 2026-01-30 16:45:20 by admin@company.com
  Previous rotation

v1 - 2026-01-01 00:00:00 by admin@company.com
  Created
```

---

### 7.2 `xtra rollback`
**Description:** Rollback a secret to a previous version.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: dev)

**Arguments:**
- `<key>` - Secret key
- `<version>` - Version number to restore to

**Behavior:**
- Shows interactive list of previous versions
- Allows selection of version to restore
- Creates new version entry (doesn't delete history)
- Full audit trail preserved
- Shows old values for selection

**Examples:**
```bash
# Interactive rollback selection
xtra rollback DATABASE_URL

# Rollback to specific version
xtra rollback API_KEY v2 -e production

# Rollback in non-default environment
xtra rollback SECRET_KEY v5 -p proj_123 -e staging
```

**Output:**
```
Fetching history for DATABASE_URL...
Select version to restore:
  1) v5 - 2026-02-25 (Value: postgres://...)
  2) v4 - 2026-02-20 (Value: postgres://...)
  3) v3 - 2026-02-15 (Value: postgres://...)

Selected: v3
Restoring version v3...
✔ Successfully rolled back to v3 (New current version: v6)
```

---

## 8. Integration Commands

### 8.1 `xtra integration`
**Description:** Manage external service integrations (GitHub, etc.).

#### Subcommand: `xtra integration sync`
**Description:** Sync secrets to GitHub as repository secrets.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `--github` - Sync to GitHub (implied)
- `--repo <owner/repo>` - GitHub repository (format: owner/repo)
- `--prefix <prefix>` - Prefix for secret keys

**Behavior:**
- Requires GitHub connection via web dashboard first
- Syncs XtraSync secrets to GitHub repository secrets
- Can create GitHub secrets folder structure with prefix
- Useful for GitHub Actions workflows

**Examples:**
```bash
# Interactive repo selection
xtra integration sync -p proj_123 -e production

# Sync to specific repo
xtra integration sync -p proj_123 -e production --repo owner/myrepo

# Add prefix for namespacing
xtra integration sync -p proj_123 -e production --repo owner/myrepo --prefix APP_

# Result in GitHub: APP_DATABASE_URL, APP_API_KEY, etc. as repository secrets
```

**Output:**
```
Connected as: github-username

Syncing secrets from production to GitHub repo: owner/myrepo...
✔ Successfully synced 8 secrets!

✔ DATABASE_URL
✔ API_KEY
✔ JWT_SECRET
...
```

---

### 8.2 `xtra integration kubernetes`
**Description:** Export secrets as Kubernetes manifests.

#### Subcommand: `xtra integration kubernetes export`
**Description:** Generate Kubernetes Secret YAML manifest.

**Options:**
- `-p, --project <id>` - Project ID
- `-e, --env <environment>` - Environment (default: development)
- `-n, --namespace <namespace>` - Kubernetes namespace (default: default)
- `-o, --output <file>` - Output file path
- `--name <name>` - Secret resource name

**Behavior:**
- Fetches secrets from XtraSync
- Generates Kubernetes Secret manifest YAML
- Can write to file or stdout
- Useful for GitOps workflows

**Examples:**
```bash
# Generate to stdout
xtra integration kubernetes export -p proj_123 -e production

# Save to file
xtra integration kubernetes export -p proj_123 -e production -o secrets.yaml

# Custom namespace and name
xtra integration kubernetes export -p proj_123 -e production -n apps --name app-secrets -o secrets.yaml

# Apply directly to cluster
xtra integration kubernetes export -p proj_123 -e production | kubectl apply -f -
```

**Output:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: apps
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXM6Ly8uLi4=
  API_KEY: c2tfMTIzNDU=
  JWT_SECRET: c2VjcmV0MTIz
```

---

## 9. Audit & Security Commands

### 9.1 `xtra logs`
**Description:** View local audit logs of secret access and operations.

**Options:**
- `-n, --limit <number>` - Number of logs to show (default: 20)
- `--sync` - Sync unsynced logs to cloud
- `--event <type>` - Filter by event type (e.g., SECRET_UPDATE)
- `--project <projectId>` - Filter by project ID
- `--since <duration>` - Show logs since duration (e.g., 1h, 24h, 7d, 30d)
- `--json` - Output raw JSON (pipe-friendly)

**Behavior:**
- Reads local audit log file
- Filters by various criteria
- Syncs unsynced logs to cloud for compliance
- Useful for personal audit trail and debugging

**Filter Format:**
- `--since` accepts: `1h`, `24h`, `7d`, `30d`, `1m`, `6h`

**Examples:**
```bash
# Show recent 20 logs
xtra logs

# Show more logs
xtra logs -n 50

# Filter by event type
xtra logs --event SECRET_UPDATE

xtra logs --event SECRET_ACCESS -n 30

# Show logs from last 24 hours
xtra logs --since 24h

# Filter by project
xtra logs --project proj_123

# Combined filters
xtra logs --event SECRET_UPDATE --since 7d --project proj_123 -n 50

# JSON output for parsing
xtra logs --json | jq '.[] | select(.action=="SECRET_UPDATE")'

# Sync logs to cloud
xtra logs --sync
```

**Output:**
```
Local Audit Logs

| Timestamp           | Action        | Project  | Sync | Details            |
|---------------------|---------------|----------|------|-------------------|
| 2026-02-25 10:30:15 | SECRET_UPDATE | proj_... | ✔    | Keys: 2           |
| 2026-02-25 10:25:30 | SECRET_ACCESS | proj_... | ✔    | key: DATABASE_URL |
| 2026-02-25 10:20:45 | SECRET_ROTATE | proj_... | ✖    | expiresAt: ...    |

Showing 3 of 47 total logs.
```

---

### 9.2 `xtra audit`
**Description:** Manage and verify server-side audit logs.

#### Subcommand: `xtra audit verify`
**Description:** Verify integrity of audit log chain (Tamper-Evident).

**Behavior:**
- Cryptographically verifies audit chain hasn't been modified
- Detects tampering attempts
- Shows where chain is broken if detected
- Used for compliance certification

**Examples:**
```bash
xtra audit verify
```

**Output (Success):**
```
✔ Audit chain integrity verified! All 1,247 entries are valid.
```

**Output (Failure):**
```
✗ Verification Failed!
Broken at Log ID: 456
Reason: Hash mismatch for entry 456
```

#### Subcommand: `xtra audit export`
**Description:** Export audit logs for compliance (SOC2, ISO compliance).

**Options:**
- `-f, --format <format>` - Format: json or csv (default: json)
- `--start <date>` - Start date (YYYY-MM-DD)
- `--end <date>` - End date (YYYY-MM-DD)
- `-o, --output <file>` - Output file path

**Behavior:**
- Exports server-side audit logs
- Used for compliance audits
- Can filter by date range
- Outputs machine-readable format

**Examples:**
```bash
# Export all logs as JSON
xtra audit export

# Export to file
xtra audit export -o audit-logs.json

# CSV format for spreadsheets
xtra audit export -f csv -o audit-logs.csv

# Date range
xtra audit export --start 2026-01-01 --end 2026-02-25 -o audit-q1.json

# Current month
xtra audit export --start 2026-02-01 --end 2026-02-28 -f csv
```

---

### 9.3 `xtra scan`
**Description:** Scan project for leaked secrets and git tracking issues.

**Options:**
- `--staged` - Scan only staged files (for pre-commit hooks)
- `--install-hook` - Install the git pre-commit hook

**Behavior:**
- Checks if .env is accidentally tracked by git
- Scans files for hardcoded secrets (API keys, tokens)
- Can be used as pre-commit hook
- Blocks commits if secrets detected

**Patterns Detected:**
- Xtra API keys (xs_* pattern)
- Hardcoded passwords/tokens with specific patterns
- .env files being tracked

**Examples:**
```bash
# Scan all files
xtra scan

# Scan staged files (pre-commit)
xtra scan --staged

# Install pre-commit hook
xtra scan --install-hook

# Hook will run automatically on git commit
git add .
git commit -m "Fix bug"  # Hook runs: xtra scan --staged
```

**Output (Success):**
```
XtraSync Secret Scan
✔ Scan passed. No secrets found.
```

**Output (Failure):**
```
XtraSync Secret Scan
✗ CRITICAL: .env file is tracked by git!
✗ [src/config.js] Potential Secret Detected: Xtra API Key
✖ Scan failed. found 2 issues.
```

---

## 10. Access Control & Admin Commands

### 10.1 `xtra access`
**Description:** Just-in-Time access request management.

#### Subcommand: `xtra access request`
**Description:** Request temporary access to secrets.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-s, --secret <secretId>` - Specific secret ID (optional)
- `-d, --duration <minutes>` - Duration in minutes (required)
- `-r, --reason <text>` - Reason for access (required)

**Behavior:**
- Creates JIT access request
- Notifies admins for approval
- Access expires after specified duration
- Logged for audit trail
- Reason required for compliance

**Examples:**
```bash
# Request 30 minutes of access
xtra access request -p proj_123 -d 30 -r "Investigating production issue"

# Request for specific secret
xtra access request -p proj_123 -s DATABASE_PASSWORD -d 15 -r "Emergency password reset"

# Request 2 hours (120 minutes)
xtra access request -p proj_123 -d 120 -r "Deploying hotfix to production"
```

**Output:**
```
✔ Access request submitted! (ID: req_12345)
Status: pending
[Notification sent to admins]
```

#### Subcommand: `xtra access list`
**Description:** List access requests (yours or pending for admins).

**Options:**
- `--pending` - Show pending approvals (admin only)

**Examples:**
```bash
# Show my requests
xtra access list

# Show pending approvals (admin)
xtra access list --pending
```

**Output:**
```
| ID        | User              | Target           | Duration | Reason              | Status    |
|-----------|-------------------|------------------|----------|---------------------|-----------|
| req_001   | user@company.com  | Secret: API_KEY  | 30m      | Issue investigation | approved  |
| req_002   | dev@company.com   | Project: proj123 | 60m      | Hotfix deploy       | pending   |
```

#### Subcommand: `xtra access approve`
**Description:** Approve or reject access requests (admin).

**Options:**
- `--decision <decision>` - Decision: approved or rejected (required)

**Arguments:**
- `<requestId>` - Request ID to approve/reject

**Examples:**
```bash
# Approve request
xtra access approve req_001 --decision approved

# Reject request
xtra access approve req_002 --decision rejected
```

**Output (Approved):**
```
✔ Request approved!
Access granted until: 2026-02-25 11:30:00
```

---

### 10.2 `xtra admin`
**Description:** Administrative user and role management.

#### Subcommand: `xtra admin users`
**Description:** List all users in workspace with their roles.

**Options:**
- `-t, --team <teamId>` - Filter by team ID

**Examples:**
```bash
# List all users
xtra admin users

# List users in specific team
xtra admin users -t team_123
```

**Output:**
```
Users:

| Email                 | Name            | Role       | Status |
|-----------------------|-----------------|------------|--------|
| owner@company.com     | Company Owner   | owner      | active |
| admin@company.com     | Admin User      | admin      | active |
| dev@company.com       | Developer       | developer  | active |
| viewer@company.com    | Viewer          | viewer     | active |
```

#### Subcommand: `xtra admin set-role`
**Description:** Change a user's role.

**Options:**
- `-t, --team <teamId>` - Team ID (for team-specific role)

**Arguments:**
- `<email>` - User email
- `<role>` - New role (owner, admin, developer, viewer, guest)

**Valid Roles:**
- `owner` - Full access, billing
- `admin` - Manage users, secrets, audit
- `developer` - Create/update secrets
- `viewer` - Read-only access
- `guest` - Limited guest access

**Examples:**
```bash
# Promote developer to admin
xtra admin set-role dev@company.com admin

# Downgrade admin to developer
xtra admin set-role user@company.com developer

# Set team-specific role
xtra admin set-role dev@company.com developer -t team_123
```

**Output:**
```
✔ Role updated: dev@company.com → admin
```

#### Subcommand: `xtra admin role list`
**Description:** List all available roles in the system.

**Examples:**
```bash
xtra admin role list
```

**Output:**
```
Available Roles:

| Role       | Description                          | Permissions            |
|------------|--------------------------------------|------------------------|
| owner      | Full workspace access, billing       | All permissions        |
| admin      | Manage users, secrets, audit         | Most permissions       |
| developer  | Create/update secrets                | secrets:write          |
| viewer     | Read-only access                     | secrets:read           |
| guest      | Limited guest access                 | Limited read access    |
```

---

## 11. CI/CD Commands

### 11.1 `xtra ci`
**Description:** CI/CD headless mode for automation pipelines.

**Environment Variables Required:**
- `XTRA_MACHINE_TOKEN` - Service account token (required)
- `XTRA_API_URL` - Override API URL (optional)

**Behavior:**
- No interactive prompts
- JSON output (pipe-friendly)
- Non-zero exit codes on failure
- Designed for GitHub Actions, GitLab CI, Jenkins, etc.

#### Subcommand: `xtra ci secrets`
**Description:** Fetch secrets as JSON.

**Options:**
- `-p, --project <id>` - Project ID (required)
- `-e, --env <environment>` - Environment (required)
- `-b, --branch <branch>` - Branch name (default: main)
- `--keys <keys>` - Comma-separated keys to include (default: all)

**Examples:**
```bash
# Fetch all secrets
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci secrets -p proj_123 -e production

# Fetch specific keys only
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci secrets -p proj_123 -e production --keys DATABASE_URL,API_KEY

# Pipe to jq
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci secrets -p proj_123 -e production | jq '.secrets.DATABASE_URL'

# In GitHub Actions
- name: Fetch Secrets
  env:
    XTRA_MACHINE_TOKEN: ${{ secrets.XTRA_MACHINE_TOKEN }}
  run: xtra ci secrets -p proj_123 -e production | jq '.secrets'
```

**Output:**
```json
{
  "ok": true,
  "project": "proj_123",
  "env": "production",
  "branch": "main",
  "secrets": {
    "DATABASE_URL": "postgres://...",
    "API_KEY": "sk_12345",
    "JWT_SECRET": "secret123"
  }
}
```

#### Subcommand: `xtra ci set`
**Description:** Set secrets in CI mode (KEY=VALUE).

**Options:**
- `-p, --project <id>` - Project ID (required)
- `-e, --env <environment>` - Environment (required)
- `-b, --branch <branch>` - Branch name (default: main)

**Examples:**
```bash
# Set single secret
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci set -p proj_123 -e staging API_KEY=new_key_123

# Set multiple secrets
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci set -p proj_123 -e staging \
  DATABASE_URL=postgres://... \
  API_KEY=sk_xxx \
  JWT_SECRET=secret
```

#### Subcommand: `xtra ci export`
**Description:** Export secrets to file in CI mode.

**Options:**
- `-p, --project <id>` - Project ID (required)
- `-e, --env <environment>` - Environment (required)
- `-f, --format <format>` - Format: dotenv, json, yaml (default: dotenv)
- `-o, --output <file>` - Output file

**Examples:**
```bash
# Export to .env file
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci export -p proj_123 -e production -f dotenv -o .env

# Export as JSON
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci export -p proj_123 -e production -f json -o config.json

# In Docker build
RUN XTRA_MACHINE_TOKEN=tok_xxx xtra ci export -p proj_123 -e production -o .env && \
    npm run build
```

#### Subcommand: `xtra ci run`
**Description:** Run command with secrets injected in CI mode.

**Options:**
- `-p, --project <id>` - Project ID (required)
- `-e, --env <environment>` - Environment (required)

**Examples:**
```bash
# Run build with secrets
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci run -p proj_123 -e production npm run build

# Run tests
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci run -p proj_123 -e staging npm test

# Run deployment
XTRA_MACHINE_TOKEN=tok_xxxx xtra ci run -p proj_123 -e production -- python deploy.py
```

---

## 12. Diagnostic & Utility Commands

### 12.1 `xtra doctor`
**Description:** Diagnose CLI setup and connectivity issues.

**Options:**
- `--json` - Output diagnostics as JSON

**Checks Performed:**
1. Node.js version (requires >=18)
2. Authentication token status
3. API URL configuration
4. API connectivity/reachability
5. Active project setting
6. Active branch
7. Project configuration files
8. Overall system health

**Examples:**
```bash
# Run diagnostics
xtra doctor

# JSON output for automation
xtra doctor --json
```

**Output:**
```
  ⚕ XtraSecurity Diagnostics
  ╭──────────────────────────────────────────────────────────╮
  │ ✓   Node.js Version       v18.15.0 (OK)                 │
  │ ✓   Auth Token           Set (xs_abc123...)             │
  │ ✓   API URL              https://xtra-security...       │
  │ ✓   API Connectivity     200 OK                         │
  │ ✓   Active Project       proj_abc123                    │
  │ ✓   Active Branch        main                           │
  │ ✓   Project Config       .xtrarc found                  │
  ╰──────────────────────────────────────────────────────────╯

  ✓ All systems operational. The CLI is ready to use.
```

**Output (Issues):**
```
  Found 2 error(s) and 1 warning(s).

  ✗   Auth Token            Not set — run 'xtra login'
  ⚠   Active Project        Not set — run 'xtra project set <id>'
  ✓   API Connectivity      200 OK
```

---

### 12.2 `xtra profile`
**Description:** Manage named configuration profiles (multiple workspace support).

#### Subcommand: `xtra profile list`
**Description:** List all saved profiles.

**Examples:**
```bash
xtra profile list
```

**Output:**
```
Profiles:

| Profile  | API URL               | Project   | Status   |
|----------|----------------------|-----------|----------|
| ▶ work   | https://api...       | proj_123  | active   |
|   personal | (default)          | proj_456  | inactive |
|   staging | https://staging...   | proj_789  | inactive |
```

#### Subcommand: `xtra profile create <name>`
**Description:** Create a new profile with custom settings.

**Options:**
- `--url <apiUrl>` - API URL for this profile
- `--project <projectId>` - Default project
- `--token <token>` - Auth token for profile

**Examples:**
```bash
# Interactive creation
xtra profile create work

# Create with all options
xtra profile create staging --url https://staging-api.com --project proj_789 --token tok_xxx

# Create for personal projects
xtra profile create personal
```

#### Subcommand: `xtra profile use <name>`
**Description:** Switch to a different profile.

**Behavior:**
- Changes active profile persistently
- All future commands use this profile
- Can be overridden per-command with `--profile` flag

**Examples:**
```bash
# Switch to staging profile
xtra profile use staging

# Then all commands use staging profile
xtra secrets list  # Uses staging profile
```

#### Subcommand: `xtra profile set <name>`
**Description:** Update values in existing profile.

**Options:**
- `--url <apiUrl>` - Update API URL
- `--project <projectId>` - Update project
- `--token <token>` - Update auth token
- `--env <environment>` - Update default environment

**Examples:**
```bash
# Update project
xtra profile set work --project proj_new

# Update API URL
xtra profile set staging --url https://new-staging-api.com

# Update token
xtra profile set personal --token tok_new
```

#### Subcommand: `xtra profile delete <name>`
**Description:** Remove a profile.

**Examples:**
```bash
xtra profile delete old-profile
```

**Usage in Commands:**
```bash
# Use specific profile for a single command
xtra --profile staging secrets list

# Set profile env var
XTRA_PROFILE=work xtra run npm start
```

---

### 12.3 `xtra status`
**Description:** Check synchronization status with cloud for current environment.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: dev)
- `-b, --branch <branchName>` - Branch name

**Behavior:**
- Compares local manifest with remote state
- Shows which secrets are in sync, modified, deleted, or new
- Uses local cache/manifest from previous `xtra run` command
- Non-destructive check

**Examples:**
```bash
# Check sync status
xtra status

# Check production
xtra status -e production

# Check specific project/branch
xtra status -p proj_123 -e staging -b develop
```

**Output:**
```
| Secret Key      | Status         | Local Last Updated  |
|-----------------|----------------|---------------------|
| DATABASE_URL    | Synced         | 2026-02-25 10:30:00 |
| API_KEY         | MODIFIED       | 2026-02-20 14:22:00 |
| JWT_SECRET      | NEW (Remote)   | -                   |
| OLD_KEY         | DELETED (Rem)  | 2026-02-15 09:15:00 |

⚠ Found 3 difference(s).

Next steps:
  xtra generate              # pull cloud secrets → .env (merge)
  xtra generate -f json      # pull cloud secrets → secrets.json
  xtra run node app.js       # inject secrets at runtime (no file)
  xtra local sync            # pull cloud secrets → .env.local
```

---

### 12.4 `xtra diff`
**Description:** Show differences between environments or local vs remote.

**Options:**
- `-p, --project <projectId>` - Project ID
- `-e, --env <environment>` - Environment (default: dev)
- `-b, --branch <branchName>` - Branch name
- `--show` - Reveal actual values (sensitive)

**Arguments:**
- `[env1]` and `[env2]` - Two environments to compare (optional)

**Behavior:**
- If two envs given: compares remote env1 vs env2
- If no envs: compares remote vs local cache
- Shows additions, modifications, deletions
- Without `--show`: masks secret values

**Examples:**
```bash
# Compare local cache vs remote
xtra diff

# Compare two environments
xtra diff production staging

xtra diff staging development

# Show actual values (caution)
xtra diff production staging --show

# Cross-project diff (rare)
xtra diff -p proj_123 staging production
```

**Output:**
```
Diff Report (production <-> staging @ main):

+ DATABASE_BACKUP_URL (Only in staging)
- DEPRECATED_KEY (Only in production)
~ API_ENDPOINT (Modified)
  - "https://api.prod.io"
  + "https://api.staging.io"

(Use --show to reveal secret values)
```

---

### 12.5 `xtra completion`
**Description:** Generate shell completion scripts for bash/zsh/PowerShell.

#### Subcommand: `xtra completion bash`
**Description:** Generate bash completion script.

**Examples:**
```bash
# View completion script
xtra completion bash

# Install permanently in ~/.bashrc
xtra completion bash >> ~/.bashrc

# Use directly
source <(xtra completion bash)
```

#### Subcommand: `xtra completion zsh`
**Description:** Generate zsh completion script.

**Examples:**
```bash
# Install for zsh
xtra completion zsh >> ~/.zshrc

source ~/.zshrc
```

#### Subcommand: `xtra completion powershell`
**Description:** Generate PowerShell completion.

**Examples:**
```powershell
# View completion
xtra completion powershell

# Add to profile
xtra completion powershell | Out-File -Append $PROFILE
```

#### Subcommand: `xtra completion install`
**Description:** Auto-detect and install completion for current shell.

**Examples:**
```bash
xtra completion install
```

---

### 12.6 `xtra ui`
**Description:** Interactive TUI (Terminal User Interface) dashboard.

**Behavior:**
- React-based terminal UI using Ink
- Navigate with arrow keys
- Shows projects, environments, and secrets
- Interactive secret viewing
- Fully terminal-based GUI
- No external browser required

**Key Bindings:**
- `↑↓` - Navigate items
- `Enter` - Select/load
- `Tab` - Switch panels
- `V` - Toggle value visibility
- `Q` - Quit

**Examples:**
```bash
xtra ui
```

**Features:**
- Three-panel layout: Projects | Environments | Secrets
- Interactive navigation
- Show/hide secret values
- Real-time sync with cloud
- Seamless terminal experience

---

## Quick Reference: Command Categories

### Authentication & Setup
- `xtra login` - Authenticate
- `xtra init` - Initialize project
- `xtra doctor` - Diagnose setup

### Project Management
- `xtra project set` - Set active project
- `xtra project current` - Show active project
- `xtra branch list/create/delete/update` - Manage branches
- `xtra checkout` - Switch branch

### Secrets Operations
- `xtra secrets list` - List secrets
- `xtra secrets set` - Create/update secrets
- `xtra rotate` - Rotate secret with shadow mode
- `xtra history` - View secret versions
- `xtra rollback` - Revert to previous version

### File Operations
- `xtra generate` - Create .env/JSON/YAML files
- `xtra import` - Load secrets from file
- `xtra export` - Save secrets to file
- `xtra template render` - Inject into templates

### Execution
- `xtra run` - Execute with injected secrets
- `xtra watch` - Live reload on secret changes
- `xtra simulate` - Dry-run (no execution)
- `xtra ci` - CI/CD headless mode

### Environment & Config
- `xtra local` - Toggle offline mode
- `xtra env clone` - Copy between environments
- `xtra diff` - Compare secrets
- `xtra status` - Check sync status

### Utilities
- `xtra scan` - Detect potential leaks
- `xtra logs` - View audit trail
- `xtra audit verify/export` - Compliance audits
- `xtra access` - JIT access requests
- `xtra admin` - User/role management
- `xtra integration` - GitHub, Kubernetes, etc.
- `xtra profile` - Multiple workspace profiles
- `xtra completion` - Shell completion
- `xtra ui` - Terminal dashboard

---

## Tips & Best Practices

### Security Best Practices
1. **Never use `--show`** in shared/recorded sessions
2. **Use JIT access** (`xtra access request`) for temporary access
3. **Enable scanning** (`xtra scan --install-hook`) to prevent leaks
4. **Rotate regularly** using shadow mode (`xtra rotate`)
5. **Verify audit logs** (`xtra audit verify`)

### Development Workflow
1. Build locally: `xtra run npm start`
2. Keep secrets in sync: `xtra watch npm run dev`
3. Preview injection: `xtra simulate`
4. Generate config: `xtra generate -f json`

### CI/CD Integration
```bash
# Set env var in pipeline
export XTRA_MACHINE_TOKEN=tok_xxx

# Fetch secrets
xtra ci secrets -p proj_123 -e production > .env

# Run build
xtra ci run -p proj_123 -e production npm run build
```

### Production Deployments
```bash
# Container build
RUN XTRA_MACHINE_TOKEN=... xtra ci export -p proj_123 -e production -o .env && \
    npm run build

# Or at runtime
CMD ["xtra", "run", "-e", "production", "node", "app.js"]
```

### Local Offline Development
```bash
# Initial sync
xtra local sync -e development

# Enable local mode
xtra local on

# Develop normally
xtra run npm start  # Reads .env.local
```

---

## Error Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `Unauthorized` | Invalid token | Run `xtra login` |
| `Project not found` | Wrong project ID or no access | Verify project ID with `xtra project current` |
| `No secrets found` | Environment empty or wrong branch | Check `xtra secrets list`, verify branch with `xtra checkout` |
| `Local mode is ON but .env.local not found` | Missing sync | Run `xtra local sync` |
| `Connection refused` | Network/API down | Check `xtra doctor`, verify internet |
| `Access denied to production` | Insufficient permissions | Request access via `xtra access request` |
| `.env file is tracked` | Git tracking leak | Remove from git: `git rm --cached .env` |
| `Shell mode required` | Command has pipes/redirects | Add `--shell` flag |

---

**End of Command Reference**
Generated: February 25, 2026
Total Commands Documented: 31+ main commands with 40+ subcommands
