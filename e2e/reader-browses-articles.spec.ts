import { test, expect } from './fixtures/base'

test.describe('讀者瀏覽文章', () => {
  test('從首頁進入文章列表，過濾分類，搜尋關鍵字，翻頁瀏覽，切換視圖', async ({
    page,
    homePage,
    articleListPage,
    filterBar,
  }) => {
    // --- 首頁：看到文章卡片，點進文章列表 ---
    await homePage.goto()
    await expect(homePage.articleCards.first()).toBeVisible()
    await homePage.clickViewAll()
    await expect(page).toHaveURL('/articles')

    // --- 文章列表：等載入完成，看到文章 ---
    await articleListPage.waitForArticlesLoaded()
    const initialCount = await articleListPage.articleCards.count()
    expect(initialCount).toBeGreaterThan(0)

    // --- 分類過濾：點 Frontend，結果數量改變 ---
    await filterBar.selectCategory('Frontend')
    await articleListPage.waitForArticlesLoaded()
    const frontendCount = await articleListPage.articleCards.count()
    expect(frontendCount).toBeGreaterThan(0)

    // --- 搜尋關鍵字：結果再次改變 ---
    await filterBar.search('Vue')
    await articleListPage.waitForArticlesLoaded()
    const searchCount = await articleListPage.articleCards.count()
    expect(searchCount).toBeGreaterThan(0)

    // --- 清空搜尋：結果恢復 ---
    await filterBar.clearSearch()
    await articleListPage.waitForArticlesLoaded()
    const clearedCount = await articleListPage.articleCards.count()
    expect(clearedCount).toBeGreaterThanOrEqual(searchCount)

    // --- 切回全部分類 ---
    await filterBar.selectCategory('全部')
    await articleListPage.waitForArticlesLoaded()

    // --- 翻到第 2 頁：仍能看到文章 ---
    await articleListPage.goToPage(2)
    // 等待 loading 動畫出現再消失（確認新頁面資料載入完成）
    await articleListPage.loadingDots.waitFor({ state: 'visible' })
    await articleListPage.waitForArticlesLoaded()
    expect(await articleListPage.articleCards.count()).toBeGreaterThan(0)

    // --- 切換 List 模式：分頁器消失 ---
    await filterBar.switchToList()
    await articleListPage.waitForArticlesLoaded()
    await expect(articleListPage.paginationPrev).not.toBeVisible()
    await expect(articleListPage.paginationNext).not.toBeVisible()
  })

  test('搜尋不存在的內容時看到空狀態提示', async ({
    articleListPage,
    filterBar,
  }) => {
    await articleListPage.goto()
    await articleListPage.waitForArticlesLoaded()

    await filterBar.search('完全不存在的關鍵字xyzzy')
    await expect(articleListPage.emptyMessage).toBeVisible()
  })
})
