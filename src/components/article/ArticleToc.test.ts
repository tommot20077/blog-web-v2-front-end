import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleToc from './ArticleToc.vue'
import type { TocEntry } from '../../types/article'

function sampleToc(): TocEntry[] {
  return [
    { id: 'heading-安裝步驟', text: '安裝步驟', level: 2 },
    { id: 'heading-常見問題', text: '常見問題', level: 2 },
    { id: 'heading-port-被佔用', text: 'Port 被佔用', level: 3 },
  ]
}

describe('ArticleToc', () => {
  it('renders no DOM at all when toc is an empty array', () => {
    const { container } = render(ArticleToc, {
      props: { toc: [] },
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders h2 entries flush and h3 entries indented', () => {
    render(ArticleToc, { props: { toc: sampleToc() } })

    expect(screen.getByTestId('toc-entry-heading-安裝步驟')).not.toHaveClass('toc-item--h3')
    expect(screen.getByTestId('toc-entry-heading-常見問題')).not.toHaveClass('toc-item--h3')
    expect(screen.getByTestId('toc-entry-heading-port-被佔用')).toHaveClass('toc-item--h3')
  })

  it('renders entries in document order with their text', () => {
    render(ArticleToc, { props: { toc: sampleToc() } })

    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      '安裝步驟',
      '常見問題',
      'Port 被佔用',
    ])
  })

  it('emits select with the clicked entry id', async () => {
    const { emitted } = render(ArticleToc, { props: { toc: sampleToc() } })

    await fireEvent.click(screen.getByTestId('toc-link-heading-常見問題'))

    expect(emitted().select?.[0]).toEqual(['heading-常見問題'])
  })

  it('highlights the entry matching activeId', () => {
    render(ArticleToc, {
      props: { toc: sampleToc(), activeId: 'heading-常見問題' },
    })

    const active = screen.getByTestId('toc-link-heading-常見問題')
    expect(active).toHaveClass('active')
    expect(active).toHaveAttribute('aria-current', 'true')

    const inactive = screen.getByTestId('toc-link-heading-安裝步驟')
    expect(inactive).not.toHaveClass('active')
    expect(inactive).not.toHaveAttribute('aria-current')
  })

  it('highlights nothing when activeId is not provided', () => {
    render(ArticleToc, { props: { toc: sampleToc() } })

    for (const entry of sampleToc()) {
      const link = screen.getByTestId(`toc-link-${entry.id}`)
      expect(link).not.toHaveClass('active')
      expect(link).not.toHaveAttribute('aria-current')
    }
  })

  // ── 視覺改版（導軌骨架 + 無標記 + 自動收合，G 規格）─────────────────────────
  //
  // 資料集設計：9 項（超過門檻 8），依 h2→附屬 h3 分組如下：
  //   g0(h2) → g0-a, g0-b (h3)
  //   g1(h2) → g1-a (h3)
  //   g2(h2) → g2-a, g2-b (h3)
  //   g3(h2) → 無子項
  function longToc(): TocEntry[] {
    return [
      { id: 'h-g0', text: 'Group 0', level: 2 },
      { id: 'h-g0-a', text: 'G0 Child A', level: 3 },
      { id: 'h-g0-b', text: 'G0 Child B', level: 3 },
      { id: 'h-g1', text: 'Group 1', level: 2 },
      { id: 'h-g1-a', text: 'G1 Child A', level: 3 },
      { id: 'h-g2', text: 'Group 2', level: 2 },
      { id: 'h-g2-a', text: 'G2 Child A', level: 3 },
      { id: 'h-g2-b', text: 'G2 Child B', level: 3 },
      { id: 'h-g3', text: 'Group 3', level: 2 },
    ]
  }

  describe('自動收合（>8 項啟動分組）', () => {
    it('toc.length > 8 時啟動分組收合，只有 activeId 所在的組展開，其餘收合', () => {
      render(ArticleToc, { props: { toc: longToc(), activeId: 'h-g1-a' } })

      // g1（含 active 子項）展開：子項存在於 DOM
      expect(screen.getByTestId('toc-link-h-g1-a')).toBeInTheDocument()

      // 其餘 group 收合：子項不存在於 DOM
      expect(screen.queryByTestId('toc-link-h-g0-a')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toc-link-h-g0-b')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toc-link-h-g2-a')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toc-link-h-g2-b')).not.toBeInTheDocument()

      // 收合的組在右側顯示子項數
      expect(screen.getByTestId('toc-count-h-g0')).toHaveTextContent('2')
      expect(screen.getByTestId('toc-count-h-g2')).toHaveTextContent('2')
      // 展開的組不顯示子項數
      expect(screen.queryByTestId('toc-count-h-g1')).not.toBeInTheDocument()
      // 沒有子項的 group（g3）不顯示 caret
      expect(screen.queryByTestId('toc-caret-h-g3')).not.toBeInTheDocument()
    })

    it('toc.length <= 8 時不啟動分組收合，全部平鋪（與改版前行為一致）', () => {
      const toc = longToc().slice(0, 8) // 剛好等於門檻，不啟動收合
      render(ArticleToc, { props: { toc, activeId: 'h-g1-a' } })

      expect(screen.queryByTestId('toc-caret-h-g0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('toc-count-h-g0')).not.toBeInTheDocument()
      for (const entry of toc) {
        expect(screen.getByTestId(`toc-link-${entry.id}`)).toBeInTheDocument()
      }
    })

    it('手動點擊 caret 可切換該組的展開/收合狀態，且不觸發 select', async () => {
      const { emitted } = render(ArticleToc, { props: { toc: longToc(), activeId: 'h-g1-a' } })

      expect(screen.queryByTestId('toc-link-h-g0-a')).not.toBeInTheDocument()

      await fireEvent.click(screen.getByTestId('toc-caret-h-g0'))

      expect(screen.getByTestId('toc-link-h-g0-a')).toBeInTheDocument()
      expect(emitted().select).toBeUndefined()
    })

    it('點擊分組模式下的項目仍會 emit select 帶正確 id', async () => {
      const { emitted } = render(ArticleToc, { props: { toc: longToc(), activeId: 'h-g1-a' } })

      await fireEvent.click(screen.getByTestId('toc-link-h-g1-a'))
      expect(emitted().select?.[0]).toEqual(['h-g1-a'])

      await fireEvent.click(screen.getByTestId('toc-link-h-g0'))
      expect(emitted().select?.[1]).toEqual(['h-g0'])
    })

    it('分組模式下子項仍帶有 toc-item--h3 縮排 class，主節沒有', () => {
      render(ArticleToc, { props: { toc: longToc(), activeId: 'h-g1-a' } })

      expect(screen.getByTestId('toc-entry-h-g1-a')).toHaveClass('toc-item--h3')
      expect(screen.getByTestId('toc-entry-h-g0')).not.toHaveClass('toc-item--h3')
    })

    it('分組模式下若第一項就是 h3（異常順序）不拋錯，該項自成一組', () => {
      const toc: TocEntry[] = [
        { id: 'orphan-h3', text: 'Orphan', level: 3 },
        ...longToc(),
      ]

      expect(() => render(ArticleToc, { props: { toc } })).not.toThrow()
      expect(screen.getByTestId('toc-entry-orphan-h3')).toBeInTheDocument()
    })
  })
})
