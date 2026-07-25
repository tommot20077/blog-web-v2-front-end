import { screen } from '@testing-library/vue'
import { renderWithRouter } from '../test-utils'
import AdminDashboardView from './AdminDashboardView.vue'

describe('AdminDashboardView（佔位頁，Task A4）', () => {
  it('渲染 admin 殼層，且「總覽」項目為 active', () => {
    renderWithRouter(AdminDashboardView)
    expect(screen.getByTestId('admin-dashboard-root')).toBeInTheDocument()
    expect(screen.getByTestId('admin-rail-link-admin-dashboard').className).toContain('active')
  })

  it('渲染內容區骨架佔位', () => {
    renderWithRouter(AdminDashboardView)
    expect(screen.getByTestId('admin-dashboard-placeholder')).toBeInTheDocument()
  })
})
