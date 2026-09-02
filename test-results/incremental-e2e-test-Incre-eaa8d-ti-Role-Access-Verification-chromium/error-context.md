# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: incremental-e2e-test.spec.ts >> Incremental Step-by-Step Platform E2E Test Suite >> Step 1 - Step 6: Auth, Workspace, Project, 10 UI Secrets, Branches, Teams, .env Bulk Import, Branch Diff, Project Settings Team Assign & Multi-Role Access Verification
- Location: tests\e2e-playwright\incremental-e2e-test.spec.ts:5:7

# Error details

```
Test timeout of 900000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "chrome-error://chromewebdata/"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    6 × locator resolved to <html dir="ltr" lang="en">…</html>
      - unexpected value "chrome-error://chromewebdata/"

```

```yaml
- heading "Your connection was interrupted" [level=1]
- paragraph: Your computer went to sleep.
- text: ERR_NETWORK_IO_SUSPENDED
- button "Reload"
```

```
Tearing down "context" exceeded the test timeout of 900000ms.
```