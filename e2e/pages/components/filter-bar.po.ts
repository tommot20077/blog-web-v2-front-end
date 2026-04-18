import type { Page, Locator } from '@playwright/test'

export class FilterBarPO {
  readonly page: Page
  readonly searchInput: Locator
  readonly gridToggle: Locator
  readonly listToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByTestId('articles-search-input')
    this.gridToggle = page.getByTitle('網格與分頁模式')
    this.listToggle = page.getByTitle('無限捲動清單模式')
  }

  /** 點擊分類按鈕 */
  async selectCategory(name: string) {
    await this.page.getByRole('button', { name, exact: true }).click()
  }

  /** 輸入關鍵字並按 Enter 搜尋 */
  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.searchInput.press('Enter')
  }

  /** 清空搜尋欄位並按 Enter */
  async clearSearch() {
    await this.searchInput.clear()
    await this.searchInput.press('Enter')
  }

  async switchToGrid() {
    await this.gridToggle.click()
  }

  async switchToList() {
    await this.listToggle.click()
  }
}
