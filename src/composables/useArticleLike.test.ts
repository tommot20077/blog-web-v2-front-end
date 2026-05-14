import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useArticleLike } from './useArticleLike'
import { useAuthStore } from '../stores/auth'
import { articleLikeService } from '../api/articleLikeService'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ fullPath: '/articles/abc' }),
}))
vi.mock('../api/articleLikeService')

describe('useArticleLike', () => {
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

  it('toggle like：optimistic update + 呼叫 service', async () => {
    vi.mocked(articleLikeService.like).mockResolvedValue()
    const uuid = ref('a-uuid')
    const { liked, likeCount, toggle } = useArticleLike(uuid, { liked: false, likeCount: 5 })

    await toggle()
    expect(liked.value).toBe(true)
    expect(likeCount.value).toBe(6)
    expect(articleLikeService.like).toHaveBeenCalledWith('a-uuid')
  })

  it('toggle unlike: optimistic decrement + 呼叫 unlike', async () => {
    vi.mocked(articleLikeService.unlike).mockResolvedValue()
    const uuid = ref('a-uuid')
    const { liked, likeCount, toggle } = useArticleLike(uuid, { liked: true, likeCount: 5 })

    await toggle()
    expect(liked.value).toBe(false)
    expect(likeCount.value).toBe(4)
    expect(articleLikeService.unlike).toHaveBeenCalledWith('a-uuid')
  })

  it('service throw → rollback', async () => {
    vi.mocked(articleLikeService.like).mockRejectedValue(new Error('boom'))
    const uuid = ref('a-uuid')
    const { liked, likeCount, toggle } = useArticleLike(uuid, { liked: false, likeCount: 5 })

    await toggle()
    expect(liked.value).toBe(false)
    expect(likeCount.value).toBe(5)
  })

  it('未登入 → 不打 service，redirect /login', async () => {
    const auth = useAuthStore()
    auth.user = null
    auth.accessToken = null

    const uuid = ref('a-uuid')
    const { liked, toggle } = useArticleLike(uuid, { liked: false, likeCount: 5 })

    await toggle()
    expect(liked.value).toBe(false)
    expect(articleLikeService.like).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('isPending lock：toggle 期間第二次 click 不重複打 service', async () => {
    let resolveFn: (() => void) | null = null
    vi.mocked(articleLikeService.like).mockImplementation(
      () => new Promise<void>(r => { resolveFn = r }),
    )
    const uuid = ref('a-uuid')
    const { toggle, isPending } = useArticleLike(uuid, { liked: false, likeCount: 5 })

    const first = toggle()
    expect(isPending.value).toBe(true)
    await toggle()  // 第二次應跳過
    expect(articleLikeService.like).toHaveBeenCalledTimes(1)
    resolveFn!()
    await first
    expect(isPending.value).toBe(false)
  })
})
