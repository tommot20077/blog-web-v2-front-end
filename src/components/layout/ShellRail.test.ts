import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createTestRouter } from '../../test-utils'
import ShellRail from './ShellRail.vue'

const CHILDREN = [
  { id: 'profile', label: '個人資料' },
  { id: 'account', label: '帳號安全' },
  { id: 'danger', label: '危險操作', danger: true },
]

function mountShellRail(props: Record<string, unknown> = {}, initialRoute = '/settings') {
  const router = createTestRouter(initialRoute)
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(ShellRail, {
    props,
    global: { plugins: [router, pinia] },
  })
  return { wrapper, router }
}

describe('ShellRail — 設定樹狀子項', () => {
  it('在 /settings 且提供 settingsChildren 時，設定分支預設展開', () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    const toggle = wrapper.get('[data-testid="shell-rail-toggle-settings"]')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const kids = wrapper.get('[data-testid="shell-rail-settings-kids"]')
    expect((kids.element as HTMLElement).style.display).not.toBe('none')
  })

  it('在 /bookmarks 時，即使傳入 settingsChildren，設定分支也不會自動展開', () => {
    const { wrapper } = mountShellRail(
      { active: 'bookmarks', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/bookmarks',
    )
    const toggle = wrapper.get('[data-testid="shell-rail-toggle-settings"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    const kids = wrapper.get('[data-testid="shell-rail-settings-kids"]')
    expect((kids.element as HTMLElement).style.display).toBe('none')
  })

  it('沒有 settingsChildren 時（/bookmarks、/my-articles、/my-stats 實際用法），設定項目維持一般連結，不出現 chevron', () => {
    const { wrapper } = mountShellRail({ active: 'bookmarks' }, '/bookmarks')
    expect(wrapper.find('[data-testid="shell-rail-toggle-settings"]').exists()).toBe(false)
    expect(wrapper.find('.chev').exists()).toBe(false)
    const link = wrapper.get('[data-testid="shell-rail-link-settings"]')
    expect(link.attributes('href')).toBe('/settings')
  })

  it('點擊 chevron 可收合已展開的分支，再點一次可展開', async () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    const toggle = wrapper.get('[data-testid="shell-rail-toggle-settings"]')
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect((wrapper.get('[data-testid="shell-rail-settings-kids"]').element as HTMLElement).style.display).toBe('none')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect((wrapper.get('[data-testid="shell-rail-settings-kids"]').element as HTMLElement).style.display).not.toBe('none')
  })

  it('收合狀態下子項以 display:none 移除，不會被鍵盤 Tab 到', async () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    const toggle = wrapper.get('[data-testid="shell-rail-toggle-settings"]')
    await toggle.trigger('click')
    const kids = wrapper.get('[data-testid="shell-rail-settings-kids"]')
    expect((kids.element as HTMLElement).style.display).toBe('none')
    // 收合時每個子項按鈕額外加上 tabindex="-1"，雙重保險確保鍵盤 Tab 跳過
    const kidButtons = wrapper.findAll('[data-testid^="shell-rail-kid-"]')
    for (const btn of kidButtons) {
      expect(btn.attributes('tabindex')).toBe('-1')
    }
  })

  it('點擊子項會 emit select-child 帶上該子項 id', async () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    await wrapper.get('[data-testid="shell-rail-kid-account"]').trigger('click')
    expect(wrapper.emitted('select-child')?.[0]).toEqual(['account'])
  })

  it('activeChildId 對應的子項有 on 樣式標記，其餘沒有', () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'account' },
      '/settings',
    )
    expect(wrapper.get('[data-testid="shell-rail-kid-account"]').classes()).toContain('on')
    expect(wrapper.get('[data-testid="shell-rail-kid-profile"]').classes()).not.toContain('on')
  })

  it('danger 子項帶 danger class', () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    expect(wrapper.get('[data-testid="shell-rail-kid-danger"]').classes()).toContain('danger')
  })

  it('toggle 按鈕帶 aria-controls 指向子項清單', () => {
    const { wrapper } = mountShellRail(
      { active: 'settings', settingsChildren: CHILDREN, activeChildId: 'profile' },
      '/settings',
    )
    const toggle = wrapper.get('[data-testid="shell-rail-toggle-settings"]')
    const kids = wrapper.get('[data-testid="shell-rail-settings-kids"]')
    expect(toggle.attributes('aria-controls')).toBe(kids.attributes('id'))
  })
})
