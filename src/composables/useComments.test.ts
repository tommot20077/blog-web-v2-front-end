import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useComments } from './useComments'
import { useAuthStore } from '../stores/auth'
import { commentService } from '../api/commentService'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ fullPath: '/articles/abc' }),
}))
vi.mock('../api/commentService')

describe('useComments', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u', email: '', nickname: '', avatarUrl: null,
      role: 'USER', emailVerified: true, createdAt: '',
    }
    auth.accessToken = 'token'
  })

  it('fetchPage 呼叫 commentService.list 並更新 state', async () => {
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [{ uuid: 'c1' } as never], total: 1, page: 1, size: 20 },
      totalCommentCount: 1,
    })
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await nextTick()
    await new Promise(r => setTimeout(r, 0))  // wait for initial fetch
    expect(commentService.list).toHaveBeenCalledWith('a-uuid', 1, 20, 'newest')
    expect(c.list.value).toHaveLength(1)
    expect(c.totalCommentCount.value).toBe(1)
  })

  it('post 呼叫 commentService.create + refetch', async () => {
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    })
    vi.mocked(commentService.create).mockResolvedValue({ uuid: 'c1' } as never)
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await new Promise(r => setTimeout(r, 0))

    const ok = await c.post('hello')
    expect(ok).toBe(true)
    expect(commentService.create).toHaveBeenCalledWith('a-uuid', { content: 'hello' })
    expect(commentService.list).toHaveBeenCalledTimes(2)  // initial + refetch
  })

  it('post 未登入 → 不呼叫 service', async () => {
    const auth = useAuthStore()
    auth.user = null
    auth.accessToken = null
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    })
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await new Promise(r => setTimeout(r, 0))

    const ok = await c.post('hello')
    expect(ok).toBe(false)
    expect(commentService.create).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('reply 呼叫 commentService.create with parentUuid', async () => {
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    })
    vi.mocked(commentService.create).mockResolvedValue({ uuid: 'c2' } as never)
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await new Promise(r => setTimeout(r, 0))

    const ok = await c.reply('parent-uuid', 'reply text')
    expect(ok).toBe(true)
    expect(commentService.create).toHaveBeenCalledWith('a-uuid', { content: 'reply text', parentUuid: 'parent-uuid' })
  })

  it('edit 呼叫 commentService.edit + refetch', async () => {
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    })
    vi.mocked(commentService.edit).mockResolvedValue({ uuid: 'c1' } as never)
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await new Promise(r => setTimeout(r, 0))

    const ok = await c.edit('c1', 'updated')
    expect(ok).toBe(true)
    expect(commentService.edit).toHaveBeenCalledWith('c1', { content: 'updated' })
  })

  it('remove 呼叫 commentService.delete + refetch', async () => {
    vi.mocked(commentService.list).mockResolvedValue({
      topLevels: { records: [], total: 0, page: 1, size: 20 },
      totalCommentCount: 0,
    })
    vi.mocked(commentService.delete).mockResolvedValue()
    const uuid = ref('a-uuid')
    const c = useComments(uuid)
    await new Promise(r => setTimeout(r, 0))

    const ok = await c.remove('c1')
    expect(ok).toBe(true)
    expect(commentService.delete).toHaveBeenCalledWith('c1')
  })

  describe('過期回應防護', () => {
    type ListRes = Awaited<ReturnType<typeof commentService.list>>
    const mk = (id: string, total: number): ListRes => ({
      topLevels: { records: [{ uuid: id } as never], total, page: 1, size: 20 },
      totalCommentCount: total,
    })
    function deferred<T>() {
      let resolve!: (v: T) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
      return { promise, resolve, reject }
    }

    it('第 1 頁晚於第 2 頁 resolve → 最終 state 是第 2 頁', async () => {
      const init = deferred<ListRes>()
      const p1 = deferred<ListRes>()
      const p2 = deferred<ListRes>()
      vi.mocked(commentService.list)
        .mockReturnValueOnce(init.promise)
        .mockReturnValueOnce(p1.promise)
        .mockReturnValueOnce(p2.promise)
      const c = useComments(ref('a-uuid'))
      init.resolve(mk('init', 1))
      await new Promise(r => setTimeout(r, 0))

      const f1 = c.fetchPage(1)
      const f2 = c.fetchPage(2)
      p2.resolve(mk('page2', 22))
      await f2
      p1.resolve(mk('page1', 11))
      await f1

      expect(c.list.value.map(x => x.uuid)).toEqual(['page2'])
      expect(c.totalTopLevels.value).toBe(22)
      expect(c.page.value).toBe(2)
      expect(c.isLoading.value).toBe(false)
    })

    it('舊請求晚到時不可提前把 isLoading 設為 false', async () => {
      const init = deferred<ListRes>()
      const p1 = deferred<ListRes>()
      const p2 = deferred<ListRes>()
      vi.mocked(commentService.list)
        .mockReturnValueOnce(init.promise)
        .mockReturnValueOnce(p1.promise)
        .mockReturnValueOnce(p2.promise)
      const c = useComments(ref('a-uuid'))
      init.resolve(mk('init', 1))
      await new Promise(r => setTimeout(r, 0))

      const f1 = c.fetchPage(1)
      const f2 = c.fetchPage(2)
      p1.resolve(mk('page1', 11))
      await f1
      expect(c.isLoading.value).toBe(true)
      p2.resolve(mk('page2', 22))
      await f2
      expect(c.isLoading.value).toBe(false)
    })

    it('舊請求失敗 → 不顯示錯誤 toast、不改動新請求的 state', async () => {
      const { useToast } = await import('./useToast')
      const { toasts } = useToast()
      toasts.value.splice(0)
      const init = deferred<ListRes>()
      const p1 = deferred<ListRes>()
      const p2 = deferred<ListRes>()
      vi.mocked(commentService.list)
        .mockReturnValueOnce(init.promise)
        .mockReturnValueOnce(p1.promise)
        .mockReturnValueOnce(p2.promise)
      const c = useComments(ref('a-uuid'))
      init.resolve(mk('init', 1))
      await new Promise(r => setTimeout(r, 0))

      const f1 = c.fetchPage(1)
      const f2 = c.fetchPage(2)
      p2.resolve(mk('page2', 22))
      await f2
      p1.reject(new Error('stale boom'))
      await f1

      expect(toasts.value.filter(t => t.type === 'error')).toHaveLength(0)
      expect(c.list.value.map(x => x.uuid)).toEqual(['page2'])
    })

    it('切換 sort 後舊排序回應晚到 → 被丟棄', async () => {
      const init = deferred<ListRes>()
      const oldSort = deferred<ListRes>()
      const newSort = deferred<ListRes>()
      vi.mocked(commentService.list)
        .mockReturnValueOnce(init.promise)
        .mockReturnValueOnce(oldSort.promise)
        .mockReturnValueOnce(newSort.promise)
      const c = useComments(ref('a-uuid'))
      init.resolve(mk('init', 1))
      await new Promise(r => setTimeout(r, 0))

      const fOld = c.fetchPage(1)
      // sort 在 fetchPage 同步段被 watchEffect 追蹤 → 切換排序會自動重新抓第 1 頁
      c.sort.value = 'oldest'
      await nextTick()
      newSort.resolve(mk('oldest-first', 5))
      await new Promise(r => setTimeout(r, 0))
      oldSort.resolve(mk('newest-first', 9))
      await fOld

      expect(c.list.value.map(x => x.uuid)).toEqual(['oldest-first'])
      expect(c.totalCommentCount.value).toBe(5)
    })
  })
})
