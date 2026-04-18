import type { Page, Locator } from '@playwright/test'

export class ArticleDetailPage {
  readonly page: Page
  readonly loadingText: Locator
  readonly notFoundEmoji: Locator
  readonly notFoundText: Locator
  readonly notFoundBackButton: Locator
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
    this.notFoundEmoji = page.getByText('🏜️')
    this.notFoundText = page.getByText('找不到該篇文章（404）')
    this.notFoundBackButton = page.getByRole('button', { name: '返回列表頁面' })
    this.backButton = page.getByRole('button', { name: '回列表' })
    this.articleTitle = page.getByTestId('article-title')
    this.articleTags = page.locator('article header span').filter({ hasText: '#' })
    this.articleContent = page.getByTestId('article-body')
    this.scrollToTopButton = page.locator('article footer button')
    this.endOfArticle = page.getByText('END OF ARTICLE.')
    this.categoryPills = page.locator('article header span').filter({ hasNotText: '#' })
    this.readingTimeText = page.getByText(/分鐘閱讀時間/)
    this.likeCount = page.locator('[data-testid="like-count"]')
    this.commentCount = page.locator('[data-testid="comment-count"]')
  }

  async goto(uuid: string) {
    await this.page.goto(`/articles/${uuid}`)
  }

  /** 等待文章載入完成 */
  async waitForArticleLoaded() {
    await this.articleTitle.waitFor({ state: 'visible' })
  }
}
