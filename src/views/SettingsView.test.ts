import { screen } from '@testing-library/vue'
import { renderWithRouterAsync } from '../test-utils'
import SettingsView from './SettingsView.vue'

describe('SettingsView — 樹狀導覽 + query param deep-link', () => {
  it('無 section query 時預設顯示個人資料區塊', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    expect(screen.getByRole('heading', { name: '個人資料' })).toBeInTheDocument()
  })

  it('?section=account 會開在帳號安全區塊', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings?section=account')
    expect(screen.getByRole('heading', { name: '帳號安全' })).toBeInTheDocument()
  })

  it('?section=不合法值 落回個人資料區塊，不拋錯、不顯示空白', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings?section=not-a-real-section')
    expect(screen.getByRole('heading', { name: '個人資料' })).toBeInTheDocument()
  })

  it('不再渲染舊的 .st-rail 側邊欄（已併入 ShellRail 樹狀子項）', async () => {
    const { container } = await renderWithRouterAsync(SettingsView, {}, '/settings')
    expect(container.querySelector('.st-rail')).toBeNull()
  })

  it('不再顯示 emoji 圖示', async () => {
    const { container } = await renderWithRouterAsync(SettingsView, {}, '/settings')
    const text = container.textContent ?? ''
    for (const emoji of ['👤', '🔐', '🔗', '✍️', '🔔', '⚠️']) {
      expect(text).not.toContain(emoji)
    }
  })

  it('進入 /settings 時 ShellRail 的設定分支已自動展開', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    const toggle = screen.getByTestId('shell-rail-toggle-settings')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })

  it('點擊「帳號安全」子項會更新網址的 section query', async () => {
    const { router } = await renderWithRouterAsync(SettingsView, {}, '/settings')
    const kid = screen.getByTestId('shell-rail-kid-account')
    kid.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await router.isReady()
    // 讓 Vue 完成一次 tick 以套用 router.push 後的重新渲染
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(router.currentRoute.value.query.section).toBe('account')
  })
})
