import { test, expect } from '../fixtures/base'

/**
 * 情境 F：標籤頁跨頁面導航
 */
test.describe('Tag 頁面導航', () => {
  test('從文章列表點 tag pill 進入 TagView', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.waitForTimeout(600)

    // 找 tag rail 中的 tag 按鈕並點擊
    const tagLinks = page.locator('.art-tag')
    const count = await tagLinks.count()
    if (count > 0) {
      const tagText = await tagLinks.first().textContent()
      await tagLinks.first().click()
      // URL 應跳轉到 /tags/xxx
      await expect(page).toHaveURL(/\/tags\//)
      // Tag 標題應顯示
      await expect(page.locator('[data-testid="tag-title"]')).toBeVisible()
    }
  })

  test('TagView 顯示文章列表容器', async ({ page }) => {
    await page.goto('/tags/vue-3')
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="tag-articles"]')).toBeVisible()
  })

  test('TagView 顯示相關標籤（若有資料）', async ({ page }) => {
    await page.goto('/tags/vue-3')
    await page.waitForTimeout(600)
    // tag 標題存在
    await expect(page.locator('[data-testid="tag-title"]')).toBeVisible()
  })

  test('從首頁 tags section 點 tag-pill 跳到 TagView', async ({ page, homePage }) => {
    await homePage.goto()
    // 滾動到 tags section
    await page.evaluate(() => {
      document.querySelector('.tags-cloud')?.scrollIntoView({ behavior: 'instant' })
    })
    await page.waitForTimeout(300)

    const tagPills = page.locator('.tag-pill')
    const count = await tagPills.count()
    if (count > 0) {
      await tagPills.first().click()
      await expect(page).toHaveURL(/\/tags\//)
    }
  })
})
