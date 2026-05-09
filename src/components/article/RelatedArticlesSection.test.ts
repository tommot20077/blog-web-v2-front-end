import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import RelatedArticlesSection from './RelatedArticlesSection.vue'

vi.mock('../../composables/useRelatedArticles', () => ({
  useRelatedArticles: vi.fn(),
}))

import { useRelatedArticles } from '../../composables/useRelatedArticles'

const sampleArticles = [
  {
    uuid: 'a1', title: 'Article One', slug: 'article-one', summary: '',
    authorNickname: 'Y', viewCount: 0, likeCount: 0,
    publishedAt: '2026-04-01T10:00:00Z', tags: ['Vue'],
  },
  {
    uuid: 'a2', title: 'Article Two', slug: 'article-two', summary: '',
    authorNickname: 'Y', viewCount: 0, likeCount: 0,
    publishedAt: '2026-03-15T10:00:00Z', tags: ['CSS'],
  },
]

function mountSection(props: { articleUuid: string }) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/articles/:uuid', component: { template: '<div/>' } },
    ],
  })
  return mount(RelatedArticlesSection, {
    props,
    global: { plugins: [router] },
  })
}

describe('RelatedArticlesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('articles 0 篇 → section 隱藏', () => {
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref([]),
      isLoading: ref(false),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    expect(wrapper.find('[data-testid="related-articles-section"]').exists()).toBe(false)
  })

  it('isLoading=true → section 隱藏（避免閃現）', () => {
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref([]),
      isLoading: ref(true),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    expect(wrapper.find('[data-testid="related-articles-section"]').exists()).toBe(false)
  })

  it('多篇 articles → section 顯示 + 對應 cards', () => {
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref(sampleArticles),
      isLoading: ref(false),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    expect(wrapper.find('[data-testid="related-articles-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('繼續讀。')
    expect(wrapper.findAll('[data-testid^="related-article-card-"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Article One')
    expect(wrapper.text()).toContain('Article Two')
    expect(wrapper.text()).toContain('Vue')
  })

  it('每張 card link 到 /articles/{uuid}（用 uuid 不是 slug）', () => {
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref(sampleArticles),
      isLoading: ref(false),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    const linkA1 = wrapper.find('[data-testid="related-article-card-a1"]')
    expect(linkA1.attributes('href')).toBe('/articles/a1')
    const linkA2 = wrapper.find('[data-testid="related-article-card-a2"]')
    expect(linkA2.attributes('href')).toBe('/articles/a2')
  })

  it('formatDate 不受時區影響（用 ISO 字串前 10 字）', () => {
    // 故意用 T00:00:00Z 邊界，新 Date(iso) 在負時區會 shift 到前一天；slice 不會
    const edge = [{
      uuid: 'edge', title: 'Edge', slug: 'edge', summary: '',
      authorNickname: 'Y', viewCount: 0, likeCount: 0,
      publishedAt: '2026-04-01T00:00:00Z', tags: ['Vue'],
    }]
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref(edge),
      isLoading: ref(false),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    expect(wrapper.text()).toContain('2026 · 04 · 01')
  })
})
