import { nextTick } from 'vue'

type Font = 'space' | 'inter' | 'geist'
type Cursor = 'ring' | 'cross' | 'dot' | 'label' | 'off'
type Accent = 'on' | 'off'

describe('useAppearance', () => {
  const loadUseAppearance = async () => {
    vi.resetModules()
    const module = await import('./useAppearance')
    return module.useAppearance
  }

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-font')
    document.documentElement.removeAttribute('data-cursor')
    document.documentElement.removeAttribute('data-accent')
    document.documentElement.classList.remove('dark')
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── Theme ──────────────────────────────────────────────────────────────────

  it('預設主題為 light', async () => {
    const useAppearance = await loadUseAppearance()
    const { isDark } = useAppearance()
    expect(isDark.value).toBe(false)
  })

  it('從 localStorage 恢復 dark 主題', async () => {
    localStorage.setItem('theme', 'dark')
    const useAppearance = await loadUseAppearance()
    const { isDark } = useAppearance()
    expect(isDark.value).toBe(true)
  })

  it('系統偏好 dark 時初始化為 dark', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
    const useAppearance = await loadUseAppearance()
    const { isDark } = useAppearance()
    expect(isDark.value).toBe(true)
  })

  it('toggleTheme 切換 isDark 並同步 data-theme 和 localStorage', async () => {
    const useAppearance = await loadUseAppearance()
    const { isDark, toggleTheme } = useAppearance()
    await nextTick()

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')

    toggleTheme()
    await nextTick()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  // ── Font ───────────────────────────────────────────────────────────────────

  it('預設字體為 space', async () => {
    const useAppearance = await loadUseAppearance()
    const { font } = useAppearance()
    expect(font.value).toBe('space')
  })

  it('從 localStorage 恢復字體', async () => {
    localStorage.setItem('font', 'inter')
    const useAppearance = await loadUseAppearance()
    const { font } = useAppearance()
    expect(font.value).toBe('inter')
  })

  it('setFont 更新 font、data-font 屬性和 localStorage', async () => {
    const useAppearance = await loadUseAppearance()
    const { font, setFont } = useAppearance()
    await nextTick()

    setFont('geist' as Font)
    await nextTick()

    expect(font.value).toBe('geist')
    expect(document.documentElement.getAttribute('data-font')).toBe('geist')
    expect(localStorage.getItem('font')).toBe('geist')
  })

  // ── Cursor ─────────────────────────────────────────────────────────────────

  it('預設光標為 ring', async () => {
    const useAppearance = await loadUseAppearance()
    const { cursor } = useAppearance()
    expect(cursor.value).toBe('ring')
  })

  it('從 localStorage 恢復光標變體', async () => {
    localStorage.setItem('cursor', 'cross')
    const useAppearance = await loadUseAppearance()
    const { cursor } = useAppearance()
    expect(cursor.value).toBe('cross')
  })

  it('setCursor 更新 cursor、data-cursor 屬性和 localStorage', async () => {
    const useAppearance = await loadUseAppearance()
    const { cursor, setCursor } = useAppearance()
    await nextTick()

    setCursor('dot' as Cursor)
    await nextTick()

    expect(cursor.value).toBe('dot')
    expect(document.documentElement.getAttribute('data-cursor')).toBe('dot')
    expect(localStorage.getItem('cursor')).toBe('dot')
  })

  // ── Accent ─────────────────────────────────────────────────────────────────

  it('預設 accent 為 on', async () => {
    const useAppearance = await loadUseAppearance()
    const { accent } = useAppearance()
    expect(accent.value).toBe('on')
  })

  it('從 localStorage 恢復 accent 狀態', async () => {
    localStorage.setItem('accent', 'off')
    const useAppearance = await loadUseAppearance()
    const { accent } = useAppearance()
    expect(accent.value).toBe('off')
  })

  it('setAccent 更新 accent、data-accent 屬性和 localStorage', async () => {
    const useAppearance = await loadUseAppearance()
    const { accent, setAccent } = useAppearance()
    await nextTick()

    setAccent('off' as Accent)
    await nextTick()

    expect(accent.value).toBe('off')
    expect(document.documentElement.getAttribute('data-accent')).toBe('off')
    expect(localStorage.getItem('accent')).toBe('off')
  })

  // ── Cursor body style ──────────────────────────────────────────────────────

  it('setCursor("off") 時 document.body.style.cursor 設為 auto（讓原生游標可見）', async () => {
    const useAppearance = await loadUseAppearance()
    const { setCursor } = useAppearance()
    await nextTick()

    setCursor('off' as Cursor)
    await nextTick()

    expect(document.body.style.cursor).toBe('auto')
  })

  it('cursor 從 off 改為其他值時 body.style.cursor 清除', async () => {
    localStorage.setItem('cursor', 'off')
    const useAppearance = await loadUseAppearance()
    const { setCursor } = useAppearance()
    await nextTick()

    setCursor('ring' as Cursor)
    await nextTick()

    expect(document.body.style.cursor).toBe('')
  })

  // ── Singleton ───────────────────────────────────────────────────────────────

  it('多次呼叫 useAppearance() 共享同一個狀態', async () => {
    const useAppearance = await loadUseAppearance()
    const { isDark: isDark1, toggleTheme } = useAppearance()
    const { isDark: isDark2 } = useAppearance()

    expect(isDark1).toBe(isDark2)
    toggleTheme()
    expect(isDark1.value).toBe(isDark2.value)
  })
})
