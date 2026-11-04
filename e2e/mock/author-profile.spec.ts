import { test, expect } from '../fixtures/base'

/**
 * 情境 G：公開作者頁（路由 /author/:uuid）
 * mock 作者 uuid 規則：`mock-author-<nickname>`（與文章 mock 共用 mockAuthorUuid）。
 */
const YUAN = '/author/mock-author-Yuan'

test.describe('Author Profile 頁面', () => {
  test('直接訪問作者頁顯示 nickname', async ({ page }) => {
    await page.goto(YUAN)
    await expect(page.locator('[data-testid="author-name"]')).toHaveText('Yuan')
  })

  test('作者頁顯示 bio 與職稱行（location）', async ({ page }) => {
    await page.goto(YUAN)
    await expect(page.locator('.ap-bio')).toBeVisible()
    await expect(page.locator('.ap-role')).toContainText('Taipei')
  })

  test('作者頁顯示文章列表', async ({ page }) => {
    await page.goto(YUAN)
    await expect(page.locator('[data-testid="author-articles"]')).toBeVisible()
    await expect(page.locator('.ap-card').first()).toBeVisible()
  })

  test('社群連結由 handle 加固定前綴組成，且為外部連結', async ({ page }) => {
    await page.goto(YUAN)
    const github = page.locator('.ap-social-link', { hasText: 'GitHub' })
    await expect(github).toBeVisible()
    await expect(github).toHaveAttribute('href', 'https://github.com/tommot20077')
    await expect(github).toHaveAttribute('rel', /noopener/)
  })

  test('作者頁的文章可點擊進入 ArticleDetail', async ({ page }) => {
    await page.goto(YUAN)
    const first = page.locator('.ap-card').first()
    await expect(first).toBeVisible()
    await first.click()
    await expect(page).toHaveURL(/\/articles\//)
  })

  test('不存在的作者 → 顯示「找不到這位作者」', async ({ page }) => {
    await page.goto('/author/does-not-exist')
    await expect(page.getByText('找不到這位作者')).toBeVisible()
  })

  test('沒有已發布文章的作者 → 個人資料照常顯示，文章區顯示「尚未發表文章」', async ({ page }) => {
    await page.goto('/author/mock-author-Newbie')
    await expect(page.locator('[data-testid="author-name"]')).toHaveText('Newbie')
    await expect(page.getByText('尚未發表文章')).toBeVisible()
  })

  test('文章頁點作者名 → 進入該作者的公開頁', async ({ page }) => {
    await page.goto('/articles/a-2023-01')
    const link = page.locator('[data-testid="article-author"] a')
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(YUAN)
    await expect(page.locator('[data-testid="author-name"]')).toHaveText('Yuan')
  })
})

test.describe('文章列表的作者篩選（AuthorMultiSelect）', () => {
  test('輸入搜尋 → 鍵盤選取 → 只剩該作者的文章，active filter 顯示 nickname', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    const combo = page.getByRole('combobox', { name: '搜尋作者' })
    await combo.fill('han')
    await expect(page.getByRole('option', { name: /Han/ })).toBeVisible()
    await combo.press('ArrowDown')
    await combo.press('Enter')
    await expect(page.locator('.art-active-filters')).toContainText('@Han')
    await expect(page.getByRole('button', { name: '移除 Han' })).toBeVisible()
    // 篩選由後端（mock）執行：Han 在文章 mock 中共 6 篇
    await expect(page.locator('.art-tb-count')).toContainText('6')
  })

  test('無符合的作者 → 顯示「找不到符合的作者」', async ({ page }) => {
    await page.goto('/articles')
    await page.waitForSelector('[data-testid="articles-root"]')
    await page.getByRole('combobox', { name: '搜尋作者' }).fill('zzzz')
    await expect(page.getByText('找不到符合的作者')).toBeVisible()
  })
})
