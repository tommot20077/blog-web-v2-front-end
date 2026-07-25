import { screen } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import AdminCategoriesView from './AdminCategoriesView.vue'

describe('AdminCategoriesView（佔位頁，Task A4）', () => {
  it('渲染 admin 殼層，且「分類管理」項目為 active', () => {
    renderWithRouter(AdminCategoriesView)
    expect(screen.getByTestId('admin-categories-root')).toBeInTheDocument()
    expect(screen.getByTestId('admin-rail-link-admin-categories').className).toContain('active')
  })

  it('渲染內容區骨架佔位', () => {
    renderWithRouter(AdminCategoriesView)
    expect(screen.getByTestId('admin-categories-placeholder')).toBeInTheDocument()
  })
})
