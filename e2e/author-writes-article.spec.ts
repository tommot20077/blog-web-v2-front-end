import { test, expect } from './fixtures/auth'

test.describe('作者撰寫文章', () => {
  test.beforeEach(async ({ loginAsAuthorAndGoToEditor }) => {
    await loginAsAuthorAndGoToEditor()
  })

  test('作者可進入編輯器並看到所有 UI 元素', async ({ page, editorPage }) => {
    // 標題輸入框
    await expect(editorPage.titleInput).toBeVisible()

    // 工具列按鈕
    await expect(editorPage.boldButton).toBeVisible()
    await expect(editorPage.h1Button).toBeVisible()

    // 儲存按鈕
    await expect(editorPage.saveDraftButton).toBeVisible()
    await expect(editorPage.submitReviewButton).toBeVisible()

    // 字數顯示
    await expect(editorPage.wordCount).toBeVisible()
  })

  test('點擊「儲存草稿」後按鈕從「儲存中...」回到「儲存草稿」', async ({ page, editorPage }) => {
    await editorPage.fillTitle('E2E 測試文章標題')
    await editorPage.saveDraft()

    // 按鈕文字先變為「儲存中...」（isSaving=true）再回到「儲存草稿」（isSaving=false）
    // 等待 isSaving=false（button 文字回到原狀）
    await expect(editorPage.saveDraftButton).toHaveText('儲存草稿', { timeout: 5000 })
  })

  test('工具列粗體按鈕可點擊', async ({ editorPage }) => {
    await editorPage.boldButton.click()
    // 不拋出錯誤即為通過
  })

  test('側欄顯示分類選項', async ({ page }) => {
    // 等待分類非同步載入
    await expect(page.getByText('Frontend').first()).toBeVisible({ timeout: 5000 })
  })

  test('側欄可輸入文章摘要', async ({ editorPage }) => {
    await editorPage.summaryTextarea.fill('這是測試摘要')
    await expect(editorPage.summaryTextarea).toHaveValue('這是測試摘要')
  })

  test('新文章儲存草稿後 URL 更新至 /editor/{uuid}', async ({ page, editorPage }) => {
    // 確認初始在 /editor（無 uuid）
    await expect(page).toHaveURL('/editor')

    await editorPage.fillTitle('E2E UUID 接力測試')
    await editorPage.fillContent('Test content for E2E.')
    await editorPage.saveDraft()
    await editorPage.waitForSaveSuccess()

    // 儲存後 URL 應更新為 /editor/{uuid}（非 /editor）
    await expect(page).toHaveURL(/\/editor\/.+/, { timeout: 5000 })
  })

  test('再次儲存草稿 UUID 不變，URL 不再更改', async ({ page, editorPage }) => {
    await editorPage.fillTitle('E2E UUID 接力測試 - 重複儲存')
    await editorPage.fillContent('Test content for repeated save E2E.')
    await editorPage.saveDraft()
    await editorPage.waitForSaveSuccess()

    // 取得第一次儲存後的 URL
    await page.waitForURL(/\/editor\/.+/, { timeout: 5000 })
    const urlAfterFirstSave = page.url()

    // 再次儲存
    await editorPage.saveDraft()
    await editorPage.waitForSaveSuccess()

    // URL 應與第一次相同（uuid 未改變）
    expect(page.url()).toBe(urlAfterFirstSave)
  })

  // F2/F3/F10 補強
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

  test('F3: 輸入標籤按 Enter 後標籤 chip 顯示', async ({ page, editorPage }) => {
    await editorPage.fillTitle(`E2E tag ${Date.now()}`)
    const tagInput = page.getByPlaceholder('輸入標籤後按 Enter')
    await tagInput.fill('vue3-spec')
    await tagInput.press('Enter')
    // 標籤 chip 應在頁面顯示
    await expect(page.locator('text=vue3-spec').first()).toBeVisible({ timeout: 3000 })
  })

  test('F10: 特殊字元 (emoji + 中文 + 全形) 標題能 round-trip 正常存讀', async ({ request }) => {
    const author = (await import('./fixtures/auth')).getCredentials('author')
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
