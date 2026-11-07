import { screen, fireEvent } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { useAuthStore } from '../stores/auth'
import { createMockUser } from '../test-utils'
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

  it('個人資料副標改為「管理你的公開個人資訊。」，不再顯示舊文案', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    expect(screen.getByText('管理你的公開個人資訊。')).toBeInTheDocument()
    expect(screen.queryByText(/讓其他讀者認識你/)).not.toBeInTheDocument()
  })

  it('危險操作區塊不再有「匯出資料」按鈕', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings?section=danger')
    expect(screen.queryByRole('button', { name: '匯出資料' })).not.toBeInTheDocument()
  })
})

describe('SettingsView — 公開個人頁', () => {
  it('個人資料區塊明示「以下資料會顯示在你的公開個人頁」', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    expect(screen.getByText('以下資料會顯示在你的公開個人頁')).toBeInTheDocument()
  })

  it('社群連結區塊同樣有公開說明', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings?section=social')
    expect(screen.getByText('以下資料會顯示在你的公開個人頁')).toBeInTheDocument()
  })

  it('「查看我的公開頁」連到 /author/{我的 uuid}', async () => {
    const { pinia } = await renderWithRouterAsync(SettingsView, {}, '/settings')
    useAuthStore(pinia).user = createMockUser({ uuid: 'me-123' })
    await flushPromises()
    expect(screen.getByRole('link', { name: '查看我的公開頁' }).getAttribute('href')).toBe('/author/me-123')
  })

  it('尚未取得使用者資料時不顯示「查看我的公開頁」', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    expect(screen.queryByRole('link', { name: '查看我的公開頁' })).toBeNull()
  })

  describe('社群連結：格式錯誤時無法儲存並顯示提示', () => {
    it('貼網址 → 顯示提示、輸入框標示 aria-invalid、儲存鈕停用', async () => {
      await renderWithRouterAsync(SettingsView, {}, '/settings?section=social')
      const input = screen.getByTestId('social-github-input')
      expect(input.getAttribute('aria-invalid')).not.toBe('true')
      await fireEvent.update(input, 'https://github.com/octocat')
      expect(screen.getByTestId('social-github-error').textContent).toContain('帳號名稱')
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(screen.getByTestId('social-save-btn')).toBeDisabled()
    })

    it('aria-describedby 只在有錯誤時綁定（避免指向不存在的 id）', async () => {
      await renderWithRouterAsync(SettingsView, {}, '/settings?section=social')
      const input = screen.getByTestId('social-github-input')
      expect(input.getAttribute('aria-describedby')).toBeNull()
      await fireEvent.update(input, 'a/b')
      expect(input.getAttribute('aria-describedby')).toBe('social-github-error')
      expect(document.getElementById('social-github-error')).not.toBeNull()
      await fireEvent.update(input, 'octocat')
      expect(input.getAttribute('aria-describedby')).toBeNull()
    })

    it('改成合格帳號名稱 → 提示消失、儲存鈕恢復', async () => {
      await renderWithRouterAsync(SettingsView, {}, '/settings?section=social')
      const input = screen.getByTestId('social-github-input')
      await fireEvent.update(input, 'a/b')
      expect(screen.getByTestId('social-save-btn')).toBeDisabled()
      await fireEvent.update(input, 'octocat')
      expect(screen.queryByTestId('social-github-error')).toBeNull()
      expect(screen.getByTestId('social-save-btn')).not.toBeDisabled()
    })

    it('twitter／linkedin 各自驗證', async () => {
      await renderWithRouterAsync(SettingsView, {}, '/settings?section=social')
      await fireEvent.update(screen.getByTestId('social-twitter-input'), '@@x')
      await fireEvent.update(screen.getByTestId('social-linkedin-input'), 'a:b')
      expect(screen.getByTestId('social-twitter-error')).toBeInTheDocument()
      expect(screen.getByTestId('social-linkedin-error')).toBeInTheDocument()
    })
  })

  describe('個人網站：格式錯誤時無法儲存並顯示提示', () => {
    it('javascript: → 顯示提示、儲存鈕停用；改成 https 後恢復', async () => {
      await renderWithRouterAsync(SettingsView, {}, '/settings')
      const input = screen.getByPlaceholderText('https://yoursite.com')
      await fireEvent.update(input, 'javascript:alert(1)')
      expect(screen.getByTestId('website-error').textContent).toContain('http')
      expect(screen.getByRole('button', { name: '儲存變更' })).toBeDisabled()
      await fireEvent.update(input, 'https://example.com')
      expect(screen.queryByTestId('website-error')).toBeNull()
      expect(screen.getByRole('button', { name: '儲存變更' })).not.toBeDisabled()
    })
  })
})

describe('SettingsView — 頭像選檔（A6b）', () => {
  function bigImage(size: number) {
    const file = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('頭像被大小檢查擋下後仍清掉 input.value，重選同一個檔案才會再觸發 change', async () => {
    await renderWithRouterAsync(SettingsView, {}, '/settings')
    const input = screen.getByTestId('avatar-upload-input') as HTMLInputElement
    const valueSetter = vi.fn()
    Object.defineProperty(input, 'value', { configurable: true, get: () => '', set: valueSetter })

    await fireEvent.change(input, { target: { files: [bigImage(5 * 1024 * 1024 + 1)] } })

    expect(valueSetter).toHaveBeenCalledWith('')
  })
})
