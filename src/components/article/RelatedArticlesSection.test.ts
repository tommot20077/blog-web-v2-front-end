import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import RelatedArticlesSection from './RelatedArticlesSection.vue'

const pushMock = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push: pushMock }),
  }
})

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
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
  return mount(RelatedArticlesSection, {
    props,
    global: { plugins: [router] },
  })
}

describe('RelatedArticlesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pushMock.mockClear()
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

  it('click card → router.push 到 /articles/{slug}', async () => {
    vi.mocked(useRelatedArticles).mockReturnValue({
      articles: ref(sampleArticles),
      isLoading: ref(false),
    })

    const wrapper = mountSection({ articleUuid: 'x' })
    await wrapper.find('[data-testid="related-article-card-a1"]').trigger('click')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/articles/article-one')
  })
})
