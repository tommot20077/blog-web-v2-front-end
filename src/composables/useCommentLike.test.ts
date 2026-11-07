import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentLike } from './useCommentLike'
import { useAuthStore } from '../stores/auth'
import { commentService } from '../api/commentService'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ fullPath: '/articles/abc' }),
}))
vi.mock('../api/commentService')

describe('useCommentLike', () => {
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

  it('toggle like：呼叫 commentService.like', async () => {
    vi.mocked(commentService.like).mockResolvedValue()
    const uuid = ref('c-uuid')
    const { liked, likeCount, toggle } = useCommentLike(uuid, { liked: false, likeCount: 0 })

    await toggle()
    expect(liked.value).toBe(true)
    expect(likeCount.value).toBe(1)
    expect(commentService.like).toHaveBeenCalledWith('c-uuid')
  })

  it('rollback on error', async () => {
    vi.mocked(commentService.like).mockRejectedValue(new Error('boom'))
    const uuid = ref('c-uuid')
    const { liked, likeCount, toggle } = useCommentLike(uuid, { liked: false, likeCount: 0 })

    await toggle()
    expect(liked.value).toBe(false)
    expect(likeCount.value).toBe(0)
  })

  it('A4：遇到 429 → 仍 rollback，但不顯示自己的錯誤 toast', async () => {
    const { useToast } = await import('./useToast')
    const { toasts } = useToast()
    toasts.value.splice(0)
    vi.mocked(commentService.like).mockRejectedValue(Object.assign(new Error('操作太頻繁，請 30 秒後再試'), { status: 429, code: 'A0009' }))
    const { liked, likeCount, toggle } = useCommentLike(ref('c-uuid'), { liked: false, likeCount: 0 })

    await toggle()

    expect(liked.value).toBe(false)
    expect(likeCount.value).toBe(0)
    expect(toasts.value.filter(t => t.type === 'error')).toHaveLength(0)
  })

  it('未登入 → redirect', async () => {
    const auth = useAuthStore()
    auth.user = null
    auth.accessToken = null

    const uuid = ref('c-uuid')
    const { toggle } = useCommentLike(uuid, { liked: false, likeCount: 0 })

    await toggle()
    expect(commentService.like).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
