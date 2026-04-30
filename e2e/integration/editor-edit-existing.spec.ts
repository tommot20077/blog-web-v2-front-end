import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

test.describe('Editor - edit existing article (F5/F8)', () => {
  test('載入既有 draft 應正確帶入 title 與 content', async ({ page, request }) => {
    const creds = getCredentials('author')

    // 1. 用 API 直接建立 draft 並拿 token
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: creds.email, password: creds.password },
    })
    expect(loginResp.ok()).toBeTruthy()
    const accessToken = (await loginResp.json()).data.accessToken

    const catsResp = await request.get(`${BACKEND}/api/v1/categories`)
    const categoryUuid = (await catsResp.json()).data[0].uuid

    const draftTitle = `E2E Edit Existing Test ${Date.now()}`
    const createResp = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: draftTitle,
        summary: 'Original summary',
        content: '# Original Heading\n\nSome content here',
        coverImageUrl: null,
        categoryIds: [categoryUuid],
        tagNames: ['vue3', 'editor'],
      },
    })
    expect(createResp.ok()).toBeTruthy()
    const draftUuid = (await createResp.json()).data.uuid

    try {
      // 2. UI login（不用 helper，避免 helper 先 push /editor 造成 component reuse）
      await page.goto('/login')
      await page.waitForURL(/\/login/, { timeout: 5000 })
      await page.getByTestId('auth-login-field-email').fill(creds.email)
      await page.getByTestId('auth-login-field-password').fill(creds.password)
      await page.getByTestId('auth-login-submit').click()
      await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 5000 })

      // 3. 直接 router.push /editor/{uuid} → EditorView fresh mount
      await page.evaluate((uuid) => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push(`/editor/${uuid}`)
      }, draftUuid)
      await page.waitForURL(`/editor/${draftUuid}`, { timeout: 5000 })

      // 預期：title 載入既有值
      await expect(page.getByTestId('editor-title-input')).toHaveValue(draftTitle, { timeout: 8000 })
      // 預期：CodeMirror 載入內容
      await expect(page.locator('.cm-content')).toContainText('Original Heading', { timeout: 5000 })
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${draftUuid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    }
  })
})
