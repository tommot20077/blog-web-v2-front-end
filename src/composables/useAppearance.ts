import { ref, watchEffect } from 'vue'

type Font = 'space' | 'inter' | 'geist'
type Cursor = 'ring' | 'cross' | 'dot' | 'label' | 'off'
type Accent = 'on' | 'off'

function readStorage(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) ?? fallback
}

function detectDark(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isDark = ref(detectDark())
const font   = ref<Font>(readStorage('font', 'space') as Font)
const cursor = ref<Cursor>(readStorage('cursor', 'ring') as Cursor)
const accent = ref<Accent>(readStorage('accent', 'on') as Accent)

watchEffect(() => {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.setAttribute('data-theme',  isDark.value ? 'dark' : 'light')
  el.setAttribute('data-font',   font.value)
  el.setAttribute('data-cursor', cursor.value)
  el.setAttribute('data-accent', accent.value)
  isDark.value ? el.classList.add('dark') : el.classList.remove('dark')
  localStorage.setItem('theme',  isDark.value ? 'dark' : 'light')
  localStorage.setItem('font',   font.value)
  localStorage.setItem('cursor', cursor.value)
  localStorage.setItem('accent', accent.value)
})

export function useAppearance() {
  const toggleTheme = ()              => { isDark.value = !isDark.value }
  const setFont     = (v: Font)   => { font.value   = v }
  const setCursor   = (v: Cursor) => { cursor.value = v }
  const setAccent   = (v: Accent) => { accent.value = v }

  return { isDark, font, cursor, accent, toggleTheme, setFont, setCursor, setAccent }
}
