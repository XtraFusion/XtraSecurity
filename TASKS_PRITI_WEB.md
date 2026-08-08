# 🎨 WEB APPLICATION & UI/UX TASK LIST — PRITI

**Assigned To**: Priti  
**Scope**: Frontend Web Application, Next.js App Router (`/app`), React Components (`/components`), Design Tokens & Styles (`/app/globals.css`), State Management (`/lib/store.tsx`), Forms & Validation (`@hookform/resolvers`, `zod`), Theme, Visual Secret Masking, UI Dashboards, Mobile Responsiveness, Toast Notifications.

---

> ⚠️ **CRITICAL CROSS-PLATFORM IMPACT NOTICE**
> Any UI changes that alter API request payloads or query parameters must be coordinated with **Nishant (Backend)** to ensure API routes accept the payload structure.
> Any UI feature displaying CLI status or SDK keys must align with the spec provided by **Atharva (CLI & SDK)**.

---

## 📌 TASK SUMMARY (35 TASKS)

### 🟢 Phase 1: Security, Route Polish & Core Fixes
- [ ] **P01: Clean Up & Protect Missing Middleware Routes**
  - **Details**: Ensure UI navigation respects protected routes. Coordinate with Nishant's middleware updates so `/team`, `/compliance`, `/profile`, `/analytics`, `/subscription`, `/jit` redirect unauthenticated users to `/login`.
- [ ] **P02: Fix Duplicate Team Route Conflict (`/team` vs `/teams`)**
  - **Details**: Deprecate legacy `/app/team` page component. Move remaining UI features (`TeamDetails.tsx`) into `/app/teams/[id]/page.tsx` and set up redirect.
- [ ] **P03: Fix Duplicate Comparison Route Conflict (`/comparison` vs `/comparisons`)**
  - **Details**: Merge static comparison pages in `/app/comparison/` into dynamic `/app/comparisons/[slug]/page.tsx` for consistent SEO and UI structure.
- [ ] **P04: Implement Visual Secret Diff & Version Rollback Modal**
  - **Details**: Build interactive comparison modal in `/app/projects/[id]/page.tsx` showing side-by-side version changes (v1 vs v2) with 1-click restore button.
  - ⚠️ *Cross-Platform Impact*: Trigger endpoint `POST /api/projects/[id]/secrets/[key]/rollback` built by Nishant.
- [ ] **P05: JIT Access Request & Grant UI Dashboard**
  - **Details**: Build user interface in `/app/access-requests/page.tsx` allowing developers to request temporary secret access (15m, 1h, 8h) with justification text.
- [ ] **P06: Searchable Audit Log Dashboard**
  - **Details**: Enhance `/app/audit/page.tsx` with date-range pickers, event filter dropdowns (SECRET_READ, ROTATION, LOGIN), and IP address filter pills.
- [ ] **P07: Secret Masking & Toggle Controls**
  - **Details**: Add eye icon toggle button to secret rows in project table allowing users to reveal values (`••••••••` -> `plaintext`). Implement "Hide All" master toggle.

---

### 🟡 Phase 2: User Dashboards, Management & Form Polish
- [ ] **P08: Bulk Secret Import/Export Modal**
  - **Details**: Build modal dialog supporting copy-paste of `.env` files, JSON payload preview, and file download (`.env`, `.env.example`).
- [ ] **P09: Team Invitation & Role Management UI**
  - **Details**: Enhance `/app/teams/page.tsx` with email invite input, role selector (Owner, Admin, Developer, Viewer), and pending invitation status badges.
- [ ] **P10: Interactive 2FA (TOTP) Setup Flow**
  - **Details**: Create modal step wizard displaying QR code, manual secret key, and 6-digit OTP verification input field.
- [ ] **P11: Secret Rotation Manager UI**
  - **Details**: Build schedule builder in `/app/rotation/page.tsx` for Daily, Weekly, Monthly, or Custom days rotation with Webhook URL field.
- [ ] **P12: SOC2/GDPR Compliance Report UI**
  - **Details**: Build dashboard layout in `/app/compliance/page.tsx` rendering security score gauges, unrotated secrets list, and "Download PDF Report" button.
- [ ] **P13: Third-Party Integration Connection Grid**
  - **Details**: Redesign `/app/integrations/page.tsx` into a card grid for 20+ services (AWS, Vercel, Netlify, Supabase, Slack, Vault) with connection status badges.
- [ ] **P14: Service Account Management UI**
  - **Details**: Add section in project settings to create non-human service accounts, scope permissions, and display one-time secret API token.
- [ ] **P15: Dark/Light Mode Theme Polish**
  - **Details**: Audit `next-themes` configuration in `layout.tsx` to eliminate white flash on page reload in dark mode.
- [ ] **P16: Mobile Responsive Navigation Drawer**
  - **Details**: Implement responsive mobile drawer menu using Radix UI Dialog/Sheet component for viewports `< 768px`.
- [ ] **P17: Secret Share Link Builder UI**
  - **Details**: Create UI form allowing users to select secret keys, set view limits (e.g. 1 view), and expiration time (e.g. 24h) to generate temporary share links.
- [ ] **P18: Live Secret Drift Detection Widget**
  - **Details**: Add visual banner on project dashboard indicating whether cloud secrets match active git branch.

---

### 🔵 Phase 3: Developer Experience & UI Refinements
- [ ] **P19: Command Palette (Ctrl+K / Cmd+K)**
  - **Details**: Implement global search palette using `cmdk` library for instant navigation to projects, teams, settings, and documentation.
- [ ] **P20: Toast Notification System**
  - **Details**: Replace native browser alerts with animated toasts using `sonner` for actions like "Secret Copied", "Saved", and error messages.
- [ ] **P21: Subscription & Billing Portal UI**
  - **Details**: Upgrade `/app/subscription/page.tsx` with usage progress bars (Workspaces used, API calls made), Razorpay modal checkout, and invoice table.
- [ ] **P22: Project Security Settings hardener UI**
  - **Details**: Add IP Allowlist input table, password complexity toggles, and forced 2FA switch inside `/app/projects/[id]/settings/page.tsx`.
- [ ] **P23: Stale Secret Alert Banners**
  - **Details**: Render warning badges next to secrets that have not been rotated in > 90 days.
- [ ] **P24: Webhook Configuration Dashboard**
  - **Details**: Create UI in project settings to manage webhook URLs, select event triggers (`secret.create`, `secret.update`), and view delivery logs.
- [ ] **P25: User Profile & Security Settings Page**
  - **Details**: Build `/app/profile/page.tsx` for updating user name, avatar, changing password, managing active sessions, and viewing personal API keys.
- [ ] **P26: Web Terminal Dashboard UI (`xtra ui` Mirror)**
  - **Details**: Create web-based terminal simulator component rendering ASCII dashboards for browser users.
- [ ] **P27: Interactive OpenAPI Documentation Viewer**
  - **Details**: Embed Swagger UI / Scalar component in `/app/developers/page.tsx` reading `/api/openapi.json`.
- [ ] **P28: Public System Status Page**
  - **Details**: Build `/app/health/page.tsx` displaying live status cards for API, Database, Redis, and Webhooks.
- [ ] **P29: New User Onboarding Wizard**
  - **Details**: 4-step modal workflow triggering after first registration (Create Workspace -> Create Project -> Set First Secret -> Download CLI).

---

### 🟣 Phase 4: SEO, Performance & Polish
- [ ] **P30: Secret Filter & Tagging Toolbar**
  - **Details**: Add multi-select filter bar for filtering secrets by Environment (Dev/Staging/Prod), Branch, and search string.
- [ ] **P31: Project Branch Switcher Component**
  - **Details**: Dropdown selector in project view to switch git context (`main`, `feature/*`) and reload environment secrets.
- [ ] **P32: Public Landing Page Optimization**
  - **Details**: Audit `/app/page.tsx` with Lighthouse to ensure 95+ score, fix font loading, add gradient badges, and verify structured JSON-LD schema.
- [ ] **P33: Knowledge Base & Tutorial Layout**
  - **Details**: Build markdown renderer layout for `/app/docs` and `/app/tutorials` with sidebar table of contents.
- [ ] **P34: Form Validation & Error Boundary Protection**
  - **Details**: Wrap key route components in React Error Boundaries and add Zod schema validation to all forms.
- [ ] **P35: Global Loading Skeletons**
  - **Details**: Create `loading.tsx` files for all sub-folders in `/app` rendering custom UI skeleton components.
