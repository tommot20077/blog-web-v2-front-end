import { render, fireEvent } from '@testing-library/vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useTheme } from '../../composables/useTheme'

describe('ThemeSwitcher', () => {
  it('渲染切換按鈕 — button with aria-label "切換深淺色模式" exists', () => {
    const { getByRole } = render(ThemeSwitcher)
    const button = getByRole('button', { name: '切換深淺色模式' })
    expect(button).toBeInTheDocument()
  })

  it('點擊切換 isDark — click button → isDark toggles', async () => {
    const { isDark } = useTheme()
    const initialValue = isDark.value

    const { getByRole } = render(ThemeSwitcher)
    const button = getByRole('button', { name: '切換深淺色模式' })

    await fireEvent.click(button)
    expect(isDark.value).toBe(!initialValue)

    await fireEvent.click(button)
    expect(isDark.value).toBe(initialValue)
  })
})
