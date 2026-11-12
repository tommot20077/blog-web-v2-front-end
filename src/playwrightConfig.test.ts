import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Playwright 設定守衛（CI 的 Node 版本由 ciWorkflow.test.ts 守住）。
 *
 * 這是純設定，沒有可單元執行的程式碼，故以讀檔斷言鎖住關鍵屬性：
 * E2E 失敗時保留截圖、錄影與 trace，讓 CI 紅燈時能回放失敗現場（綠燈的案例自動刪除，不佔空間）。
 *   trace 用 `retain-on-failure` 而非 `on-first-retry`：後者在「第一次失敗、重試通過」（flaky）時不會留下第一次失敗的現場。
 */
const playwrightConfig = readFileSync('playwright.config.ts', 'utf8')

describe('Playwright 設定', () => {
  it('失敗時應保留錄影', () => {
    expect(playwrightConfig).toMatch(/video:\s*'retain-on-failure'/)
  })

  it('失敗時應保留 trace（不只在重試時錄）', () => {
    expect(playwrightConfig).toMatch(/trace:\s*'retain-on-failure'/)
  })

  it('失敗時應保留截圖', () => {
    expect(playwrightConfig).toMatch(/screenshot:\s*'only-on-failure'/)
  })

  // A2（XSS-03）：CSP E2E 必須用 nginx.conf 解析出的政策供應「正式建置」，不能退回 dev server
  //（dev server 會注入 inline HMR script，量到的違規沒有代表性）。
  describe('CSP E2E（E2E_CSP=1）', () => {
    const viteCspConfig = readFileSync('vite.csp.config.ts', 'utf8')
    const packageJson = readFileSync('package.json', 'utf8')

    it('有獨立的 csp project 與 npm script', () => {
      expect(playwrightConfig).toContain("process.env.E2E_CSP === '1'")
      expect(playwrightConfig).toMatch(/name:\s*'csp',\s*testDir:\s*'\.\/e2e\/csp'/)
      expect(packageJson).toContain('"test:e2e:csp": "E2E_CSP=1 playwright test"')
    })

    it('以正式建置 + vite preview 供應頁面，每次重新建置、不重用舊伺服器', () => {
      expect(playwrightConfig).toContain('npx vite build --config vite.csp.config.ts --mode mock')
      expect(playwrightConfig).toContain('npx vite preview --config vite.csp.config.ts --mode mock')
      expect(playwrightConfig).toMatch(/reuseExistingServer:\s*false/)
    })

    it('API 位址取正式環境（.env.production），避免 mock 的 localhost:9010 造成正式環境不存在的違規', () => {
      expect(playwrightConfig).toContain("loadEnv('production'")
    })

    it('preview 的 CSP header 來自 nginx.conf 的解析結果，沒有複製政策字串', () => {
      expect(viteCspConfig).toContain('readNginxCsp()')
      expect(viteCspConfig).toMatch(/headers:\s*\{\s*\[headerName\]:\s*policy\s*\}/)
      expect(viteCspConfig).not.toContain("default-src 'self'")
    })
  })
})
