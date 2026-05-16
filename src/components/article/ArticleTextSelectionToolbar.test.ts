import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleTextSelectionToolbar from './ArticleTextSelectionToolbar.vue'

describe('ArticleTextSelectionToolbar', () => {
  it('is hidden without a selection payload', () => {
    const { container } = render(ArticleTextSelectionToolbar, {
      props: { selectionPayload: null, isPending: false },
    })

    expect(container.querySelector('[data-testid="article-highlight-toolbar"]')).not.toBeInTheDocument()
  })

  it('shows selection error when selected text cannot be used', () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: null,
        selectionError: '選取文字不可超過 500 字',
        isPending: false,
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('選取文字不可超過 500 字')
  })

  it('emits create with the selected color and payload', async () => {
    const { emitted } = render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: 'before ', suffix: ' after' },
        isPending: false,
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: '使用綠色劃線' }))
    await fireEvent.click(screen.getByTestId('highlight-create-button'))

    expect(emitted().create?.[0]).toEqual([
      {
        snippet: 'selected text',
        prefix: 'before ',
        suffix: ' after',
        color: '#C8E6C9',
      },
    ])
  })

  it('exposes selected state for color swatches', async () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: 'before ', suffix: ' after' },
        isPending: false,
      },
    })

    expect(screen.getByRole('button', { name: '使用黃色劃線' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '使用綠色劃線' })).toHaveAttribute('aria-pressed', 'false')

    await fireEvent.click(screen.getByRole('button', { name: '使用綠色劃線' }))

    expect(screen.getByRole('button', { name: '使用黃色劃線' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '使用綠色劃線' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables create while pending', () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: '', suffix: '' },
        isPending: true,
      },
    })

    expect(screen.getByTestId('highlight-create-button')).toBeDisabled()
  })

  it('positions itself near the current selection anchor', () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: '', suffix: '' },
        selectionAnchor: { top: 120, left: 240 },
        isPending: false,
      },
    })

    const toolbar = screen.getByTestId('article-highlight-toolbar')
    expect(toolbar).toHaveClass('is-floating')
    expect(toolbar).toHaveStyle({ top: '120px', left: '240px' })
  })
})
