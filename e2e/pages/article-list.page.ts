import type { Page, Locator } from '@playwright/test'

export class ArticleListPage {
  readonly page: Page
  readonly articleCards: Locator
  readonly loadingDots: Locator
  readonly emptyMessage: Locator
  readonly paginationPrev: Locator
  readonly paginationNext: Locator
  readonly noMoreDataMessage: Locator
  readonly loadingMoreMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.articleCards = page.locator('article')
    this.loadingDots = page.locator('.animate-bounce').first()
    this.emptyMessage = page.getByText('沒有找到符合條件的文章。')
    this.paginationPrev = page.getByRole('button', { name: '←' })
    this.paginationNext = page.getByRole('button', { name: '→' })
    this.noMoreDataMessage = page.getByText('已經到底囉！')
    this.loadingMoreMessage = page.getByText('載入下一頁中...')
  }

  async goto() {
    await this.page.goto('/articles')
  }

  /** 等待首次載入完成（loading 消失 + 文章出現） */
  async waitForArticlesLoaded() {
    await this.articleCards.first().waitFor({ state: 'visible' })
  }

  /** 點擊分頁器指定頁碼 */
  async goToPage(pageNumber: number) {
    await this.page.getByRole('button', { name: String(pageNumber), exact: true }).click()
  }

  /** 取得分頁器按鈕 */
  pageButton(pageNumber: number) {
    return this.page.getByRole('button', { name: String(pageNumber), exact: true })
  }
}
