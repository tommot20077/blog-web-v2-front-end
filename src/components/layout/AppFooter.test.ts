import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppFooter from './AppFooter.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

describe('AppFooter', () => {
  it('使用 footer 語意標籤並帶 data-testid', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.element.tagName).toBe('FOOTER')
    expect(wrapper.find('[data-testid="footer-root"]').exists()).toBe(true)
  })

  it('顯示版權文字', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } })
    await router.isReady()
    const copy = wrapper.find('[data-testid="footer-copyright"]')
    expect(copy.exists()).toBe(true)
    expect(copy.text()).toContain('MY BLOG WEB.')
  })

  it('顯示 Back to top 連結', async () => {
    const wrapper = mount(AppFooter, { global: { plugins: [router] } })
    await router.isReady()
    const topLink = wrapper.find('[data-testid="footer-top-link"]')
    expect(topLink.exists()).toBe(true)
    expect(topLink.attributes('href')).toBe('#top')
  })
})
