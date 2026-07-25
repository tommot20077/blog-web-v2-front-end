import { fireEvent, waitFor } from '@testing-library/vue'
import ArticleCard from './ArticleCard.vue'
import { renderWithRouter, createMockArticle } from '../../test-utils'

describe('ArticleCard', () => {
  it('渲染文章資訊 — 標題、日期、觀看次數、摘要、標籤皆正確顯示', () => {
    const article = createMockArticle({
      title: '深入理解 Vue 3',
      publishedAt: '2026-03-15',
      viewCount: 256,
      summary: '本篇文章深入探討 Vue 3 的核心概念',
      tags: ['Vue', 'Frontend'],
    })

    const { getByText } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    expect(getByText('深入理解 Vue 3')).toBeTruthy()
    expect(getByText('2026-03-15')).toBeTruthy()
    expect(getByText('256 次觀看')).toBeTruthy()
    expect(getByText('本篇文章深入探討 Vue 3 的核心概念')).toBeTruthy()
    expect(getByText('# Vue')).toBeTruthy()
    expect(getByText('# Frontend')).toBeTruthy()
  })

  it('顯示作者暱稱', () => {
    const article = createMockArticle({ authorNickname: 'Yuan' })

    const { getByText } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    expect(getByText('Yuan')).toBeTruthy()
  })

  it('顯示按讚數和留言數', () => {
    const article = createMockArticle({ likeCount: 42, commentCount: 7 })

    const { container } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    const likeEl = container.querySelector('[data-testid="like-count"]')
    const commentEl = container.querySelector('[data-testid="comment-count"]')
    expect(likeEl?.textContent).toContain('42')
    expect(commentEl?.textContent).toContain('7')
  })

  it('有封面圖時渲染 img 元素', () => {
    const article = createMockArticle({ coverImageUrl: 'https://example.com/cover.jpg' })

    const { container } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.src).toContain('example.com/cover.jpg')
    expect(img?.getAttribute('loading')).toBe('lazy')
  })

  it('coverImageUrl 為 null 時不渲染圖片', () => {
    const article = createMockArticle({ coverImageUrl: null })

    const { container } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    const img = container.querySelector('img')
    expect(img).toBeNull()
  })

  it('點擊卡片 → 導航至 /articles/{uuid}', async () => {
    const article = createMockArticle({ uuid: 'abc-123' })

    const { getByText, router } = renderWithRouter(ArticleCard, {
      props: { article },
    })

    await router.isReady()
    await fireEvent.click(getByText(article.title))

    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/articles/abc-123')
    })
  })

  describe('標籤連結', () => {
    it('有 tagRefs 時，標籤渲染為連向 /tags/{slug} 的連結', () => {
      const article = createMockArticle({
        uuid: 'abc-123',
        tags: ['Vue', 'Frontend'],
        tagRefs: [
          { name: 'Vue', slug: 'vue' },
          { name: 'Frontend', slug: 'frontend' },
        ],
      })

      const { container } = renderWithRouter(ArticleCard, {
        props: { article },
      })

      const links = container.querySelectorAll('a[href^="/tags/"]')
      expect(links).toHaveLength(2)
      expect(links[0]).toHaveAttribute('href', '/tags/vue')
      expect(links[1]).toHaveAttribute('href', '/tags/frontend')
      expect(links[0]?.textContent).toContain('Vue')
      expect(links[1]?.textContent).toContain('Frontend')
    })

    it('點擊標籤連結會導航至對應 tag 頁面，且不會觸發卡片本身的文章導航（阻止冒泡）', async () => {
      const article = createMockArticle({
        uuid: 'abc-123',
        tags: ['Vue'],
        tagRefs: [{ name: 'Vue', slug: 'vue' }],
      })

      const { container, router } = renderWithRouter(ArticleCard, {
        props: { article },
      })

      await router.isReady()
      const link = container.querySelector('a[href="/tags/vue"]')!
      await fireEvent.click(link)

      await waitFor(() => {
        expect(router.currentRoute.value.path).toBe('/tags/vue')
      })
      // 關鍵斷言：若冒泡未被阻止，卡片的 @click 會接著把路由推去 /articles/abc-123，
      // 最終路由會是文章詳情頁而非標籤頁。
      expect(router.currentRoute.value.path).not.toBe('/articles/abc-123')
    })

    it('tagRefs 缺失時退回純文字渲染，不噴錯且標籤不消失', () => {
      const article = createMockArticle({
        tags: ['Vue', 'TypeScript'],
        tagRefs: undefined,
      })

      const { container, getByText } = renderWithRouter(ArticleCard, {
        props: { article },
      })

      expect(container.querySelectorAll('a[href^="/tags/"]')).toHaveLength(0)
      expect(getByText('# Vue')).toBeTruthy()
      expect(getByText('# TypeScript')).toBeTruthy()
    })

    it('tagRefs 為空陣列時同樣退回純文字渲染', () => {
      const article = createMockArticle({
        tags: ['Vue'],
        tagRefs: [],
      })

      const { container, getByText } = renderWithRouter(ArticleCard, {
        props: { article },
      })

      expect(container.querySelectorAll('a[href^="/tags/"]')).toHaveLength(0)
      expect(getByText('# Vue')).toBeTruthy()
    })
  })
})
