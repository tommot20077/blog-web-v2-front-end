import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

test.describe.configure({ mode: 'serial' })

test.describe('My Articles (F7/F8)', () => {
  test('F7: /my-articles 列表 + DRAFT 過濾顯示草稿', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const accessToken = (await loginResp.json()).data.accessToken
    const cats = await request.get(`${BACKEND}/api/v1/categories`)
    const categoryUuid = (await cats.json()).data[0].uuid

    const draftTitle = `MyArticles Draft ${Date.now()}`
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: draftTitle,
        summary: 's',
        content: '# c',
        coverImageUrl: null,
        categoryIds: [categoryUuid],
        tagNames: ['my-articles-spec'],
      },
    })
    const draftUuid = (await create.json()).data.uuid

    try {
      await page.goto('/login')
      await page.waitForURL(/\/login/, { timeout: 5000 })
      await page.getByTestId('auth-login-field-email').fill(author.email)
      await page.getByTestId('auth-login-field-password').fill(author.password)
      await page.getByTestId('auth-login-submit').click()
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/my-articles')
      })
      await page.waitForURL('/my-articles', { timeout: 5000 })

      await expect(page.getByTestId('my-root')).toBeVisible()
      const row = page.getByTestId(`my-row-${draftUuid}`)
      await expect(row).toBeVisible({ timeout: 5000 })

      await page.getByTestId('my-tab-draft').click()
      await expect(row).toBeVisible({ timeout: 5000 })
      await expect(row).toContainText(draftTitle)
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${draftUuid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null)
    }
  })

  test('F8: 從列表點「編輯」進入 /editor/{uuid} 帶入草稿內容', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const accessToken = (await loginResp.json()).data.accessToken
    const cats = await request.get(`${BACKEND}/api/v1/categories`)
    const categoryUuid = (await cats.json()).data[0].uuid

    const draftTitle = `MyArticles Edit ${Date.now()}`
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: draftTitle,
        summary: 's',
        content: '# original heading',
        coverImageUrl: null,
        categoryIds: [categoryUuid],
        tagNames: ['edit-spec'],
      },
    })
    const draftUuid = (await create.json()).data.uuid

    try {
      await page.goto('/login')
      await page.waitForURL(/\/login/, { timeout: 5000 })
      await page.getByTestId('auth-login-field-email').fill(author.email)
      await page.getByTestId('auth-login-field-password').fill(author.password)
      await page.getByTestId('auth-login-submit').click()
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

      await page.evaluate(() => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push('/my-articles')
      })
      await page.waitForURL('/my-articles', { timeout: 5000 })

      const row = page.getByTestId(`my-row-${draftUuid}`)
      await expect(row).toBeVisible({ timeout: 5000 })
      const editLink = row.getByRole('link', { name: '編輯' })
      await expect(editLink).toBeVisible({ timeout: 5000 })
      await editLink.click()

      await page.waitForURL(`/editor/${draftUuid}`, { timeout: 5000 })
      await expect(page.getByTestId('editor-title-input')).toHaveValue(draftTitle, { timeout: 8000 })
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${draftUuid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null)
    }
  })
})
