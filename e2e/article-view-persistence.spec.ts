import { test, expect } from './fixtures/base'

/**
 * 情境 B（延伸）：view mode + paging mode localStorage 持久化
 */
test.describe('文章視圖偏好持久化', () => {
  test('List 視圖設定在重新整理後保留', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.waitForTimeout(400)

    await page.click('button[title="無限捲動清單模式"]')
    await page.waitForTimeout(200)

    await page.reload()
    await page.waitForTimeout(400)

    // list 視圖應保留
    await expect(page.locator('.art-list')).toBeVisible()
  })

  test('Pages 分頁設定在重新整理後保留', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.waitForTimeout(400)

    await page.locator('.art-seg button', { hasText: 'Pages' }).click()
    await page.waitForTimeout(200)

    await page.reload()
    await page.waitForTimeout(400)

    // Pages 按鈕仍是 active
    const pagesBtn = page.locator('.art-seg button', { hasText: 'Pages' }).first()
    await expect(pagesBtn).toHaveClass(/active/)
  })

  test('sort 設定在重新整理後保留', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.waitForTimeout(400)

    await page.locator('.art-seg button', { hasText: 'Popular' }).click()
    await page.waitForTimeout(200)

    await page.reload()
    await page.waitForTimeout(400)

    // Popular 按鈕應是 active
    const popularBtn = page.locator('.art-seg button', { hasText: 'Popular' }).first()
    await expect(popularBtn).toHaveClass(/active/)
  })
})
