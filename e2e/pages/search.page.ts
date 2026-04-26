import type { Page, Locator } from '@playwright/test'

export class SearchPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly noResultState: Locator
  readonly articleCards: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByTestId('search-input')
    this.noResultState = page.getByTestId('search-no-result')
    this.articleCards = page.locator('[data-testid="search-article-card"]')
  }

  async goto() {
    await this.page.goto('/search')
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword)
  }

  async typeKeyword(keyword: string) {
    await this.searchInput.fill(keyword)
  }

  async clearSearch() {
    await this.searchInput.clear()
  }

  async waitForResults(timeout = 5000) {
    await this.articleCards.first().waitFor({ state: 'visible', timeout })
  }

  async waitForNoResult(timeout = 8000) {
    await this.noResultState.waitFor({ state: 'visible', timeout })
  }

  /** 等待搜尋完成：接受「有結果」或「無結果提示」兩種情況 */
  async waitForSearchComplete(timeout = 8000) {
    await Promise.any([
      this.articleCards.first().waitFor({ state: 'visible', timeout }),
      this.noResultState.waitFor({ state: 'visible', timeout }),
    ])
  }
}
