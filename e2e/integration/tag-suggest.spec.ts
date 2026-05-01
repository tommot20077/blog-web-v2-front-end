import { test, expect } from '@playwright/test'

test.describe('Tag suggest API (B-4)', () => {
  test('B-4: GET /tags/suggest?q=vu 應 prefix match 包含 vue', async ({ request }) => {
    const resp = await request.get('http://localhost:9010/api/v1/tags/suggest?q=vu')
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    expect(body.code).toBe('00000')
    expect(Array.isArray(body.data)).toBe(true)
    const names = body.data.map((t: { name: string } | string) =>
      typeof t === 'string' ? t : t.name,
    )
    expect(names).toContain('vue')
  })

  test('B-4: GET /tags/suggest?q=java 應 prefix match 包含 java', async ({ request }) => {
    const resp = await request.get('http://localhost:9010/api/v1/tags/suggest?q=java')
    const body = await resp.json()
    expect(body.code).toBe('00000')
    const names = body.data.map((t: { name: string } | string) =>
      typeof t === 'string' ? t : t.name,
    )
    expect(names).toContain('java')
  })

  test('B-4: GET /tags/suggest?q=zzz 不存在 prefix 應回空陣列', async ({ request }) => {
    const resp = await request.get('http://localhost:9010/api/v1/tags/suggest?q=zzz')
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    expect(body.code).toBe('00000')
    expect(body.data).toEqual([])
  })
})
