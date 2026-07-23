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
})
