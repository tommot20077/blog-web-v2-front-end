import { mount } from '@vue/test-utils'
import { createTestRouter } from '../../test-utils'
import AdminRail from './AdminRail.vue'

async function mountAdminRail(props: Record<string, unknown> = {}, initialRoute = '/admin') {
  const router = createTestRouter(initialRoute)
  // router.push() 是非同步的；當 active 需要依賴 route.name 推斷時，
  // 必須等初始導航 resolve 後再掛載，否則 mount 當下 route 仍是預設值。
  await router.isReady()
  const wrapper = mount(AdminRail, {
    props,
    global: { plugins: [router] },
  })
  return { wrapper, router }
}

describe('AdminRail — admin 後台左側導覽', () => {
  it('渲染 5 個導覽項目，label 與 href 正確', async () => {
    const { wrapper } = await mountAdminRail()

    const expected: Array<[string, string, string]> = [
      ['admin-dashboard', '總覽', '/admin'],
      ['admin-review', '待審', '/admin/review'],
      ['admin-categories', '分類管理', '/admin/categories'],
      ['admin-tags', '標籤管理', '/admin/tags'],
      ['admin-search', '搜尋索引', '/admin/search'],
    ]

    for (const [key, label, to] of expected) {
      const link = wrapper.get(`[data-testid="admin-rail-link-${key}"]`)
      expect(link.text()).toBe(label)
      expect(link.attributes('href')).toBe(to)
    }
  })

  it('提供 active prop 時，對應項目帶 active class，其餘沒有', async () => {
    const { wrapper } = await mountAdminRail({ active: 'admin-categories' })

    expect(wrapper.get('[data-testid="admin-rail-link-admin-categories"]').classes()).toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-dashboard"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-review"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-tags"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-search"]').classes()).not.toContain('active')
  })

  it('未提供 active prop 時，依目前路由名稱推斷 active 項目', async () => {
    const { wrapper } = await mountAdminRail({}, '/admin/tags')

    expect(wrapper.get('[data-testid="admin-rail-link-admin-tags"]').classes()).toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-dashboard"]').classes()).not.toContain('active')
  })

  it('目前路由不屬於 admin 路由群時，沒有任何項目為 active', async () => {
    const { wrapper } = await mountAdminRail({}, '/')

    expect(wrapper.get('[data-testid="admin-rail-link-admin-dashboard"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-review"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-categories"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-tags"]').classes()).not.toContain('active')
    expect(wrapper.get('[data-testid="admin-rail-link-admin-search"]').classes()).not.toContain('active')
  })

  it('品牌連結導向首頁，testid 為 admin-logo', async () => {
    const { wrapper } = await mountAdminRail()
    const brand = wrapper.get('[data-testid="admin-logo"]')
    expect(brand.attributes('href')).toBe('/')
  })
})
