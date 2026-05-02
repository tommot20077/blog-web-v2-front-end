import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthWall } from './useAuthWall'
import { useAuthStore } from '../stores/auth'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ fullPath: '/articles/abc' }),
}))

describe('useAuthWall', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
  })

  it('已登入 → requireAuth() 回 true，不導頁', () => {
    const auth = useAuthStore()
    auth.user = {
      uuid: 'u',
      email: '',
      nickname: '',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: '',
    }
    auth.accessToken = 'token'

    const { requireAuth } = useAuthWall()
    expect(requireAuth()).toBe(true)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('未登入 → requireAuth() 回 false + setReturnUrl + push /login', () => {
    const auth = useAuthStore()
    const { requireAuth } = useAuthWall()
    expect(requireAuth()).toBe(false)
    expect(auth.returnUrl).toBe('/articles/abc')
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
