import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useArticleTextSelection } from './useArticleTextSelection'

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

describe('useArticleTextSelection', () => {
  afterEach(() => {
    window.getSelection()?.removeAllRanges()
  })

  it('extracts snippet prefix suffix for selection inside article body', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('p')!.firstChild as Text

    selectText(textNode, 7, 20)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'before ',
      suffix: ' after',
    })
  })

  it('uses the actual range offset when selected text appears more than once', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'alpha selected text omega target before selected text target after'
    const textNode = paragraph.firstChild as Text

    selectText(textNode, 40, 53)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toEqual({
      snippet: 'selected text',
      prefix: 'alpha selected text omega target before ',
      suffix: ' target after',
    })
  })

  it('clears selection outside article body', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const textNode = wrapper.element.querySelector('aside')!.firstChild as Text

    selectText(textNode, 0, 7)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toBeNull()
  })

  it('rejects selected text longer than 500 characters', async () => {
    const wrapper = mountHarness()
    await nextTick()
    const paragraph = wrapper.element.querySelector('p')!
    paragraph.textContent = 'x'.repeat(501)
    selectText(paragraph.firstChild as Text, 0, 501)
    await nextTick()

    expect(wrapper.vm.selectionPayload).toBeNull()
    expect(wrapper.vm.selectionError).toBe('選取文字不可超過 500 字')
  })
})
