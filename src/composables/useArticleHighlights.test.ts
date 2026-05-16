import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { highlightService, type Highlight } from '../api/highlightService'
import { useAuthStore } from '../stores/auth'
import { useArticleHighlights } from './useArticleHighlights'

const mockRequireAuth = vi.fn()
const mockShowToast = vi.fn()

vi.mock('../api/highlightService', () => ({
  highlightService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('./useAuthWall', () => ({
  useAuthWall: () => ({ requireAuth: mockRequireAuth }),
}))

vi.mock('./useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

function makeHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    uuid: 'h-1',
    snippet: 'selected text',
    prefix: '',
    suffix: '',
    color: '#FFEB3B',
    note: null,
    createdAt: '2026-05-16T00:00:00',
    updatedAt: '2026-05-16T00:00:00',
    ...overrides,
  }
}

function mountHarness(options: { uuid?: string; authenticated?: boolean } = {}) {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  auth.accessToken = options.authenticated === false ? null : 'access-token'

  const Wrapper = defineComponent({
    setup() {
      const articleUuid = ref(options.uuid ?? 'article-uuid')
      const state = useArticleHighlights(articleUuid)
      return { articleUuid, ...state }
    },
    template: '<div />',
  })

  return mount(Wrapper)
}

describe('useArticleHighlights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockReturnValue(true)
    vi.mocked(highlightService.list).mockResolvedValue([])
    vi.mocked(highlightService.create).mockResolvedValue(makeHighlight())
    vi.mocked(highlightService.update).mockResolvedValue(makeHighlight({ note: 'updated' }))
    vi.mocked(highlightService.delete).mockResolvedValue(undefined)
  })

  it('loads highlights for authenticated readers', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight()])

    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    expect(highlightService.list).toHaveBeenCalledWith('article-uuid')
    expect(wrapper.vm.highlights).toHaveLength(1)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('skips load when unauthenticated or UUID is missing', async () => {
    mountHarness({ authenticated: false })
    mountHarness({ uuid: '' })
    await nextTick()
    await flushPromises()

    expect(highlightService.list).not.toHaveBeenCalled()
  })

  it('creates a highlight after auth wall passes', async () => {
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.createHighlight({
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
      color: '#FFEB3B',
    })

    expect(highlightService.create).toHaveBeenCalledWith('article-uuid', {
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
      color: '#FFEB3B',
    })
    expect(wrapper.vm.highlights[0].uuid).toBe('h-1')
  })

  it('does not create when auth wall blocks', async () => {
    mockRequireAuth.mockReturnValue(false)
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.createHighlight({ snippet: 'text', color: '#FFEB3B' })

    expect(highlightService.create).not.toHaveBeenCalled()
  })

  it('updates highlight and rolls back on failure', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight({ note: 'old' })])
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.updateHighlight('h-1', { note: 'updated' })
    expect(wrapper.vm.highlights[0].note).toBe('updated')

    vi.mocked(highlightService.update).mockRejectedValueOnce(new Error('fail'))
    await wrapper.vm.updateHighlight('h-1', { note: 'bad' })

    expect(wrapper.vm.highlights[0].note).toBe('updated')
    expect(mockShowToast).toHaveBeenCalledWith('更新劃線失敗，請稍後再試', 'error')
  })

  it('deletes highlight after API succeeds and keeps it on failure', async () => {
    vi.mocked(highlightService.list).mockResolvedValue([makeHighlight()])
    const wrapper = mountHarness()
    await nextTick()
    await flushPromises()

    await wrapper.vm.deleteHighlight('h-1')
    expect(wrapper.vm.highlights).toHaveLength(0)

    wrapper.vm.highlights = [makeHighlight()]
    vi.mocked(highlightService.delete).mockRejectedValueOnce(new Error('fail'))
    await wrapper.vm.deleteHighlight('h-1')

    expect(wrapper.vm.highlights).toHaveLength(1)
    expect(mockShowToast).toHaveBeenCalledWith('刪除劃線失敗，請稍後再試', 'error')
  })
})
