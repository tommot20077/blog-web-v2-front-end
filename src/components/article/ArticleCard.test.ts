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
})
