import { test, expect } from '@playwright/test';

test.describe('3. Projects & Secrets Management Live Visual Simulation', () => {

  test('3.1 Create Project, Add Secret & Filter Environment', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // 1. Click New Project Button if present
    const newProjBtn = page.locator('button, a').filter({ hasText: /new project|create project|add project/i }).first();
    if (await newProjBtn.isVisible()) {
      await newProjBtn.click();
      await page.waitForTimeout(1000);

      // Fill Project Name in dialog
      const projNameInput = page.locator('input[placeholder*="project name"], input[placeholder*="Name"], input[name="name"]').first();
      if (await projNameInput.isVisible()) {
        await projNameInput.fill('Production Vault Platform');
        await page.waitForTimeout(800);
      }

      // Close modal or submit
      const cancelOrSubmit = page.locator('button').filter({ hasText: /cancel|create|submit|close/i }).first();
      if (await cancelOrSubmit.isVisible()) {
        await cancelOrSubmit.click();
        await page.waitForTimeout(800);
      }
    }

    // 2. Search & Filter Secrets
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('DATABASE_URL');
      await page.waitForTimeout(1000);
      await searchInput.fill('');
    }
  });
});
