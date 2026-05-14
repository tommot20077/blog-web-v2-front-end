import { test, expect } from '../fixtures/base'

/**
 * MobileBottomNav 響應式行為回歸測試
 *
 * 對應 PR #21 review #3：unit test 只驗 class，沒驗實際 CSS 行為。
 * 此 spec 設定不同 viewport 後驗 computed `display`，
 * 防止 `md:hidden` bug 再次出現。
 *
 * Breakpoint 對齊 Tailwind 預設 `md = 768px`：
 *   < 768px  → 顯示
 *   ≥ 768px  → 隱藏（與 md:hidden 行為一致）
 */
test.describe('MobileBottomNav 響應式顯示', () => {
  const SELECTOR = '[data-testid="mobile-bottom-nav"]'

  test('桌面寬度 1280px：bottom nav 應隱藏', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const display = await page.locator(SELECTOR).evaluate(
      (el) => getComputedStyle(el).display
    )
    expect(display).toBe('none')
  })

  test('Tailwind md 邊界 768px：bottom nav 應隱藏（與 md:hidden 對齊）', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 800 })
    await page.goto('/')
    const display = await page.locator(SELECTOR).evaluate(
      (el) => getComputedStyle(el).display
    )
    expect(display).toBe('none')
  })

  test('行動寬度 375px：bottom nav 應顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const display = await page.locator(SELECTOR).evaluate(
      (el) => getComputedStyle(el).display
    )
    expect(display).not.toBe('none')
  })

  test('行動寬度 767px（md 邊界 -1px）：bottom nav 應顯示', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 800 })
    await page.goto('/')
    const display = await page.locator(SELECTOR).evaluate(
      (el) => getComputedStyle(el).display
    )
    expect(display).not.toBe('none')
  })
})
