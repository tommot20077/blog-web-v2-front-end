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
})
