import type { Page, Locator } from '@playwright/test'

export class FilterBarPO {
  readonly page: Page
  readonly gridToggle: Locator
  readonly listToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.gridToggle = page.getByTitle('網格與分頁模式')
    this.listToggle = page.getByTitle('無限捲動清單模式')
  }

  async selectCategory(name: string) {
    await this.page.getByTestId('articles-filter-bar').getByRole('button', { name, exact: true }).click()
  }

  async switchToGrid() {
    await this.gridToggle.click()
  }

  async switchToList() {
    await this.listToggle.click()
  }
}
