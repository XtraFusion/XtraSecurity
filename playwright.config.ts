import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e-playwright',
  timeout: 120 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    headless: false,
    viewport: null,
    launchOptions: {
      headless: false,
      slowMo: 1000,
      args: ['--start-maximized', '--window-position=0,0'],
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        headless: false,
        viewport: null,
        launchOptions: {
          headless: false,
          slowMo: 1000,
          args: ['--start-maximized', '--window-position=0,0'],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
