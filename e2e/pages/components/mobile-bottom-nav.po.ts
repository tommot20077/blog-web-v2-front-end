import type { Page, Locator } from '@playwright/test'

export class MobileBottomNavPO {
  readonly nav: Locator
  readonly tabs: Locator
  readonly homeTab: Locator
  readonly articlesTab: Locator
  readonly searchTab: Locator
  readonly profileTab: Locator

  constructor(page: Page) {
    this.nav = page.locator('[data-testid="mobile-bottom-nav"]')
    this.tabs = page.locator('[data-testid="nav-tab"]')
    this.homeTab = this.tabs.nth(0)
    this.articlesTab = this.tabs.nth(1)
    this.searchTab = this.tabs.nth(2)
    this.profileTab = this.tabs.nth(3)
  }

  async clickHomeTab() {
    await this.homeTab.click()
  }

  async clickArticlesTab() {
    await this.articlesTab.click()
  }

  async clickSearchTab() {
    await this.searchTab.click()
  }

  async clickProfileTab() {
    await this.profileTab.click()
  }
}
