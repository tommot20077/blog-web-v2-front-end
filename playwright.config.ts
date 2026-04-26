import { defineConfig, devices } from '@playwright/test'

const USE_MOCK = process.env.E2E_MOCK === '1'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // 對接真實 dev backend 時, 多 spec 同時建/刪 article 會撞
  // (如 reader-reads-article 點第一篇時, admin-review 正在 publish 影響列表 ordering)
  // 改成串行確保 fixture 穩定; CI 上的 mock 環境可改回並行
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
