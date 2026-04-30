import { test, expect } from '../fixtures/auth'

test.describe('作者撰寫文章 (integration)', () => {
  test.beforeEach(async ({ loginAsAuthorAndGoToEditor }) => {
    await loginAsAuthorAndGoToEditor()
  })

  test('F2: 勾選兩個分類後儲存, backend 應收到兩個 categoryIds', async ({ page, editorPage }) => {
    await editorPage.fillTitle(`E2E 多分類 ${Date.now()}`)
    await editorPage.fillContent('multi-category test')

    // 等分類載入後勾選 Frontend + Backend (checkbox 是用 input[type=checkbox] 包在 label 裡)
    await expect(page.getByText('Frontend').first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('checkbox', { name: 'Frontend' }).check()
    await page.getByRole('checkbox', { name: 'Backend' }).check()

    // 攔截 POST /articles 看送出的 categoryIds
    const [request] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/api/v1/articles') && r.method() === 'POST'),
      editorPage.saveDraft(),
    ])
    const body = JSON.parse(request.postData() ?? '{}')
    expect(body.categoryIds).toHaveLength(2)
  })

  test('F10: 特殊字元 (emoji + 中文 + 全形) 標題能 round-trip 正常存讀', async ({ request }) => {
    const author = (await import('../fixtures/auth')).getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const specialTitle = `🚀 測試「邊界」字元 ${Date.now()} ＡＢＣ`
    const create = await request.post('http://localhost:9010/api/v1/articles', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: specialTitle, summary: 's', content: 'c', coverImageUrl: null, categoryIds: [], tagNames: [] },
    })
    const createBody = await create.json()
    expect(createBody.code).toBe('00000')
    const uuid = createBody.data.uuid

    try {
      const get = await request.get(`http://localhost:9010/api/v1/articles/${uuid}/edit`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const getBody = await get.json()
      expect(getBody.data.title).toBe(specialTitle)
    } finally {
      await request.delete(`http://localhost:9010/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
