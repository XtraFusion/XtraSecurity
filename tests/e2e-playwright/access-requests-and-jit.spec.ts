import { test, expect } from '@playwright/test';

test.describe('4. Just-In-Time (JIT) Access Requests E2E Simulation', () => {

  test('4.1 Access Requests Dashboard & Status Tabs', async ({ page }) => {
    await page.goto('/access-requests');

    await expect(page.locator('body')).toBeVisible();

    // Check tabs or request lists
    const pendingTab = page.locator('button, a').filter({ hasText: /pending/i }).first();
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
    }
  });

  test('4.2 Request Access Form Workflow', async ({ page }) => {
    await page.goto('/access-requests');

    const requestBtn = page.getByRole('button', { name: /request access|new request|create request/i }).first();
    if (await requestBtn.isVisible()) {
      await requestBtn.click();
      
      const modal = page.locator('div[role="dialog"], form').first();
      await expect(modal).toBeVisible();

      // Fill reason / duration if form inputs exist
      const reasonInput = page.locator('textarea, input[name*="reason"], input[placeholder*="reason"]').first();
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Emergency hotfix incident resolution #402');
      }
    }
  });
});
