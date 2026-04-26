import { test, expect } from './fixtures/base'

test.describe('讀者瀏覽文章', () => {
  test('從首頁進入文章列表，過濾分類，翻頁瀏覽，切換視圖', async ({
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

    // --- 切回全部分類 ---
    await filterBar.selectCategory('全部')
    await articleListPage.waitForArticlesLoaded()

    // --- 切換到 Pages 分頁模式，翻第 2 頁（integration 只有 1 頁時跳過）---
    await filterBar.switchToPagesMode()
    await articleListPage.waitForArticlesLoaded()
    const page2Btn = articleListPage.pageButton(2)
    if (await page2Btn.isVisible()) {
      await articleListPage.goToPage(2)
      await articleListPage.waitForArticlesLoaded()
      expect(await articleListPage.articleCards.count()).toBeGreaterThan(0)
    }

    // --- 切換 List 模式：同時切回 infinite，分頁器消失 ---
    await filterBar.switchToList()
    await articleListPage.waitForArticlesLoaded()
    await expect(articleListPage.paginationPrev).not.toBeVisible()
    await expect(articleListPage.paginationNext).not.toBeVisible()
  })

  test('使用搜尋頁搜尋不存在的內容時看到無結果提示', async ({ searchPage }) => {
    await searchPage.goto()

    await searchPage.typeKeyword('完全不存在的關鍵字xyzzy')
    await searchPage.waitForNoResult()

    await expect(searchPage.noResultState).toBeVisible()
  })
})
