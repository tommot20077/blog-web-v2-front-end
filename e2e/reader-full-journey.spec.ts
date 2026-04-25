import { test, expect } from './fixtures/base'

/**
 * 情境 A：讀者完整瀏覽流程
 */
test.describe('讀者完整瀏覽流程', () => {
  test('首頁顯示 Hero + Navbar + 內容區段', async ({ page, homePage }) => {
    await homePage.goto()
    // Hero section
    await expect(page.locator('.hero')).toBeVisible()
    await expect(page.locator('.hero-title')).toBeVisible()
    // Navbar
    await expect(page.locator('.nav-wrap')).toBeVisible()
    // Trending section
    await expect(page.locator('.trending')).toBeVisible()
  })

  test('Navbar 有 Writing / Articles / Search / About 連結', async ({ page, homePage }) => {
    await homePage.goto()
    await expect(page.locator('.nav-inner a', { hasText: 'Writing' })).toBeVisible()
    await expect(page.locator('.nav-inner a', { hasText: 'Articles' })).toBeVisible()
    await expect(page.locator('.nav-inner a', { hasText: 'Search' })).toBeVisible()
    await expect(page.locator('.nav-inner a', { hasText: 'About' })).toBeVisible()
  })

  test('點 Articles 連結進入文章列表', async ({ page, homePage }) => {
    await homePage.goto()
    await page.click('.nav-inner a[href="/articles"]')
    await expect(page).toHaveURL('/articles')
    await expect(page.locator('[data-testid="articles-root"]')).toBeVisible()
  })

  test('從文章列表點文章進入 ArticleDetail', async ({ page, articleListPage, articleDetailPage }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    const firstArticle = page.locator('[role="article"]').first()
    if (await firstArticle.count() > 0) {
      await firstArticle.click()
      await expect(page).toHaveURL(/\/articles\//)
      await expect(page.locator('[data-testid="article-root"]')).toBeVisible()
    }
  })

  test('ArticleDetail 顯示進度條、標題、作者', async ({ page, articleDetailPage }) => {
    await articleDetailPage.goto()
    await articleDetailPage.waitForContent()

    await expect(page.locator('[data-testid="article-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="article-author"]')).toBeVisible()
    await expect(page.locator('.art-progress')).toBeVisible()
  })

  test('SCROLL 指示器在首頁底部顯示', async ({ page, homePage }) => {
    await homePage.goto()
    await expect(page.locator('.scroll-cue')).toBeVisible()
  })

  test('Footer 顯示 copyright', async ({ page, homePage }) => {
    await homePage.goto()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await expect(page.locator('.footer')).toBeVisible()
    await expect(page.locator('[data-testid="footer-copyright"]')).toBeVisible()
  })
})
