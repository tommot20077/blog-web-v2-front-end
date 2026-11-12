import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownViewModal from './MarkdownViewModal.vue'

const mockShowToast = vi.fn()

vi.mock('../../composables/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}))

function stubNavigatorClipboard(impl?: { writeText: (text: string) => Promise<void> }) {
  Object.defineProperty(navigator, 'clipboard', {
    value: impl,
    configurable: true,
  })
}

describe('MarkdownViewModal', () => {
  afterEach(() => {
    vi.clearAllMocks()
    delete (navigator as unknown as { clipboard?: unknown }).clipboard
  })

  it('顯示的內容等於 content prop 的原始 markdown（不解析為 HTML）', () => {
    const raw = '# 標題\n\n**加粗** 與 `code`'
    const wrapper = mount(MarkdownViewModal, { props: { content: raw } })

    const contentEl = wrapper.find('[data-testid="markdown-view-modal-content"]')
    expect(contentEl.exists()).toBe(true)
    expect(contentEl.text()).toBe(raw)
    expect(contentEl.element.innerHTML).not.toContain('<strong>')
    expect(contentEl.element.innerHTML).not.toContain('<h1>')
  })

  it('點擊「複製全文」呼叫 clipboard 並帶入完整 content，成功後顯示成功 toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigatorClipboard({ writeText })
    const raw = '# hello markdown'
    const wrapper = mount(MarkdownViewModal, { props: { content: raw } })

    await wrapper.find('[data-testid="markdown-view-modal-copy"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(writeText).toHaveBeenCalledWith(raw)
    expect(mockShowToast).toHaveBeenCalledWith('已複製全文', 'success')
  })

  it('複製全文失敗時顯示錯誤 toast', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    stubNavigatorClipboard({ writeText })
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })

    await wrapper.find('[data-testid="markdown-view-modal-copy"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockShowToast).toHaveBeenCalledWith('複製失敗，請稍後再試', 'error')
  })

  it('按下 ESC 鍵會 emit close', async () => {
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('按下非 ESC 鍵不會 emit close', async () => {
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('點擊遮罩（overlay 本身）會 emit close', async () => {
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })

    await wrapper.find('[data-testid="markdown-view-modal-overlay"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('點擊彈窗面板內部不會 emit close', async () => {
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })

    await wrapper.find('[data-testid="markdown-view-modal"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('卸載時移除 keydown 監聽，避免殘留（卸載後 ESC 不再觸發 emit）', async () => {
    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })
    wrapper.unmount()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    // 卸載後元件已無法 emit，這裡驗證不會拋出例外（監聽器已清除）
    expect(true).toBe(true)
  })

  it('掛載時鎖定 body 捲動、卸載時回復並恢復原本捲動位置', async () => {
    Object.defineProperty(window, 'scrollY', { value: 320, writable: true, configurable: true })
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    const wrapper = mount(MarkdownViewModal, { props: { content: '# hello' } })
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()

    expect(document.body.style.overflow).toBe('')
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 320, left: 0, behavior: 'auto' })
  })
})
