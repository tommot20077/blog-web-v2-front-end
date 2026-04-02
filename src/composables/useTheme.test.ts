import { nextTick } from 'vue'

// 不使用 vi.fn() 定義 matchMedia mock，避免被 mockReset 清除
const createMatchMediaMock = (darkMode = false) => {
  return (query: string) => ({
    matches: darkMode && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // 每次 beforeEach 重新建立 matchMedia stub（非 vi.fn，不受 mockReset 影響）
    vi.stubGlobal('matchMedia', createMatchMediaMock(false))
  })

  const loadUseTheme = async () => {
    const module = await import('./useTheme')
    return module.useTheme
  }

  it('預設值（無 localStorage、系統無偏好）→ isDark === false', async () => {
    const useTheme = await loadUseTheme()
    const { isDark } = useTheme()
    expect(isDark.value).toBe(false)
  })

  it('從 localStorage 恢復 dark → isDark === true', async () => {
    localStorage.setItem('theme', 'dark')
    const useTheme = await loadUseTheme()
    const { isDark } = useTheme()
    expect(isDark.value).toBe(true)
  })

  it('系統偏好 dark（無 localStorage）→ isDark === true', async () => {
    vi.stubGlobal('matchMedia', createMatchMediaMock(true))
    const useTheme = await loadUseTheme()
    const { isDark } = useTheme()
    expect(isDark.value).toBe(true)
  })

  it('toggleTheme 切換 → isDark 反轉', async () => {
    const useTheme = await loadUseTheme()
    const { isDark, toggleTheme } = useTheme()

    expect(isDark.value).toBe(false)
    toggleTheme()
    expect(isDark.value).toBe(true)
    toggleTheme()
    expect(isDark.value).toBe(false)
  })

  it('DOM data-theme 同步 → 與 isDark 一致', async () => {
    const useTheme = await loadUseTheme()
    const { toggleTheme } = useTheme()

    // 模組載入時 watchEffect 已同步
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    toggleTheme()
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    toggleTheme()
    await nextTick()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('localStorage 同步 → 切換後 localStorage.theme 更新', async () => {
    const useTheme = await loadUseTheme()
    const { toggleTheme } = useTheme()

    await nextTick()
    expect(localStorage.getItem('theme')).toBe('light')

    toggleTheme()
    await nextTick()
    expect(localStorage.getItem('theme')).toBe('dark')

    toggleTheme()
    await nextTick()
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('多次呼叫共享狀態 → 兩次 useTheme() 的 isDark 是同一 ref', async () => {
    const useTheme = await loadUseTheme()
    const { isDark: isDark1, toggleTheme } = useTheme()
    const { isDark: isDark2 } = useTheme()

    expect(isDark1).toBe(isDark2)

    toggleTheme()
    expect(isDark1.value).toBe(true)
    expect(isDark2.value).toBe(true)
  })
})
