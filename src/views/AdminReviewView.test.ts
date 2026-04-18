import AdminReviewView from './AdminReviewView.vue'
import { renderWithRouter } from '../test-utils'

describe('AdminReviewView', () => {
  it('正常掛載不拋出錯誤', () => {
    expect(() => renderWithRouter(AdminReviewView)).not.toThrow()
  })

  it('顯示「審核管理」標題', () => {
    const { getByRole } = renderWithRouter(AdminReviewView)
    expect(getByRole('heading', { name: '審核管理' })).toBeInTheDocument()
  })

  it('顯示「功能開發中」提示文字', () => {
    const { getByText } = renderWithRouter(AdminReviewView)
    expect(getByText('功能開發中')).toBeInTheDocument()
  })
})
