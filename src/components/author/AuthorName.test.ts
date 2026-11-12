import { describe, it, expect, vi } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/vue'
import { h } from 'vue'
import AuthorName from './AuthorName.vue'
import { renderWithRouter } from '../../test-utils'
import { DELETED_NICKNAME_PREFIX } from '../../utils/deletedUser'

describe('AuthorName', () => {
  it('有 authorUuid → 連結到 /author/{uuid}', () => {
    const { getByRole } = renderWithRouter(AuthorName, { props: { uuid: 'abc-123', nickname: 'Yuan' } })
    const link = getByRole('link', { name: 'Yuan' })
    expect(link.getAttribute('href')).toBe('/author/abc-123')
  })

  it('uuid 為 null → 純文字，不是連結', () => {
    const { queryByRole, getByText } = renderWithRouter(AuthorName, { props: { uuid: null, nickname: 'Yuan' } })
    expect(queryByRole('link')).toBeNull()
    expect(getByText('Yuan')).toBeTruthy()
  })

  it('uuid 為 undefined 或空字串 → 純文字', () => {
    const a = renderWithRouter(AuthorName, { props: { nickname: 'A' } })
    expect(a.queryByRole('link')).toBeNull()
    const b = renderWithRouter(AuthorName, { props: { uuid: '', nickname: 'B' } })
    expect(b.queryByRole('link')).toBeNull()
  })

  it('uuid 含特殊字元時網址已編碼（不會逃出 /author/ 路徑）', () => {
    const { getByRole } = renderWithRouter(AuthorName, { props: { uuid: 'a/b?c', nickname: 'X' } })
    expect(getByRole('link').getAttribute('href')).toBe('/author/a%2Fb%3Fc')
  })

  it('點擊連結會導向作者頁，且不會觸發外層卡片的點擊（避免同時跳到文章頁）', async () => {
    const outer = vi.fn()
    const Wrapper = {
      components: { AuthorName },
      setup: () => ({ outer }),
      template: '<div data-testid="card" @click="outer"><AuthorName uuid="u1" nickname="Yuan" /></div>',
    }
    const { getByRole, router } = renderWithRouter(Wrapper)
    await fireEvent.click(getByRole('link', { name: 'Yuan' }))
    await waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/author/u1'))
    expect(outer).not.toHaveBeenCalled()
  })

  it('預設 slot 可自訂內容（例如搜尋高亮），連結仍存在', () => {
    const { getByRole } = renderWithRouter(AuthorName, {
      props: { uuid: 'u1', nickname: 'Yuan' },
      slots: { default: () => h('mark', 'Yu'), },
    })
    const link = getByRole('link')
    expect(link.querySelector('mark')).not.toBeNull()
  })

  it('已刪帳保留前綴暱稱即使有 uuid 也是純文字，不產生連結', () => {
    const { queryByRole, getByText } = renderWithRouter(AuthorName, {
      props: { uuid: 'u-deleted', nickname: `${DELETED_NICKNAME_PREFIX}ab12cd34` },
    })
    expect(queryByRole('link')).toBeNull()
    expect(getByText('已刪除使用者#ab12cd34')).toBeTruthy()
  })

  it('一般暱稱（含「已刪除使用者」但無 # 前綴）加 uuid 仍是連結', () => {
    const { getByRole } = renderWithRouter(AuthorName, { props: { uuid: 'u1', nickname: '已刪除使用者粉絲' } })
    expect(getByRole('link').getAttribute('href')).toBe('/author/u1')
  })
})
