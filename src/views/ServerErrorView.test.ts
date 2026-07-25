import { renderWithRouter } from '../test-utils'
import ServerErrorView from './ServerErrorView.vue'

describe('ServerErrorView', () => {
  it('根元素 server-error-root 存在', () => {
    const { getByTestId } = renderWithRouter(ServerErrorView)
    expect(getByTestId('server-error-root')).toBeInTheDocument()
  })

  it('標題改為「伺服器發生錯誤。」，不再顯示舊文案「伺服器壞了，抱歉。」', () => {
    const { getByTestId } = renderWithRouter(ServerErrorView)
    const root = getByTestId('server-error-root')
    expect(root.textContent).toContain('伺服器發生錯誤。')
    expect(root.textContent).not.toContain('伺服器壞了')
  })

  it('副標改為「請稍後再試，或返回首頁。」，不再顯示舊副標文案且不含 <br>', () => {
    const { container, getByTestId } = renderWithRouter(ServerErrorView)
    const root = getByTestId('server-error-root')
    expect(root.textContent).toContain('請稍後再試，或返回首頁。')
    expect(root.textContent).not.toContain('這不是你的錯')
    expect(root.textContent).not.toContain('等三十秒再試')

    const sub = container.querySelector('.err-sub')
    expect(sub).toBeInTheDocument()
    expect(sub?.innerHTML).not.toContain('<br')
  })
})
