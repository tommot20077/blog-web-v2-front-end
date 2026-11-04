import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { render } from '@testing-library/vue'
import SearchView from './SearchView.vue'
import { createTestRouter } from '../test-utils'
import type { SearchResult } from '../types/search'

function result(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    articleUuid: 'art-1', title: 'Vue 入門', summary: '摘要', slug: 'vue-intro',
    authorNickname: 'Yuan', authorUuid: 'author-1', tagNames: ['vue'],
    publishedAt: '2026-03-01T00:00:00', viewCount: 10, likeCount: 1,
    ...overrides,
  }
}

const articles = ref<SearchResult[]>([])

vi.mock('../composables/useSearch', () => ({
  useSearch: () => ({
    query: ref('yu'),
    debouncedQuery: ref('yu'),
    isLoading: ref(false),
    results: computed(() => ({ articles: articles.value, tags: [], total: articles.value.length })),
    popularTags: ref([]),
    recentSearches: ref([]),
    hasQuery: ref(true),
    hasResults: ref(true),
    clearQuery: vi.fn(), clearRecent: vi.fn(), setQuery: vi.fn(),
    POPULAR_QUERIES: [],
  }),
}))

async function renderView() {
  const router = createTestRouter('/search')
  await router.isReady()
  return { ...render(SearchView, { global: { plugins: [router] } }), router }
}

describe('SearchView — 作者入口', () => {
  it('有 authorUuid → 作者名（含搜尋高亮）是連到 /author/{uuid} 的連結', async () => {
    articles.value = [result()]
    const { container } = await renderView()
    const link = container.querySelector('a[href="/author/author-1"]')
    expect(link).not.toBeNull()
    expect(link?.textContent).toBe('Yuan')
  })

  it('authorUuid 為 null → 作者名純文字', async () => {
    articles.value = [result({ authorUuid: null })]
    const { container } = await renderView()
    expect(container.querySelector('a[href^="/author/"]')).toBeNull()
    expect(container.querySelector('.sv-author-n')?.textContent).toBe('Yuan')
  })

  it('作者名的高亮仍經過 highlight()（nickname 內的 HTML 不會被執行）', async () => {
    articles.value = [result({ authorNickname: '<img src=x onerror=alert(1)>Yuan' })]
    const { container } = await renderView()
    expect(container.querySelector('.sv-author-n img')).toBeNull()
  })
})
