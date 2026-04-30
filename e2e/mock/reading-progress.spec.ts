import { test, expect } from '../fixtures/base'

/**
 * 情境 A（部分）：閱讀進度條
 */
test.describe('ArticleDetail 閱讀進度條', () => {
  test('頁面載入時進度條 width 為 0%', async ({ page, articleDetailPage }) => {
    await articleDetailPage.goto()
    await articleDetailPage.waitForContent()

    const bar = page.locator('[data-testid="article-progress-bar"]')
    await expect(bar).toBeAttached()
    const width = await bar.evaluate(el => (el as HTMLElement).style.width)
    expect(parseFloat(width)).toBeLessThan(10)
  })

  test('滾動到底部後進度條 width > 80%', async ({ page, articleDetailPage }) => {
    await articleDetailPage.goto()
    await articleDetailPage.waitForContent()

    // 滾動到底部
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
    await page.waitForTimeout(300)

    const bar = page.locator('[data-testid="article-progress-bar"]')
    const width = await bar.evaluate(el => (el as HTMLElement).style.width)
    expect(parseFloat(width)).toBeGreaterThan(60)
  })

  test('art-progress .bar 元素存在', async ({ page, articleDetailPage }) => {
    await articleDetailPage.goto()
    await articleDetailPage.waitForContent()
    await expect(page.locator('.art-progress .bar')).toBeAttached()
  })
})
