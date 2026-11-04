import { test, expect } from '@playwright/test'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

/**
 * 公開作者頁（真後端；CI 執行，本機不必跑）。
 * 資料來自 global-setup 播種的已發布文章（作者 author@test.local）。
 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test.describe('公開作者頁', () => {
  test('文章頁點作者名 → 進入該作者的公開頁', async ({ page, request }) => {
    const resp = await request.get(`${BACKEND}/api/v1/articles`, { params: { page: 1, size: 1 } })
    const first = (await resp.json()).data.records[0] as { uuid: string; authorUuid: string; authorNickname: string }
    expect(first.authorUuid).toBeTruthy()

    await page.goto(`/articles/${first.uuid}`)
    const link = page.locator('[data-testid="article-author"] a')
    await expect(link).toBeVisible()
    await link.click()

    await expect(page).toHaveURL(`/author/${first.authorUuid}`)
    await expect(page.getByTestId('author-name')).toHaveText(first.authorNickname)
    await expect(page.locator('.ap-card').first()).toBeVisible()
  })

  test('不存在的作者 uuid → 顯示「找不到這位作者」（HTTP 404 / A0101）', async ({ page }) => {
    await page.goto('/author/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText('找不到這位作者')).toBeVisible()
  })

  test('文章列表以作者下拉篩選', async ({ page, request }) => {
    const resp = await request.get(`${BACKEND}/api/v1/authors`)
    const authors = (await resp.json()).data as Array<{ uuid: string; nickname: string }>
    expect(authors.length).toBeGreaterThan(0)

    await page.goto('/articles')
    const combo = page.getByRole('combobox', { name: '搜尋作者' })
    await combo.click()
    await page.getByRole('option', { name: new RegExp(escapeRegExp(authors[0].nickname)) }).first().click()
    await expect(page.locator('.art-active-filters')).toContainText(`@${authors[0].nickname}`)
  })
})
