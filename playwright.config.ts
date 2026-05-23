import { defineConfig, devices } from '@playwright/test'

const USE_FULLSTACK_RED = process.env.E2E_FULLSTACK_RED === '1'
const USE_MOCK = process.env.E2E_MOCK === '1' && !USE_FULLSTACK_RED
const projects = USE_FULLSTACK_RED
  ? [
      { name: 'fullstack-red', testDir: './e2e/fullstack-red', use: { ...devices['Desktop Chrome'] } },
    ]
  : [
      { name: 'chromium', testDir: USE_MOCK ? './e2e/mock' : './e2e/integration', use: { ...devices['Desktop Chrome'] } },
    ]

export default defineConfig({
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
  projects,
  globalSetup: USE_MOCK || USE_FULLSTACK_RED ? undefined : './e2e/global-setup.ts',
  webServer: {
    command: 'npx vite --host localhost --port 5500',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCK: USE_MOCK ? 'true' : 'false' },
  },
})
