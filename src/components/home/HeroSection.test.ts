import { mount } from '@vue/test-utils'
import HeroSection from './HeroSection.vue'

describe('HeroSection', () => {
  it('根元素是 section.hero 並帶 data-testid', () => {
    const wrapper = mount(HeroSection)
    const root = wrapper.find('[data-testid="hero-root"]')
    expect(root.exists()).toBe(true)
    expect(root.element.tagName).toBe('SECTION')
    expect(root.classes()).toContain('hero')
  })

  it('hero-title 是 h1', () => {
    const wrapper = mount(HeroSection)
    const title = wrapper.find('[data-testid="hero-title"]')
    expect(title.exists()).toBe(true)
    expect(title.element.tagName).toBe('H1')
    expect(title.classes()).toContain('hero-title')
  })

  it('hero-eyebrow 存在且包含 dot-live', () => {
    const wrapper = mount(HeroSection)
    expect(wrapper.find('.hero-eyebrow').exists()).toBe(true)
    expect(wrapper.find('.dot-live').exists()).toBe(true)
  })

  it('hero-foot-min 存在', () => {
    const wrapper = mount(HeroSection)
    expect(wrapper.find('.hero-foot-min').exists()).toBe(true)
  })

  it('scroll-cue 存在', () => {
    const wrapper = mount(HeroSection)
    expect(wrapper.find('.scroll-cue').exists()).toBe(true)
  })

  it('傳入 latestArticleUuid 時 read-next 連結指向正確路徑', () => {
    const wrapper = mount(HeroSection, {
      props: { latestArticleUuid: 'abc-123' },
    })
    const link = wrapper.find('.read-next')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toContain('abc-123')
  })
})
