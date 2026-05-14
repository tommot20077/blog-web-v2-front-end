import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReactionFooter from './ReactionFooter.vue'

describe('ReactionFooter', () => {
  it('未 liked → ♡ + count', () => {
    const wrapper = mount(ReactionFooter, { props: { liked: false, likeCount: 5, isPending: false } })
    const btn = wrapper.find('[data-testid="article-like-footer"]')
    expect(btn.text()).toContain('♡')
    expect(wrapper.find('[data-testid="article-like-footer-count"]').text()).toBe('5')
  })

  it('liked → ♥ + active', () => {
    const wrapper = mount(ReactionFooter, { props: { liked: true, likeCount: 6, isPending: false } })
    const btn = wrapper.find('[data-testid="article-like-footer"]')
    expect(btn.text()).toContain('♥')
    expect(btn.classes()).toContain('active')
  })

  it('click → emit toggle', async () => {
    const wrapper = mount(ReactionFooter, { props: { liked: false, likeCount: 5, isPending: false } })
    await wrapper.find('[data-testid="article-like-footer"]').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
