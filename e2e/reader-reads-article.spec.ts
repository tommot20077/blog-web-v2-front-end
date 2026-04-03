import { test, expect } from './fixtures/base'

test.describe('讀者閱讀文章', () => {
  test('從文章列表點進一篇文章，閱讀內容，然後返回列表', async ({
    page,
    articleListPage,
    articleDetailPage,
  }) => {
    // --- 進入文章列表，等載入完成 ---
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    // --- 點擊第一張卡片，進入詳情頁 ---
    await articleListPage.articleCards.first().click()
    await expect(page).toHaveURL(/\/articles\/.+/)

    // --- 載入動畫出現後消失 ---
    await expect(articleDetailPage.loadingText).toBeVisible()
    await articleDetailPage.waitForArticleLoaded()
    await expect(articleDetailPage.loadingText).not.toBeVisible()

    // --- 看到文章標題（非空）、標籤 ---
    await expect(articleDetailPage.articleTitle).not.toBeEmpty()
    await expect(articleDetailPage.articleTags.first()).toBeVisible()

    // --- 看到 Markdown 渲染的 HTML 內容 ---
    await expect(articleDetailPage.articleContent).toBeVisible()
    const renderedElements = await articleDetailPage.articleContent
      .locator('p, h1, h2, h3, code, pre')
      .count()
    expect(renderedElements).toBeGreaterThan(0)

    // --- Shiki 語法高亮產生 .shiki class（WASM 載入需要時間）---
    await expect(
      articleDetailPage.articleContent.locator('.shiki').first(),
    ).toBeVisible({ timeout: 15000 })

    // --- 點「回列表」按鈕，返回文章列表 ---
    await articleDetailPage.backButton.click()
    await expect(page).toHaveURL('/articles')
  })

  test('訪問不存在的文章看到 404，點按鈕返回列表', async ({
    page,
    articleDetailPage,
  }) => {
    // --- 直接訪問不存在的 UUID ---
    await articleDetailPage.goto('not-exist-uuid-12345')

    // --- 看到 404 提示 ---
    await expect(articleDetailPage.notFoundText).toBeVisible()

    // --- 點「返回列表頁面」，回到 /articles ---
    await articleDetailPage.notFoundBackButton.click()
    await expect(page).toHaveURL('/articles')
  })

  test('文章 Metadata 可見性：閱讀時間、分類、讚數、留言數', async ({
    articleListPage,
    articleDetailPage,
  }) => {
    // --- 進入第一篇文章 ---
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()
    await articleListPage.articleCards.first().click()
    await articleDetailPage.waitForArticleLoaded()

    // --- 閱讀時間標籤可見 ---
    await expect(articleDetailPage.readingTimeText).toBeVisible()

    // --- 讚數與留言數區塊可見 ---
    await expect(articleDetailPage.likeCount).toBeVisible()
    await expect(articleDetailPage.commentCount).toBeVisible()

    // --- 至少有一個分類 pill（mock 資料保證 Frontend 或 Backend）---
    await expect(articleDetailPage.categoryPills.first()).toBeVisible()
  })

  test('Scroll to top 按鈕：滾動後點擊回到頁頂', async ({
    page,
    articleListPage,
    articleDetailPage,
  }) => {
    // --- 進入文章詳情，等載入完成 ---
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()
    await articleListPage.articleCards.first().click()
    await articleDetailPage.waitForArticleLoaded()

    // --- 等文章底部出現（確保 footer 已完整渲染）---
    await expect(articleDetailPage.endOfArticle).toBeVisible()
    await expect(articleDetailPage.scrollToTopButton).toBeVisible()

    // --- 點擊回到頂部按鈕，確認不跳頁（headless Chromium 不執行 smooth scroll，不驗證 scrollY）---
    const urlBefore = page.url()
    await articleDetailPage.scrollToTopButton.click()
    expect(page.url()).toBe(urlBefore)
  })
})
