import type { Page, Locator } from '@playwright/test'

export class NavigationBarPO {
  readonly page: Page
  readonly nav: Locator
  readonly homeLink: Locator
  readonly articlesLink: Locator
  readonly logoLink: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = page.getByTestId('navbar-root')
    this.homeLink = page.getByTestId('navbar-link-home')
    this.articlesLink = page.getByTestId('navbar-link-articles')
    this.logoLink = page.getByTestId('navbar-logo')
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
