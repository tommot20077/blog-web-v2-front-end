import { test, expect } from '../fixtures/mock-app'

/**
 * W7F-7：留言內容上限 2000 字（快照 Create/EditCommentRequest.content maxLength）。
 * 瀏覽器的 maxlength 會截斷輸入與貼上，所以「超過上限」要先移除 maxlength 才能重現
 * （模擬 maxlength 被繞過，例如舊資料或其他來源寫入），用來驗證 JS 預檢本身。
 */
const ARTICLE = 'a-2025-01'
const LIMIT = 2000

test.describe('留言內容上限', () => {
  test.beforeEach(async ({ resetMockStateInApp, loginAs, page }) => {
    await resetMockStateInApp()
    await loginAs('reader')
    await page.goto(`/articles/${ARTICLE}`)
  })

  test('接近上限（1,800 字）顯示字數提示', async ({ page }) => {
    await page.getByTestId('comment-textarea').first().fill('a'.repeat(1800))
    await expect(page.getByTestId('comment-length-hint').first()).toContainText('1,800 / 2,000')
  })

  test('超過上限：顯示超出提示、送出鈕停用、留言不會新增', async ({ page }) => {
    const before = await page.getByTestId('comment-item').count()
    await page.getByTestId('comment-textarea').first().evaluate((el) => el.removeAttribute('maxlength'))
    await page.getByTestId('comment-textarea').first().fill('a'.repeat(LIMIT + 1))
    await expect(page.getByTestId('comment-length-hint').first()).toContainText('留言超過 2,000 字上限（目前 2,001 字）')
    await expect(page.getByTestId('comment-submit').first()).toBeDisabled()
    await page.getByTestId('comment-textarea').first().press('Control+Enter')
    await expect(page.getByTestId('comment-item')).toHaveCount(before)
  })

  test('textarea 帶 maxlength：輸入 2,001 字會被截成 2,000 字', async ({ page }) => {
    await page.getByTestId('comment-textarea').first().fill('c'.repeat(LIMIT + 1))
    await expect(page.getByTestId('comment-textarea').first()).toHaveValue('c'.repeat(LIMIT))
  })

  test('剛好 2,000 字：可以送出', async ({ page }) => {
    const before = await page.getByTestId('comment-item').count()
    await page.getByTestId('comment-textarea').first().fill('b'.repeat(LIMIT))
    await page.getByTestId('comment-submit').first().click()
    await expect(page.getByTestId('comment-item')).toHaveCount(before + 1)
  })
})
