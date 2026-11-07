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

  describe('uuid 變空時進行中的請求失效', () => {
    it('A 請求進行中 uuid 變 \'\' → A 晚到不寫回舊資料，state 為空', async () => {
      type ListRes = Awaited<ReturnType<typeof commentService.list>>
      let resolveA!: (v: ListRes) => void
      vi.mocked(commentService.list).mockReturnValueOnce(new Promise<ListRes>(r => { resolveA = r }))
      const uuid = ref('A')
      const c = useComments(uuid)
      uuid.value = ''
      await nextTick()
      resolveA({
        topLevels: { records: [{ uuid: 'stale-A' } as never], total: 9, page: 1, size: 20 },
        totalCommentCount: 9,
      })
      await new Promise(r => setTimeout(r, 0))

      expect(c.list.value).toEqual([])
      expect(c.totalTopLevels.value).toBe(0)
      expect(c.totalCommentCount.value).toBe(0)
      expect(c.isLoading.value).toBe(false)
    })
  })

  describe('回覆分頁（D3 載入更多）', () => {
    type ListRes = Awaited<ReturnType<typeof commentService.list>>
    type RepliesRes = Awaited<ReturnType<typeof commentService.listReplies>>
    const reply = (n: number, parent = 'p1') => ({ uuid: `r${n}`, parentUuid: parent, content: `reply-${n}` }) as never
    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => reply(from + i))
    const topList = (replyCount: number, embedded = Math.min(3, replyCount)): ListRes => ({
      topLevels: {
        records: [{ uuid: 'p1', parentUuid: null, replyCount, replies: range(1, embedded) } as never],
        total: 1, page: 1, size: 20,
      },
      totalCommentCount: 1 + replyCount,
    })
    const repliesPage = (records: unknown[], total: number, current = 1, size = 20): RepliesRes => ({
      records: records as never, total, size, current, pages: Math.ceil(total / size),
    })
    const uuids = (c: ReturnType<typeof useComments>) => c.list.value[0].replies?.map(r => r.uuid)
    function deferred<T>() {
      let resolve!: (v: T) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
      return { promise, resolve, reject }
    }
    async function setup(res: ListRes) {
      vi.mocked(commentService.list).mockResolvedValue(res)
      const c = useComments(ref('a-uuid'))
      await new Promise(r => setTimeout(r, 0))
      return c
    }

    it('5 則回覆：載入更多以 page=1,size=20 取回並取代內嵌 3 則，全部 5 則、不重複', async () => {
      const c = await setup(topList(5))
      expect(c.hasMoreReplies(c.list.value[0])).toBe(true)
      vi.mocked(commentService.listReplies).mockResolvedValue(repliesPage(range(1, 5), 5))

      await c.loadMoreReplies('p1')

      expect(commentService.listReplies).toHaveBeenCalledWith('p1', 1, 20)
      expect(uuids(c)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5'])
      expect(c.hasMoreReplies(c.list.value[0])).toBe(false)
      expect(c.getReplyState('p1')).toMatchObject({ isLoading: false, error: false })
    })

    it('超過一頁：第二次點擊 page 遞增並附加，重疊的 uuid 去重', async () => {
      const c = await setup(topList(45))
      vi.mocked(commentService.listReplies)
        .mockResolvedValueOnce(repliesPage(range(1, 20), 45, 1))
        .mockResolvedValueOnce(repliesPage(range(20, 40), 45, 2)) // r20 與上一頁重疊

      await c.loadMoreReplies('p1')
      expect(uuids(c)).toHaveLength(20)
      expect(c.hasMoreReplies(c.list.value[0])).toBe(true)
      await c.loadMoreReplies('p1')

      expect(commentService.listReplies).toHaveBeenNthCalledWith(2, 'p1', 2, 20)
      expect(uuids(c)).toEqual(range(1, 40).map(r => (r as { uuid: string }).uuid))
      expect(c.hasMoreReplies(c.list.value[0])).toBe(true) // 40 / 45
    })

    it('載入失敗：保留內嵌 3 則、標示 error，重試後成功', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.listReplies)
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(repliesPage(range(1, 5), 5))

      await c.loadMoreReplies('p1')
      expect(c.getReplyState('p1')).toMatchObject({ isLoading: false, error: true })
      expect(uuids(c)).toEqual(['r1', 'r2', 'r3'])

      await c.loadMoreReplies('p1')
      expect(commentService.listReplies).toHaveBeenLastCalledWith('p1', 1, 20) // 失敗不推進頁碼
      expect(c.getReplyState('p1').error).toBe(false)
      expect(uuids(c)).toHaveLength(5)
    })

    it('載入中重複點擊 → 不重複發請求', async () => {
      const c = await setup(topList(5))
      const d = deferred<RepliesRes>()
      vi.mocked(commentService.listReplies).mockReturnValueOnce(d.promise)

      const first = c.loadMoreReplies('p1')
      expect(c.getReplyState('p1').isLoading).toBe(true)
      await c.loadMoreReplies('p1')
      expect(commentService.listReplies).toHaveBeenCalledTimes(1)
      d.resolve(repliesPage(range(1, 5), 5))
      await first
      expect(c.getReplyState('p1').isLoading).toBe(false)
    })

    it('回覆請求進行中列表被重新載入 → 舊回應被丟棄，不寫進新列表、isLoading 復原', async () => {
      const c = await setup(topList(5))
      const d = deferred<RepliesRes>()
      vi.mocked(commentService.listReplies).mockReturnValueOnce(d.promise)
      const pending = c.loadMoreReplies('p1')

      vi.mocked(commentService.list).mockResolvedValue(topList(5))
      await c.fetchPage(1)
      d.resolve(repliesPage(range(1, 5), 5))
      await pending

      expect(uuids(c)).toEqual(['r1', 'r2', 'r3'])
      expect(c.getReplyState('p1').isLoading).toBe(false)
    })

    it('回覆請求進行中失敗但已過期 → 不標示 error', async () => {
      const c = await setup(topList(5))
      const d = deferred<RepliesRes>()
      vi.mocked(commentService.listReplies).mockReturnValueOnce(d.promise)
      const pending = c.loadMoreReplies('p1')

      await c.fetchPage(1)
      d.reject(new Error('stale boom'))
      await pending

      expect(c.getReplyState('p1').error).toBe(false)
    })

    it('已展開後新增回覆：replyCount 與列表一致（含新回覆）', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.listReplies).mockResolvedValueOnce(repliesPage(range(1, 5), 5))
      await c.loadMoreReplies('p1')

      vi.mocked(commentService.create).mockResolvedValue({ uuid: 'r6' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(6)) // 內嵌又只剩 3 則
      vi.mocked(commentService.listReplies).mockResolvedValueOnce(repliesPage(range(1, 6), 6))

      expect(await c.reply('p1', 'new')).toBe(true)

      expect(uuids(c)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6'])
      expect(c.list.value[0].replyCount).toBe(6)
      expect(c.hasMoreReplies(c.list.value[0])).toBe(false)
    })

    it('M1：未展開時新增回覆 → 新回覆（升冪排序在最後一頁）直接載出，不被藏在載入更多後面', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.create).mockResolvedValue({ uuid: 'r6' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(6))
      vi.mocked(commentService.listReplies).mockResolvedValueOnce(repliesPage(range(1, 6), 6))

      await c.reply('p1', 'new')

      expect(uuids(c)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6'])
      expect(c.list.value[0].replyCount).toBe(6)
      expect(c.hasMoreReplies(c.list.value[0])).toBe(false)
    })

    it('M1：回覆很多的未展開留言 → 載到最後一頁，新回覆可見，計數正確', async () => {
      const c = await setup(topList(45))
      vi.mocked(commentService.create).mockResolvedValue({ uuid: 'r46' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(46))
      vi.mocked(commentService.listReplies)
        .mockResolvedValueOnce(repliesPage(range(1, 20), 46, 1))
        .mockResolvedValueOnce(repliesPage(range(21, 40), 46, 2))
        .mockResolvedValueOnce(repliesPage(range(41, 46), 46, 3))

      await c.reply('p1', 'new')

      expect(commentService.listReplies).toHaveBeenCalledTimes(3)
      expect(uuids(c)?.at(-1)).toBe('r46')
      expect(c.list.value[0].replyCount).toBe(46)
      expect(c.hasMoreReplies(c.list.value[0])).toBe(false)
    })

    it('M1：回覆總數仍 ≤ 3（內嵌即完整）→ 不額外打回覆端點', async () => {
      const c = await setup(topList(1))
      vi.mocked(commentService.create).mockResolvedValue({ uuid: 'r2' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(2))

      await c.reply('p1', 'new')

      expect(commentService.listReplies).not.toHaveBeenCalled()
      expect(uuids(c)).toEqual(['r1', 'r2'])
    })

    it('m5：還原展開期間 getReplyState().isLoading 為 true，載入更多不會用舊頁碼重複送請求', async () => {
      const c = await setup(topList(45))
      vi.mocked(commentService.listReplies).mockResolvedValueOnce(repliesPage(range(1, 20), 45, 1))
      await c.loadMoreReplies('p1') // pagesLoaded = 1
      vi.mocked(commentService.edit).mockResolvedValue({ uuid: 'r4' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(45))
      const restore = deferred<RepliesRes>()
      vi.mocked(commentService.listReplies).mockReset()
      vi.mocked(commentService.listReplies).mockReturnValueOnce(restore.promise)

      const editing = c.edit('r4', 'edited')
      await vi.waitFor(() => expect(commentService.listReplies).toHaveBeenCalledTimes(1))

      expect(c.getReplyState('p1').isLoading).toBe(true)
      await c.loadMoreReplies('p1')
      expect(commentService.listReplies).toHaveBeenCalledTimes(1)

      restore.resolve(repliesPage(range(1, 20), 45, 1))
      await editing
      expect(c.getReplyState('p1').isLoading).toBe(false)
      expect(c.getReplyState('p1').pagesLoaded).toBe(1)
    })

    describe('A4：429 限流時不重複顯示呼叫端自己的錯誤 toast', () => {
      const rateLimited = () => Object.assign(new Error('操作太頻繁，請 30 秒後再試'), { status: 429, code: 'A0009' })
      async function errorToasts() {
        const { useToast } = await import('./useToast')
        const { toasts } = useToast()
        toasts.value.splice(0)
        return toasts
      }

      it.each([
        ['post', (c: ReturnType<typeof useComments>) => c.post('x')],
        ['reply', (c: ReturnType<typeof useComments>) => c.reply('p1', 'x')],
        ['edit', (c: ReturnType<typeof useComments>) => c.edit('p1', 'x')],
      ])('%s 遇到 429 → 回傳 false、不顯示「失敗」toast', async (_name, act) => {
        const c = await setup(topList(0))
        const toasts = await errorToasts()
        vi.mocked(commentService.create).mockRejectedValue(rateLimited())
        vi.mocked(commentService.edit).mockRejectedValue(rateLimited())

        expect(await act(c)).toBe(false)

        expect(toasts.value.filter(t => t.type === 'error')).toHaveLength(0)
      })

      it('非 429 的失敗仍顯示原本的錯誤 toast', async () => {
        const c = await setup(topList(0))
        const toasts = await errorToasts()
        vi.mocked(commentService.create).mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }))

        await c.post('x')

        expect(toasts.value.map(t => t.message)).toEqual(['留言失敗，請稍後再試'])
      })
    })

    it('已展開後編輯：載入過的回覆維持展開', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.listReplies).mockResolvedValue(repliesPage(range(1, 5), 5))
      await c.loadMoreReplies('p1')
      vi.mocked(commentService.edit).mockResolvedValue({ uuid: 'r4' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(5))

      await c.edit('r4', 'edited')

      expect(uuids(c)).toHaveLength(5)
    })

    it('展開狀態還原失敗：退回內嵌 3 則並標示可重試', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.listReplies).mockResolvedValueOnce(repliesPage(range(1, 5), 5))
      await c.loadMoreReplies('p1')
      vi.mocked(commentService.edit).mockResolvedValue({ uuid: 'r4' } as never)
      vi.mocked(commentService.list).mockResolvedValue(topList(5))
      vi.mocked(commentService.listReplies).mockRejectedValueOnce(new Error('boom'))

      await c.edit('r4', 'edited')

      expect(uuids(c)).toEqual(['r1', 'r2', 'r3'])
      expect(c.getReplyState('p1').error).toBe(true)
    })

    it('伺服器回空頁但 replyCount 偏大 → 視為沒有更多，不再顯示載入更多', async () => {
      const c = await setup(topList(5))
      vi.mocked(commentService.listReplies).mockResolvedValue(repliesPage([], 0))

      await c.loadMoreReplies('p1')

      expect(c.hasMoreReplies(c.list.value[0])).toBe(false)
    })
  })
})
