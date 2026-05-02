import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useRelatedArticles } from './useRelatedArticles'
import { recommendService } from '../api/recommendService'

vi.mock('../api/recommendService')

describe('useRelatedArticles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetch 呼叫 recommendService.getRelatedArticles 並更新 state', async () => {
    const mockArticles = [
      {
        uuid: 'a1', title: 'A', slug: 'a', summary: '',
        authorNickname: 'Y', viewCount: 0, likeCount: 0,
        publishedAt: '2026-04-01', tags: ['Vue'],
      },
    ]
    vi.mocked(recommendService.getRelatedArticles).mockResolvedValue(mockArticles)

    const uuid = ref('article-uuid')
    const { articles } = useRelatedArticles(uuid)
    await new Promise(r => setTimeout(r, 0))

    expect(recommendService.getRelatedArticles).toHaveBeenCalledWith('article-uuid')
    expect(articles.value).toEqual(mockArticles)
  })

  it('articleUuid 空字串 → 不呼叫 service', async () => {
    vi.mocked(recommendService.getRelatedArticles).mockResolvedValue([])

    const uuid = ref('')
    useRelatedArticles(uuid)
    await new Promise(r => setTimeout(r, 0))

    expect(recommendService.getRelatedArticles).not.toHaveBeenCalled()
  })

  it('service throws → articles 是 []', async () => {
    vi.mocked(recommendService.getRelatedArticles).mockRejectedValue(new Error('boom'))

    const uuid = ref('article-uuid')
    const { articles } = useRelatedArticles(uuid)
    await new Promise(r => setTimeout(r, 0))

    expect(articles.value).toEqual([])
  })
})
