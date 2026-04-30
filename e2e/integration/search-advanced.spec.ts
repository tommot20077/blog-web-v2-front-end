import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = 'http://localhost:9010'

test.describe.configure({ mode: 'serial' })

test.describe('Search advanced (D3/D4/D5)', () => {
  test('D3: 搜尋歷史 — 登入 user 搜過後 history 包含該關鍵字, 清除後消失', async ({ request }) => {
    const reader = getCredentials('reader')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: reader.email, password: reader.password },
    })
    const token = (await loginResp.json()).data.accessToken

    // 先清空既有歷史
    await request.delete(`${BACKEND}/api/v1/search/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    // 用 unique keyword 搜尋（要登入 user 帶 token，後端才會記錄到此 user history）
    const keyword = `d3test${Date.now()}`
    await request.get(`${BACKEND}/api/v1/search?q=${keyword}&page=1&size=3`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const histResp = await request.get(`${BACKEND}/api/v1/search/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const history = (await histResp.json()).data as string[]
    expect(history).toContain(keyword.toLowerCase())

    // 清除
    await request.delete(`${BACKEND}/api/v1/search/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const after = await request.get(`${BACKEND}/api/v1/search/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect((await after.json()).data).toEqual([])
  })

  test('D4: tag-only filter (no q) 應回有結果, 不再 500', async ({ request }) => {
    const resp = await request.get(`${BACKEND}/api/v1/search?tag=frontend&page=1&size=3`)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.code).toBe('00000')
    expect(body.data.total).toBeGreaterThan(0)
    // 每篇 record 應確實含 frontend tag
    for (const r of body.data.records) {
      expect((r.tagNames as string[])).toContain('frontend')
    }
  })

  test('D5: sort=latest 與 sort=hot 各回不同順序', async ({ request }) => {
    const latest = await request.get(`${BACKEND}/api/v1/search?q=E2E&sort=latest&page=1&size=10`)
    const hot = await request.get(`${BACKEND}/api/v1/search?q=E2E&sort=hot&page=1&size=10`)

    expect(latest.status()).toBe(200)
    expect(hot.status()).toBe(200)

    const latestBody = await latest.json()
    const hotBody = await hot.json()

    expect(latestBody.code).toBe('00000')
    expect(hotBody.code).toBe('00000')
    expect(latestBody.data.total).toBeGreaterThan(0)

    // sort=latest: 期望 publishedAt 遞減
    const latestRecords = latestBody.data.records
    for (let i = 1; i < latestRecords.length; i++) {
      expect(new Date(latestRecords[i - 1].publishedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(latestRecords[i].publishedAt).getTime())
    }
  })
})
