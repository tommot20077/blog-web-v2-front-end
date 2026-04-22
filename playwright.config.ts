import { defineConfig, devices } from '@playwright/test'

const USE_MOCK = process.env.E2E_MOCK === '1'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 20000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:5500',
    actionTimeout: 8000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'zh-TW',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  globalSetup: USE_MOCK ? undefined : './e2e/global-setup.ts',
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5500',
    url: 'http://127.0.0.1:5500',
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCK: USE_MOCK ? 'true' : 'false' },
  },
})
