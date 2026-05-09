import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

test.describe('Article like (Stage A)', () => {
  test('登入 author → 進文章 → click ActionBar like → count +1 + active', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Like test ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
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

      const actionBarBtn = page.getByTestId('article-like-action-bar')
      const actionBarCount = page.getByTestId('article-like-action-bar-count')

      const before = parseInt(await actionBarCount.textContent() || '0', 10)
      await actionBarBtn.click()

      await page.waitForResponse(
        r => r.url().includes(`/articles/${uuid}/like`) && r.request().method() === 'POST',
      )

      await expect(actionBarCount).toHaveText(String(before + 1))
      await expect(actionBarBtn).toHaveClass(/active/)

      await actionBarBtn.click()
      await page.waitForResponse(
        r => r.url().includes(`/articles/${uuid}/like`) && r.request().method() === 'DELETE',
      )
      await expect(actionBarCount).toHaveText(String(before))
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  test('未登入 click like → redirect /login', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Like guest ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
    })
    const uuid = (await create.json()).data.uuid

    try {
      await request.post(`${BACKEND}/api/v1/articles/${uuid}/publish`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await page.goto(`/articles/${uuid}`)
      await page.getByTestId('article-like-action-bar').click()
      await page.waitForURL(/\/login/, { timeout: 5000 })
      expect(page.url()).toContain('/login')
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
