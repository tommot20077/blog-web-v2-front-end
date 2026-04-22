import path from 'path'
import { test, expect } from './fixtures/auth'

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
