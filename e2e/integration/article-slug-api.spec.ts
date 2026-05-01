import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

test.describe('Article slug API (C4)', () => {
  test('C4: GET /articles/slug/{slug} 應回與 UUID 拉的同一篇', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const create = await request.post('http://localhost:9010/api/v1/articles', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        title: `C4 slug test ${Date.now()}`,
        content: 'slug test content',
        summary: 's',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      },
    })
    const uuid = (await create.json()).data.uuid

    try {
      // 發布
      await request.post(`http://localhost:9010/api/v1/articles/${uuid}/publish`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // UUID 拉取得 slug
      const byUuid = await request.get(`http://localhost:9010/api/v1/articles/${uuid}`)
      const uuidBody = (await byUuid.json()).data
      expect(uuidBody.slug).toBeTruthy()
      const slug = uuidBody.slug

      // slug 拉應回同一篇
      const bySlug = await request.get(`http://localhost:9010/api/v1/articles/slug/${slug}`)
      expect(bySlug.ok()).toBeTruthy()
      const slugBody = (await bySlug.json()).data
      expect(slugBody.uuid).toBe(uuid)
      expect(slugBody.title).toBe(uuidBody.title)
      expect(slugBody.content).toBe(uuidBody.content)
    } finally {
      await request.delete(`http://localhost:9010/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
