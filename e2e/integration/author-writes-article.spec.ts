import { test, expect } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const specialTitle = `🚀 測試「邊界」字元 ${Date.now()} ＡＢＣ`
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: specialTitle, summary: 's', content: 'c', coverImageUrl: null, categoryIds: [], tagNames: [] },
    })
    const createBody = await create.json()
    expect(createBody.code).toBe('00000')
    const uuid = createBody.data.uuid

    try {
      const get = await request.get(`${BACKEND}/api/v1/articles/${uuid}/edit`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const getBody = await get.json()
      expect(getBody.data.title).toBe(specialTitle)
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })

  test('F10: 標題超過 120 字應收到後端驗證錯誤訊息', async ({ page, editorPage }) => {
    const longTitle = 'a'.repeat(121)
    await editorPage.fillTitle(longTitle)
    await editorPage.fillContent('long-title test')

    const startUrl = page.url()

    // 嘗試送出（攔截 POST /articles，儲存草稿）
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/articles') && r.request().method() === 'POST'
    )
    await editorPage.saveDraft()

    const response = await responsePromise
    const body = await response.json()
    expect(body.code).toBe('400')
    expect(body.message).toContain('標題長度')

    // toast 顯示錯誤（editor saveDraft 統一顯示「儲存失敗」，後端原始訊息可從 response body 取得 — 已上方驗）
    const toastMessage = page.getByTestId('toast-message').first()
    await expect(toastMessage).toContainText('儲存失敗', { timeout: 5000 })

    // URL 應仍在編輯器（未跳走）
    expect(page.url()).toBe(startUrl)
  })

  test('F10: markdown 內容含 XSS payload, DOMPurify 應攔截', async ({ page, editorPage, request }) => {
    // 用 API 直接建草稿（避免 editor 對 raw markdown 的處理影響測試）
    const author = (await import('../fixtures/auth')).getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const xssMarkdown = `# Hello

<script>window.__xssTriggered = true; alert('xss')<\/script>

<img src="x" onerror="window.__xssTriggered = true">

End.`

    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        title: `XSS test ${Date.now()}`,
        summary: 's',
        content: xssMarkdown,
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      },
    })
    const createBody = await create.json()
    expect(createBody.code).toBe('00000')
    const uuid = createBody.data.uuid

    try {
      // 發布
      const publishResp = await request.post(`${BACKEND}/api/v1/articles/${uuid}/publish`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(publishResp.ok()).toBeTruthy()

      // 監聽 dialog（如 alert 觸發 → fail）
      let dialogTriggered = false
      page.on('dialog', async (dialog) => {
        dialogTriggered = true
        await dialog.dismiss()
      })

      // 進公開瀏覽頁
      await page.goto(`/articles/${uuid}`)
      // 確認文章 render 成功，避免 404 偽裝成 XSS pass
      await expect(page.locator('article')).toBeVisible({ timeout: 10000 })
      // 等 markdown render 完，<h1>Hello</h1> 出現
      await page.waitForFunction(
        () => !!document.querySelector('article h1'),
        { timeout: 10000 }
      )

      // 斷言
      expect(dialogTriggered).toBe(false)

      const xssTriggered = await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__xssTriggered ?? false
      )
      expect(xssTriggered).toBe(false)

      // DOM 中 <script> tag 應該被剝除
      const scriptTags = await page.locator('article script').count()
      expect(scriptTags).toBe(0)

      // <img> 若存在不應有 onerror
      const imgWithOnError = await page.locator('article img[onerror]').count()
      expect(imgWithOnError).toBe(0)
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  })
})
