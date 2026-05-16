import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleTextSelectionToolbar from './ArticleTextSelectionToolbar.vue'

describe('ArticleTextSelectionToolbar', () => {
  it('is hidden without a selection payload', () => {
    const { container } = render(ArticleTextSelectionToolbar, {
      props: { selectionPayload: null, isPending: false },
    })

    expect(container.querySelector('[data-testid="article-highlight-toolbar"]')).not.toBeInTheDocument()
  })

  it('emits create with the selected color and payload', async () => {
    const { emitted } = render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: 'before ', suffix: ' after' },
        isPending: false,
      },
    })

    await fireEvent.click(screen.getByTestId('highlight-color-1'))
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

  it('disables create while pending', () => {
    render(ArticleTextSelectionToolbar, {
      props: {
        selectionPayload: { snippet: 'selected text', prefix: '', suffix: '' },
        isPending: true,
      },
    })

    expect(screen.getByTestId('highlight-create-button')).toBeDisabled()
  })
})
