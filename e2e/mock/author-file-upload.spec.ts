import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '../fixtures/auth'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('作者上傳封面圖', () => {
  test.beforeEach(async ({ loginAsAuthorAndGoToEditor }) => {
    await loginAsAuthorAndGoToEditor()
  })

  test('上傳封面圖後顯示預覽圖', async ({ page }) => {
    // 在 editor 側欄找到封面圖 file input（以 testid 定位，避免與內文圖 input 撞名）
    const fileInput = page.getByTestId('cover-upload-input')
    await expect(fileInput).toBeAttached()

    // 使用 Playwright 內建的 setInputFiles（不觸發真實 dialog）
    const testImagePath = path.join(__dirname, '../fixtures', 'test-image.png')
    await fileInput.setInputFiles(testImagePath)

    // 封面預覽圖應出現（img tag 出現代表 uploadFile 成功並 emit coverImageUrl）
    await expect(page.locator('img[alt="封面圖預覽"]')).toBeVisible({ timeout: 8000 })
  })

  test('移除封面圖後預覽圖消失', async ({ page }) => {
    // 先上傳（以 testid 定位封面圖 input，避免與內文圖 input 撞名）
    const fileInput = page.getByTestId('cover-upload-input')
    const testImagePath = path.join(__dirname, '../fixtures', 'test-image.png')
    await fileInput.setInputFiles(testImagePath)

    const preview = page.locator('img[alt="封面圖預覽"]')
    await expect(preview).toBeVisible({ timeout: 8000 })

    // 點 ✕ 移除封面
    await page.locator('button:has-text("✕")').click()
    await expect(preview).not.toBeVisible()
  })
})
