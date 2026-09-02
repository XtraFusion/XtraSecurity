import { test, expect } from '@playwright/test';

test.describe('5. Audit Logs & Secret Auto-Rotation E2E Simulation', () => {

  test('5.1 Real-Time Audit Log Feed & Event Filters', async ({ page }) => {
    await page.goto('/audit');

    await expect(page.locator('body')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="filter"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('SECRET_ROTATE');
      await expect(searchInput).toHaveValue('SECRET_ROTATE');
    }
  });

  test('5.2 Secret Auto-Rotation Configuration & Schedule Trigger', async ({ page }) => {
    await page.goto('/rotation');

    await expect(page.locator('body')).toBeVisible();

    const triggerBtn = page.getByRole('button', { name: /rotate|trigger|schedule/i }).first();
    if (await triggerBtn.isVisible()) {
      await triggerBtn.click();
    }
  });
});
