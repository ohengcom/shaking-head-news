import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      AUTH_SECRET: 'playwright-auth-secret',
      AUTH_GOOGLE_ID: 'playwright-google-id',
      AUTH_GOOGLE_SECRET: 'playwright-google-secret',
      AUTH_MICROSOFT_ENTRA_ID_ID: 'playwright-microsoft-id',
      AUTH_MICROSOFT_ENTRA_ID_SECRET: 'playwright-microsoft-secret',
      AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: 'common',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEWS_API_BASE_URL: 'https://news.ravelloh.top',
    },
  },
})
