import path from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/fullstack-red'

const imagePath = path.resolve('e2e/fixtures/test-image.png')

async function assertLoggedIn(page: Page, role: string): Promise<void> {
  try {
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 8000 })
  } catch (error) {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    const detail = bodyText ? ` Current page text: ${bodyText}` : ''
    throw new Error(`${role} UI login did not leave /login.${detail}`, { cause: error })
  }
}

async function navigateWithinApp(page: Page, path: string): Promise<void> {
  await page.evaluate(async (targetPath) => {
    const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
    await router.push(targetPath)
  }, path)
}

async function logoutViaStore(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const store = (window as unknown as { __pinia?: { _s: Map<string, { logout: () => Promise<void> }> } })
      .__pinia?._s.get('auth')
    if (store) {
      await store.logout()
    }
  })
}

test.describe('P0 full-stack red - author review', () => {
  test('Author 建草稿上傳封面送審後 Admin 發布 Reader 可搜尋', async ({
    page,
    waitForBackend,
    expectSeedUserCanLogin,
    uiLogin,
  }) => {
    test.setTimeout(60_000)
    await waitForBackend()
    await expectSeedUserCanLogin('author@test.local', 'Test1234!', 'AUTHOR')
    await expectSeedUserCanLogin('admin@test.local', 'Test1234!', 'ADMIN')

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const articleTitle = `P0 Author Review ${unique}`

    await uiLogin('author@test.local', 'Test1234!')
    await assertLoggedIn(page, 'author@test.local')
    await navigateWithinApp(page, '/editor')
    await page.waitForURL('/editor', { timeout: 8_000 })

    await page.getByTestId('editor-title-input').fill(articleTitle)
    await page.locator('.cm-content').click()
    await page
      .locator('.cm-content')
      .pressSequentially(`# ${articleTitle}\n\n這是一篇 P0 full-stack red e2e 測試文章。`)
    await page.getByPlaceholder(/文章摘要/).fill(`P0 red 摘要 ${unique}`)

    await page.getByTestId('cover-upload-input').setInputFiles(imagePath)
    await expect(page.getByTestId('cover-preview')).toBeVisible({ timeout: 10_000 })

    const firstCategory = page.locator('aside input[type="checkbox"]').first()
    if (await firstCategory.isVisible().catch(() => false)) {
      await firstCategory.check()
    }

    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/editor\/.+/, { timeout: 8000 })

    await page.getByTestId('editor-publish-btn').click()
    await expect(page.getByText('已送出審核')).toBeVisible({ timeout: 10_000 })
    await logoutViaStore(page)

    await uiLogin('admin@test.local', 'Test1234!')
    await assertLoggedIn(page, 'admin@test.local')
    await navigateWithinApp(page, '/admin/review')
    await page.waitForURL('/admin/review', { timeout: 8_000 })

    const pendingArticle = page.locator('.admin-card', { hasText: articleTitle })
    await expect(pendingArticle).toBeVisible({ timeout: 10_000 })
    await pendingArticle.getByRole('button', { name: '通過' }).click()
    await expect(pendingArticle).toHaveCount(0, { timeout: 8000 })
    await logoutViaStore(page)

    await navigateWithinApp(page, '/search')
    await page.waitForURL('/search', { timeout: 8_000 })
    await page.getByTestId('search-input').fill(articleTitle)
    const searchResult = page.getByTestId('search-article-card').filter({ hasText: articleTitle })
    await expect(searchResult.first()).toBeVisible({ timeout: 10_000 })
  })
})
