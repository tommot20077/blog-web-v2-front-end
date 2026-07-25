import { screen } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import AdminSearchView from './AdminSearchView.vue'

describe('AdminSearchView（佔位頁，Task A4）', () => {
  it('渲染 admin 殼層，且「搜尋索引」項目為 active', () => {
    renderWithRouter(AdminSearchView)
    expect(screen.getByTestId('admin-search-root')).toBeInTheDocument()
    expect(screen.getByTestId('admin-rail-link-admin-search').className).toContain('active')
  })

  it('渲染內容區骨架佔位', () => {
    renderWithRouter(AdminSearchView)
    expect(screen.getByTestId('admin-search-placeholder')).toBeInTheDocument()
  })
})
