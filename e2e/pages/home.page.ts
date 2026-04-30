import type { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly heroMarquee: Locator
  readonly recentTitle: Locator
  readonly viewAllLink: Locator
  readonly articleCards: Locator

  constructor(page: Page) {
    this.page = page
    this.heroMarquee = page.locator('h1')
    this.recentTitle = page.getByText('近期發布')
    this.viewAllLink = page.getByTestId('navbar-link-articles')
    this.articleCards = page.locator('article')
  }

  async goto() {
    await this.page.goto('/')
  }

  async clickViewAll() {
    await this.viewAllLink.click()
  }

  async clickArticleCard(index: number) {
    await this.articleCards.nth(index).click()
  }
}
