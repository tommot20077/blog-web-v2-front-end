import { test, expect } from '../fixtures/mock-app'

/**
 * B2（RACE-05）：編輯器存檔帶 version，別處改過時後端回 409／A0208，
 * 前端提示「已在其他地方被修改」，由使用者選擇重新載入或取消（不做自動合併）。
 * 「別處改過」以 mock 控制 simulateExternalArticleUpdate 模擬。
 */
const ARTICLE_UUID = 'editor-draft-1'
const CONFLICT_MESSAGE = '這篇文章已在其他地方被修改。重新載入會捨棄你目前未儲存的內容。'

test.describe('編輯器存檔衝突（B2）', () => {
  test.beforeEach(async ({ page, resetMockStateInApp, loginAs }) => {
    await resetMockStateInApp()
    await loginAs('author')
    await page.goto(`/editor/${ARTICLE_UUID}`)
    await expect(page.getByTestId('editor-title-input')).toHaveValue('Vue 3 Composition API 草稿')
  })

  test('沒有衝突時可連續存檔（每次改用新 version）', async ({ page }) => {
    const title = page.getByTestId('editor-title-input')
    await title.fill('第一次存檔')
    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible()

    await title.fill('第二次存檔')
    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存').first()).toBeVisible()
    await expect(page.getByText('儲存失敗')).toHaveCount(0)
  })

  test('別處改過後存檔 → 跳提示；取消：留在原頁、本機內容不變', async ({ page, simulateExternalArticleUpdate }) => {
    await simulateExternalArticleUpdate(ARTICLE_UUID, { title: '別處改的標題', content: '# 別處改的內容' })

    const title = page.getByTestId('editor-title-input')
    await title.fill('我的修改')

    const messages: string[] = []
    page.once('dialog', (dialog) => {
      messages.push(dialog.message())
      void dialog.dismiss()
    })
    await page.getByTestId('editor-save-btn').click()

    await expect.poll(() => messages).toEqual([CONFLICT_MESSAGE])
    await expect(title).toHaveValue('我的修改')
    await expect(page.getByText('草稿已儲存')).toHaveCount(0)
  })

  test('別處改過後存檔 → 重新載入：以最新內容取代本機內容，之後可正常存檔', async ({ page, simulateExternalArticleUpdate }) => {
    await simulateExternalArticleUpdate(ARTICLE_UUID, { title: '別處改的標題', content: '# 別處改的內容' })

    const title = page.getByTestId('editor-title-input')
    await title.fill('我的修改')

    page.once('dialog', (dialog) => void dialog.accept())
    await page.getByTestId('editor-save-btn').click()

    await expect(title).toHaveValue('別處改的標題')
    await expect(page.locator('.cm-content')).toContainText('別處改的內容')

    // 重新載入後改用新 version，且不應再有任何對話框
    let dialogShown = false
    page.on('dialog', (dialog) => {
      dialogShown = true
      void dialog.dismiss()
    })

    // 再改再存不會再衝突
    await title.fill('重新載入後的修改')
    await page.getByTestId('editor-save-btn').click()
    await expect(page.getByText('草稿已儲存')).toBeVisible()
    expect(dialogShown).toBe(false)
  })
})
