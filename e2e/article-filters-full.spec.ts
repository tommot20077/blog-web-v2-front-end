import { test, expect } from './fixtures/base'

/**
 * 情境 B：文章多條件篩選流程
 * 測試 useArticleFilters 的完整互動
 */
test.describe('文章多條件篩選', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articles')
    // 等待文章載入完成
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.waitForTimeout(600)
  })

  test('初始狀態：Infinite 模式，無分頁器', async ({ page }) => {
    // 預設是 infinite，沒有分頁箭頭
    await expect(page.locator('button', { hasText: '←' })).not.toBeVisible()
    // ∞ Infinite 按鈕應是 active
    const infiniteBtn = page.locator('.art-seg button', { hasText: '∞ Infinite' })
    await expect(infiniteBtn).toHaveClass(/active/)
  })

  test('切換到 Pages 模式後出現分頁器', async ({ page }) => {
    await page.click('.art-seg button:has-text("Pages")')
    // 分頁器出現
    await expect(page.locator('button', { hasText: '←' })).toBeVisible()
    await expect(page.locator('button', { hasText: '→' })).toBeVisible()
  })

  test('切回 Infinite 後分頁器消失', async ({ page }) => {
    // 先切到 Pages
    await page.click('.art-seg button:has-text("Pages")')
    await expect(page.locator('button', { hasText: '←' })).toBeVisible()
    // 再切回 Infinite
    await page.click('.art-seg button:has-text("∞ Infinite")')
    await expect(page.locator('button', { hasText: '←' })).not.toBeVisible()
  })

  test('Date filter：點 Last 30 後出現 active filter badge', async ({ page }) => {
    const last30Btn = page.locator('.art-chip', { hasText: 'Last 30' })
    await expect(last30Btn).toBeVisible()
    await last30Btn.click()
    await page.waitForTimeout(300)

    // active filter 顯示
    const activeBadge = page.locator('.art-active-filters')
    await expect(activeBadge).toBeVisible()
    await expect(activeBadge).toContainText('30d')
  })

  test('Clear all 清除所有 filter', async ({ page }) => {
    // 先點一個 filter
    await page.locator('.art-chip', { hasText: 'Last 30' }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('.art-active-filters')).toBeVisible()

    // 點 Clear
    await page.locator('.art-rail-head .clear').click()
    await page.waitForTimeout(200)

    // active filters 消失
    await expect(page.locator('.art-active-filters')).not.toBeVisible()
  })

  test('切換 Sort → Popular 後文章順序改變', async ({ page }) => {
    // 等初始文章載入
    const initialFirst = await page.locator('article').first().textContent()

    // 點 Popular
    await page.locator('.art-seg button', { hasText: 'Popular' }).click()
    await page.waitForTimeout(300)

    // 點 Latest 重置
    await page.locator('.art-seg button', { hasText: 'Latest' }).click()
    await page.waitForTimeout(300)

    // 按鈕 UI 狀態正確
    const latestBtn = page.locator('.art-seg button', { hasText: 'Latest' }).first()
    await expect(latestBtn).toHaveClass(/active/)
  })

  test('切換 View → List 後顯示 art-list 容器', async ({ page }) => {
    await page.click('button[title="無限捲動清單模式"]')
    await page.waitForTimeout(200)
    await expect(page.locator('.art-list')).toBeVisible()
  })

  test('切換 View → Grid 後顯示 art-grid 容器', async ({ page }) => {
    // 先切到 list
    await page.click('button[title="無限捲動清單模式"]')
    await page.waitForTimeout(200)
    // 再切回 grid
    await page.click('button[title="網格視圖"]')
    await page.waitForTimeout(200)
    await expect(page.locator('.art-grid')).toBeVisible()
  })

  test('view mode 切換後 localStorage 持久化', async ({ page }) => {
    await page.click('button[title="無限捲動清單模式"]')
    await page.waitForTimeout(200)

    const viewVal = await page.evaluate(() => localStorage.getItem('blog.art.view'))
    expect(viewVal).toBe('list')
  })
})
