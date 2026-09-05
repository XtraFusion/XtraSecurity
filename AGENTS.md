# XtraSecurity Agent Guidelines & Review Pipeline

This repository has integrated role review actions for the Product Review Pipeline. When invoked with slash commands or role requests, adhere to the guidelines below:

## 1. Product Review Slash Actions

The following review actions are active in this workspace:

- **`/tester`** — Senior QA Engineer: Runs adversarial checks, edge cases, error handling, regressions, and functional test suites. Outputs `## QA Test Report`.
- **`/security`** — Security Auditor: Evaluates auth checks, token management, zero-knowledge encryption, injection risks, and CVEs. Outputs `## Security Audit`.
- **`/cto`** — CTO / Tech Lead: Judges architectural fit, scalability ceilings, technical debt, and maintainability. Outputs `## CTO Review`.
- **`/pm`** — Senior Product Manager: Walks through user journeys, friction points, empty/error states, and usability consistency. Outputs `## Product/UX Review`.
- **`/devops`** (or **`/sre`**) — Reliability & Operations: Assesses zero-downtime migrations, failure cascading, and 2am incident readiness. Outputs `## Reliability Review`.
- **`/cfo`** — CFO Financial Review: Evaluates build/run costs, API call scale economics, and financial risks. Outputs `## CFO Review`.
- **`/legal-compliance`** — Legal & Compliance: Evaluates GDPR/CCPA, ToS, licensing, and liability risks. Outputs `## Legal & Compliance Review`.
- **`/support`** — Head of Customer Support: Analyzes ticket volume drivers, user confusion, and silent failure points. Outputs `## Support Readiness Review`.
- **`/ceo`** — CEO Executive Review: Evaluates strategic fit, customer value, opportunity cost, and makes the final decision (Approve/Hold/Reject). Outputs `## CEO Review`.
- **`/pipeline-review`** — Orchestrates the review pipeline in sequence, feeding earlier stage reports into subsequent reviewer lenses.

## 2. Review Execution Principles
- Base reviews on actual code, real test executions, and concrete evidence.
- Always use the fixed Markdown Report Format specific to that role.
- When running in pipeline mode, read and reference findings from preceding stages.

## 3. Mandatory Automatic Post-Completion Skills & Quality Check

After completing any user prompt involving code changes, additions, or refactorings, the agent MUST automatically evaluate the work against the core pipeline lenses before finalizing the response:

1. **QA / Functional Correctness (`/tester`)**:
   - Have all relevant unit and integration tests been run and confirmed passing?
   - Are edge cases (nulls, empty inputs, extreme boundaries, large payloads) handled safely?
   - Are there any regressions in existing functionality?

2. **Security & Cryptographic Integrity (`/security`)**:
   - Are sensitive credentials, secrets, and auth tokens strictly masked or encrypted (zero-knowledge)?
   - Are authentication and RBAC authorization enforced server-side?
   - Is user input validated and sanitized against injection and malformed formats?

3. **Architecture & Maintainability (`/cto`)**:
   - Does the implementation follow established architectural patterns without introducing unnecessary tech debt?
   - Are there any performance bottlenecks, unindexed queries, or memory leaks?

4. **Product, UX & Customer Support (`/pm` & `/support`)**:
   - Are error messages clear, actionable, and free of confusing internal stack traces?
   - Does the change avoid silent failures or breaking existing client/CLI/SDK workflows?

5. **Operational Reliability (`/devops`)**:
   - Are errors caught and logged with sufficient context for production troubleshooting?
   - Is backward compatibility preserved for existing deployments?

If any check fails or reveals a defect, proactively fix the issue or flag the specific risk in your response before marking the task complete.
