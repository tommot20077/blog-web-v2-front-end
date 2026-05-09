import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

test.describe('Comment CRUD (Stage C)', () => {
  test('post → edit → save → 顯示 (edited)', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Edit ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
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

      await page.getByTestId('comment-textarea').fill('original content')
      await Promise.all([
        page.waitForResponse(r => r.url().includes(`/articles/${uuid}/comments`) && r.request().method() === 'POST'),
        page.getByTestId('comment-submit').click(),
      ])

      await page.getByTestId('comment-edit-btn').first().click()
      const editForm = page.getByTestId('comment-edit-form')
      await editForm.locator('textarea').fill('updated content')
      await Promise.all([
        page.waitForResponse(r => r.url().match(/\/comments\/[^/]+$/) && r.request().method() === 'PUT'),
        editForm.getByText('Save').click(),
      ])

      await expect(page.getByTestId('comment-section')).toContainText('updated content')
      await expect(page.getByTestId('comment-section')).toContainText('(edited)')
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  test('post → delete → 顯示 tombstone', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Del ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
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

      await page.getByTestId('comment-textarea').fill('to delete')
      await Promise.all([
        page.waitForResponse(r => r.url().includes(`/articles/${uuid}/comments`) && r.request().method() === 'POST'),
        page.getByTestId('comment-submit').click(),
      ])

      page.once('dialog', async d => { await d.accept() })
      await Promise.all([
        page.waitForResponse(r => r.url().match(/\/comments\/[^/]+$/) && r.request().method() === 'DELETE'),
        page.getByTestId('comment-delete-btn').first().click(),
      ])

      await expect(page.getByTestId('comment-section')).toContainText('已被作者刪除')
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  test('post top-level → reply → 子層出現 reply', async ({ page, request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: `Reply ${Date.now()}`, content: 'c', summary: 's', categoryIds: [], tagNames: [] },
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

      await page.getByTestId('comment-textarea').fill('top-level')
      await Promise.all([
        page.waitForResponse(r => r.url().includes(`/articles/${uuid}/comments`) && r.request().method() === 'POST'),
        page.getByTestId('comment-submit').click(),
      ])

      await page.getByTestId('comment-reply-btn').first().click()
      const replyForm = page.getByTestId('comment-reply-form')
      await replyForm.locator('textarea').fill('my reply text')
      await Promise.all([
        page.waitForResponse(r => r.url().includes(`/articles/${uuid}/comments`) && r.request().method() === 'POST'),
        replyForm.getByText('Reply').click(),
      ])

      const replies = page.locator('.replies [data-testid="comment-item"]')
      await expect(replies).toHaveCount(1, { timeout: 5000 })
      await expect(replies.first()).toContainText('my reply text')
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
