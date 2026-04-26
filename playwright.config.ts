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
    // 用 localhost (而非 127.0.0.1) 與 backend hostname 對齊，
    // 避免 SameSite=Strict 把 refresh token cookie 視為跨 site 而擋掉
    baseURL: 'http://localhost:5500',
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
    command: 'npx vite --host localhost --port 5500',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCK: USE_MOCK ? 'true' : 'false' },
  },
})
