import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, fireEvent } from '@testing-library/vue'
import { nextTick } from 'vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useAppearance } from '../../composables/useAppearance'

describe('ThemeSwitcher', () => {
  it('渲染切換按鈕 — button with aria-label "切換深淺色模式" exists', () => {
    const { getByRole } = render(ThemeSwitcher)
    const button = getByRole('button', { name: '切換深淺色模式' })
    expect(button).toBeInTheDocument()
  })

  it('點擊切換 isDark — click button → isDark toggles', async () => {
    const { isDark } = useAppearance()
    const initialValue = isDark.value

    const { getByRole } = render(ThemeSwitcher)
    const button = getByRole('button', { name: '切換深淺色模式' })

    await fireEvent.click(button)
    expect(isDark.value).toBe(!initialValue)

    await fireEvent.click(button)
    expect(isDark.value).toBe(initialValue)
  })

  it('FE-03：ThemeSwitcher 與 useAppearance 共用同一份 isDark（點擊 → DOM 與 localStorage 同步）', async () => {
    const { isDark } = useAppearance()
    isDark.value = false
    await nextTick()

    const { getByRole } = render(ThemeSwitcher)
    await fireEvent.click(getByRole('button', { name: '切換深淺色模式' }))
    await nextTick()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('FE-03：反向 — 由 useAppearance（桌面 NavigationBar 的路徑）切換後，ThemeSwitcher 的圖示同步更新', async () => {
    const { isDark, toggleTheme } = useAppearance()
    isDark.value = false
    await nextTick()

    const { container } = render(ThemeSwitcher)
    const before = container.querySelector('button')!.innerHTML

    toggleTheme()
    await nextTick()
    await nextTick()

    expect(container.querySelector('button')!.innerHTML).not.toBe(before)
  })

  it('FE-03：DOM／localStorage 只由 useAppearance 一處寫入 — 不存在第二份 useTheme composable', () => {
    expect(existsSync(resolve(__dirname, '../../composables/useTheme.ts'))).toBe(false)
  })
})
