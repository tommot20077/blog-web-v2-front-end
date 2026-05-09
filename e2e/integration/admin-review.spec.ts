import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface ApiTokens {
  authorToken: string
  adminToken: string
  categoryUuid: string
}

async function setupTokens(request: import('@playwright/test').APIRequestContext): Promise<ApiTokens> {
  const author = getCredentials('author')
  const admin = getCredentials('admin')

  const authorLogin = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { identifier: author.email, password: author.password },
  })
  const authorToken = (await authorLogin.json()).data.accessToken

  const adminLogin = await request.post(`${BACKEND}/api/v1/auth/login`, {
    data: { identifier: admin.email, password: admin.password },
  })
  const adminToken = (await adminLogin.json()).data.accessToken

  const cats = await request.get(`${BACKEND}/api/v1/categories`)
  const categoryUuid = (await cats.json()).data[0].uuid

  return { authorToken, adminToken, categoryUuid }
}

async function createPendingArticle(
  request: import('@playwright/test').APIRequestContext,
  authorToken: string,
  categoryUuid: string,
  title: string,
): Promise<string> {
  const create = await request.post(`${BACKEND}/api/v1/articles`, {
    headers: { Authorization: `Bearer ${authorToken}` },
    data: {
      title,
      summary: 'pending review',
      content: '# Test',
      coverImageUrl: null,
      categoryIds: [categoryUuid],
      tagNames: ['test-pending'],
    },
  })
  const uuid = (await create.json()).data.uuid
  await request.post(`${BACKEND}/api/v1/articles/${uuid}/submit`, {
    headers: { Authorization: `Bearer ${authorToken}` },
  })
  return uuid
}

async function deleteArticle(
  request: import('@playwright/test').APIRequestContext,
  authorToken: string,
  uuid: string,
): Promise<void> {
  await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
    headers: { Authorization: `Bearer ${authorToken}` },
  }).catch(() => null)
}

async function loginAsAdminViaUI(page: import('@playwright/test').Page): Promise<void> {
  const admin = getCredentials('admin')
  await page.goto('/login')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  await page.getByTestId('auth-login-field-email').fill(admin.email)
  await page.getByTestId('auth-login-field-password').fill(admin.password)
  await page.getByTestId('auth-login-submit').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Admin Review (H1/H3/H4/H5)', () => {
  test('H1+H3: admin 看到 pending 列表，點「通過」後文章消失', async ({ page, request }) => {
    const { authorToken, adminToken, categoryUuid } = await setupTokens(request)
    const title = `Approve Test ${Date.now()}`
    const draftUuid = await createPendingArticle(request, authorToken, categoryUuid, title)

    try {
      await loginAsAdminViaUI(page)
      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/admin/review')
      })
      await page.waitForURL('/admin/review', { timeout: 5000 })

      const article = page.locator('.admin-card', { hasText: title })
      await expect(article).toBeVisible({ timeout: 8000 })
      await article.getByRole('button', { name: '通過' }).click()
      await expect(article).toHaveCount(0, { timeout: 5000 })

      // H5: 公開列表能看到
      const publicResp = await request.get(`${BACKEND}/api/v1/articles?page=1&size=50`)
      const records = (await publicResp.json()).data.records as Array<{ title: string; status: string }>
      const found = records.find((r) => r.title === title)
      expect(found?.status).toBe('PUBLISHED')
    } finally {
      // 清理：admin token 刪除（admin 有 ARTICLE_DELETE 權限）
      await deleteArticle(request, adminToken, draftUuid)
    }
  })

  test('H4: admin 點「退回」帶理由後文章從列表消失', async ({ page, request }) => {
    const { authorToken, adminToken, categoryUuid } = await setupTokens(request)
    const title = `Reject Test ${Date.now()}`
    const draftUuid = await createPendingArticle(request, authorToken, categoryUuid, title)

    try {
      await loginAsAdminViaUI(page)
      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/admin/review')
      })
      await page.waitForURL('/admin/review', { timeout: 5000 })

      const article = page.locator('.admin-card', { hasText: title })
      await expect(article).toBeVisible({ timeout: 8000 })
      await article.getByRole('button', { name: '退回' }).click()
      await article.locator('.admin-reject-textarea').fill('內容不夠完整')
      await article.getByRole('button', { name: '確認退回' }).click()
      await expect(article).toHaveCount(0, { timeout: 5000 })

      // 驗證 backend 狀態
      const editResp = await request.get(`${BACKEND}/api/v1/articles/${draftUuid}/edit`, {
        headers: { Authorization: `Bearer ${authorToken}` },
      })
      const data = (await editResp.json()).data
      expect(data.status).toBe('REJECTED')
      expect(data.rejectReason).toBe('內容不夠完整')
    } finally {
      await deleteArticle(request, authorToken, draftUuid)
    }
  })

  test('H7: 無待審文章時應顯示 empty state (mock)', async ({ page }) => {
    const admin = getCredentials('admin')

    // mock pending list 回空，避開 fixture 副作用
    await page.route('**/api/v1/admin/articles/pending*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: '00000',
          message: '操作成功',
          data: { records: [], total: 0, page: 1, size: 20 },
        }),
      }),
    )

    await page.goto('/login')
    await page.getByTestId('auth-login-field-email').fill(admin.email)
    await page.getByTestId('auth-login-field-password').fill(admin.password)
    await page.getByTestId('auth-login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))

    // 用 router.push 避免 page.goto full reload 重置 Pinia state → guard 誤判未登入
    await page.evaluate(() => {
      const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
      return router.push('/admin/review')
    })
    await page.waitForURL('/admin/review', { timeout: 5000 })

    // empty state UI: AdminReviewView 顯示「目前沒有待審核文章」
    await expect(page.getByText('目前沒有待審核文章')).toBeVisible({ timeout: 5000 })
  })
})
