import { screen } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import AdminTagsView from './AdminTagsView.vue'

describe('AdminTagsView（佔位頁，Task A4）', () => {
  it('渲染 admin 殼層，且「標籤管理」項目為 active', () => {
    renderWithRouter(AdminTagsView)
    expect(screen.getByTestId('admin-tags-root')).toBeInTheDocument()
    expect(screen.getByTestId('admin-rail-link-admin-tags').className).toContain('active')
  })

  it('渲染內容區骨架佔位', () => {
    renderWithRouter(AdminTagsView)
    expect(screen.getByTestId('admin-tags-placeholder')).toBeInTheDocument()
  })
})
