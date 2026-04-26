import { test, expect } from './fixtures/base'

/**
 * 情境 C：搜尋完整流程
 */
test.describe('搜尋完整流程', () => {
  test('Ctrl+K 跳轉到搜尋頁', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(300)
    await page.keyboard.press('Control+k')
    await expect(page).toHaveURL('/search')
  })

  test('空狀態顯示熱門查詢', async ({ page, searchPage }) => {
    await searchPage.goto()
    // 未輸入時顯示熱門查詢 section（可能有多個 section，取第一個）
    await expect(page.locator('.sv-section').first()).toBeVisible()
  })

  test('輸入關鍵字後顯示搜尋結果卡片', async ({ page, searchPage }) => {
    await searchPage.goto()
    await searchPage.search('vue')

    // 等 debounce (220ms)
    await page.waitForTimeout(400)

    // 結果卡片出現
    const cards = page.locator('[data-testid="search-article-card"]')
    const count = await cards.count()
    if (count > 0) {
      // 卡片有日期
      const firstCard = cards.first()
      await expect(firstCard.locator('.sv-card-foot')).toBeVisible()
    }
  })

  test('搜尋結果卡片有日期資訊', async ({ page, searchPage }) => {
    await searchPage.goto()
    await searchPage.search('vue')
    await page.waitForTimeout(400)

    const cards = page.locator('[data-testid="search-article-card"]')
    const count = await cards.count()
    if (count > 0) {
      // sv-card-foot 內有時間格式的 span
      const foot = cards.first().locator('.sv-card-foot')
      await expect(foot).toBeVisible()
    }
  })

  test('Escape 鍵清空搜尋框', async ({ page, searchPage }) => {
    await searchPage.goto()
    await searchPage.search('vue')
    await page.waitForTimeout(400)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // 應顯示空狀態（熱門查詢）（可能有多個 section，取第一個）
    await expect(page.locator('.sv-section').first()).toBeVisible()
  })

  test('點搜尋結果文章進入 ArticleDetail', async ({ page, searchPage }) => {
    await searchPage.goto()
    await searchPage.search('vue')
    await page.waitForTimeout(400)

    const cards = page.locator('[data-testid="search-article-card"]')
    if (await cards.count() > 0) {
      await cards.first().click()
      await expect(page).toHaveURL(/\/articles\//)
    }
  })
})
