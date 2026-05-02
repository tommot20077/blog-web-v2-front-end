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
})
