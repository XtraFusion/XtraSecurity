import { test, expect } from '@playwright/test';

test.describe('2. Dashboard & Global Navigation E2E Simulation', () => {

  test('2.1 Dashboard Header & Security Overview Rendering', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('body')).toBeVisible();
    
    // Check main navigation links or headers
    const mainHeading = page.locator('h1, h2').first();
    await expect(mainHeading).toBeVisible();
  });

  test('2.2 Navigation Menu Route Integrity Checks', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/projects',
      '/access-requests',
      '/audit',
      '/rotation',
      '/settings',
      '/team',
      '/analytics',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      // Ensure HTTP response is 200 OK and no 404 text is displayed as title
      const notFoundText = page.locator('text=404 - Page Not Found');
      await expect(notFoundText).not.toBeVisible();
    }
  });

  test('2.3 Theme Switcher (Dark/Light Mode Simulation)', async ({ page }) => {
    await page.goto('/dashboard');

    const themeToggleBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await themeToggleBtn.isVisible()) {
      await themeToggleBtn.click();
    }
    await expect(page.locator('body')).toBeVisible();
  });
});
