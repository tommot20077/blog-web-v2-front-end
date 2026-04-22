import type { Page, Locator } from '@playwright/test'

export class EditorPage {
  readonly page: Page

  // 標題區
  readonly titleInput: Locator

  // 工具列按鈕（抽樣驗證）
  readonly boldButton: Locator
  readonly h1Button: Locator

  // 編輯面板
  readonly editorContainer: Locator

  // 動作列
  readonly saveDraftButton: Locator
  readonly submitReviewButton: Locator
  readonly wordCount: Locator

  // 側欄
  readonly summaryTextarea: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.getByTestId('editor-title-input')
    this.boldButton = page.getByTitle(/粗體/)
    this.h1Button = page.getByTitle(/H1/)
    this.editorContainer = page.getByTestId('editor-root')
    this.saveDraftButton = page.getByTestId('editor-save-btn')
    this.submitReviewButton = page.getByTestId('editor-publish-btn')
    this.wordCount = page.locator('text=/\\d+ 字/')
    this.summaryTextarea = page.getByPlaceholder(/文章摘要/)
  }

  async goto() {
    await this.page.goto('/editor')
  }

  async gotoEdit(uuid: string) {
    await this.page.goto(`/editor/${uuid}`)
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title)
  }

  async fillContent(text: string) {
    const cmContent = this.page.locator('.cm-content')
    await cmContent.click()
    await cmContent.pressSequentially(text)
  }

  async saveDraft() {
    await this.saveDraftButton.click()
  }

  async submitForReview() {
    await this.submitReviewButton.click()
  }

  async waitForSaveSuccess() {
    await this.page.getByText('草稿已儲存').waitFor({ state: 'visible', timeout: 8000 })
  }

  async waitForEditorReady() {
    await this.editorContainer.waitFor({ state: 'visible', timeout: 5000 })
  }
}
