import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useInlineArticleHighlights } from './useInlineArticleHighlights'
import type { Highlight } from '../api/highlightService'

function highlight(overrides: Partial<Highlight> = {}): Highlight {
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

function mountHarness(html: string, records: Highlight[]) {
  const Wrapper = defineComponent({
    setup() {
      const bodyRef = ref<HTMLElement | null>(null)
      const highlights = ref(records)
      const state = useInlineArticleHighlights(bodyRef, highlights)
      return { bodyRef, highlights, ...state }
    },
    template: `<div ref="bodyRef" data-testid="article-body">${html}</div>`,
  })

  return mount(Wrapper)
}

describe('useInlineArticleHighlights', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('wraps a unique snippet with a highlight mark', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    const mark = wrapper.element.querySelector('[data-highlight-uuid="h-1"]') as HTMLElement
    expect(mark).toBeTruthy()
    expect(mark.textContent).toBe('selected text')
    expect(mark.style.backgroundColor).toBe('rgb(255, 235, 59)')
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(true)
  })

  it('uses prefix and suffix to choose the matching duplicate snippet', async () => {
    const wrapper = mountHarness(
      '<p>alpha selected text omega</p><p>target before selected text target after</p>',
      [highlight({ prefix: 'target before ', suffix: ' target after' })],
    )
    await nextTick()

    const marks = Array.from(
      wrapper.element.querySelectorAll('[data-highlight-uuid="h-1"]'),
    ) as HTMLElement[]
    expect(marks).toHaveLength(1)
    expect(marks[0]!.parentElement!.textContent).toContain('target before selected text target after')
  })

  it('does not guess when duplicate snippets tie on matching context', async () => {
    const wrapper = mountHarness(
      '<p>same before selected text same after</p><p>same before selected text same after</p>',
      [highlight({ prefix: 'same before ', suffix: ' same after' })],
    )
    await nextTick()

    expect(wrapper.element.querySelector('[data-highlight-uuid="h-1"]')).toBeNull()
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(false)
  })

  it('uses trimmed snippet length when suffix disambiguates duplicate snippets', async () => {
    const wrapper = mountHarness(
      '<p>same before selected text wrong after</p><p>same before selected text target after</p>',
      [highlight({ snippet: ' selected text ', prefix: 'same before ', suffix: ' target after' })],
    )
    await nextTick()

    const marks = Array.from(
      wrapper.element.querySelectorAll('[data-highlight-uuid="h-1"]'),
    ) as HTMLElement[]
    expect(marks).toHaveLength(1)
    expect(marks[0]!.textContent).toBe('selected text')
    expect(marks[0]!.parentElement!.textContent).toContain('same before selected text target after')
  })

  it('considers overlapping snippet candidates when context identifies the middle match', async () => {
    const wrapper = mountHarness('<p>aaaa</p>', [
      highlight({ snippet: 'aa', prefix: 'a', suffix: 'a' }),
    ])
    await nextTick()

    const mark = wrapper.element.querySelector('[data-highlight-uuid="h-1"]') as HTMLElement | null
    expect(mark?.textContent).toBe('aa')
    expect(wrapper.element.textContent).toBe('aaaa')
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(true)
  })

  it('does not guess when a snippet cannot be found', async () => {
    const wrapper = mountHarness('<p>article body</p>', [highlight({ snippet: 'missing text' })])
    await nextTick()

    expect(wrapper.element.querySelector('[data-highlight-uuid="h-1"]')).toBeNull()
    expect(wrapper.vm.locatedByHighlightUuid.get('h-1')).toBe(false)
  })

  it('re-applies marks when color changes', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    wrapper.vm.highlights = [highlight({ color: '#C8E6C9' })]
    await nextTick()

    const mark = wrapper.element.querySelector('[data-highlight-uuid="h-1"]') as HTMLElement
    expect(mark.style.backgroundColor).toBe('rgb(200, 230, 201)')
  })

  it('removes inline marks when highlight is deleted', async () => {
    const wrapper = mountHarness('<p>before selected text after</p>', [highlight()])
    await nextTick()

    wrapper.vm.highlights = []
    await nextTick()

    expect(wrapper.element.querySelector('[data-highlight-uuid="h-1"]')).toBeNull()
    expect(wrapper.element.textContent).toContain('before selected text after')
  })
})
