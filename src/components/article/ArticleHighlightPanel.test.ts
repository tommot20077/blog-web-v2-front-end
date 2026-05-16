import { render, screen, fireEvent } from '@testing-library/vue'
import ArticleHighlightPanel from './ArticleHighlightPanel.vue'
import type { Highlight } from '../../api/highlightService'

function highlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    uuid: 'h-1',
    snippet: 'selected text',
    prefix: '',
    suffix: '',
    color: '#FFEB3B',
    note: 'note',
    createdAt: '2026-05-16T00:00:00',
    updatedAt: '2026-05-16T00:00:00',
    ...overrides,
  }
}

describe('ArticleHighlightPanel', () => {
  it('shows empty state when there are no highlights', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [],
        locatedByHighlightUuid: new Map(),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByText('尚未建立劃線')).toBeInTheDocument()
  })

  it('shows a load error state and emits retry', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [],
        locatedByHighlightUuid: new Map(),
        isLoading: false,
        isMutating: false,
        loadError: true,
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('劃線載入失敗')
    expect(screen.queryByText('尚未建立劃線')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: '重新載入劃線' }))

    expect(emitted().retry).toHaveLength(1)
  })

  it('renders snippet note and not-located state', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', false]]),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByText('selected text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('note')).toBeInTheDocument()
    expect(screen.getByText('正文位置已變更')).toBeInTheDocument()
  })

  it('emits update for note and color changes', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.update(screen.getByDisplayValue('note'), 'new note')
    await fireEvent.click(screen.getByTestId('highlight-note-save-h-1'))
    await fireEvent.click(screen.getByTestId('highlight-panel-color-h-1-1'))

    expect(emitted().update?.[0]).toEqual(['h-1', { note: 'new note' }])
    expect(emitted().update?.[1]).toEqual(['h-1', { color: '#C8E6C9' }])
  })

  it('preserves an unsaved note draft across unrelated highlight prop updates', async () => {
    const { rerender } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.update(screen.getByRole('textbox', { name: '劃線筆記' }), 'draft note')
    await rerender({
      highlights: [highlight({ color: '#C8E6C9' })],
      locatedByHighlightUuid: new Map([['h-1', true]]),
      isLoading: false,
      isMutating: false,
    })

    expect(screen.getByRole('textbox', { name: '劃線筆記' })).toHaveValue('draft note')
  })

  it('keeps a saved note draft visible when parent rolls back after update failure', async () => {
    const { rerender } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight({ note: 'old note' })],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.update(screen.getByRole('textbox', { name: '劃線筆記' }), 'draft note')
    await fireEvent.click(screen.getByTestId('highlight-note-save-h-1'))
    await rerender({
      highlights: [highlight({ note: 'old note' })],
      locatedByHighlightUuid: new Map([['h-1', true]]),
      isLoading: false,
      isMutating: false,
    })

    expect(screen.getByRole('textbox', { name: '劃線筆記' })).toHaveValue('draft note')
  })

  it('exposes color swatches with accessible names and selected state', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByRole('button', { name: '選擇劃線顏色 #FFEB3B' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '選擇劃線顏色 #C8E6C9' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('exposes the note textarea with an accessible label', () => {
    render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    expect(screen.getByRole('textbox', { name: '劃線筆記' })).toHaveValue('note')
  })

  it('disables editing controls and suppresses emits while mutating', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: true,
      },
    })

    const note = screen.getByRole('textbox', { name: '劃線筆記' })
    const save = screen.getByTestId('highlight-note-save-h-1')
    const color = screen.getByRole('button', { name: '選擇劃線顏色 #C8E6C9' })
    const deleteButton = screen.getByTestId('highlight-delete-h-1')

    expect(note).toBeDisabled()
    expect(save).toBeDisabled()
    expect(color).toBeDisabled()
    expect(deleteButton).toBeDisabled()

    await fireEvent.click(save)
    await fireEvent.click(color)
    await fireEvent.click(deleteButton)

    expect(emitted().update).toBeUndefined()
    expect(emitted().delete).toBeUndefined()
  })

  it('emits delete', async () => {
    const { emitted } = render(ArticleHighlightPanel, {
      props: {
        highlights: [highlight()],
        locatedByHighlightUuid: new Map([['h-1', true]]),
        isLoading: false,
        isMutating: false,
      },
    })

    await fireEvent.click(screen.getByTestId('highlight-delete-h-1'))

    expect(emitted().delete?.[0]).toEqual(['h-1'])
  })
})
