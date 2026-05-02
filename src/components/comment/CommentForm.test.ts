import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommentForm from './CommentForm.vue'

describe('CommentForm', () => {
  it('content 短於 3 字 → submit disabled', async () => {
    const wrapper = mount(CommentForm)
    const textarea = wrapper.find('[data-testid="comment-textarea"]')
    const submit = wrapper.find('[data-testid="comment-submit"]')

    await textarea.setValue('ab')
    expect((submit.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('content >= 3 字 + click submit → emit submit + clear textarea', async () => {
    const wrapper = mount(CommentForm)
    const textarea = wrapper.find('[data-testid="comment-textarea"]')

    await textarea.setValue('hello world')
    // 用 form submit 模擬「user 點 submit button」— jsdom 不會把 button click cascade 到 form submit event
    await wrapper.find('form').trigger('submit')

    const events = wrapper.emitted('submit')!
    expect(events).toHaveLength(1)
    expect(events[0]![0]).toBe('hello world')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('cmd+enter 觸發 submit', async () => {
    const wrapper = mount(CommentForm)
    const textarea = wrapper.find('[data-testid="comment-textarea"]')

    await textarea.setValue('hello')
    await textarea.trigger('keydown', { key: 'Enter', metaKey: true })

    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('initialContent prop → textarea 預填', () => {
    const wrapper = mount(CommentForm, { props: { initialContent: 'pre' } })
    const textarea = wrapper.find('[data-testid="comment-textarea"]')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('pre')
  })

  it('cancel button → emit cancel (when prop showCancel)', async () => {
    const wrapper = mount(CommentForm, { props: { showCancel: true } })
    await wrapper.find('[data-testid="comment-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
