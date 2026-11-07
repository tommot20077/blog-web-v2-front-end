import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const USE_FULLSTACK_RED = process.env.E2E_FULLSTACK_RED === '1'
// CSP 違規收集（A2）：用 nginx.conf 的 CSP header 供應 mock 模式的正式建置，見 vite.csp.config.ts
const USE_CSP = process.env.E2E_CSP === '1' && !USE_FULLSTACK_RED
const USE_MOCK = process.env.E2E_MOCK === '1' && !USE_FULLSTACK_RED && !USE_CSP
const projects = USE_CSP
  ? [
      { name: 'csp', testDir: './e2e/csp', timeout: 45_000, use: { ...devices['Desktop Chrome'] } },
    ]
  : USE_FULLSTACK_RED
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
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'zh-TW',
  },
  projects,
  globalSetup: USE_MOCK || USE_CSP || USE_FULLSTACK_RED ? undefined : './e2e/global-setup.ts',
  webServer: USE_CSP
    ? {
        // 每次都重新建置，避免讀到舊的 dist-csp；mock 模式（.env.mock）讓頁面不依賴後端
        command:
          'npx vite build --config vite.csp.config.ts --mode mock && npx vite preview --config vite.csp.config.ts --mode mock',
        url: 'http://localhost:5500',
        reuseExistingServer: false,
        timeout: 180_000,
        // API 位址取正式環境的值（.env.production），否則 .env.mock 的 localhost:9010 不在 connect-src，
        // 會量到正式環境不存在的違規。process.env 的 VITE_* 優先於 .env 檔。
        env: { VITE_API_BASE_URL: loadEnv('production', process.cwd(), 'VITE_').VITE_API_BASE_URL },
      }
    : {
        command: 'npx vite --host localhost --port 5500',
        url: 'http://localhost:5500',
        reuseExistingServer: !process.env.CI,
        env: { VITE_USE_MOCK: USE_MOCK ? 'true' : 'false' },
      },
})
