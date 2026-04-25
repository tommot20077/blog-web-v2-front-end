import { test, expect } from './fixtures/base'

/**
 * 情境 G：Author 頁面完整流程
 */
test.describe('Author Profile 頁面', () => {
  test('直接訪問 /author/yuanluca 顯示作者頁', async ({ page }) => {
    await page.goto('/author/yuanluca')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="author-name"]')).toBeVisible()
  })

  test('作者頁顯示 bio 文字', async ({ page }) => {
    await page.goto('/author/yuanluca')
    await page.waitForTimeout(500)
    await expect(page.locator('.ap-bio')).toBeVisible()
  })

  test('作者頁顯示文章列表', async ({ page }) => {
    await page.goto('/author/yuanluca')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="author-articles"]')).toBeVisible()
  })

  test('作者頁顯示社交連結', async ({ page }) => {
    await page.goto('/author/yuanluca')
    await page.waitForTimeout(500)
    const githubLink = page.locator('.ap-social-link', { hasText: 'GitHub' })
    await expect(githubLink).toBeVisible()
  })

  test('作者頁的文章可點擊進入 ArticleDetail', async ({ page }) => {
    await page.goto('/author/yuanluca')
    await page.waitForTimeout(600)
    const articles = page.locator('.ap-card')
    if (await articles.count() > 0) {
      await articles.first().click()
      await expect(page).toHaveURL(/\/articles\//)
    }
  })
})
