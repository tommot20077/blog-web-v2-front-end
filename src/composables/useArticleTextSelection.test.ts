import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useArticleTextSelection, type ArticleSelectionPayload } from './useArticleTextSelection'

interface SelectionHarnessVm {
  selectionPayload: ArticleSelectionPayload | null
  selectionError: string | null
}

function selectText(node: Text, start: number, end: number) {
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
}

function mountHarness() {
  const Wrapper = defineComponent({
    setup() {
      const bodyRef = ref<HTMLElement | null>(null)
      const state = useArticleTextSelection(bodyRef)
      return { bodyRef, ...state }
    },
    template: `<div><article ref="bodyRef"><p>before selected text after</p></article><aside>outside text</aside></div>`,
  })
  return mount(Wrapper, { attachTo: document.body })
}

function selectionVm(wrapper: VueWrapper): SelectionHarnessVm {
  return wrapper.vm as unknown as SelectionHarnessVm
}

describe('useArticleTextSelection', () => {
  let wrapper: VueWrapper | null = null

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    window.getSelection()?.removeAllRanges()
  })

  it('extracts snippet prefix suffix for selection inside article body', async () => {
    wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('p')!.firstChild as Text

    selectText(textNode, 7, 20)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
    })
  })

  it('uses the actual range offset when selected text appears more than once', async () => {
    wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'alpha selected text omega target before selected text target after'
    const textNode = paragraph.firstChild as Text

    selectText(textNode, 40, 53)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'alpha selected text omega target before ',
      suffix: ' target after',
    })
  })

  it('clears selection outside article body', async () => {
    wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('aside')!.firstChild as Text

    selectText(textNode, 0, 7)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toBeNull()
  })

  it('rejects selected text longer than 500 characters', async () => {
    wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'x'.repeat(501)
    selectText(paragraph.firstChild as Text, 0, 501)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toBeNull()
    expect(selectionVm(wrapper).selectionError).toBe('選取文字不可超過 500 字')
  })

  it('clears stale error after selecting outside article body', async () => {
    wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'x'.repeat(501)

    selectText(paragraph.firstChild as Text, 0, 501)
    await nextTick()
    expect(selectionVm(wrapper).selectionError).toBe('選取文字不可超過 500 字')

    const outsideText = wrapper.element.querySelector('aside')!.firstChild as Text
    selectText(outsideText, 0, 7)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toBeNull()
    expect(selectionVm(wrapper).selectionError).toBeNull()
  })

  it('truncates prefix and suffix context to 64 characters', async () => {
    wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    const prefix = 'p'.repeat(70)
    const suffix = 's'.repeat(70)
    paragraph.textContent = `${prefix}selected text${suffix}`

    selectText(paragraph.firstChild as Text, 70, 83)
    await nextTick()

    expect(selectionVm(wrapper).selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'p'.repeat(64),
      suffix: 's'.repeat(64),
    })
  })
})
