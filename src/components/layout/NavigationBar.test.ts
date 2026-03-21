import { renderWithRouter } from '../../test-utils'
import NavigationBar from './NavigationBar.vue'

describe('NavigationBar', () => {
  it('首頁連結存在 — link with text "首頁" pointing to "/"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const link = getByText('首頁')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('文章連結存在 — link with text "文章" pointing to "/articles"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const link = getByText('文章')
    expect(link.closest('a')).toHaveAttribute('href', '/articles')
  })

  it('Logo 連結存在 — link containing "MY BLOG WEB." pointing to "/"', () => {
    const { getByText } = renderWithRouter(NavigationBar)
    const logoText = getByText('MY BLOG WEB.')
    expect(logoText.closest('a')).toHaveAttribute('href', '/')
  })

  it('ThemeSwitcher 存在 — the theme toggle button is rendered', () => {
    const { getByRole } = renderWithRouter(NavigationBar)
    const button = getByRole('button', { name: '切換深淺色模式' })
    expect(button).toBeInTheDocument()
  })

  it('WeatherWidget 存在 — weather info area is rendered', () => {
    const { getByTitle } = renderWithRouter(NavigationBar)
    const weatherWidget = getByTitle('今日天氣')
    expect(weatherWidget).toBeInTheDocument()
  })
})
