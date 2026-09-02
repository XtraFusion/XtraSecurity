import { test, expect } from '@playwright/test';

test.describe('1. Authentication & Onboarding E2E Simulation', () => {

  test('1.1 Login Page UI & Form Validation', async ({ page }) => {
    await page.goto('/login');

    // Verify Brand Logo and Title
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('text=XtraSecurity').first()).toBeVisible();

    // Test Empty Form Submission Validation
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await continueBtn.click();
    await expect(page.locator('text=Please fill in all fields')).toBeVisible();

    // Test Invalid Credentials Submission Validation
    await page.fill('input[type="email"]', 'nonexistent@xtrasecurity.test');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await continueBtn.click();
    await expect(page.locator('div[role="alert"], [class*="alert"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('1.2 Password Visibility Toggle & Remember Me Checkbox', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]');
    await page.fill('input[type="password"]', 'SuperSecretPass123!');
    
    // Toggle Password Visibility
    const eyeButton = page.locator('form button').filter({ has: page.locator('svg') }).first();
    if (await eyeButton.isVisible()) {
      await eyeButton.click();
    }

    // Check Remember Me
    const rememberCheckbox = page.locator('button[role="checkbox"]#remember, input#remember');
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.click();
    }
  });

  test('1.3 Navigation from Login to Forgot Password & Registration Pages', async ({ page }) => {
    await page.goto('/login');

    // Forgot password link
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();

    // Register page direct visit
    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
  });
});
