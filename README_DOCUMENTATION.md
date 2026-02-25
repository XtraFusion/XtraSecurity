# XtraSync CLI Complete Documentation

## 📚 Documentation Files Created

This package contains **3 comprehensive documentation resources** covering all **31 commands** with **40+ subcommands** of the XtraSecurity CLI.

### Files Included

#### 1. **CLI_COMMANDS_REFERENCE.md** (Recommended for Chatbot)
- **Format**: Markdown (human-readable)
- **Size**: ~20KB
- **Content**: 
  - Detailed descriptions for each command
  - All options and flags explained
  - Multiple examples per command
  - Common patterns and best practices
  - Error troubleshooting
  - Tips for developers
- **Best For**: Chatbots, documentation websites, detailed reference

#### 2. **CLI_COMMANDS_REFERENCE.json** (Recommended for Integration)
- **Format**: Structured JSON
- **Size**: ~50KB
- **Content**:
  - Machine-readable command metadata
  - Organized by category
  - All options and subcommands
  - Examples for each command
  - Environment variables
  - Best practices
  - Error references
- **Best For**: API integration, chatbot backend, automated processing

#### 3. **CLI_COMMANDS_QUICK_REFERENCE.csv** (Recommended for Lookup)
- **Format**: CSV (tab-separated)
- **Size**: ~15KB
- **Content**:
  - Quick lookup table
  - Command names and categories
  - Subcommands listed
  - Brief descriptions
  - Key options
  - Example usage
  - Key features
- **Best For**: Quick reference, spreadsheet analysis, scanning

---

## 📋 Command Summary

### Total Commands: **31**
### Total Subcommands: **40+**
### Total Options/Flags: **200+**

---

## 🗂️ Commands by Category

### 1. **Authentication (1 command)**
- `login` - Authenticate with SSO, Email, or Access Key

### 2. **Project & Setup (4 commands)**
- `init` - Initialize project configuration
- `project` - Set/manage default project
- `branch` - Manage project branches
- `checkout` - Switch active branch

### 3. **Secrets Management (3 commands)**
- `secrets` - List, set, delete secrets
- `rotate` - Rotate with shadow mode
- `access` - JIT access requests

### 4. **Version Control (2 commands)**
- `history` - View secret versions
- `rollback` - Revert to previous version

### 5. **Execution (3 commands)**
- `run` - Execute with injected secrets
- `watch` - Live reload on changes
- `simulate` - Dry-run preview

### 6. **Configuration (5 commands)**
- `generate` - Create .env/JSON/YAML
- `import` - Load from file
- `export` - Save to file
- `template` - Template rendering engine
- `profile` - Multiple workspace profiles

### 7. **Environment (2 commands)**
- `local` - Offline mode toggle
- `env` - Environment cloning

### 8. **Audit & Logging (2 commands)**
- `logs` - Local audit logs
- `audit` - Server-side compliance logs

### 9. **Security (1 command)**
- `scan` - Leak detection

### 10. **Administration (1 command)**
- `admin` - User and role management

### 11. **Integrations (1 command)**
- `integration` - GitHub, Kubernetes, etc.

### 12. **CI/CD (1 command)**
- `ci` - Headless mode for pipelines

### 13. **Utilities (6 commands)**
- `status` - Sync status check
- `diff` - Environment comparison
- `doctor` - Diagnostics
- `ui` - Terminal dashboard
- `completion` - Shell completion
- (logs, audit are also utilities)

---

## 🚀 Quick Start Examples

### Authentication
```bash
xtra login                    # Interactive
xtra login --sso             # Browser login
xtra login --key xs_xxxxx    # Access key
```

### Initialize Project
```bash
xtra init                     # Interactive setup
xtra init -y                  # Auto with defaults
```

### Run with Secrets
```bash
xtra run node app.js          # Development
xtra run -e production npm run build    # Production
```

### Manage Secrets
```bash
xtra secrets list             # Show all
xtra secrets set API_KEY=xyz  # Create/update
xtra rotate DATABASE_PASSWORD # Shadow mode
xtra rotate PASSWORD --promote# Finalize rotation
```

### Generate Config
```bash
xtra generate                 # Create .env
xtra generate -f json -o config.json    # JSON
```

### CI/CD
```bash
export XTRA_MACHINE_TOKEN=tok_xxx
xtra ci secrets -p proj_123 -e production
xtra ci export -p proj_123 -e production -o .env
```

### Offline Mode
```bash
xtra local sync              # Pull secrets
xtra local on                # Enable offline
xtra run npm start           # Uses .env.local
```

---

## 🎯 Use Cases by Scenario

### Local Development
1. `xtra init` - Setup project
2. `xtra run npm start` - Develop with secrets
3. `xtra watch npm run dev` - Auto-reload on changes

### CI/CD Pipeline
1. Set `XTRA_MACHINE_TOKEN` env var
2. `xtra ci export -p proj -e env -o .env`
3. Use .env in build process

### Configuration Management
1. `xtra generate -f json -o config.json` - Create config
2. `xtra template render config.tpl` - Render templates
3. `xtra export -f dotenv > .env` - Export to .env

### Secret Rotation
1. `xtra rotate KEY` - Start rotation
2. Verify with rotated secret
3. `xtra rotate KEY --promote` - Make active

### Compliance & Audit
1. `xtra audit verify` - Check integrity
2. `xtra audit export -f csv` - Export logs
3. `xtra logs --since 30d` - View recent activity

### Access Control
1. `xtra access request -d 30 -r "reason"` - Request access
2. `xtra access list --pending` - Admin approval
3. Access automatically expires

### Multiple Workspaces
1. `xtra profile create work` - Create profile
2. `xtra profile create personal` - Another profile
3. `xtra profile use work` - Switch profiles
4. `xtra --profile personal secrets list` - Use per-command

---

## 📊 Command Statistics

| Category | Count | Examples |
|----------|-------|----------|
| Authentication | 1 | login |
| Project Management | 4 | init, project, branch, checkout |
| Secrets | 3 | secrets, rotate, access |
| Version Control | 2 | history, rollback |
| Execution | 3 | run, watch, simulate |
| Configuration | 5 | generate, import, export, template, profile |
| Environment | 2 | local, env |
| Audit | 2 | logs, audit |
| Security | 1 | scan |
| Admin | 1 | admin |
| Integration | 1 | integration |
| CI/CD | 1 | ci |
| Utilities | 5 | status, diff, doctor, ui, completion |
| **Total** | **31** | **40+ subcommands** |

---

## 🔐 Security Features

- **Zero-Disk Injection**: Secrets never written to disk with `xtra run`
- **Shadow Mode Rotation**: Test new secrets before activation
- **JIT Access**: Temporary access with expiration
- **Audit Trail**: Complete tamper-evident logs
- **Offline Safety**: Work without internet
- **Leak Detection**: Pre-commit scanning
- **Role-Based Access**: Owner/Admin/Developer/Viewer/Guest roles

---

## 🛠️ Integration Capabilities

### Cloud Platforms
- **GitHub** - Sync to repository secrets
- **Kubernetes** - Export as K8s manifests
- **Others** - Extensible integration framework

### File Formats
- **.env** - Dotenv format (merge-safe)
- **JSON** - Machine-readable
- **YAML** - Configuration files
- **CSV** - Spreadsheet-compatible

### Automation
- **CI/CD Pipelines** - GitHub Actions, GitLab CI, Jenkins
- **Docker** - In-container secret injection
- **Kubernetes** - Secret management
- **Templates** - Configuration templating

---

## 📖 How to Use These Files for Your Chatbot

### Option 1: Load JSON
```javascript
const commands = require('./CLI_COMMANDS_REFERENCE.json');
// Access: commands.commandReference.commands[0]
// Perfect for building chatbot knowledge base
```

### Option 2: Parse CSV
```python
import csv
with open('CLI_COMMANDS_QUICK_REFERENCE.csv') as f:
    commands = list(csv.DictReader(f))
# Quick lookup table
```

### Option 3: Reference Markdown
- Use for detailed responses
- Quote sections directly
- Include in help messages

### Option 4: Hybrid Approach (Recommended)
```
1. Use JSON as primary data source
2. Use CSV for quick lookups
3. Use Markdown for detailed explanations
```

---

## 🎓 Examples by User Level

### Beginner
```bash
# Setup
xtra login
xtra init

# Daily use
xtra run npm start
xtra secrets list
xtra local sync
```

### Intermediate
```bash
# Advanced features
xtra watch npm run dev
xtra rotate API_KEY --promote
xtra template render config.tpl
xtra simulate npm start
```

### Advanced
```bash
# Automation
XTRA_MACHINE_TOKEN=x xtra ci export -p proj -e prod -o .env
xtra audit verify
xtra admin set-role user@ex.com admin
xtra profile create work --url https://custom-api.com
```

---

## 🆘 Support Resources

### Troubleshooting
- See "Error Troubleshooting" section in CLI_COMMANDS_REFERENCE.md
- Run `xtra doctor` for diagnostics
- Check `xtra logs` for audit trail

### Common Issues
1. **"Unauthorized"** → Run `xtra login`
2. **"Project not found"** → Check `xtra project current`
3. **"Network error"** → Run `xtra doctor` to verify connectivity
4. **".env tracked in git"** → Run `git rm --cached .env`

### Additional Help
- `xtra --help` - General help
- `xtra <command> --help` - Command-specific help
- `xtra ui` - Interactive dashboard
- `xtra doctor` - System diagnostics

---

## 📝 Notes for Chatbot Implementation

### Data Structure
- **JSON file** contains all command metadata
- **CSV file** provides quick lookup table
- **Markdown file** has rich descriptions and examples

### Recommended Queries
```
User: "How do I..."
Bot: [Checks JSON for relevant commands]
Bot: [Provides markdown formatted response]
```

### Command Categories to Feature
1. Most Used: `run`, `secrets`, `init`, `login`
2. Powerful: `rotate`, `watch`, `template`
3. Admin: `audit`, `admin`, `access`
4. Advanced: `ci`, `integration`, `profile`

### Conversation Patterns
- User asks about task
- Bot identifies category
- Bot finds relevant command(s)
- Bot provides example with explanation
- Bot offers next steps

---

## 📈 File Statistics

| File | Format | Size | Records | Updated |
|------|--------|------|---------|---------|
| CLI_COMMANDS_REFERENCE.md | Markdown | 20KB | 31 commands | Feb 25, 2026 |
| CLI_COMMANDS_REFERENCE.json | JSON | 50KB | 31 commands + meta | Feb 25, 2026 |
| CLI_COMMANDS_QUICK_REFERENCE.csv | CSV | 15KB | 50+ rows | Feb 25, 2026 |

---

## ✅ Verification Checklist

- [x] All 31 commands documented
- [x] All major subcommands included (40+)
- [x] Examples provided for each command
- [x] Options fully described
- [x] Categories organized
- [x] Error handling documented
- [x] Best practices included
- [x] Quick reference available
- [x] JSON structure validated
- [x] CSV headers consistent

---

## 🚀 Ready for Chatbot!

These documentation files contain **everything needed** to build a comprehensive CLI chatbot. The JSON file can be loaded directly into your chatbot system, the CSV provides quick lookups, and the Markdown serves as detailed reference material.

**Suggested next steps:**
1. Load `CLI_COMMANDS_REFERENCE.json` into your chatbot's knowledge base
2. Index commands by keywords for search
3. Map user questions to command categories
4. Use Markdown descriptions for detailed responses
5. Provide examples from CSV/JSON data

---

**Generated**: February 25, 2026  
**CLI Version**: xtra-cli v0.2.7  
**Total Documentation**: 31 commands, 40+ subcommands, 200+ options
