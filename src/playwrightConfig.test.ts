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
})
