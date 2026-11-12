import { test, expect } from '../fixtures/mock-app'

test.describe('Reader journey', () => {
  test.beforeEach(async ({ resetMockStateInApp }) => {
    await resetMockStateInApp()
  })

  test('讀者可瀏覽、搜尋、進文章詳情、按讚、收藏、留言與點相關文章', async ({ page, loginAs }) => {
    await loginAs('reader')

    await page.goto('/')
    await expect(page.locator('.hero')).toBeVisible()
    await expect(page.locator('.trending')).toBeVisible()

    await page.goto('/articles')
    await expect(page.getByTestId('articles-root')).toBeVisible()
    await page.locator('article').first().click()
    await expect(page).toHaveURL(/\/articles\//)
    await expect(page.getByTestId('article-root')).toBeVisible()

    const likeButton = page.getByTestId('article-like-action-bar')
    const bookmarkButton = page.getByTestId('article-bookmark-action-bar')
    await likeButton.click()
    await expect(likeButton).toHaveClass(/active/)
    await bookmarkButton.click()
    await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true')

    const title = await page.getByTestId('article-title').innerText()
    await page.goto('/bookmarks')
    await expect(page.getByText(title)).toBeVisible()

    await page.getByTestId(/^bookmark-row-remove-/).first().click()
    await expect(page.getByText(title)).not.toBeVisible()

    await page.goto('/articles/a-2025-01')
    await page.getByTestId('comment-textarea').fill('這是一則 reader journey 留言')
    await page.getByTestId('comment-submit').click()
    await expect(page.getByTestId('comment-item').filter({ hasText: 'reader journey 留言' })).toBeVisible()

    await expect(page.getByTestId('related-articles-section')).toBeVisible()
    const currentArticleUrl = page.url()
    const firstRelatedCard = page.locator('[data-testid^="related-article-card-"]').first()
    const relatedHref = await firstRelatedCard.getAttribute('href')
    if (!relatedHref) throw new Error('First related article card should have href')
    const expectedRelatedUrl = new URL(relatedHref, currentArticleUrl).toString()
    await firstRelatedCard.click()
    await expect(page).toHaveURL(expectedRelatedUrl)
    expect(page.url()).not.toBe(currentArticleUrl)

    await page.goto('/search')
    await page.getByTestId('search-input').fill('zzzz-no-result')
    await expect(page.getByTestId('search-no-result')).toBeVisible({ timeout: 8000 })
  })

  test('未登入點互動功能會導向登入頁', async ({ page }) => {
    await page.goto('/articles/a-2025-01')
    await page.getByTestId('article-like-action-bar').click()
    await expect(page).toHaveURL(/\/login/)

    await page.goto('/articles/a-2025-01')
    await page.getByTestId('article-bookmark-action-bar').click()
    await expect(page).toHaveURL(/\/login/)

    await page.goto('/tags/vue-3')
    await page.getByTestId('tag-follow-btn').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('收藏空狀態正常顯示', async ({ page, loginAs }) => {
    await loginAs('reader')
    await page.goto('/bookmarks')
    await expect(page.getByText('目前沒有收藏文章')).toBeVisible()
  })
})
