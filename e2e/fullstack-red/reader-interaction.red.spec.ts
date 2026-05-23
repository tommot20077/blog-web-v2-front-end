import type { Locator, Page } from '@playwright/test'
import { test, expect } from './fixtures/fullstack-red'

async function assertLoggedIn(page: Page, identifier: string): Promise<void> {
  try {
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 8000 })
  } catch (error) {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    const detail = bodyText ? ` Current page text: ${bodyText}` : ''
    throw new Error(`${identifier} UI login did not leave /login.${detail}`, { cause: error })
  }
}

async function expectFirstSearchArticle(page: Page, keyword: string): Promise<Locator> {
  await page.goto('/search')
  await page.getByTestId('search-input').fill(keyword)

  const firstResult = page.getByTestId('search-article-card').first()
  const noResult = page.getByTestId('search-no-result')

  await Promise.race([
    firstResult.waitFor({ state: 'visible', timeout: 10_000 }),
    noResult.waitFor({ state: 'visible', timeout: 10_000 }),
  ]).catch(async (error) => {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    throw new Error(`Full-stack red precondition failed: search "${keyword}" did not settle. Current page text: ${bodyText}`, {
      cause: error,
    })
  })

  if (await noResult.isVisible().catch(() => false)) {
    throw new Error(`Full-stack red precondition failed: expected at least one published article matching "${keyword}"`)
  }

  return firstResult
}

async function expectFirstArticleInList(page: Page): Promise<Locator> {
  await page.goto('/articles')

  const firstArticle = page.locator('article').first()
  const emptyState = page.getByTestId('articles-empty-state')

  await Promise.race([
    firstArticle.waitFor({ state: 'visible', timeout: 10_000 }),
    emptyState.waitFor({ state: 'visible', timeout: 10_000 }),
  ]).catch(async (error) => {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    throw new Error(`Full-stack red precondition failed: /articles did not load article cards. Current page text: ${bodyText}`, {
      cause: error,
    })
  })

  if (await emptyState.isVisible().catch(() => false)) {
    throw new Error('Full-stack red precondition failed: expected at least one published article on /articles')
  }

  return firstArticle
}

async function expectGuestInteractionBlocked(page: Page): Promise<void> {
  const loginUrl = page.waitForURL(/\/login/, { timeout: 5000 }).then(() => true).catch(() => false)
  const permissionText = page
    .locator('body')
    .getByText(/登入|權限|未授權|unauthorized|forbidden|permission/i)
    .first()
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)

  if (await Promise.race([loginUrl, permissionText])) {
    return
  }

  const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
  throw new Error(`Guest interaction was not blocked by login redirect or permission text. URL: ${page.url()}. Current page text: ${bodyText}`)
}

test.describe('P0 full-stack red - reader interaction', () => {
  test('Reader 搜尋文章後可按讚收藏留言且重複操作狀態一致', async ({
    page,
    waitForBackend,
    expectSeedUserCanLogin,
    uiLogin,
  }) => {
    test.setTimeout(60_000)
    await waitForBackend()
    await expectSeedUserCanLogin('reader@test.local', 'Test1234!', 'USER')

    await uiLogin('reader@test.local', 'Test1234!')
    await assertLoggedIn(page, 'reader@test.local')

    const searchResult = await expectFirstSearchArticle(page, 'E2E')
    await searchResult.click()
    await expect(page).toHaveURL(/\/articles\//, { timeout: 10_000 })
    await expect(page.getByTestId('article-root')).toBeVisible({ timeout: 10_000 })

    const title = (await page.getByTestId('article-title').innerText()).trim()
    if (!title) {
      throw new Error('Full-stack red flow failed: selected article title is empty')
    }

    const likeButton = page.getByTestId('article-like-action-bar')
    const wasLiked = await likeButton.evaluate((el) => el.classList.contains('active'))
    await likeButton.click()
    if (wasLiked) {
      await expect(likeButton).not.toHaveClass(/active/, { timeout: 8000 })
    } else {
      await expect(likeButton).toHaveClass(/active/, { timeout: 8000 })
    }
    await likeButton.click()
    if (wasLiked) {
      await expect(likeButton).toHaveClass(/active/, { timeout: 8000 })
    } else {
      await expect(likeButton).not.toHaveClass(/active/, { timeout: 8000 })
    }

    const bookmarkButton = page.getByTestId('article-bookmark-action-bar')
    const wasBookmarked = (await bookmarkButton.getAttribute('aria-pressed')) === 'true'
    if (wasBookmarked) {
      await bookmarkButton.click()
      await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'false', { timeout: 8000 })
    }
    await bookmarkButton.click()
    await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true', { timeout: 8000 })

    const comment = `P0 reader interaction ${Date.now()}`
    await page.getByTestId('comment-textarea').fill(comment)
    await page.getByTestId('comment-submit').click()
    await expect(page.getByTestId('comment-item').filter({ hasText: comment })).toBeVisible({ timeout: 10_000 })

    await page.goto('/bookmarks')
    await expect(page.getByTestId('bookmarks-root')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })
  })

  test('Guest 點擊互動應導到登入頁或顯示穩定權限錯誤', async ({ page, waitForBackend }) => {
    await waitForBackend()

    const firstArticle = await expectFirstArticleInList(page)
    await firstArticle.click()
    await expect(page).toHaveURL(/\/articles\//, { timeout: 10_000 })
    await expect(page.getByTestId('article-root')).toBeVisible({ timeout: 10_000 })

    await page.getByTestId('article-like-action-bar').click()
    await expectGuestInteractionBlocked(page)
  })
})
