import { test, expect } from '../fixtures/auth'

/**
 * D5（FE-02）：編輯器有未儲存修改時，站內切頁要跳確認；存檔後或沒修改則不跳。
 * 站內切頁以 router.push 觸發（編輯器是 full layout，沒有導覽列連結），
 * 與使用者點連結走同一條 onBeforeRouteLeave 路徑。
 */
test.describe('編輯器離開前確認', () => {
  test.beforeEach(async ({ loginAsAuthorAndGoToEditor }) => {
    await loginAsAuthorAndGoToEditor()
  })

  const leaveTo = (page: import('@playwright/test').Page, path: string) =>
    page.evaluate((target) => {
      const router = (window as unknown as { __router: { push: (p: string) => Promise<unknown> } }).__router
      return router.push(target).then(() => undefined)
    }, path)

  test('輸入標題後切頁會跳確認；取消留在編輯器，確認才離開', async ({ page, editorPage }) => {
    await editorPage.fillTitle('尚未儲存的標題')

    const messages: string[] = []
    page.once('dialog', (dialog) => {
      messages.push(dialog.message())
      void dialog.dismiss()
    })
    await leaveTo(page, '/my-articles')
    expect(messages).toEqual(['你有尚未儲存的修改，確定要離開嗎？'])
    await expect(page).toHaveURL('/editor')
    await expect(editorPage.titleInput).toHaveValue('尚未儲存的標題')

    page.once('dialog', (dialog) => void dialog.accept())
    await leaveTo(page, '/my-articles')
    await expect(page).toHaveURL(/\/my-articles/)
  })

  test('在 CodeMirror 輸入內文（沒改標題）也會跳確認', async ({ page, editorPage }) => {
    await editorPage.fillContent('只改了內文')

    let dialogShown = false
    page.once('dialog', (dialog) => {
      dialogShown = true
      void dialog.dismiss()
    })
    await leaveTo(page, '/my-articles')
    expect(dialogShown).toBe(true)
    await expect(page).toHaveURL('/editor')
  })

  test('沒有任何修改時直接離開，不跳確認', async ({ page }) => {
    let dialogShown = false
    page.on('dialog', (dialog) => {
      dialogShown = true
      void dialog.dismiss()
    })
    await leaveTo(page, '/my-articles')
    await expect(page).toHaveURL(/\/my-articles/)
    expect(dialogShown).toBe(false)
  })

  test('儲存草稿成功後再離開，不跳確認', async ({ page, editorPage }) => {
    await editorPage.fillTitle('先存再走')
    await editorPage.fillContent('內容')
    await editorPage.saveDraft()
    await editorPage.waitForSaveSuccess()
    await expect(page).toHaveURL(/\/editor\/.+/)

    let dialogShown = false
    page.on('dialog', (dialog) => {
      dialogShown = true
      void dialog.dismiss()
    })
    await leaveTo(page, '/my-articles')
    await expect(page).toHaveURL(/\/my-articles/)
    expect(dialogShown).toBe(false)
  })
})
