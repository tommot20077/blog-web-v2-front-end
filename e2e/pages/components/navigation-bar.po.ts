import type { Page, Locator } from '@playwright/test'

export class NavigationBarPO {
  readonly page: Page
  readonly nav: Locator
  readonly homeLink: Locator
  readonly articlesLink: Locator
  readonly logoLink: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = page.locator('nav')
    this.homeLink = page.getByRole('link', { name: '首頁', exact: true })
    this.articlesLink = page.getByRole('link', { name: '文章', exact: true })
    this.logoLink = page.getByRole('link', { name: 'MY BLOG WEB.' })
  }

  async navigateToHome() {
    await this.homeLink.click()
  }

  async navigateToArticles() {
    await this.articlesLink.click()
  }

  async clickLogo() {
    await this.logoLink.click()
  }
}
