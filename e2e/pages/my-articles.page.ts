import type { Page, Locator } from '@playwright/test'

export class MyArticlesPage {
  readonly page: Page
  readonly root: Locator
  readonly headerTitle: Locator
  readonly newArticleBtn: Locator
  readonly tabDraft: Locator
  readonly tabPublished: Locator
  readonly loading: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('my-root')
    this.headerTitle = page.getByTestId('my-header-title')
    this.newArticleBtn = page.getByTestId('my-new-btn')
    this.tabDraft = page.getByTestId('my-tab-draft')
    this.tabPublished = page.getByTestId('my-tab-published')
    this.loading = page.getByTestId('loading')
  }

  async goto() {
    await this.page.goto('/my-articles')
  }

  articleRow(uuid: string) {
    return this.page.getByTestId(`my-row-${uuid}`)
  }

  editBtn(uuid: string) {
    return this.page.getByTestId(`my-row-action-edit-${uuid}`)
  }

  deleteBtn(uuid: string) {
    return this.page.getByTestId(`my-row-action-delete-${uuid}`)
  }
}
