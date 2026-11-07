import { test, expect } from '../fixtures/mock-app'

/**
 * A6b：上傳前先檢查單檔大小（文章圖片 20MB、頭像 5MB），超過就直接提示、不送出。
 * mock 的 uploadFile 一律成功，所以「有出現友善提示」＝前端自己擋下了。
 */
const MB = 1024 * 1024

function pngBuffer(size: number) {
  return { name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(size, 1) }
}

test.describe('上傳大小檢查', () => {
  test.beforeEach(async ({ resetMockStateInApp, loginAs }) => {
    await resetMockStateInApp()
    await loginAs('author')
  })

  test('封面圖超過 20MB：提示檔案太大，不顯示預覽', async ({ page }) => {
    await page.goto('/editor')
    await page.getByTestId('cover-upload-input').setInputFiles(pngBuffer(20 * MB + 1))

    await expect(page.getByText('檔案太大（文章圖片上限 20MB，頭像上限 5MB）').first()).toBeVisible()
    await expect(page.locator('img[alt="封面圖預覽"]')).toHaveCount(0)
  })

  test('封面圖剛好 20MB：可以上傳', async ({ page }) => {
    await page.goto('/editor')
    await page.getByTestId('cover-upload-input').setInputFiles(pngBuffer(20 * MB))

    await expect(page.locator('img[alt="封面圖預覽"]')).toBeVisible({ timeout: 8000 })
  })

  test('設定頁頭像超過 5MB：選檔當下提示，預覽不變', async ({ page }) => {
    await page.goto('/settings')
    const input = page.getByTestId('avatar-upload-input')
    await expect(input).toBeAttached()
    await input.setInputFiles(pngBuffer(5 * MB + 1))

    await expect(page.getByText('檔案太大（文章圖片上限 20MB，頭像上限 5MB）').first()).toBeVisible()
    await expect(page.locator('.st-avatar-box img')).toHaveCount(0)
  })

  test('設定頁頭像剛好 5MB：接受並顯示預覽', async ({ page }) => {
    await page.goto('/settings')
    await page.getByTestId('avatar-upload-input').setInputFiles(pngBuffer(5 * MB))

    await expect(page.locator('.st-avatar-box img')).toBeVisible()
  })
})
