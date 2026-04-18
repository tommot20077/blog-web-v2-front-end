import MyArticlesView from './MyArticlesView.vue'
import { renderWithRouter } from '../test-utils'

describe('MyArticlesView', () => {
  it('正常掛載不拋出錯誤', () => {
    expect(() => renderWithRouter(MyArticlesView)).not.toThrow()
  })

  it('根元素存在', () => {
    const { container } = renderWithRouter(MyArticlesView)
    expect(container.firstChild).toBeTruthy()
  })
})
