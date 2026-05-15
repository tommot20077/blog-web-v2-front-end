import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { setupGuards } from './index'
import { vi } from 'vitest'
import type { UserRole } from '../types/auth'

// Mock useToast
const mockShowToast = vi.fn()
vi.mock('../composables/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}))

// Mock authService（避免 auth store 內部 import 報錯）
vi.mock('../api/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
  },
}))

const StubComponent = { template: '<div></div>' }

/**
 * 建立帶有 guard 的測試用 router
 * 包含與 production 相同的路由定義（使用 stub component）
 */
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: StubComponent },
      { path: '/articles', name: 'articles', component: StubComponent },
      { path: '/articles/:uuid', name: 'article-detail', component: StubComponent, props: true },
      { path: '/login', name: 'login', component: StubComponent, meta: { guestOnly: true } },
      { path: '/register', name: 'register', component: StubComponent, meta: { guestOnly: true } },
      { path: '/forgot-password', name: 'forgot-password', component: StubComponent, meta: { guestOnly: true } },
      { path: '/reset-password', name: 'reset-password', component: StubComponent, meta: { guestOnly: true } },
      { path: '/verify-email', name: 'verify-email', component: StubComponent },
      // 測試用：需要認證的路由
      { path: '/dashboard', name: 'dashboard', component: StubComponent, meta: { requiresAuth: true } },
      { path: '/bookmarks', name: 'bookmarks', component: StubComponent, meta: { requiresAuth: true, layout: 'shell' } },
      // 測試用：需要特定角色的路由
      {
        path: '/admin',
        name: 'admin',
        component: StubComponent,
        meta: { requiresAuth: true, requiredRole: 'ADMIN' as UserRole },
      },
    ],
  })

  setupGuards(router)
  return router
}

describe('Router 設定', () => {
  const createTestableRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: { template: '<div>Home</div>' },
        },
        {
          path: '/articles',
          name: 'articles',
          component: { template: '<div>Articles</div>' },
        },
        {
          path: '/articles/:uuid',
          name: 'article-detail',
          component: { template: '<div>Detail</div>' },
          props: true,
        },
      ],
      scrollBehavior() {
        return { top: 0, behavior: 'smooth' }
      },
    })
  }

  it('首頁路由正確匹配', async () => {
    const router = createTestableRouter()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('文章列表路由正確匹配', async () => {
    const router = createTestableRouter()
    await router.push('/articles')
    expect(router.currentRoute.value.name).toBe('articles')
  })

  it('文章詳情路由正確匹配並傳遞 uuid 參數', async () => {
    const router = createTestableRouter()
    await router.push('/articles/abc-123')
    expect(router.currentRoute.value.name).toBe('article-detail')
    expect(router.currentRoute.value.params.uuid).toBe('abc-123')
  })

  it('scrollBehavior 回傳平滑捲動到頂部', () => {
    const router = createTestableRouter()
    const result = router.options.scrollBehavior?.(
      {} as any,
      {} as any,
      null
    )
    expect(result).toEqual({ top: 0, behavior: 'smooth' })
  })
})

describe('Auth 路由解析', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('/login 路由正確匹配 name: login', async () => {
    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('/register 路由正確匹配 name: register', async () => {
    const router = createTestRouter()
    await router.push('/register')
    expect(router.currentRoute.value.name).toBe('register')
  })

  it('/forgot-password 路由正確匹配 name: forgot-password', async () => {
    const router = createTestRouter()
    await router.push('/forgot-password')
    expect(router.currentRoute.value.name).toBe('forgot-password')
  })

  it('/reset-password 路由正確匹配 name: reset-password', async () => {
    const router = createTestRouter()
    await router.push('/reset-password')
    expect(router.currentRoute.value.name).toBe('reset-password')
  })

  it('/verify-email 路由正確匹配 name: verify-email', async () => {
    const router = createTestRouter()
    await router.push('/verify-email')
    expect(router.currentRoute.value.name).toBe('verify-email')
  })
})

describe('Router Guard — guestOnly', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('未登入時允許進入 guestOnly 頁面', async () => {
    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('已登入時進入 guestOnly 頁面重導至首頁', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'fake-token'

    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('Router Guard — requiresAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('未登入進入需認證頁面重導至 /login 並設定 returnUrl', async () => {
    const authStore = useAuthStore()
    const router = createTestRouter()

    await router.push('/dashboard')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(authStore.returnUrl).toBe('/dashboard')
  })

  it('已登入進入需認證頁面允許存取', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'fake-token'

    const router = createTestRouter()
    await router.push('/dashboard')

    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })

  it('/bookmarks 需要登入，未登入會重導至 /login 並記錄 returnUrl', async () => {
    const authStore = useAuthStore()
    const router = createTestRouter()

    await router.push('/bookmarks')

    expect(router.currentRoute.value.name).toBe('login')
    expect(authStore.returnUrl).toBe('/bookmarks')
  })
})

describe('Router Guard — requiredRole', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('角色不符重導至首頁並顯示 toast', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'fake-token'
    authStore.user = {
      uuid: 'test-uuid',
      email: 'user@test.com',
      nickname: 'User',
      avatarUrl: null,
      role: 'USER',
      emailVerified: true,
      createdAt: '2024-01-01',
    }

    const router = createTestRouter()
    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.path).toBe('/')
    expect(mockShowToast).toHaveBeenCalledWith('權限不足', 'error')
  })

  it('角色符合時允許存取', async () => {
    const authStore = useAuthStore()
    authStore.accessToken = 'fake-token'
    authStore.user = {
      uuid: 'admin-uuid',
      email: 'admin@test.com',
      nickname: 'Admin',
      avatarUrl: null,
      role: 'ADMIN',
      emailVerified: true,
      createdAt: '2024-01-01',
    }

    const router = createTestRouter()
    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('admin')
    expect(router.currentRoute.value.path).toBe('/admin')
  })
})

describe('Router Guard — 無 meta 路由', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockShowToast.mockClear()
  })

  it('無 meta 的路由正常通過', async () => {
    const router = createTestRouter()
    await router.push('/articles')
    expect(router.currentRoute.value.name).toBe('articles')
    expect(router.currentRoute.value.path).toBe('/articles')
  })
})
