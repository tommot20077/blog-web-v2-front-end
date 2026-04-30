import type { Page, Locator } from '@playwright/test'

export class ArticleDetailPage {
  readonly page: Page
  readonly loadingText: Locator
  readonly backButton: Locator
  readonly articleTitle: Locator
  readonly articleTags: Locator
  readonly articleContent: Locator
  readonly scrollToTopButton: Locator
  readonly endOfArticle: Locator
  readonly categoryPills: Locator
  readonly readingTimeText: Locator
  readonly likeCount: Locator
  readonly commentCount: Locator

  constructor(page: Page) {
    this.page = page
    this.loadingText = page.getByText('萃取文章細節中...')
    this.backButton = page.getByRole('button', { name: '回列表' })
    this.articleTitle = page.getByTestId('article-title')
    this.articleTags = page.getByTestId('article-tags').locator('span')
    this.articleContent = page.getByTestId('article-body')
    this.scrollToTopButton = page.locator('article footer button')
    this.endOfArticle = page.getByText('END OF ARTICLE.')
    this.categoryPills = page.getByTestId('article-categories').locator('span')
    this.readingTimeText = page.getByText(/分鐘閱讀時間/)
    this.likeCount = page.locator('[data-testid="like-count"]')
    this.commentCount = page.locator('[data-testid="comment-count"]')
  }

  async goto(uuid?: string) {
    if (uuid) {
      await this.page.goto(`/articles/${uuid}`)
      return
    }
    await this.page.goto('/articles')
    await this.page.locator('article').first().waitFor({ state: 'visible', timeout: 10000 })
    await this.page.locator('article').first().click()
    await this.page.waitForURL(/\/articles\//, { timeout: 10000 })
  }

  /** 等待文章載入完成 */
  async waitForArticleLoaded() {
    await this.articleTitle.waitFor({ state: 'visible' })
  }

  async waitForContent() {
    await this.waitForArticleLoaded()
  }
}
