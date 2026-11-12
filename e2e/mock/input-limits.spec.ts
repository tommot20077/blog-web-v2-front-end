import { test, expect } from '../fixtures/mock-app'

/**
 * W7F-6：編輯器內文上限 200,000 字（快照 Create/UpdateArticleRequest.content maxLength）。
 * 內文達 90% 顯示字數提示；超過時存檔不送出並說明原因。
 * 用 keyboard.insertText 一次寫入整段文字，避免逐字輸入 20 萬字。
 */
const LIMIT = 200000

test.describe('編輯器內文上限', () => {
  test.beforeEach(async ({ resetMockStateInApp, loginAs, page }) => {
    await resetMockStateInApp()
    await loginAs('author')
    await page.goto('/editor')
    await page.getByTestId('editor-title-input').fill('上限測試')
  })

  async function typeContent(page: import('@playwright/test').Page, length: number) {
    const cm = page.locator('.cm-content')
    await cm.click()
    await page.keyboard.insertText('a'.repeat(length))
  }

  test('接近上限（180,000 字）顯示字數提示', async ({ page }) => {
    await typeContent(page, 180000)
    await expect(page.getByTestId('editor-content-limit-hint')).toContainText('180,000')
  })

  test('超過上限：顯示超出提示，按儲存不會成功', async ({ page }) => {
    await typeContent(page, LIMIT + 1)
    await expect(page.getByTestId('editor-content-limit-hint')).toContainText('內文超過 200,000 字上限')

    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('內文超過 200,000 字上限（目前 200,001 字）', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('草稿已儲存')).toHaveCount(0)
    await expect(page).toHaveURL(/\/editor$/)
  })

  test('剛好 200,000 字：可以儲存', async ({ page }) => {
    await typeContent(page, LIMIT)
    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible({ timeout: 10000 })
  })
})
