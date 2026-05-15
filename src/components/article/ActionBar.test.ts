import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionBar from './ActionBar.vue'

describe('ActionBar', () => {
  const baseProps = {
    liked: false,
    likeCount: 5,
    isPending: false,
    bookmarked: false,
    bookmarkPending: false,
  }

  it('未 liked → 顯示 inactive', () => {
    const wrapper = mount(ActionBar, { props: baseProps })
    const btn = wrapper.find('[data-testid="article-like-action-bar"]')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).not.toContain('active')
    expect(wrapper.find('[data-testid="article-like-action-bar-count"]').text()).toBe('5')
  })

  it('liked → active class', () => {
    const wrapper = mount(ActionBar, { props: { ...baseProps, liked: true, likeCount: 6 } })
    expect(wrapper.find('[data-testid="article-like-action-bar"]').classes()).toContain('active')
  })

  it('isPending → pulse class', () => {
    const wrapper = mount(ActionBar, { props: { ...baseProps, isPending: true } })
    expect(wrapper.find('[data-testid="article-like-action-bar"]').classes()).toContain('pulse')
  })

  it('click → emit toggle', async () => {
    const wrapper = mount(ActionBar, { props: baseProps })
    await wrapper.find('[data-testid="article-like-action-bar"]').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('bookmarked → bookmark button active', () => {
    const wrapper = mount(ActionBar, { props: { ...baseProps, bookmarked: true } })
    const btn = wrapper.find('[data-testid="article-bookmark-action-bar"]')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('active')
    expect(btn.attributes('aria-pressed')).toBe('true')
  })

  it('click bookmark → emit toggleBookmark', async () => {
    const wrapper = mount(ActionBar, { props: baseProps })
    await wrapper.find('[data-testid="article-bookmark-action-bar"]').trigger('click')
    expect(wrapper.emitted('toggleBookmark')).toHaveLength(1)
  })

  it('bookmarkPending → bookmark button disabled and pulse', () => {
    const wrapper = mount(ActionBar, { props: { ...baseProps, bookmarkPending: true } })
    const btn = wrapper.find('[data-testid="article-bookmark-action-bar"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.classes()).toContain('pulse')
  })
})
