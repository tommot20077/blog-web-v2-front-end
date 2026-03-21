import type { Page, Locator } from '@playwright/test'

export class ThemeSwitcherPO {
  readonly page: Page
  readonly toggleButton: Locator

  constructor(page: Page) {
    this.page = page
    this.toggleButton = page.getByRole('button', { name: '切換深淺色模式' })
  }

  async toggle() {
    await this.toggleButton.click()
  }

  /** 取得目前的 data-theme 屬性值 */
  async getTheme(): Promise<string | null> {
    return this.page.locator('html').getAttribute('data-theme')
  }
}
