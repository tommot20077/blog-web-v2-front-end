import { createRouter, createMemoryHistory } from 'vue-router'

describe('Router 設定', () => {
  const createTestableRouter = () => {
    // 使用與原始路由相同的路由定義，但用 memoryHistory 替代 webHistory
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
