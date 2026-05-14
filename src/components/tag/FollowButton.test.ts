import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FollowButton from './FollowButton.vue'

describe('FollowButton', () => {
  it('followed=false → 顯示 + Follow', () => {
    const wrapper = mount(FollowButton, { props: { followed: false, isPending: false } })
    const btn = wrapper.find('[data-testid="tag-follow-btn"]')
    expect(btn.text()).toContain('Follow')
    expect(btn.classes()).not.toContain('active')
  })

  it('followed=true → 顯示 Following + active', () => {
    const wrapper = mount(FollowButton, { props: { followed: true, isPending: false } })
    const btn = wrapper.find('[data-testid="tag-follow-btn"]')
    expect(btn.text()).toContain('Following')
    expect(btn.classes()).toContain('active')
  })

  it('isPending=true → button disabled + aria-busy', () => {
    const wrapper = mount(FollowButton, { props: { followed: false, isPending: true } })
    const btn = wrapper.find('[data-testid="tag-follow-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(btn.attributes('aria-busy')).toBe('true')
  })

  it('a11y：type="button" + aria-pressed 反映 followed 狀態', () => {
    const w1 = mount(FollowButton, { props: { followed: false, isPending: false } })
    const b1 = w1.find('[data-testid="tag-follow-btn"]')
    expect(b1.attributes('type')).toBe('button')
    expect(b1.attributes('aria-pressed')).toBe('false')

    const w2 = mount(FollowButton, { props: { followed: true, isPending: false } })
    expect(w2.find('[data-testid="tag-follow-btn"]').attributes('aria-pressed')).toBe('true')
  })

  it('click → emit toggle', async () => {
    const wrapper = mount(FollowButton, { props: { followed: false, isPending: false } })
    await wrapper.find('[data-testid="tag-follow-btn"]').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })
})
