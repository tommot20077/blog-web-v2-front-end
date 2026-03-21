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
})
