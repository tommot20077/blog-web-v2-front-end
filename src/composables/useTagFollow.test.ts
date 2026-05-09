import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useTagFollow } from './useTagFollow'
import { useAuthStore } from '../stores/auth'
import { tagService } from '../api/tagService'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ fullPath: '/tags/vue' }),
}))
vi.mock('../api/tagService')

describe('useTagFollow', () => {
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

  it('toggle follow: optimistic + 呼叫 followTag', async () => {
    vi.mocked(tagService.followTag).mockResolvedValue()
    const tagId = ref('tag-uuid')
    const { followed, toggle } = useTagFollow(tagId, { followed: false })

    await toggle()
    expect(followed.value).toBe(true)
    expect(tagService.followTag).toHaveBeenCalledWith('tag-uuid')
  })

  it('toggle unfollow: 呼叫 unfollowTag', async () => {
    vi.mocked(tagService.unfollowTag).mockResolvedValue()
    const tagId = ref('tag-uuid')
    const { followed, toggle } = useTagFollow(tagId, { followed: true })

    await toggle()
    expect(followed.value).toBe(false)
    expect(tagService.unfollowTag).toHaveBeenCalledWith('tag-uuid')
  })

  it('service throw → rollback', async () => {
    vi.mocked(tagService.followTag).mockRejectedValue(new Error('boom'))
    const tagId = ref('tag-uuid')
    const { followed, toggle } = useTagFollow(tagId, { followed: false })

    await toggle()
    expect(followed.value).toBe(false)
  })

  it('未登入 → 不打 service，redirect /login', async () => {
    const auth = useAuthStore()
    auth.user = null
    auth.accessToken = null

    const tagId = ref('tag-uuid')
    const { followed, toggle } = useTagFollow(tagId, { followed: false })

    await toggle()
    expect(followed.value).toBe(false)
    expect(tagService.followTag).not.toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('isPending lock：toggle 期間第二次 click 不重複打 service', async () => {
    let resolveFn: (() => void) | null = null
    vi.mocked(tagService.followTag).mockImplementation(
      () => new Promise<void>(r => { resolveFn = r }),
    )
    const tagId = ref('tag-uuid')
    const { toggle, isPending } = useTagFollow(tagId, { followed: false })

    const first = toggle()
    expect(isPending.value).toBe(true)
    await toggle()
    expect(tagService.followTag).toHaveBeenCalledTimes(1)
    resolveFn!()
    await first
    expect(isPending.value).toBe(false)
  })
})
