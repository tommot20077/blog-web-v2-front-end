import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from './fixtures/auth'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('作者上傳封面圖', () => {
  test.beforeEach(async ({ loginAsAuthorAndGoToEditor }) => {
    await loginAsAuthorAndGoToEditor()
  })

  test('上傳封面圖後顯示預覽圖', async ({ page }) => {
    // 在 editor 側欄找到 file input 並設定測試圖檔
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    await expect(fileInput).toBeAttached()

    // 使用 Playwright 內建的 setInputFiles（不觸發真實 dialog）
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')
    await fileInput.setInputFiles(testImagePath)

    // 封面預覽圖應出現（img tag 出現代表 uploadFile 成功並 emit coverImageUrl）
    await expect(page.locator('img[alt="封面圖預覽"]')).toBeVisible({ timeout: 8000 })
  })

  test('移除封面圖後預覽圖消失', async ({ page }) => {
    // 先上傳
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')
    await fileInput.setInputFiles(testImagePath)

    const preview = page.locator('img[alt="封面圖預覽"]')
    await expect(preview).toBeVisible({ timeout: 8000 })

    // 點 ✕ 移除封面
    await page.locator('button:has-text("✕")').click()
    await expect(preview).not.toBeVisible()
  })
})

// G3/G4/G8 純 API 補強（G5 配額超因為要 600MB+ buffer 不實際, defer）
import { getCredentials } from './fixtures/auth'

test.describe('檔案上傳邊界 API (G3/G4/G8)', () => {
  test.skip(process.env.E2E_MOCK === '1', '需要真實後端，在 e2e-integration job 執行')

  test('G3: png MIME 上傳成功並回 FileUploadResponse', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
      '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
      '4e44ae426082',
      'hex',
    )

    const resp = await request.post('http://localhost:9010/api/v1/files/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g3-test.png', mimeType: 'image/png', buffer: png },
        usageType: 'ARTICLE_COVER',
      },
    })
    expect(resp.ok()).toBeTruthy()
    const body = await resp.json()
    expect(body.code).toBe('00000')
    expect(body.data.id).toMatch(/[0-9a-f-]{36}/i)
    expect(body.data.url).toBeTruthy()

    // cleanup
    await request.delete(`http://localhost:9010/api/v1/files/${body.data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  })

  test('G4: 上傳 .txt 應拒絕 (A0404 不支援的檔案類型)', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const resp = await request.post('http://localhost:9010/api/v1/files/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g4-test.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
        usageType: 'ARTICLE_COVER',
      },
    })
    const body = await resp.json()
    expect(body.code).toBe('A0404')
    expect(body.message).toContain('不支援')
  })

  test('G8: 上傳後 DELETE /files/{id}, /users/me/files 不再包含', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
      '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
      '4e44ae426082',
      'hex',
    )
    const upload = await request.post('http://localhost:9010/api/v1/files/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g8-test.png', mimeType: 'image/png', buffer: png },
        usageType: 'ARTICLE_COVER',
      },
    })
    const fileId = (await upload.json()).data.id

    const del = await request.delete(`http://localhost:9010/api/v1/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect((await del.json()).code).toBe('00000')

    const list = await request.get('http://localhost:9010/api/v1/users/me/files', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const files = (await list.json()).data as Array<{ id: string }>
    expect(files.find((f) => f.id === fileId)).toBeUndefined()
  })
})
