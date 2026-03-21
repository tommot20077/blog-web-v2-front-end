import { renderWithRouter } from '../test-utils'
import Home from './Home.vue'

describe('Home 頁面', () => {
  it('渲染 3 張文章卡片', () => {
    const { getAllByRole } = renderWithRouter(Home)
    const articles = getAllByRole('article')
    expect(articles).toHaveLength(3)
  })

  it('顯示「近期發布」標題', () => {
    const { getByText } = renderWithRouter(Home)
    expect(getByText('近期發布')).toBeInTheDocument()
  })

  it('「查看全部文章 →」連結指向 /articles', () => {
    const { getByText } = renderWithRouter(Home)
    const link = getByText('查看全部文章 →')
    expect(link.closest('a')).toHaveAttribute('href', '/articles')
  })

  it('渲染 HeroMarquee 元件', () => {
    const { getByRole } = renderWithRouter(Home)
    // HeroMarquee 渲染一個 h1 包含 "Animated Text Effects"
    expect(getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
