import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

test.describe('Comment list + post (Stage B)', () => {
  test('登入 author → 文章頁 → 發留言 → list 出現新留言', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Comment list ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
    })
    const uuid = (await create.json()).data.uuid

    try {
      await request.post(`${BACKEND}/api/v1/articles/${uuid}/publish`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await page.goto('/login')
      await page.getByTestId('auth-login-field-email').fill(author.email)
      await page.getByTestId('auth-login-field-password').fill(author.password)
      await page.getByTestId('auth-login-submit').click()
      await page.waitForURL(url => !url.pathname.startsWith('/login'))

      await page.evaluate(u => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router
        return router.push(`/articles/${u}`)
      }, uuid)
      await page.waitForURL(`/articles/${uuid}`)

      const message = `E2E test comment ${Date.now()}`
      await page.getByTestId('comment-textarea').fill(message)

      await Promise.all([
        page.waitForResponse(
          r => r.url().includes(`/articles/${uuid}/comments`) && r.request().method() === 'POST',
        ),
        page.getByTestId('comment-submit').click(),
      ])

      await expect(page.getByTestId('comment-section')).toContainText(message, { timeout: 5000 })
      await expect(page.getByTestId('comment-total-count')).toContainText('1')
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  test('未登入 click submit → redirect /login', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Comment guest ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
    })
    const uuid = (await create.json()).data.uuid

    try {
      await request.post(`${BACKEND}/api/v1/articles/${uuid}/publish`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await page.goto(`/articles/${uuid}`)
      await page.getByTestId('comment-textarea').fill('guest hi there')
      await page.getByTestId('comment-submit').click()
      await page.waitForURL(/\/login/, { timeout: 5000 })
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
