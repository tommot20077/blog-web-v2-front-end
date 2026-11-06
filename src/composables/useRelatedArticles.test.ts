import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
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

  it('articleUuid 變化 → watchEffect 重新 fetch', async () => {
    vi.mocked(recommendService.getRelatedArticles).mockResolvedValue([])

    const uuid = ref('uuid-1')
    useRelatedArticles(uuid)
    await new Promise(r => setTimeout(r, 0))
    expect(recommendService.getRelatedArticles).toHaveBeenCalledWith('uuid-1')

    uuid.value = 'uuid-2'
    await new Promise(r => setTimeout(r, 0))
    expect(recommendService.getRelatedArticles).toHaveBeenCalledWith('uuid-2')
    expect(recommendService.getRelatedArticles).toHaveBeenCalledTimes(2)
  })

  describe('過期回應防護', () => {
    type Res = Awaited<ReturnType<typeof recommendService.getRelatedArticles>>
    const art = (uuid: string) => ({ uuid, title: uuid } as unknown as Res[number])
    function deferred<T>() {
      let resolve!: (v: T) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
      return { promise, resolve, reject }
    }

    it('同一實例連續查 A 再查 B，A 晚到 → 結果仍是 B', async () => {
      const a = deferred<Res>()
      const b = deferred<Res>()
      vi.mocked(recommendService.getRelatedArticles)
        .mockReturnValueOnce(a.promise)
        .mockReturnValueOnce(b.promise)

      const uuid = ref('A')
      const { articles, isLoading } = useRelatedArticles(uuid)
      uuid.value = 'B'
      await nextTick()
      b.resolve([art('B')])
      await new Promise(r => setTimeout(r, 0))
      a.resolve([art('A')])
      await new Promise(r => setTimeout(r, 0))

      expect(articles.value.map(x => x.uuid)).toEqual(['B'])
      expect(isLoading.value).toBe(false)
    })

    it('A 晚到失敗 → 不清空 B 的結果', async () => {
      const a = deferred<Res>()
      const b = deferred<Res>()
      vi.mocked(recommendService.getRelatedArticles)
        .mockReturnValueOnce(a.promise)
        .mockReturnValueOnce(b.promise)

      const uuid = ref('A')
      const { articles } = useRelatedArticles(uuid)
      uuid.value = 'B'
      await nextTick()
      b.resolve([art('B')])
      await new Promise(r => setTimeout(r, 0))
      a.reject(new Error('stale'))
      await new Promise(r => setTimeout(r, 0))

      expect(articles.value.map(x => x.uuid)).toEqual(['B'])
    })

    it('scope 停止（unmount）後才收到回應 → 不寫 state', async () => {
      const a = deferred<Res>()
      vi.mocked(recommendService.getRelatedArticles).mockReturnValueOnce(a.promise)

      const scope = effectScope()
      const { articles } = scope.run(() => useRelatedArticles(ref('A')))!
      scope.stop()
      a.resolve([art('A')])
      await new Promise(r => setTimeout(r, 0))

      expect(articles.value).toEqual([])
    })
  })

  describe('uuid 變空時進行中的請求失效', () => {
    it('A 請求進行中 uuid 變 \'\' → A 晚到不寫回舊資料', async () => {
      type Res = Awaited<ReturnType<typeof recommendService.getRelatedArticles>>
      let resolveA!: (v: Res) => void
      vi.mocked(recommendService.getRelatedArticles).mockReturnValueOnce(new Promise<Res>(r => { resolveA = r }))
      const uuid = ref('A')
      const { articles, isLoading } = useRelatedArticles(uuid)
      uuid.value = ''
      await nextTick()
      resolveA([{ uuid: 'A', title: 'A' } as unknown as Res[number]])
      await new Promise(r => setTimeout(r, 0))

      expect(articles.value).toEqual([])
      expect(isLoading.value).toBe(false)
    })
  })
})
