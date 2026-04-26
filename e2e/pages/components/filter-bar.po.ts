import type { Page, Locator } from '@playwright/test'

export class FilterBarPO {
  readonly page: Page
  readonly gridToggle: Locator
  readonly listToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.gridToggle = page.getByTitle('網格視圖')
    this.listToggle = page.getByTitle('無限捲動清單模式')
  }

  async selectCategory(name: string) {
    if (name === '全部') {
      const clearBtn = this.page.locator('.art-rail-head .clear')
      if (await clearBtn.isVisible()) {
        await clearBtn.click()
      }
      return
    }
    await this.page
      .getByTestId('articles-filter-bar')
      .locator('.art-check', { hasText: name })
      .click()
  }

  async switchToGrid() {
    await this.gridToggle.click()
  }

  async switchToList() {
    await this.listToggle.click()
  }

  async switchToPagesMode() {
    await this.page.locator('.art-seg button', { hasText: 'Pages' }).click()
  }
}
