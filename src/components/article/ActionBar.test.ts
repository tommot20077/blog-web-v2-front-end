import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionBar from './ActionBar.vue'

describe('ActionBar', () => {
  it('未 liked → 顯示 inactive', () => {
    const wrapper = mount(ActionBar, { props: { liked: false, likeCount: 5, isPending: false } })
    const btn = wrapper.find('[data-testid="article-like-action-bar"]')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).not.toContain('active')
    expect(wrapper.find('[data-testid="article-like-action-bar-count"]').text()).toBe('5')
  })

  it('liked → active class', () => {
    const wrapper = mount(ActionBar, { props: { liked: true, likeCount: 6, isPending: false } })
    expect(wrapper.find('[data-testid="article-like-action-bar"]').classes()).toContain('active')
  })

  it('isPending → pulse class', () => {
    const wrapper = mount(ActionBar, { props: { liked: false, likeCount: 5, isPending: true } })
    expect(wrapper.find('[data-testid="article-like-action-bar"]').classes()).toContain('pulse')
  })

  it('click → emit toggle', async () => {
    const wrapper = mount(ActionBar, { props: { liked: false, likeCount: 5, isPending: false } })
    await wrapper.find('[data-testid="article-like-action-bar"]').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
